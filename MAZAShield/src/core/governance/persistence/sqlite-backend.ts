import { mkdirSync } from "node:fs";
import path from "node:path";

import type { AuditLogEntry } from "../types.js";
import type { AuditLogPersistenceBackend } from "./backend.js";
import { logger as defaultLogger, type Logger } from "../../observability/logger.js";

/**
 * SQLite persistence backend for the audit log.
 *
 * Uses `better-sqlite3` (synchronous, native) loaded via a **dynamic
 * import** so the package can be declared in `optionalDependencies` and
 * installations on hosts without a working native toolchain do not break.
 * Callers that request the SQLite backend without `better-sqlite3`
 * installed get a clear error at bootstrap time, not later.
 *
 * Operational profile:
 *
 *   - Single shared connection per backend instance (the audit service
 *     serialises calls through its internal `opChain`, so a single
 *     connection is the right shape).
 *   - `journal_mode=WAL` + `synchronous=NORMAL` + `busy_timeout=5000ms`
 *     gives concurrent reader/writer safety with durable commits and
 *     tolerates brief lock contention from co-located processes.
 *   - Prepared statements for hot paths (`SELECT`, `INSERT OR IGNORE`,
 *     `DELETE`); each `persist()` runs as a single transaction.
 *
 * Schema:
 *
 *   - `audit_meta(key TEXT PRIMARY KEY, value TEXT)` — tracks the
 *     **internal** SQLite schema version, distinct from the on-the-wire
 *     `AUDIT_LOG_SCHEMA_VERSION` exported by the service.
 *   - `audit_entries(id TEXT PRIMARY KEY, correlation_id TEXT,
 *     domain TEXT, risk_level TEXT, created_at TEXT, payload TEXT)`
 *     stores the full {@link AuditLogEntry} JSON in `payload` and
 *     promotes the four hot lookup columns to first-class indexed
 *     columns.
 *
 * Migrations are applied sequentially via {@link MIGRATIONS} on every
 * bootstrap. Adding a new schema bump means appending a new entry — the
 * runner records each applied version in `audit_meta` so it never
 * re-applies a migration twice.
 */

/** Internal SQLite schema version. Independent from the wire-format `AUDIT_LOG_SCHEMA_VERSION`. */
export const SQLITE_SCHEMA_VERSION = 1;

/**
 * Ordered list of SQLite migrations. Each migration runs exactly once,
 * tracked in the `audit_meta` table under `schema_version`.
 *
 * Adding a v6 wire bump in the future would append a migration that
 * rewrites payload columns; today none is required because
 * `AUDIT_LOG_SCHEMA_VERSION` is unchanged.
 */
