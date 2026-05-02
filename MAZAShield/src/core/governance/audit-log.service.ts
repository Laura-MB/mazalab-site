import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import {
  mkdir,
  open,
  readFile,
  rename,
  rm,
  writeFile
} from "node:fs/promises";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
// DP-2026-GOV-001, DR-2026-GOV-001-001, RVTM v1.1
import type { AssessmentResult } from "../assessment/types.js";
import type { ComplianceMetadata, RiskScore } from "../../types/index.js";
import { logger as defaultLogger, type Logger } from "../observability/logger.js";
import type { RiskDomain } from "../risk-scoring/types.js";
import { validateComplianceForAuditAppend } from "./compliance-metadata.js";
import type { AuditLogPersistenceBackend } from "./persistence/backend.js";
import type { AuditLogComboSnapshot, AuditLogEntry } from "./types.js";

export interface LogAssessmentContext {
  correlationId?: string;
  inputEntityCount?: number;
  /** Optional; validated before append. DP-2026-GOV-001. */
  compliance?: ComplianceMetadata;
}

export const DEFAULT_AUDIT_LOG_FILE_PATH = path.join("data", "audit-log.json");

/**
 * Persisted file schema.
 *
 * - **v6 (current)** — adds the optional `compliance` object on each entry
 *   (DP-2026-GOV-001) with minimized governance metadata. Older files load
 *   with `compliance: undefined` on every row.
 * - **v5** — optional `combos` snapshot; `/audit-log/stats` `topCombos` /
 *   `trends`. Rotating `.bak` before each rename; optional gzip.
 * - **v4** — added derived human-readable labels (`riskScore.levelLabel`,
 *   `inputSummary.domainName`) and first-class `getStats()` / filtered
 *   queries.
 *
 * Older payloads (v2 / v3 / v4) are loaded transparently: missing fields
 * are derived on read and persisted on the next write without any operator
 * action — no migration script required.
 */
export const AUDIT_LOG_SCHEMA_VERSION = 6;

/** Number of times we retry the temp-file → primary rename on `EPERM` / `EBUSY`. */
const PERSIST_RENAME_RETRIES = 4;
/** Initial backoff between rename retries; doubles on each attempt. */
const PERSIST_RENAME_BACKOFF_MS = 25;
/** Process-local counter so concurrent persists never collide on a tmp path. */
let tmpFileCounter = 0;

/** Canonical ordering from least to most severe — used for `minRiskLevel` filtering. */
const RISK_LEVEL_ORDER: readonly RiskScore["level"][] = ["low", "medium", "high", "critical"];
const RISK_LEVEL_LABELS: Record<RiskScore["level"], string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical"
};
const DOMAIN_LABELS: Record<RiskDomain, string> = {
  general: "General",
  gaming: "Gaming"
};

function riskLevelRank(level: string): number {
  const idx = RISK_LEVEL_ORDER.indexOf(level as RiskScore["level"]);
  return idx < 0 ? 0 : idx;
}

function toRiskLevelLabel(level: string): string {
  return RISK_LEVEL_LABELS[level as RiskScore["level"]] ??
    (level.length > 0 ? `${level.charAt(0).toUpperCase()}${level.slice(1)}` : "Unknown");
}

function toDomainName(domain: RiskDomain | string): string {
  return DOMAIN_LABELS[domain as RiskDomain] ??
    (typeof domain === "string" && domain.length > 0
      ? `${domain.charAt(0).toUpperCase()}${domain.slice(1)}`
      : "Unknown");
}

/**
 * Ensures an entry carries the derived human-readable labels.
 * Non-mutating: returns a shallow clone so external state stays frozen.
 */
/**
 * Lightweight ISO-8601-ish validator used by filter inputs. Deliberately
 * permissive: accepts any non-empty string that Node's `Date` can parse.
 * Invalid values produce `undefined` so the filter silently ignores them.
 */
function isValidIsoLike(value: string | undefined): boolean {
  if (typeof value !== "string" || value.trim().length === 0) return false;
  const ts = Date.parse(value);
  return Number.isFinite(ts);
}

/**
 * `true` when at least one filter dimension is set. Used to dispatch to the
 * faster unfiltered tail-slice path. `limit` / `offset` are pagination, not
 * filters, so they are not considered here.
 */
function hasAnyFilter(options: {
  domain?: unknown;
  minRiskLevel?: unknown;
  from?: unknown;
  to?: unknown;
}): boolean {
  return (
    options.domain !== undefined ||
    options.minRiskLevel !== undefined ||
    options.from !== undefined ||
    options.to !== undefined
  );
}

/** Clamp an integer to `[min, max]`, falling back to `min` for non-finite input. */
function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

