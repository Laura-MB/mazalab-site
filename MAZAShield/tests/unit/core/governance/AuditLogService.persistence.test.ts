import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { gunzipSync } from "node:zlib";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  AUDIT_LOG_SCHEMA_VERSION,
  AuditLogService
} from "../../../../src/core/governance/audit-log.service.js";
import type { AssessmentResult } from "../../../../src/core/assessment/types.js";

/**
 * Builds the minimum `AssessmentResult` shape consumed by `logAssessment`.
 * Same trick as `AuditLogService.filters.test.ts`: cast through `unknown`
 * because we only populate the fields the persistence path actually reads.
 */
function fakeBatch(label: string, level: "low" | "high" = "low"): AssessmentResult {
  return {
    domain: "general",
    summary: { overallRiskLevel: level, overallRiskLevelLabel: level, headline: label },
    keyRiskDrivers: [],
    recommendedActions: [`P3 review ${label}`],
    resolvedEntities: [
      {
        canonicalEntity: {
          id: `ent-${label}`,
          type: "person",
          displayName: `Entity ${label}`,
          aliases: [],
          attributes: {},
          tags: [],
          sources: [],
          confidence: { score: 0.9, lastUpdatedAt: "2026-04-17T00:00:00Z" },
          firstSeenAt: "2026-04-17T00:00:00Z",
          lastSeenAt: "2026-04-17T00:00:00Z"
        },
        inputEntityIds: [`ent-${label}`],
        resolutionConfidence: 0.9,
        conflicts: []
      }
    ],
    assessments: [
      {
        entityId: `ent-${label}`,
        riskScore: {
          overall: level === "high" ? 0.81 : 0.21,
          level,
          components: [],
          confidence: 0.85,
          calculatedAt: "2026-04-17T00:00:00Z",
          modelVersion: "test"
        },
        assessmentSummary: `summary ${label}`,
        recommendedActions: []
      }
    ]
  } as unknown as AssessmentResult;
}