const MIGRATIONS: ReadonlyArray<{ readonly version: number; readonly sql: string }> = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS audit_meta (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS audit_entries (
        id             TEXT PRIMARY KEY,
        correlation_id TEXT NOT NULL,
        domain         TEXT,
        risk_level     TEXT,
        created_at     TEXT NOT NULL,
        payload        TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_audit_entries_correlation
        ON audit_entries (correlation_id);

      CREATE INDEX IF NOT EXISTS idx_audit_entries_created_at
        ON audit_entries (created_at);

      CREATE INDEX IF NOT EXISTS idx_audit_entries_domain
        ON audit_entries (domain);

      CREATE INDEX IF NOT EXISTS idx_audit_entries_risk_level
        ON audit_entries (risk_level);
    `
  }
];

/** Minimal type surface of the bits of `better-sqlite3` we use. */
interface BetterSqliteStatement {
  run(...params: unknown[]): { changes: number; lastInsertRowid: number | bigint };
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
}
interface BetterSqliteDatabase {
  pragma(source: string): unknown;
  exec(source: string): void;
  prepare(source: string): BetterSqliteStatement;
  transaction<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R;
  close(): void;
}
type BetterSqliteCtor = new (filePath: string, options?: { readonly?: boolean }) => BetterSqliteDatabase;

/** Loaded `better-sqlite3` constructor; cached after first successful import. */
let cachedCtor: BetterSqliteCtor | null = null;

/**
 * Dynamically imports `better-sqlite3`. Resolves to `null` (rather than
 * throwing) so callers can `await` the result and produce a clear error
 * message in the right context. Cached on success.
 */
export async function tryLoadBetterSqlite(): Promise<BetterSqliteCtor | null> {
  if (cachedCtor) return cachedCtor;
  try {
    const mod = (await import("better-sqlite3")) as { default?: unknown };
    const ctor = (mod.default ?? mod) as BetterSqliteCtor;
    cachedCtor = ctor;
    return ctor;
  } catch {
    return null;
  }
}

export interface SqliteBackendOptions {
  /** Filesystem path to the SQLite database. The parent directory is created on demand. */
  filePath: string;
  /** Optional logger override; defaults to the process-wide logger. */
  logger?: Logger;
}

/**
 * Persists audit-log entries to a single SQLite database file.
 *
 * Construction is intentionally a two-step dance — `new SqliteBackend`
 * captures options synchronously, but the actual database connection +
 * migrations are deferred to {@link initialise}. This keeps the
 * constructor cheap and lets callers handle missing native deps in one
 * obvious place.
 */
export class SqliteBackend implements AuditLogPersistenceBackend {
  private readonly filePath: string;
  private readonly log: Logger;
  private db: BetterSqliteDatabase | null = null;
  private selectAllStmt: BetterSqliteStatement | null = null;
  private insertStmt: BetterSqliteStatement | null = null;
  private deleteStmt: BetterSqliteStatement | null = null;
  private selectIdsStmt: BetterSqliteStatement | null = null;

  constructor(options: SqliteBackendOptions) {
    this.filePath = options.filePath;
    this.log = (options.logger ?? defaultLogger).child({ service: "audit-log.sqlite" });
  }

  /**
   * Opens the database, runs any pending migrations, and prepares the
   * hot statements. Call exactly once before any other method.
   */
  async initialise(): Promise<void> {
    if (this.db) return;

    const Ctor = await tryLoadBetterSqlite();
    if (!Ctor) {
      throw new Error(
        "[SqliteBackend] better-sqlite3 is not installed. Install it via `npm install better-sqlite3` (requires a working native toolchain), or set AUDIT_LOG_BACKEND=json to use the JSON file backend."
      );
    }

    const absolute = path.isAbsolute(this.filePath) ? this.filePath : path.join(process.cwd(), this.filePath);
    mkdirSync(path.dirname(absolute), { recursive: true });

    const db = new Ctor(absolute);
    db.pragma("journal_mode = WAL");
    db.pragma("synchronous = NORMAL");
    db.pragma("busy_timeout = 5000");
    db.pragma("foreign_keys = ON");

    this.db = db;
    this.runMigrations();
    this.prepareStatements();

    this.log.info("SqliteBackend initialised", {
      filePath: absolute,
      schemaVersion: SQLITE_SCHEMA_VERSION
    });
  }

  /** Synchronous bootstrap is not supported — SQLite must be opened asynchronously. */
  bootstrapSync(): AuditLogEntry[] {
    throw new Error(
      "[SqliteBackend] bootstrapSync() is not supported; the SQLite backend must be initialised asynchronously."
    );
  }

  async bootstrap(): Promise<AuditLogEntry[]> {
    if (!this.db) await this.initialise();
    return this.readAllEntries();
  }

  async persist(entries: ReadonlyArray<AuditLogEntry>): Promise<void> {
    if (!this.db) await this.initialise();
    if (!this.db || !this.insertStmt || !this.deleteStmt || !this.selectIdsStmt) {
      throw new Error("[SqliteBackend] Database is not initialised.");
    }

    // Compute the row-set delta against what's currently persisted. Because
    // we use INSERT OR IGNORE, re-inserting an existing id is a no-op — but
    // computing the explicit delta lets us also DELETE rows that the audit
    // service pruned in memory, which the prune path requires.
    const persistedIds = new Set(this.readAllIds());
    const inMemoryIds = new Set(entries.map((e) => e.id));

    const insertStmt = this.insertStmt;
    const deleteStmt = this.deleteStmt;

    const tx = this.db.transaction((rows: ReadonlyArray<AuditLogEntry>) => {
      // Inserts
      for (const entry of rows) {
        if (persistedIds.has(entry.id)) continue;
        insertStmt.run(
          entry.id,
          entry.correlationId,
          entry.inputSummary?.domain ?? null,
          entry.riskScore?.level ?? null,
          entry.timestamp ?? new Date().toISOString(),
          JSON.stringify(entry)
        );
      }
      // Deletions (for the prune path)
      for (const id of persistedIds) {
        if (!inMemoryIds.has(id)) deleteStmt.run(id);
      }
    });

    tx(entries);
  }

  describe(): string {
    return `SqliteBackend(${this.filePath})`;
  }

  close(): void {
    if (!this.db) return;
    try {
      this.db.close();
    } catch (err) {
      this.log.warn("SqliteBackend close failed", { error: err instanceof Error ? err.message : String(err) });
    } finally {
      this.db = null;
      this.selectAllStmt = null;
      this.insertStmt = null;
      this.deleteStmt = null;
      this.selectIdsStmt = null;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Internals                                                           */
  /* ------------------------------------------------------------------ */

  private runMigrations(): void {
    if (!this.db) return;
    const db = this.db;
    // Ensure the meta table exists before reading the version (the very
    // first migration creates it, so we run that bootstrap-statement
    // unconditionally and idempotently).
    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_meta (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    const row = db.prepare("SELECT value FROM audit_meta WHERE key = 'schema_version'").get() as
      | { value: string }
      | undefined;
    const currentVersion = row ? Number.parseInt(row.value, 10) : 0;

    const upsertVersionStmt = db.prepare(
      "INSERT INTO audit_meta (key, value) VALUES ('schema_version', ?) " +
        "ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    );

    const apply = db.transaction((from: number) => {
      let applied = from;
      for (const migration of MIGRATIONS) {
        if (migration.version <= applied) continue;
        db.exec(migration.sql);
        upsertVersionStmt.run(String(migration.version));
        applied = migration.version;
        this.log.info("SqliteBackend migration applied", { version: migration.version });
      }
      return applied;
    });

    const finalVersion = apply(currentVersion);
    if (finalVersion !== SQLITE_SCHEMA_VERSION) {
      this.log.warn("SqliteBackend schema mismatch after migrations", {
        expected: SQLITE_SCHEMA_VERSION,
        actual: finalVersion
      });
    }
  }

  private prepareStatements(): void {
    if (!this.db) return;
    this.selectAllStmt = this.db.prepare(
      "SELECT payload FROM audit_entries ORDER BY created_at ASC, id ASC"
    );
    this.selectIdsStmt = this.db.prepare("SELECT id FROM audit_entries");
    this.insertStmt = this.db.prepare(
      "INSERT OR IGNORE INTO audit_entries (id, correlation_id, domain, risk_level, created_at, payload) " +
        "VALUES (?, ?, ?, ?, ?, ?)"
    );
    this.deleteStmt = this.db.prepare("DELETE FROM audit_entries WHERE id = ?");
  }

  private readAllEntries(): AuditLogEntry[] {
    if (!this.selectAllStmt) return [];
    const rows = this.selectAllStmt.all() as Array<{ payload: string }>;
    const entries: AuditLogEntry[] = [];
    for (const row of rows) {
      try {
        entries.push(JSON.parse(row.payload) as AuditLogEntry);
      } catch (err) {
        this.log.warn("SqliteBackend skipped unparseable row", {
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }
    return entries;
  }

  private readAllIds(): string[] {
    if (!this.selectIdsStmt) return [];
    const rows = this.selectIdsStmt.all() as Array<{ id: string }>;
    return rows.map((r) => r.id);
  }
}
