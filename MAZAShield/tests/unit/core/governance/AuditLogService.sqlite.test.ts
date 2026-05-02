import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AuditLogService } from "../../../../src/core/governance/audit-log.service.js";
import { SqliteBackend } from "../../../../src/core/governance/persistence/sqlite-backend.js";
import type { AssessmentResult } from "../../../../src/core/assessment/types.js";

/**
 * Conditional suite: skipped automatically when `better-sqlite3` is not
 * installed (it lives in `optionalDependencies` precisely so installations
 * without a working native toolchain still succeed). The probe runs
 * synchronously at module load so `describe.skipIf` evaluates correctly.
 */
const sqliteAvailable = (() => {
  try {
    const req = createRequire(import.meta.url);
    req.resolve("better-sqlite3");
    return true;
  } catch {
    return false;
  }
})();

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

describe.skipIf(!sqliteAvailable)("AuditLogService — SQLite backend", () => {
  let scratch: string;
  let dbPath: string;

  beforeEach(() => {
    scratch = mkdtempSync(path.join(tmpdir(), "mazalab-sqlite-"));
    dbPath = path.join(scratch, "audit.sqlite");
  });

  afterEach(() => {
    try {
      rmSync(scratch, { recursive: true, force: true });
    } catch {
      /* best effort */
    }
  });

  it("initialises a fresh database, applies migrations, and reports its schema version", async () => {
    const backend = new SqliteBackend({ filePath: dbPath });
    await backend.initialise();

    // Database file should exist on disk after initialise.
    expect(existsSync(dbPath)).toBe(true);

    // Bootstrap on an empty DB yields no entries.
    const initial = await backend.bootstrap();
    expect(initial).toEqual([]);

    backend.close();
  });

  it("persists and reloads entries across service instances", async () => {
    const backend1 = new SqliteBackend({ filePath: dbPath });
    const svc1 = await AuditLogService.createWithBackend(backend1, { maxEntries: 0 });

    await svc1.logAssessment(fakeBatch("alpha"), { correlationId: "c-alpha", inputEntityCount: 1 });
    await svc1.logAssessment(fakeBatch("bravo", "high"), {
      correlationId: "c-bravo",
      inputEntityCount: 1
    });
    await svc1.saveToFile();
    backend1.close();

    // Open a second service against the same DB; entries must round-trip.
    const backend2 = new SqliteBackend({ filePath: dbPath });
    const svc2 = await AuditLogService.createWithBackend(backend2, { maxEntries: 0 });
    const reloaded = svc2.getRecentEntries({ limit: 10 });
    expect(reloaded).toHaveLength(2);
    expect(reloaded.map((e) => e.correlationId).sort()).toEqual(["c-alpha", "c-bravo"]);
    backend2.close();
  });

  it("getByCorrelationId returns the right rows after SQLite round-trip", async () => {
    const backend = new SqliteBackend({ filePath: dbPath });
    const svc = await AuditLogService.createWithBackend(backend, { maxEntries: 0 });

    await svc.logAssessment(fakeBatch("x"), { correlationId: "cid-1", inputEntityCount: 1 });
    await svc.logAssessment(fakeBatch("y"), { correlationId: "cid-2", inputEntityCount: 1 });
    await svc.logAssessment(fakeBatch("z"), { correlationId: "cid-1", inputEntityCount: 1 });

    const cid1 = svc.getByCorrelationId("cid-1");
    expect(cid1).toHaveLength(2);
    expect(svc.getByCorrelationId("cid-2")).toHaveLength(1);
    expect(svc.getByCorrelationId("missing")).toHaveLength(0);

    backend.close();
  });

  it("prune deletes oldest rows from SQLite (delta computed against persisted ids)", async () => {
    const backend = new SqliteBackend({ filePath: dbPath });
    const svc = await AuditLogService.createWithBackend(backend, { maxEntries: 2 });

    await svc.logAssessment(fakeBatch("1"), { correlationId: "c-1", inputEntityCount: 1 });
    await svc.logAssessment(fakeBatch("2"), { correlationId: "c-2", inputEntityCount: 1 });
    await svc.logAssessment(fakeBatch("3"), { correlationId: "c-3", inputEntityCount: 1 });
    await svc.logAssessment(fakeBatch("4"), { correlationId: "c-4", inputEntityCount: 1 });

    expect(svc.getRecentEntries({ limit: 10 })).toHaveLength(2);
    backend.close();

    // Reopen and confirm pruning is durable on disk.
    const backend2 = new SqliteBackend({ filePath: dbPath });
    const svc2 = await AuditLogService.createWithBackend(backend2, { maxEntries: 2 });
    const survivors = svc2.getRecentEntries({ limit: 10 }).map((e) => e.correlationId);
    expect(survivors).toHaveLength(2);
    expect(survivors).toContain("c-4");
    expect(survivors).toContain("c-3");
    backend2.close();
  });

  it("re-running migrations on an existing DB is idempotent", async () => {
    const a = new SqliteBackend({ filePath: dbPath });
    await a.initialise();
    a.close();
    const b = new SqliteBackend({ filePath: dbPath });
    await expect(b.initialise()).resolves.toBeUndefined();
    b.close();
  });

  it("describe() returns a stable, file-aware identifier", () => {
    const backend = new SqliteBackend({ filePath: dbPath });
    expect(backend.describe()).toContain("SqliteBackend");
    expect(backend.describe()).toContain(dbPath);
  });

  it("bootstrapSync() throws because SQLite cannot open synchronously", () => {
    const backend = new SqliteBackend({ filePath: dbPath });
    expect(() => backend.bootstrapSync()).toThrow(/bootstrapSync\(\) is not supported/);
  });
});