describe("AuditLogService — persistence hardening (v5)", () => {
  let scratch: string;

  beforeEach(() => {
    scratch = mkdtempSync(path.join(tmpdir(), "mazalab-audit-"));
  });

  afterEach(() => {
    try {
      rmSync(scratch, { recursive: true, force: true });
    } catch {
      /* best effort */
    }
  });

  describe("atomic write + .bak rotation", () => {
    it("rotates the previous primary file to <file>.bak on every successful flush", async () => {
      const filePath = path.join(scratch, "audit-log.json");
      const svc = new AuditLogService({ filePath, maxEntries: 0 });

      await svc.logAssessment(fakeBatch("a"), { correlationId: "c-a", inputEntityCount: 1 });
      expect(existsSync(filePath)).toBe(true);
      // First flush: no .bak yet (nothing to rotate).
      expect(existsSync(`${filePath}.bak`)).toBe(false);

      await svc.logAssessment(fakeBatch("b"), { correlationId: "c-b", inputEntityCount: 1 });
      // Second flush: previous primary is now the backup.
      expect(existsSync(`${filePath}.bak`)).toBe(true);

      // The .bak must be a parseable snapshot one-step behind the primary.
      const backup = JSON.parse(readFileSync(`${filePath}.bak`, "utf8"));
      expect(backup.schemaVersion).toBe(AUDIT_LOG_SCHEMA_VERSION);
      expect(backup.entries.map((e: { correlationId: string }) => e.correlationId)).toEqual(["c-a"]);

      const primary = JSON.parse(readFileSync(filePath, "utf8"));
      expect(primary.entries.map((e: { correlationId: string }) => e.correlationId)).toEqual([
        "c-a",
        "c-b"
      ]);
    });

    it("temp files do not collide across rapid concurrent persists", async () => {
      const filePath = path.join(scratch, "audit-log.json");
      const svc = new AuditLogService({ filePath, maxEntries: 0 });
      // Fire 20 appends in parallel; the opChain serializes them but each
      // flush still creates a unique tmp file. If our tmp-name strategy
      // collided, the rename would fail intermittently on Windows.
      const ops = Array.from({ length: 20 }).map((_, i) =>
        svc.logAssessment(fakeBatch(`p${i}`), {
          correlationId: `c-p-${i}`,
          inputEntityCount: 1
        })
      );
      await Promise.all(ops);
      expect(svc.getEntryCount()).toBe(20);
      const persisted = JSON.parse(readFileSync(filePath, "utf8"));
      expect(persisted.entries).toHaveLength(20);
    });
  });

  describe("corruption recovery", () => {
    it("recovers from <file>.bak when the primary is unreadable", async () => {
      const filePath = path.join(scratch, "audit-log.json");
      const writer = new AuditLogService({ filePath, maxEntries: 0 });
      await writer.logAssessment(fakeBatch("first"), {
        correlationId: "c-first",
        inputEntityCount: 1
      });
      await writer.logAssessment(fakeBatch("second"), {
        correlationId: "c-second",
        inputEntityCount: 1
      });

      // Corrupt the primary (truncated JSON) but leave the .bak intact.
      writeFileSync(filePath, "{ this is not json", "utf8");
      expect(existsSync(`${filePath}.bak`)).toBe(true);

      // Reading via a fresh instance must fall back to .bak transparently
      // and surface the previous successful snapshot.
      const reader = new AuditLogService({ filePath, maxEntries: 0 });
      const recovered = reader.getRecentEntries();
      expect(recovered.map((e) => e.correlationId)).toEqual(["c-first"]);
    });

    it("starts fresh + flags the file for quarantine when both primary and .bak are corrupt", async () => {
      const filePath = path.join(scratch, "audit-log.json");

      // Plant unreadable bytes in both primary and backup.
      writeFileSync(filePath, "garbage", "utf8");
      writeFileSync(`${filePath}.bak`, "also-garbage", "utf8");

      const reader = new AuditLogService({ filePath, maxEntries: 0 });
      // Service comes up empty in memory.
      expect(reader.getEntryCount()).toBe(0);
      expect(reader.getRecentEntries()).toEqual([]);

      // First successful flush quarantines the corrupt primary out of the way.
      await reader.logAssessment(fakeBatch("post-quarantine"), {
        correlationId: "c-rebuild",
        inputEntityCount: 1
      });

      // The new healthy snapshot lives at the original path.
      const fresh = JSON.parse(readFileSync(filePath, "utf8"));
      expect(fresh.entries).toHaveLength(1);
      expect(fresh.entries[0].correlationId).toBe("c-rebuild");

      // The corrupt original was preserved with a `.corrupt-<ts>` suffix.
      const fs = await import("node:fs/promises");
      const siblings = await fs.readdir(scratch);
      const quarantined = siblings.filter((f) => f.includes(".corrupt-"));
      expect(quarantined.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("optional gzip compression", () => {
    it("writes <file>.gz, removes the legacy plaintext, and round-trips through a new instance", async () => {
      const filePath = path.join(scratch, "audit-log.json");
      const writer = new AuditLogService({ filePath, compress: true, maxEntries: 0 });
      await writer.logAssessment(fakeBatch("gz-1", "high"), {
        correlationId: "c-gz-1",
        inputEntityCount: 1
      });
      await writer.logAssessment(fakeBatch("gz-2", "low"), {
        correlationId: "c-gz-2",
        inputEntityCount: 1
      });

      const gzPath = `${filePath}.gz`;
      expect(existsSync(gzPath)).toBe(true);
      // The gzipped payload must inflate to a parseable v5 snapshot.
      const inflated = gunzipSync(readFileSync(gzPath)).toString("utf8");
      const payload = JSON.parse(inflated);
      expect(payload.schemaVersion).toBe(AUDIT_LOG_SCHEMA_VERSION);
      expect(payload.entries.map((e: { correlationId: string }) => e.correlationId)).toEqual([
        "c-gz-1",
        "c-gz-2"
      ]);

      // Reading back through a fresh `compress: true` instance returns both entries.
      const reader = new AuditLogService({ filePath, compress: true, maxEntries: 0 });
      expect(reader.getEntryCount()).toBe(2);
      expect(reader.getRecentEntries().map((e) => e.correlationId)).toEqual(["c-gz-2", "c-gz-1"]);
    });

    it("when the gzipped primary is corrupt and no alternate candidate loads, bootstrap yields an empty store (compress: true)", async () => {
      const filePath = path.join(scratch, "audit-log.json");
      const writer = new AuditLogService({ filePath, compress: true, maxEntries: 0 });
      await writer.logAssessment(fakeBatch("only"), { correlationId: "c-only", inputEntityCount: 1 });
      expect(existsSync(`${filePath}.gz`)).toBe(true);
      writeFileSync(`${filePath}.gz`, "not-valid-gzip-or-json", "utf8");
      const reader = new AuditLogService({ filePath, compress: true, maxEntries: 0 });
      expect(reader.getEntryCount()).toBe(0);
      expect(reader.getRecentEntries()).toEqual([]);
    });

    it("a non-gz reader transparently falls back to the .gz snapshot when only that exists", async () => {
      const filePath = path.join(scratch, "audit-log.json");
      const writer = new AuditLogService({ filePath, compress: true, maxEntries: 0 });
      await writer.logAssessment(fakeBatch("hybrid"), {
        correlationId: "c-hybrid",
        inputEntityCount: 1
      });
      expect(existsSync(`${filePath}.gz`)).toBe(true);
      expect(existsSync(filePath)).toBe(false);

      // A reader that does NOT know about compression should still find the data
      // because the bootstrap candidate list probes both shapes.
      const reader = new AuditLogService({ filePath, compress: false, maxEntries: 0 });
      expect(reader.getRecentEntries().map((e) => e.correlationId)).toEqual(["c-hybrid"]);
    });
  });

  describe("indexed lookup", () => {
    it("getByCorrelationId returns the entries indexed for that id without scanning the store", async () => {
      const filePath = path.join(scratch, "audit-log.json");
      const svc = new AuditLogService({ filePath, maxEntries: 0 });
      // Two entries share a correlation id; the in-memory entryById map is
      // exercised because we never go through the chronological store sort.
      await svc.logAssessment(fakeBatch("ix-a"), { correlationId: "shared", inputEntityCount: 1 });
      await svc.logAssessment(fakeBatch("ix-b"), { correlationId: "shared", inputEntityCount: 1 });
      await svc.logAssessment(fakeBatch("ix-c"), { correlationId: "other", inputEntityCount: 1 });

      const shared = svc.getByCorrelationId("shared");
      expect(shared).toHaveLength(2);
      expect(shared.every((e) => e.correlationId === "shared")).toBe(true);

      // Whitespace is trimmed defensively so dashboards can pass the raw value.
      expect(svc.getByCorrelationId("  shared  ")).toHaveLength(2);

      // Unknown id returns []; whitespace-only returns []; never throws.
      expect(svc.getByCorrelationId("does-not-exist")).toEqual([]);
      expect(svc.getByCorrelationId("   ")).toEqual([]);
    });
  });
});
