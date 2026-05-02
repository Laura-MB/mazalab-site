import type { Server } from "node:http";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createApp } from "../../../src/app.js";
import {
  AUDIT_LOG_SCHEMA_VERSION,
  __resetSharedAssessmentAuditLogServiceForTests,
  getSharedAssessmentAuditLogService
} from "../../../src/core/governance/audit-log.service.js";
import type { AssessmentResult } from "../../../src/core/assessment/types.js";

const ISO = "2026-04-17T00:00:00Z";

function makeFakeBatch(input: {
  entityId: string;
  level: "low" | "medium" | "high" | "critical";
  overall: number;
  domain?: "general" | "gaming";
}): AssessmentResult {
  return {
    domain: input.domain ?? "general",
    summary: {
      overallRiskLevel: input.level,
      overallRiskLevelLabel: input.level,
      headline: input.entityId
    },
    keyRiskDrivers: [],
    recommendedActions: [`P3 review ${input.entityId}`],
    resolvedEntities: [
      {
        canonicalEntity: {
          id: input.entityId,
          type: "person",
          displayName: input.entityId,
          aliases: [],
          attributes: {},
          tags: [],
          sources: [],
          confidence: { score: 0.9, lastUpdatedAt: ISO },
          firstSeenAt: ISO,
          lastSeenAt: ISO
        },
        inputEntityIds: [input.entityId],
        resolutionConfidence: 0.9,
        conflicts: []
      }
    ],
    assessments: [
      {
        entityId: input.entityId,
        riskScore: {
          overall: input.overall,
          level: input.level,
          components: [],
          confidence: 0.85,
          calculatedAt: ISO,
          modelVersion: "test"
        },
        assessmentSummary: `summary ${input.entityId}`,
        recommendedActions: []
      }
    ]
  } as unknown as AssessmentResult;
}

describe("GET /audit-log/* (v6 schema)", () => {
  let server: Server;

  beforeAll(async () => {
    // Force a fresh, in-memory-only audit log so the integration suite is
    // isolated from `data/audit-log.json` and from prior test ordering.
    __resetSharedAssessmentAuditLogServiceForTests();
    getSharedAssessmentAuditLogService({ persistFile: false, maxEntries: 0 });
    server = createApp().listen(0);
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    __resetSharedAssessmentAuditLogServiceForTests();
  });

  beforeEach(async () => {
    // The service has no public truncate; resetting the singleton + reseeding
    // is the cleanest deterministic strategy for an integration suite.
    __resetSharedAssessmentAuditLogServiceForTests();
    const svc = getSharedAssessmentAuditLogService({ persistFile: false, maxEntries: 0 });
    await svc.logAssessment(makeFakeBatch({ entityId: "ent-low", level: "low", overall: 0.18 }), {
      correlationId: "corr-low",
      inputEntityCount: 1
    });
    await svc.logAssessment(
      makeFakeBatch({ entityId: "ent-high", level: "high", overall: 0.74, domain: "gaming" }),
      { correlationId: "corr-high", inputEntityCount: 1 }
    );
  });

  describe("GET /audit-log/stats", () => {
    it("returns the v5 envelope with topCombos + trends + generatedAt", async () => {
      const res = await request(server).get("/audit-log/stats");
      expect(res.status).toBe(200);
      expect(res.body.schemaVersion).toBe(AUDIT_LOG_SCHEMA_VERSION);
      const stats = res.body.stats;
      expect(stats.total).toBe(2);
      expect(Array.isArray(stats.topCombos)).toBe(true);
      expect(stats.trends).toBeDefined();
      expect(stats.trends.windowDays).toBe(7);
      expect(Array.isArray(stats.trends.dailyCounts)).toBe(true);
      expect(stats.trends.dailyCounts).toHaveLength(7);
      expect(stats.trends.byWindow).toHaveProperty("lastHour");
      expect(stats.trends.byWindow).toHaveProperty("last24Hours");
      expect(stats.trends.byWindow).toHaveProperty("last7Days");
      expect(typeof stats.generatedAt).toBe("string");
    });

    it("honors and clamps ?windowDays= within [1, 90]", async () => {
      const tooLow = await request(server).get("/audit-log/stats?windowDays=0");
      expect(tooLow.status).toBe(200);
      expect(tooLow.body.stats.trends.windowDays).toBe(1);
      expect(tooLow.body.stats.trends.dailyCounts).toHaveLength(1);

      const tooHigh = await request(server).get("/audit-log/stats?windowDays=9999");
      expect(tooHigh.status).toBe(200);
      expect(tooHigh.body.stats.trends.windowDays).toBe(90);
      expect(tooHigh.body.stats.trends.dailyCounts).toHaveLength(90);

      const exact = await request(server).get("/audit-log/stats?windowDays=14");
      expect(exact.status).toBe(200);
      expect(exact.body.stats.trends.windowDays).toBe(14);
      expect(exact.body.stats.trends.dailyCounts).toHaveLength(14);
    });
  });

  describe("GET /audit-log — date-range validation", () => {
    it("rejects malformed 'from'", async () => {
      const res = await request(server).get("/audit-log?from=not-a-date");
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid 'from'/);
    });

    it("rejects 'from' > 'to' with a clear error", async () => {
      const res = await request(server).get(
        "/audit-log?from=2026-05-01T00:00:00Z&to=2026-04-01T00:00:00Z"
      );
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/'from' must be <= 'to'/);
    });

    it("rejects multi-year date ranges (>366 days)", async () => {
      const res = await request(server).get(
        "/audit-log?from=2020-01-01T00:00:00Z&to=2026-04-17T00:00:00Z"
      );
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Date range too large/);
    });

    it("accepts well-formed ranges and returns the filtered envelope", async () => {
      const res = await request(server).get(
        "/audit-log?from=2000-01-01T00:00:00Z&to=2999-01-01T00:00:00Z"
      );
      // The 2000→2999 span is rejected by the guardrail; use a sane window.
      expect(res.status).toBe(400);
      const sane = await request(server).get(
        "/audit-log?from=2026-01-01T00:00:00Z&to=2026-12-31T00:00:00Z"
      );
      expect(sane.status).toBe(200);
      expect(sane.body.meta.filtered).toBe(2);
      expect(sane.body.entries).toHaveLength(2);
    });
  });

  describe("GET /audit-log/:correlationId", () => {
    it("returns the entry indexed for that correlation id", async () => {
      const res = await request(server).get("/audit-log/corr-high");
      expect(res.status).toBe(200);
      expect(res.body.meta.correlationId).toBe("corr-high");
      expect(res.body.entries).toHaveLength(1);
      expect(res.body.entries[0].riskScore.level).toBe("high");
    });

    it("returns 404 for unknown correlation ids", async () => {
      const res = await request(server).get("/audit-log/does-not-exist");
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/No audit entries/);
    });
  });
});