/** Returns a new `Date` set to the start of the same UTC day. */
function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** UTC `YYYY-MM-DD` key used for day-bucketed trend aggregation. */
function utcDayKey(date: Date): string {
  const y = date.getUTCFullYear().toString().padStart(4, "0");
  const m = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const d = date.getUTCDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function enrichEntry(entry: AuditLogEntry): AuditLogEntry {
  return {
    ...entry,
    inputSummary: {
      ...entry.inputSummary,
      domainName: entry.inputSummary.domainName ?? toDomainName(entry.inputSummary.domain)
    },
    riskScore: {
      ...entry.riskScore,
      levelLabel: entry.riskScore.levelLabel ?? toRiskLevelLabel(entry.riskScore.level)
    }
  };
}

/**
 * Options for filtered queries over the audit log. All fields are optional;
 * omitted filters behave as "accept all". `limit` / `offset` paginate the
 * filtered result set (newest first).
 */
export interface AuditLogQueryOptions {
  limit?: number;
  offset?: number;
  /** Restrict to entries produced under this risk domain. */
  domain?: RiskDomain;
  /** Keep entries whose `riskScore.level` is at least this severe. */
  minRiskLevel?: RiskScore["level"];
  /** ISO-8601 timestamp (inclusive lower bound on `timestamp`). */
  from?: string;
  /** ISO-8601 timestamp (inclusive upper bound on `timestamp`). */
  to?: string;
}

export type AuditLogFilterOptions = Omit<AuditLogQueryOptions, "limit" | "offset">;

/** One row in the `topCombos` ranking — aggregated across the whole store. */
export interface AuditLogTopCombo {
  /** Stable combo id (e.g. `apex_critical`, `syndicate`). */
  id: string;
  /** Analyst-facing combo label. */
  label: string;
  /** Total number of entity-level occurrences across the whole store. */
  occurrenceCount: number;
  /** Number of distinct audit entries (batches) that observed this combo. */
  entryCount: number;
  /** Maximum per-entity synergy boost ever observed for this combo. */
  maxSynergy: number;
  /** Dimensions participating in the combo (last seen). */
  dimensions: string[];
}

/** Day-bucketed entry count for a sparkline-friendly trend view. */
export interface AuditLogDailyTrend {
  /** UTC day in `YYYY-MM-DD` format. */
  date: string;
  /** Entries whose `timestamp` fell on this UTC day. */
  count: number;
}

/** Rolling-window counts used by ops dashboards (1h / 24h / 7d). */
export interface AuditLogTrendWindows {
  lastHour: number;
  last24Hours: number;
  last7Days: number;
}

export interface AuditLogTrends {
  /** Day-by-day counts for the last `windowDays` UTC days, oldest → newest. */
  dailyCounts: AuditLogDailyTrend[];
  /** Effective window the daily series was generated for. */
  windowDays: number;
  /** Rolling-window snapshot taken at `generatedAt`. */
  byWindow: AuditLogTrendWindows;
}

/**
 * Options for `getStats()` consumers. Only `windowDays` (default `7`,
 * clamped to `[1, 90]`) is honored today; the option object is exported as
 * an extension point so future stats slices can be opted into without
 * breaking existing callers.
 */
export interface AuditLogStatsOptions {
  /** Number of UTC days the daily trend series covers. Clamped to `[1, 90]`. */
  windowDays?: number;
  /** Maximum combos returned in `topCombos`. Defaults to `5`, clamped to `[1, 50]`. */
  topCombosLimit?: number;
  /** Reference "now" used for windowed buckets. Defaults to `new Date()`. Test seam. */
  now?: Date;
}

/**
 * High-level summary for dashboards / stats endpoints. All counters include
 * legacy entries; labels are derived on read so historical payloads are
 * represented consistently.
 *
 * v5 adds `topCombos`, `trends`, and `generatedAt` so a single call powers
 * both the ops "current state" cards and a sparkline / leaderboard.
 */
export interface AuditLogStats {
  total: number;
  avgRiskScore: number;
  countByLevel: Record<RiskScore["level"], number>;
  countByDomain: Record<RiskDomain, number>;
  earliestTimestamp: string | null;
  latestTimestamp: string | null;
  /** Top combos by total entity-level occurrence (newest entries break ties). */
  topCombos: AuditLogTopCombo[];
  /** Day-bucketed trend + rolling-window counts. */
  trends: AuditLogTrends;
  /** Timestamp at which this stats snapshot was computed. */
  generatedAt: string;
}

export interface AssessmentAuditLogServiceOptions {
  /** When true, append operations persist the full log to `filePath`. Default: true. */
  persistFile?: boolean;
  /** JSON file path (relative to `process.cwd()` unless absolute). */
  filePath?: string;
  /**
   * Retain at most this many entries (oldest dropped after each append). `0` disables pruning.
   * Default: 5000.
   */
  maxEntries?: number;
  /**
   * When true, persist the file gzipped at `<filePath>.gz` instead of the
   * plain `<filePath>`. Reads accept either form transparently. Default: false.
   *
   * Use this for production deployments where the audit log lives on slow
   * storage or where multi-MB JSON snapshots become a hot-path bottleneck.
   * Compression is `gzip` (zlib default level) so the resulting file
   * round-trips through standard tooling (`gzip -d`, `zcat`, ...).
   */
  compress?: boolean;
  /**
   * Optional pluggable persistence backend. When provided, the service
   * routes bootstrap and persist calls through this implementation
   * **instead of** the default JSON-file path; `persistFile`, `filePath`,
   * and `compress` are ignored in that case.
   *
   * In production, prefer constructing the service via
   * {@link AuditLogService.createWithBackend} which performs the
   * asynchronous backend initialisation up-front.
   */
  backend?: AuditLogPersistenceBackend;
}

interface AuditLogFileMeta {
  updatedAt: string;
  entryCount: number;
  maxEntriesConfigured: number;
  /** Number of distinct correlation IDs indexed for fast lookup. */
  correlationCount: number;
}

/**
 * Maps `correlationId → [entry.id, ...]`, persisted alongside the entries.
 *
 * Chronological inside each bucket (first appended → first listed).
 * Purely an index: entries remain the source of truth; the index is rebuilt
 * on every load from the entries themselves, so a missing or stale index in
 * an older payload never leads to data loss.
 */
type CorrelationIndexDict = Record<string, string[]>;

interface AuditLogFilePayload {
  schemaVersion: typeof AUDIT_LOG_SCHEMA_VERSION;
  meta: AuditLogFileMeta;
  entries: AuditLogEntry[];
  correlationIndex: CorrelationIndexDict;
}

let sharedAssessmentAuditLog: AuditLogService | null = null;

/**
 * Single process-wide audit log used by `AssessmentService` and the
 * `/audit-log` API unless a custom service is injected.
 *
 * `options` are honored only on the **first** call, when the singleton is
 * created. Any subsequent call that passes `options` is a bug (it would
 * silently be ignored and lead to diverging configurations across callers)
 * and is therefore rejected with a descriptive error.
 */
export function getSharedAssessmentAuditLogService(
  options?: AssessmentAuditLogServiceOptions
): AuditLogService {
  if (!sharedAssessmentAuditLog) {
    sharedAssessmentAuditLog = new AuditLogService(options);
    return sharedAssessmentAuditLog;
  }
  if (options !== undefined) {
    throw new Error(
      "getSharedAssessmentAuditLogService is already initialized; pass options only on the first call"
    );
  }
  return sharedAssessmentAuditLog;
}

/**
 * Test-only helper: clears the cached singleton so each test can install a
 * fresh instance with its own configuration. Prefixed with double underscore
 * to signal internal use.
 */
export function __resetSharedAssessmentAuditLogServiceForTests(): void {
  sharedAssessmentAuditLog = null;
}

/**
 * Registers an externally-constructed `AuditLogService` as the shared
 * singleton. Use this for production wiring when a non-default backend
 * (e.g. SQLite) requires asynchronous initialisation that the default
 * lazy `getSharedAssessmentAuditLogService(options)` constructor cannot
 * perform.
 *
 * Idempotent only on the *same* instance: passing a different service
 * after one is already installed throws so we never silently swap the
 * audit destination mid-process.
 *
 * Typical bootstrap (in `src/index.ts`):
 *
 * ```ts
 * const backend = new SqliteBackend({ filePath: cfg.audit.sqliteFilePath });
 * const svc = await AuditLogService.createWithBackend(backend);
 * setSharedAssessmentAuditLogService(svc);
 * ```
 */
export function setSharedAssessmentAuditLogService(svc: AuditLogService): void {
  if (sharedAssessmentAuditLog && sharedAssessmentAuditLog !== svc) {
    throw new Error(
      "setSharedAssessmentAuditLogService: a different shared AuditLogService is already installed; " +
        "call __resetSharedAssessmentAuditLogServiceForTests first if this is a test."
    );
  }
  sharedAssessmentAuditLog = svc;
}

/**
 * Append-only audit log for end-to-end assessment pipeline runs.
 *
 * The in-memory store is authoritative for the lifetime of the process.
 * Optional JSON-file persistence under `data/` is enabled by default and
 * writes are serialized through `opChain` so concurrent assessments can
 * never produce a torn snapshot. Records are never mutated in place —
 * pruning removes the oldest rows only when `maxEntries` is exceeded.
 */
export class AuditLogService {
  private readonly store: AuditLogEntry[] = [];
  /** In-memory secondary index: correlationId → ordered list of entry IDs. */
  private readonly correlationIndex = new Map<string, string[]>();
  /**
   * O(1) primary index: entry id → entry reference. Together with
   * `correlationIndex`, this makes `getByCorrelationId` O(k) without a
   * full-store scan. Rebuilt on load and on prune.
   */
  private readonly entryById = new Map<string, AuditLogEntry>();
  private readonly persistFile: boolean;
  private readonly filePath: string;
  private readonly maxEntries: number;
  private readonly compress: boolean;
  /**
   * Optional pluggable backend (e.g. SQLite). When non-null, all
   * persistence (bootstrap + flush) is delegated to it and the
   * inline JSON-file path is bypassed entirely.
   */
  private readonly backend: AuditLogPersistenceBackend | null;
  private readonly log: Logger;
  /** Serializes append + optional persist so concurrent assessments never write a stale snapshot. */
  private opChain: Promise<void> = Promise.resolve();
  /** Set by `loadFromFileSync` when a corrupt file is detected at bootstrap; consumed on the next flush. */
  private pendingCorruptPath: string | null = null;

  constructor(options?: AssessmentAuditLogServiceOptions) {
    this.persistFile = options?.persistFile ?? true;
    this.filePath = options?.filePath ?? DEFAULT_AUDIT_LOG_FILE_PATH;
    const maxOpt = options?.maxEntries;
    this.maxEntries = maxOpt === undefined ? 5000 : maxOpt;
    this.compress = options?.compress ?? false;
    this.backend = options?.backend ?? null;
    this.log = defaultLogger.child({ service: "audit-log" });

    // Bootstrap path:
    //   - When a custom backend is injected, defer to async bootstrap
    //     via createWithBackend()  this constructor stays sync-safe.
    //   - Otherwise, the historical JSON sync bootstrap runs (unchanged).
    if (this.backend) return;
    if (this.persistFile) {
      try {
        this.loadFromFileSync();
      } catch (err: unknown) {
        // Bootstrap-time corruption recovery is handled inside loadFromFileSync;
        // anything that escapes here is logged so the operator sees it during
        // process startup. The service still comes up  empty in-memory.
        this.log.error("Failed to bootstrap from persisted log", {
          error: (err as Error)?.message ?? String(err)
        });
      }
    }
  }

  /**
   * Async factory for backends that require asynchronous initialisation
   * (notably {@link ./persistence/sqlite-backend.SqliteBackend}).
   *
   * Constructs the service in JSON-bypass mode (`persistFile: false`),
   * awaits `backend.bootstrap()`, and installs the loaded entries before
   * returning. Equivalent to `new AuditLogService({ backend, ... })`
   * followed by the appropriate hydration step  exposed as a static
   * helper so callers cannot accidentally observe a half-initialised
   * service.
   */
  static async createWithBackend(
    backend: AuditLogPersistenceBackend,
    options?: Omit<AssessmentAuditLogServiceOptions, "backend" | "persistFile" | "filePath" | "compress">
  ): Promise<AuditLogService> {
    const svc = new AuditLogService({ ...options, persistFile: false, backend });
    const entries = await backend.bootstrap();
    svc.installEntries(entries);
    return svc;
  }

  private resolvePath(): string {
    return path.isAbsolute(this.filePath) ? this.filePath : path.join(process.cwd(), this.filePath);
  }

  /** Compressed-snapshot path used when `compress: true`. Sits next to the plain JSON. */
  private resolveCompressedPath(): string {
    return `${this.resolvePath()}.gz`;
  }

  /** Rolling backup path written before every successful rename. */
  private resolveBackupPath(): string {
    return `${this.resolvePath()}.bak`;
  }

  private sortEntriesChronological(entries: AuditLogEntry[]): void {
    entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  /**
   * Synchronous bootstrap loader with three-stage corruption recovery:
   *
   *   1. Try the configured primary path (`.gz` first when `compress: true`,
   *      otherwise plain JSON, then the other form as a fallback).
   *   2. On parse failure, fall back to the `.bak` snapshot if present —
   *      the previous successful flush is always one rename behind.
   *   3. On total failure, **quarantine** the unreadable file as
   *      `<file>.corrupt-<ts>` so it is preserved for forensic analysis,
   *      log a clear warning, and start fresh in memory. The next append
   *      will write a clean snapshot.
   *
   * Only the primary path is attempted on disks where the file does not
   * exist yet (no `.bak` warning, no quarantine).
   */
  private loadFromFileSync(): void {
    const candidates = this.bootstrapCandidatePaths();
    const present = candidates.filter((p) => existsSync(p));
    if (present.length === 0) {
      this.store.length = 0;
      this.entryById.clear();
      this.correlationIndex.clear();
      return;
    }

    let lastErr: unknown = null;
    for (const candidate of present) {
      try {
        const entries = this.readEntriesFromFileSync(candidate);
        this.installEntries(entries);
        if (candidate !== this.preferredReadPath()) {
          this.log.warn("Recovered entries from fallback file", {
            entries: entries.length,
            file: candidate
          });
        }
        return;
      } catch (err) {
        lastErr = err;
        // try next candidate
      }
    }

    // Every candidate failed. Mark the *primary* file (when present) for
    // quarantine on the next async flush  we cannot rename synchronously
    // here without pulling in `fs.renameSync`, which is fine because the
    // service is fully usable in memory in the meantime.
    const primary = this.preferredReadPath();
    if (existsSync(primary)) {
      this.pendingCorruptPath = primary;
      this.log.error("Audit log appears corrupt", {
        primary,
        action: "will quarantine to <path>.corrupt-<ts> on next persist",
        error: (lastErr as Error)?.message ?? String(lastErr)
      });
    }
    this.store.length = 0;
    this.entryById.clear();
    this.correlationIndex.clear();
  }

  /** Order of paths the bootstrap loader probes (primary → secondary → backup). */
  private bootstrapCandidatePaths(): string[] {
    const plain = this.resolvePath();
    const gz = this.resolveCompressedPath();
    const bak = this.resolveBackupPath();
    return this.compress ? [gz, plain, bak] : [plain, gz, bak];
  }

  /** The "expected" path for the current configuration — used to suppress noise on the happy path. */
  private preferredReadPath(): string {
    return this.compress ? this.resolveCompressedPath() : this.resolvePath();
  }

  private readEntriesFromFileSync(filePath: string): AuditLogEntry[] {
    const buf = readFileSync(filePath);
    const text = filePath.endsWith(".gz")
      ? gunzipSync(buf).toString("utf8")
      : buf.toString("utf8");
    const { entries } = parseFilePayload(JSON.parse(text) as unknown);
    return entries;
  }

  private async readEntriesFromFile(filePath: string): Promise<AuditLogEntry[]> {
    const buf = await readFile(filePath);
    const text = filePath.endsWith(".gz")
      ? gunzipSync(buf).toString("utf8")
      : buf.toString("utf8");
    const { entries } = parseFilePayload(JSON.parse(text) as unknown);
    return entries;
  }

  /** Replaces the in-memory store and rebuilds every secondary index. */
  private installEntries(entries: AuditLogEntry[]): void {
    this.store.length = 0;
    this.store.push(...entries);
    this.sortEntriesChronological(this.store);
    this.rebuildIndexes();
  }

  /**
   * Replace the in-memory log with entries from the active persistence
   * source (JSON file or registered backend). Does not merge; the source
   * is authoritative for this call. Serialized with other operations to
   * avoid torn reads/writes.
   */
  async loadFromFile(): Promise<void> {
    if (this.backend) {
      const backend = this.backend;
      this.opChain = this.opChain.catch(() => undefined).then(async () => {
        const entries = await backend.bootstrap();
        this.installEntries(entries);
      });
    } else {
      this.opChain = this.opChain.catch(() => undefined).then(() => this.loadFromDisk());
    }
    await this.opChain;
  }

  /**
   * Persist the current in-memory log to the active persistence source
   * (JSON snapshot or registered backend). Serialized with other
   * operations.
   */
  async saveToFile(): Promise<void> {
    if (this.backend) {
      const backend = this.backend;
      this.opChain = this.opChain.catch(() => undefined).then(() => backend.persist(this.store));
    } else {
      this.opChain = this.opChain.catch(() => undefined).then(() => this.flushToDisk());
    }
    await this.opChain;
  }

  /**
   * Records one batch assessment outcome. Only appends; entries are never edited in place (pruning removes oldest rows only).
   */
  async logAssessment(
    assessmentResult: AssessmentResult,
    context?: LogAssessmentContext
  ): Promise<void> {
    this.opChain = this.opChain
      .catch(() => undefined)
      .then(() => this.appendAssessmentSerialized(assessmentResult, context));
    await this.opChain;
  }

  /**
   * Returns the most recent entries, newest first, with standard offset/limit
   * pagination and optional filtering.
   *
   * Two call shapes are supported for backward compatibility:
   *
   * ```ts
   * svc.getRecentEntries();                        // default limit, no filters
   * svc.getRecentEntries(50, 0);                   // legacy positional form
   * svc.getRecentEntries({                         // rich filters
   *   limit: 50,
   *   domain: "gaming",
   *   minRiskLevel: "high",
   *   from: "2026-04-01T00:00:00Z",
   *   to:   "2026-04-30T23:59:59Z"
   * });
   * ```
   *
   * Filter semantics:
   *   - `domain`         — exact match against `inputSummary.domain`.
   *   - `minRiskLevel`   — `low < medium < high < critical`; unknown levels pass through
   *                         with severity 0, so legacy entries are never falsely excluded.
   *   - `from` / `to`    — inclusive ISO-8601 bounds; unparseable values are ignored
   *                         (defensive: filters never throw on bad input).
   *
   * Returned entries are shallow clones enriched with human-readable labels
   * (`levelLabel`, `domainName`), so external callers cannot mutate internal
   * state.
   */
  getRecentEntries(limit?: number, offset?: number): AuditLogEntry[];
  getRecentEntries(options: AuditLogQueryOptions): AuditLogEntry[];
  getRecentEntries(
    limitOrOptions?: number | AuditLogQueryOptions,
    maybeOffset?: number
  ): AuditLogEntry[] {
    const options: AuditLogQueryOptions =
      typeof limitOrOptions === "object" && limitOrOptions !== null
        ? limitOrOptions
        : {
            ...(limitOrOptions !== undefined && { limit: limitOrOptions }),
            ...(maybeOffset !== undefined && { offset: maybeOffset })
          };

    const cap = this.normalizeLimit(options.limit, 5000);
    const skip = this.normalizeOffset(options.offset);
    if (cap === 0) return [];

    // Fast path: no filters → walk the chronologically-sorted store from the
    // tail (newest) and stop once we have what we need. O(skip + cap), no
    // allocation of an intermediate filtered array, no second sort.
    if (!hasAnyFilter(options)) {
      return this.tailSlice(this.store, skip, cap).map(enrichEntry);
    }

    // Filtered path: walk newest → oldest with early exit. O(n) worst case
    // but typically O(skip + cap) when the filter matches a dense suffix.
    const filtered = this.collectFilteredNewestFirst(options, skip + cap);
    return filtered.slice(skip, skip + cap).map(enrichEntry);
  }

  /** Returns at most `cap` entries starting `skip` positions from the end of `source`, newest first. */
  private tailSlice(
    source: readonly AuditLogEntry[],
    skip: number,
    cap: number
  ): AuditLogEntry[] {
    const out: AuditLogEntry[] = [];
    for (let i = source.length - 1 - skip; i >= 0 && out.length < cap; i--) {
      out.push(source[i]!);
    }
    return out;
  }

  /**
   * Walks the store from newest to oldest, applying the filter inline, and
   * stops as soon as `maxNeeded` matches have been collected. Saves both an
   * intermediate allocation and a sort step when callers only want the first
   * page of a large filtered result set.
   */
  private collectFilteredNewestFirst(
    options: AuditLogQueryOptions,
    maxNeeded: number
  ): AuditLogEntry[] {
    const minRank =
      options.minRiskLevel !== undefined ? riskLevelRank(options.minRiskLevel) : -1;
    const fromTs = isValidIsoLike(options.from) ? options.from! : undefined;
    const toTs = isValidIsoLike(options.to) ? options.to! : undefined;

    const out: AuditLogEntry[] = [];
    for (let i = this.store.length - 1; i >= 0 && out.length < maxNeeded; i--) {
      const entry = this.store[i]!;
      if (options.domain !== undefined && entry.inputSummary.domain !== options.domain) continue;
      if (minRank >= 0 && riskLevelRank(entry.riskScore.level) < minRank) continue;
      if (fromTs !== undefined && entry.timestamp < fromTs) continue;
      if (toTs !== undefined && entry.timestamp > toTs) continue;
      out.push(entry);
    }
    return out;
  }

  /**
   * Returns the count of entries that match `filters` (no pagination). Useful
   * for surfacing `total` + `filtered` counts side-by-side in an API response.
   */
  getFilteredCount(filters: AuditLogFilterOptions = {}): number {
    return this.applyFilters(this.store, filters).length;
  }

  /**
   * Aggregated read-only summary of the current store. O(n); cheap for the
   * in-memory sizes we support (`maxEntries` default 5000).
   *
   * Counters are returned with every canonical risk level / domain pre-seeded
   * to `0`, making the response directly consumable by dashboards without
   * null guards.
   *
   * v5 additions:
   *   - `topCombos`     — leaderboard of the most-frequent gaming combos.
   *   - `trends.dailyCounts` — sparkline-friendly day buckets for the last
   *                            `windowDays` UTC days (default 7).
   *   - `trends.byWindow`    — rolling 1h / 24h / 7d counts.
   *   - `generatedAt`        — wall-clock timestamp of the snapshot.
   */
  getStats(options: AuditLogStatsOptions = {}): AuditLogStats {
    const now = options.now ?? new Date();
    const windowDays = clampInt(options.windowDays ?? 7, 1, 90);
    const topCombosLimit = clampInt(options.topCombosLimit ?? 5, 1, 50);

    const trends = this.buildTrends(windowDays, now);
    const stats: AuditLogStats = {
      total: this.store.length,
      avgRiskScore: 0,
      countByLevel: { low: 0, medium: 0, high: 0, critical: 0 },
      countByDomain: { general: 0, gaming: 0 },
      earliestTimestamp: null,
      latestTimestamp: null,
      topCombos: this.buildTopCombos(topCombosLimit),
      trends,
      generatedAt: now.toISOString()
    };

    if (this.store.length === 0) return stats;

    let sum = 0;
    let earliest = this.store[0]!.timestamp;
    let latest = this.store[0]!.timestamp;
    for (const entry of this.store) {
      sum += Number.isFinite(entry.riskScore.overall) ? entry.riskScore.overall : 0;
      const lvl = entry.riskScore.level as RiskScore["level"];
      if (lvl in stats.countByLevel) stats.countByLevel[lvl] += 1;
      const dom = entry.inputSummary.domain as RiskDomain;
      if (dom in stats.countByDomain) stats.countByDomain[dom] += 1;
      if (entry.timestamp < earliest) earliest = entry.timestamp;
      if (entry.timestamp > latest) latest = entry.timestamp;
    }

    stats.avgRiskScore = Number((sum / this.store.length).toFixed(4));
    stats.earliestTimestamp = earliest;
    stats.latestTimestamp = latest;
    return stats;
  }

  /**
   * Walk every entry once, accumulate per-combo `{id → row}` aggregates,
   * then sort by total `occurrenceCount` (with `entryCount` as tiebreaker)
   * and trim to the requested limit.
   */
  private buildTopCombos(limit: number): AuditLogTopCombo[] {
    const acc = new Map<string, AuditLogTopCombo>();
    for (const entry of this.store) {
      if (!entry.combos || entry.combos.length === 0) continue;
      for (const combo of entry.combos) {
        const existing = acc.get(combo.id);
        if (existing) {
          existing.occurrenceCount += combo.occurrenceCount;
          existing.entryCount += 1;
          if (combo.maxSynergy > existing.maxSynergy) existing.maxSynergy = combo.maxSynergy;
          if (combo.dimensions.length > 0) existing.dimensions = [...combo.dimensions];
        } else {
          acc.set(combo.id, {
            id: combo.id,
            label: combo.label,
            occurrenceCount: combo.occurrenceCount,
            entryCount: 1,
            maxSynergy: combo.maxSynergy,
            dimensions: [...combo.dimensions]
          });
        }
      }
    }
    const ranked = [...acc.values()].sort((a, b) => {
      if (b.occurrenceCount !== a.occurrenceCount) return b.occurrenceCount - a.occurrenceCount;
      if (b.entryCount !== a.entryCount) return b.entryCount - a.entryCount;
      return b.maxSynergy - a.maxSynergy;
    });
    return ranked.slice(0, limit);
  }

  /**
   * Build the day-bucketed trend series and rolling-window counts in a
   * single O(n) pass. UTC days are used so the buckets are stable across
   * regional dashboards. Days with no activity are emitted with `count: 0`
   * so the consuming chart can render a flat line without gaps.
   */
  private buildTrends(windowDays: number, now: Date): AuditLogTrends {
    const dayKeys: string[] = [];
    const counts = new Map<string, number>();
    const startUtc = startOfUtcDay(now);
    for (let i = windowDays - 1; i >= 0; i--) {
      const day = new Date(startUtc.getTime() - i * 86_400_000);
      const key = utcDayKey(day);
      dayKeys.push(key);
      counts.set(key, 0);
    }

    const ms24h = 24 * 60 * 60 * 1000;
    const ms1h = 60 * 60 * 1000;
    const ms7d = 7 * ms24h;
    const nowMs = now.getTime();
    let lastHour = 0;
    let last24Hours = 0;
    let last7Days = 0;

    for (const entry of this.store) {
      const ts = Date.parse(entry.timestamp);
      if (!Number.isFinite(ts)) continue;
      const dayKey = utcDayKey(new Date(ts));
      if (counts.has(dayKey)) {
        counts.set(dayKey, (counts.get(dayKey) ?? 0) + 1);
      }
      const delta = nowMs - ts;
      if (delta <= ms1h && delta >= 0) lastHour += 1;
      if (delta <= ms24h && delta >= 0) last24Hours += 1;
      if (delta <= ms7d && delta >= 0) last7Days += 1;
    }

    return {
      dailyCounts: dayKeys.map((date) => ({ date, count: counts.get(date) ?? 0 })),
      windowDays,
      byWindow: { lastHour, last24Hours, last7Days }
    };
  }

  /**
   * Apply the query filters to a source list without mutating it. Exported
   * through the public methods only; kept private to guarantee the store is
   * never exposed by reference.
   */
  private applyFilters(
    source: readonly AuditLogEntry[],
    filters: AuditLogFilterOptions
  ): AuditLogEntry[] {
    const minRank =
      filters.minRiskLevel !== undefined ? riskLevelRank(filters.minRiskLevel) : -1;
    const fromTs = isValidIsoLike(filters.from) ? filters.from! : undefined;
    const toTs = isValidIsoLike(filters.to) ? filters.to! : undefined;

    return source.filter((entry) => {
      if (filters.domain !== undefined && entry.inputSummary.domain !== filters.domain) {
        return false;
      }
      if (minRank >= 0 && riskLevelRank(entry.riskScore.level) < minRank) {
        return false;
      }
      if (fromTs !== undefined && entry.timestamp < fromTs) return false;
      if (toTs !== undefined && entry.timestamp > toTs) return false;
      return true;
    });
  }

  /**
   * Returns every entry associated with `correlationId`, newest first.
   *
   * Lookup is O(k) where k is the number of entries for that correlation id
   * thanks to the in-memory index. Returns `[]` when the id is unknown or
   * blank. Results are shallow clones.
   */
  getByCorrelationId(correlationId: string): AuditLogEntry[] {
    if (typeof correlationId !== "string" || correlationId.trim().length === 0) {
      return [];
    }
    const trimmed = correlationId.trim();
    const ids = this.correlationIndex.get(trimmed);
    if (!ids || ids.length === 0) return [];
    // O(k) lookup via the entry-id map; no full-store scan, no Set
    // allocation. The bucket is already chronological so we sort the
    // collected k-element slice for a predictable newest-first result.
    const collected: AuditLogEntry[] = [];
    for (const id of ids) {
      const entry = this.entryById.get(id);
      if (entry) collected.push(entry);
    }
    collected.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return collected.map(enrichEntry);
  }

  getEntryCount(): number {
    return this.store.length;
  }

  /** Number of distinct correlation IDs currently indexed. */
  getCorrelationCount(): number {
    return this.correlationIndex.size;
  }

  /** Read-only snapshot (chronological order, enriched with human-readable labels). */
  getEntries(): readonly AuditLogEntry[] {
    return Object.freeze(
      [...this.store]
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
        .map(enrichEntry)
    );
  }

  private normalizeLimit(limit: number | undefined, fallback: number): number {
    if (limit === undefined || !Number.isFinite(limit)) return fallback;
    return Math.max(0, Math.floor(limit));
  }

  private normalizeOffset(offset: number | undefined): number {
    if (offset === undefined || !Number.isFinite(offset)) return 0;
    return Math.max(0, Math.floor(offset));
  }

  private rebuildIndexes(): void {
    this.correlationIndex.clear();
    this.entryById.clear();
    for (const entry of this.store) {
      this.indexEntry(entry);
    }
  }

  /** Maintains both the correlation bucket and the O(1) `entryById` lookup map. */
  private indexEntry(entry: AuditLogEntry): void {
    const bucket = this.correlationIndex.get(entry.correlationId);
    if (bucket) {
      bucket.push(entry.id);
    } else {
      this.correlationIndex.set(entry.correlationId, [entry.id]);
    }
    this.entryById.set(entry.id, entry);
  }

  private async loadFromDisk(): Promise<void> {
    const candidates = this.bootstrapCandidatePaths().filter((p) => existsSync(p));
    if (candidates.length === 0) {
      this.store.length = 0;
      this.entryById.clear();
      this.correlationIndex.clear();
      return;
    }
    let lastErr: unknown = null;
    for (const candidate of candidates) {
      try {
        const entries = await this.readEntriesFromFile(candidate);
        this.installEntries(entries);
        if (candidate !== this.preferredReadPath()) {
          this.log.warn("Recovered entries from fallback file", {
            entries: entries.length,
            file: candidate
          });
        }
        return;
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr ?? new Error("Audit log load failed (unknown reason)");
  }

  /**
   * Full snapshot write with production-grade durability:
   *
   *   1. Writes to a process- and counter-tagged temp file so concurrent
   *      writers (or stale `.tmp` files left over from a crash) never
   *      collide.
   *   2. Calls `fsync` on the temp file before rename so the OS commits
   *      the body to disk — survives power loss between rename and the
   *      next write.
   *   3. Rotates the previous primary file to `<file>.bak` *before*
   *      renaming the temp into place, so corruption recovery has a
   *      one-step backup that is exactly the previous successful flush.
   *   4. Retries the rename on transient `EPERM` / `EBUSY` (Windows /
   *      OneDrive sync hold the lock for a few ms). On terminal failure
   *      it falls back to an in-place overwrite (logged) so the in-memory
   *      state and on-disk state never diverge silently.
   *   5. Quarantines pre-existing corrupt primary files (detected during
   *      bootstrap) on the next flush so they are preserved alongside
   *      the new healthy snapshot.
   *   6. Optional gzip via the `compress` constructor option — writes
   *      `<file>.gz` and removes the legacy `<file>` once the rename
   *      lands so the directory does not accumulate stale plaintext.
   */
  private async flushToDisk(): Promise<void> {
    const primary = this.resolvePath();
    const target = this.preferredReadPath();
    await mkdir(path.dirname(primary), { recursive: true });

    this.sortEntriesChronological(this.store);
    const now = new Date().toISOString();
    const correlationIndex = this.serializeCorrelationIndex();
    const payload: AuditLogFilePayload = {
      schemaVersion: AUDIT_LOG_SCHEMA_VERSION,
      meta: {
        updatedAt: now,
        entryCount: this.store.length,
        maxEntriesConfigured: this.maxEntries,
        correlationCount: this.correlationIndex.size
      },
      entries: [...this.store],
      correlationIndex
    };
    const json = `${JSON.stringify(payload, null, 2)}\n`;
    const body: Buffer | string = this.compress ? gzipSync(Buffer.from(json, "utf8")) : json;

    // Quarantine any pre-existing corrupt primary file we noticed at bootstrap.
    await this.quarantineKnownCorruptIfNeeded();

    const tmp = this.makeTempPath(target);
    await this.writeAndFsync(tmp, body);
    await this.rotateBackupAndRename(tmp, target);
    if (this.compress) {
      // After a successful gzip write, prune the legacy plaintext snapshot
      // to keep the directory from drifting into a multi-format zoo.
      try {
        await rm(this.resolvePath(), { force: true });
      } catch {
        /* best-effort cleanup */
      }
    }
  }

  private makeTempPath(target: string): string {
    const counter = ++tmpFileCounter;
    return `${target}.${process.pid}.${counter}.tmp`;
  }

  /** Write the body to a temp file and fsync the FD before closing. Survives crash + power loss. */
  private async writeAndFsync(tmp: string, body: Buffer | string): Promise<void> {
    const handle = await open(tmp, "w");
    try {
      await handle.writeFile(body);
      await handle.sync();
    } finally {
      await handle.close();
    }
  }

  /**
   * Rotate the current primary to `.bak`, then rename the temp file into
   * place. Retries on transient Windows / OneDrive locks; falls back to
   * an in-place overwrite when retries are exhausted so the on-disk state
   * tracks the in-memory state.
   */
  private async rotateBackupAndRename(tmp: string, target: string): Promise<void> {
    const backup = this.resolveBackupPath();
    if (existsSync(target)) {
      try {
        await rename(target, backup);
      } catch {
        // Rotation failures are non-fatal — the rename below will overwrite
        // the primary file directly. We trade the .bak guarantee for
        // the freshness guarantee in this branch.
      }
    }

    let lastErr: unknown = null;
    let backoff = PERSIST_RENAME_BACKOFF_MS;
    for (let attempt = 0; attempt <= PERSIST_RENAME_RETRIES; attempt++) {
      try {
        await rename(tmp, target);
        return;
      } catch (err) {
        lastErr = err;
        if (attempt === PERSIST_RENAME_RETRIES) break;
        await new Promise((resolve) => setTimeout(resolve, backoff));
        backoff *= 2;
      }
    }

    // Last-chance fallback: overwrite the destination directly. This loses
    // atomicity but keeps disk in sync with memory; logged loudly so
    // operators see it.
    try {
      const content = await readFile(tmp);
      await writeFile(target, content);
      try {
        await rm(tmp, { force: true });
      } catch {
        /* best-effort cleanup */
      }
      this.log.warn("Atomic rename failed; wrote in place", {
        attempts: PERSIST_RENAME_RETRIES + 1,
        target,
        error: (lastErr as Error)?.message ?? String(lastErr)
      });
    } catch (overwriteErr: unknown) {
      throw new Error(
        `Audit log persist failed (rename + overwrite both failed): ${(overwriteErr as Error)?.message ?? overwriteErr}`
      );
    }
  }

  /**
   * If bootstrap detected an unparseable primary file, move it aside on the
   * first flush so the new snapshot does not silently overwrite forensic
   * evidence. No-op when no corruption marker is set or the file disappeared.
   */
  private async quarantineKnownCorruptIfNeeded(): Promise<void> {
    if (!this.pendingCorruptPath || !existsSync(this.pendingCorruptPath)) {
      this.pendingCorruptPath = null;
      return;
    }
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const target = `${this.pendingCorruptPath}.corrupt-${stamp}`;
    try {
      await rename(this.pendingCorruptPath, target);
      this.log.warn("Quarantined corrupt audit log", { target });
    } catch (err: unknown) {
      this.log.error("Could not quarantine corrupt audit log", {
        target,
        error: (err as Error)?.message ?? String(err)
      });
    } finally {
      this.pendingCorruptPath = null;
    }
  }

  private serializeCorrelationIndex(): CorrelationIndexDict {
    const out: CorrelationIndexDict = {};
    for (const [correlationId, ids] of this.correlationIndex.entries()) {
      out[correlationId] = [...ids];
    }
    return out;
  }

  private pruneIfNeeded(): void {
    if (this.maxEntries <= 0 || this.store.length <= this.maxEntries) return;
    const drop = this.store.length - this.maxEntries;
    if (drop > 0) {
      this.store.splice(0, drop);
    }
    this.sortEntriesChronological(this.store);
    // Bucket IDs dropped during pruning must disappear from both indexes too.
    this.rebuildIndexes();
  }

  private async appendAssessmentSerialized(
    assessmentResult: AssessmentResult,
    context?: LogAssessmentContext
  ): Promise<void> {
    const correlationId = context?.correlationId ?? "unknown-correlation";
    const entityCount = context?.inputEntityCount ?? assessmentResult.resolvedEntities.length;

    const resolvedEntityIds = assessmentResult.resolvedEntities.map(
      (re) => re.canonicalEntity.id
    );

    const { assessments, domain } = assessmentResult;
    const topByOverall =
      assessments.length === 0
        ? undefined
        : assessments.reduce((best, cur) =>
            cur.riskScore.overall > best.riskScore.overall ? cur : best
          );

    const topDimensions = topByOverall
      ? [...topByOverall.riskScore.components]
          .sort((a, b) => b.contribution - a.contribution)
          .slice(0, 5)
          .map((c) => ({
            dimension: String(c.dimension),
            weight: c.weight,
            contribution: c.contribution
          }))
      : [];

    const overall = topByOverall?.riskScore.overall ?? 0;
    const level = topByOverall?.riskScore.level ?? "low";

    const assessmentSummary = assessments
      .map((a, i) => `[${i + 1}] ${a.assessmentSummary}`)
      .join("\n\n");

    const recommendedActions =
      assessmentResult.recommendedActions.length > 0
        ? [...assessmentResult.recommendedActions]
        : [...new Set(assessments.flatMap((a) => a.recommendedActions))];

    // Slim combo snapshot for trend / topCombos analytics. Only present when
    // gaming insights actually fired; the field stays optional so plain
    // general-domain entries remain byte-identical to the v4 format.
    const combos: AuditLogComboSnapshot[] | undefined = (() => {
      const detected = assessmentResult.gamingInsights?.detectedCombos;
      if (!detected || detected.length === 0) return undefined;
      return detected.map((c) => ({
        id: c.id,
        label: c.label,
        occurrenceCount: c.occurrenceCount,
        maxSynergy: c.maxSynergy,
        dimensions: [...c.dimensions]
      }));
    })();

    let compliance: ComplianceMetadata | undefined;
    if (context?.compliance !== undefined) {
      validateComplianceForAuditAppend(context.compliance);
      compliance = context.compliance;
    }

    const entry: AuditLogEntry = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      correlationId,
      inputSummary: {
        entityCount,
        domain,
        domainName: toDomainName(domain)
      },
      resolvedEntityIds,
      riskScore: {
        overall,
        level,
        levelLabel: toRiskLevelLabel(level),
        topDimensions
      },
      ...(combos !== undefined && { combos }),
      ...(compliance !== undefined && { compliance }),
      assessmentSummary,
      recommendedActions
    };

    this.store.push(entry);
    this.indexEntry(entry);
    this.sortEntriesChronological(this.store);
    this.pruneIfNeeded();

    if (this.backend) {
      try {
        await this.backend.persist(this.store);
      } catch (err: unknown) {
        this.log.error("Failed to persist audit log via backend", {
          backend: this.backend.describe(),
          error: (err as Error)?.message ?? String(err)
        });
      }
    } else if (this.persistFile) {
      try {
        await this.flushToDisk();
      } catch (err: unknown) {
        this.log.error("Failed to persist audit log", {
          error: (err as Error)?.message ?? String(err)
        });
      }
    }
  }
}

function parseFilePayload(raw: unknown): { entries: AuditLogEntry[] } {
  if (Array.isArray(raw)) {
    return { entries: raw as AuditLogEntry[] };
  }
  if (raw && typeof raw === "object" && "entries" in raw) {
    const entries = (raw as { entries?: unknown }).entries;
    if (Array.isArray(entries)) {
      return { entries: entries as AuditLogEntry[] };
    }
  }
  throw new Error("Invalid assessment audit log file shape");
}
