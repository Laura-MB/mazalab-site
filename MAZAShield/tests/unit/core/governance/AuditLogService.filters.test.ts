import { beforeEach, describe, expect, it } from "vitest";

import {
  AUDIT_LOG_SCHEMA_VERSION,
  AuditLogService
} from "../../../../src/core/governance/audit-log.service.js";
import type { AssessmentResult } from "../../../../src/core/assessment/types.js";
import type { RiskDomain } from "../../../../src/core/risk-scoring/types.js";
import type { RiskScore } from "../../../../src/types/index.js";

interface FakeEntryInput {
  entityId: string;
  correlationId: string;
  domain: RiskDomain;
  level: RiskScore["level"];
  overall: number;
}

/**
 * Builds the minimum `AssessmentResult` shape consumed by `logAssessment`.
 * We cast through `unknown` so the helper stays succinct; only the fields
 * the service actually reads are populated, which is what we want to
 * exercise in these focused unit tests.
 */
function fakeAssessmentResult(input: FakeEntryInput): AssessmentResult {
  return {
    domain: input.domain,
    summary: {
      overallRiskLevel: input.level,
      overallRiskLevelLabel: input.level,
      headline: "test"
    },
    keyRiskDrivers: [],
    recommendedActions: [`P1 ${input.level.toUpperCase()} review ${input.entityId}`],
    resolvedEntities: [
      {
        canonicalEntity: {
          id: input.entityId,
          type: "person",
          displayName: `Test ${input.entityId}`,
          aliases: [],
          attributes: {},
          tags: [],
          sources: [],
          confidence: { score: 0.9, lastUpdatedAt: "2026-04-17T00:00:00Z" },
          firstSeenAt: "2026-04-17T00:00:00Z",
          lastSeenAt: "2026-04-17T00:00:00Z"
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
          calculatedAt: "2026-04-17T00:00:00Z",
          modelVersion: "test-model"
        },
        assessmentSummary: `summary for ${input.entityId}`,
        recommendedActions: []
      }
    ]
  } as unknown as AssessmentResult;
}

async function seed(svc: AuditLogService, input: FakeEntryInput): Promise<void> {
  await svc.logAssessment(fakeAssessmentResult(input), {
    correlationId: input.correlationId,
    inputEntityCount: 1
  });
}

describe("AuditLogService — filters, stats & enrichment", () => {
  let svc: AuditLogService;

  beforeEach(async () => {
    svc = new AuditLogService({ persistFile: false, maxEntries: 0 });
    await seed(svc, {
      entityId: "ent-low",
      correlationId: "corr-low",
      domain: "general",
      level: "low",
      overall: 0.15
    });
    await seed(svc, {
      entityId: "ent-medium",
      correlationId: "corr-medium",
      domain: "gaming",
      level: "medium",
      overall: 0.42
    });
    await seed(svc, {
      entityId: "ent-high",
      correlationId: "corr-high",
      domain: "gaming",
      level: "high",
      overall: 0.71
    });
    await seed(svc, {
      entityId: "ent-critical",
      correlationId: "corr-critical",
      domain: "gaming",
      level: "critical",
      overall: 0.93
    });
  });

  describe("enrichment (human-readable labels)", () => {
    it("populates levelLabel and domainName on stored entries", () => {
      const all = svc.getRecentEntries();
      expect(all).toHaveLength(4);
      for (const entry of all) {
        expect(entry.riskScore.levelLabel).toMatch(/^(Low|Medium|High|Critical)$/);
        expect(entry.inputSummary.domainName).toMatch(/^(General|Gaming)$/);
      }
    });

    it("schema version is bumped to 6 (governance compliance field)", () => {
      expect(AUDIT_LOG_SCHEMA_VERSION).toBe(6);
    });
  });

  describe("getRecentEntries — backward compat (positional)", () => {
    it("honors the legacy (limit, offset) call shape", () => {
      const first = svc.getRecentEntries(2, 0);
      const second = svc.getRecentEntries(2, 2);
      expect(first).toHaveLength(2);
      expect(second).toHaveLength(2);
      const firstIds = first.map((e) => e.correlationId);
      const secondIds = second.map((e) => e.correlationId);
      expect(new Set([...firstIds, ...secondIds]).size).toBe(4);
    });

    it("returns newest-first order", () => {
      const entries = svc.getRecentEntries(10, 0);
      const timestamps = entries.map((e) => e.timestamp);
      const sortedDesc = [...timestamps].sort((a, b) => b.localeCompare(a));
      expect(timestamps).toEqual(sortedDesc);
    });
  });

  describe("getRecentEntries — filter by domain", () => {
    it("returns only gaming entries when domain=gaming", () => {
      const entries = svc.getRecentEntries({ domain: "gaming" });
      expect(entries).toHaveLength(3);
      expect(entries.every((e) => e.inputSummary.domain === "gaming")).toBe(true);
    });

    it("returns only general entries when domain=general", () => {
      const entries = svc.getRecentEntries({ domain: "general" });
      expect(entries).toHaveLength(1);
      expect(entries[0]?.inputSummary.domain).toBe("general");
    });
  });

  describe("getRecentEntries — filter by minRiskLevel", () => {
    it("keeps entries at or above the threshold (high → high + critical)", () => {
      const entries = svc.getRecentEntries({ minRiskLevel: "high" });
      const levels = entries.map((e) => e.riskScore.level).sort();
      expect(levels).toEqual(["critical", "high"]);
    });

    it("low threshold returns every entry", () => {
      const entries = svc.getRecentEntries({ minRiskLevel: "low" });
      expect(entries).toHaveLength(4);
    });

    it("critical threshold returns only the top-tier entry", () => {
      const entries = svc.getRecentEntries({ minRiskLevel: "critical" });
      expect(entries).toHaveLength(1);
      expect(entries[0]?.riskScore.level).toBe("critical");
    });
  });

  describe("getRecentEntries — filter by date range", () => {
    it("returns nothing when 'from' is strictly in the future", () => {
      const entries = svc.getRecentEntries({ from: "2999-01-01T00:00:00Z" });
      expect(entries).toEqual([]);
    });

    it("returns every entry when range spans the seeded window", () => {
      const entries = svc.getRecentEntries({
        from: "2000-01-01T00:00:00Z",
        to: "2999-12-31T23:59:59Z"
      });
      expect(entries).toHaveLength(4);
    });

    it("silently ignores an unparseable timestamp", () => {
      const entries = svc.getRecentEntries({ from: "not-a-date" });
      expect(entries).toHaveLength(4);
    });
  });

  describe("getRecentEntries — combined filters", () => {
    it("intersects domain + minRiskLevel correctly", () => {
      const entries = svc.getRecentEntries({ domain: "gaming", minRiskLevel: "high" });
      const levels = entries.map((e) => e.riskScore.level).sort();
      expect(entries.every((e) => e.inputSummary.domain === "gaming")).toBe(true);
      expect(levels).toEqual(["critical", "high"]);
    });
  });

  describe("getFilteredCount", () => {
    it("returns the filtered length without pagination", () => {
      expect(svc.getFilteredCount()).toBe(4);
      expect(svc.getFilteredCount({ domain: "gaming" })).toBe(3);
      expect(svc.getFilteredCount({ minRiskLevel: "high" })).toBe(2);
      expect(svc.getFilteredCount({ domain: "gaming", minRiskLevel: "critical" })).toBe(1);
    });
  });

  describe("getStats", () => {
    it("returns accurate aggregates over all entries", () => {
      const stats = svc.getStats();
      expect(stats.total).toBe(4);
      expect(stats.countByLevel).toEqual({ low: 1, medium: 1, high: 1, critical: 1 });
      expect(stats.countByDomain).toEqual({ general: 1, gaming: 3 });
      expect(stats.avgRiskScore).toBeCloseTo((0.15 + 0.42 + 0.71 + 0.93) / 4, 3);
      expect(stats.earliestTimestamp).not.toBeNull();
      expect(stats.latestTimestamp).not.toBeNull();
      expect(stats.earliestTimestamp! <= stats.latestTimestamp!).toBe(true);
    });

    it("returns zeroed buckets when the log is empty", () => {
      const empty = new AuditLogService({ persistFile: false, maxEntries: 0 });
      const stats = empty.getStats();
      expect(stats.total).toBe(0);
      expect(stats.avgRiskScore).toBe(0);
      expect(stats.countByLevel).toEqual({ low: 0, medium: 0, high: 0, critical: 0 });
      expect(stats.countByDomain).toEqual({ general: 0, gaming: 0 });
      expect(stats.earliestTimestamp).toBeNull();
      expect(stats.latestTimestamp).toBeNull();
      expect(stats.topCombos).toEqual([]);
      expect(stats.trends.dailyCounts.length).toBe(7);
      expect(stats.trends.windowDays).toBe(7);
      expect(stats.trends.byWindow).toEqual({ lastHour: 0, last24Hours: 0, last7Days: 0 });
    });

    it("emits a sparkline of `windowDays` UTC buckets even on a fresh log", () => {
      const empty = new AuditLogService({ persistFile: false, maxEntries: 0 });
      const stats = empty.getStats({ windowDays: 14 });
      expect(stats.trends.dailyCounts).toHaveLength(14);
      // Buckets must be strictly increasing UTC days, oldest -> newest.
      const dates = stats.trends.dailyCounts.map((d) => d.date);
      const sorted = [...dates].sort();
      expect(dates).toEqual(sorted);
      expect(stats.trends.dailyCounts.every((d) => d.count === 0)).toBe(true);
    });

    it("aggregates topCombos from gamingInsights snapshots", async () => {
      // Spin up a clean instance and seed two gaming entries that fire the
      // same combo with different occurrence counts; topCombos must
      // deduplicate by id and sum the counts across entries.
      const tmp = new AuditLogService({ persistFile: false, maxEntries: 0 });
      await tmp.logAssessment(
        {
          ...fakeAssessmentResult({
            entityId: "ring-1",
            correlationId: "c-ring-1",
            domain: "gaming",
            level: "critical",
            overall: 0.91
          }),
          gamingInsights: {
            detectedCombos: [
              {
                id: "apex_critical",
                label: "Apex critical",
                dimensions: ["bonus_abuse", "player_behavior", "fraud"] as never,
                analystNote: "n",
                maxSynergy: 0.12,
                occurrenceCount: 2
              }
            ],
            totalSynergyBoost: 0.12,
            keyArtifactChecklist: []
          }
        } as unknown as ReturnType<typeof fakeAssessmentResult>,
        { correlationId: "c-ring-1", inputEntityCount: 2 }
      );
      await tmp.logAssessment(
        {
          ...fakeAssessmentResult({
            entityId: "ring-2",
            correlationId: "c-ring-2",
            domain: "gaming",
            level: "high",
            overall: 0.78
          }),
          gamingInsights: {
            detectedCombos: [
              {
                id: "apex_critical",
                label: "Apex critical",
                dimensions: ["bonus_abuse", "player_behavior", "fraud"] as never,
                analystNote: "n",
                maxSynergy: 0.10,
                occurrenceCount: 1
              },
              {
                id: "syndicate",
                label: "VIP syndicate",
                dimensions: ["player_behavior", "fraud"] as never,
                analystNote: "n",
                maxSynergy: 0.09,
                occurrenceCount: 3
              }
            ],
            totalSynergyBoost: 0.10,
            keyArtifactChecklist: []
          }
        } as unknown as ReturnType<typeof fakeAssessmentResult>,
        { correlationId: "c-ring-2", inputEntityCount: 3 }
      );

      const stats = tmp.getStats();
      expect(stats.topCombos.length).toBe(2);
      const apex = stats.topCombos.find((c) => c.id === "apex_critical");
      const synd = stats.topCombos.find((c) => c.id === "syndicate");
      expect(apex).toBeDefined();
      expect(apex!.occurrenceCount).toBe(3);
      expect(apex!.entryCount).toBe(2);
      expect(apex!.maxSynergy).toBeCloseTo(0.12, 4);
      expect(synd).toBeDefined();
      expect(synd!.occurrenceCount).toBe(3);
      expect(synd!.entryCount).toBe(1);
      // apex has more occurrences (3 == 3 tie) AND more entryCount (2 vs 1)
      // so it must win the tiebreaker and rank first.
      expect(stats.topCombos[0]?.id).toBe("apex_critical");
    });

    it("clamps windowDays into [1, 90]", () => {
      const empty = new AuditLogService({ persistFile: false, maxEntries: 0 });
      expect(empty.getStats({ windowDays: 0 }).trends.windowDays).toBe(1);
      expect(empty.getStats({ windowDays: 9999 }).trends.windowDays).toBe(90);
      expect(empty.getStats({ windowDays: Number.NaN }).trends.windowDays).toBe(1);
    });

    it("computes rolling 1h / 24h / 7d windows against an injected `now`", async () => {
      const tmp = new AuditLogService({ persistFile: false, maxEntries: 0 });
      await seed(tmp, {
        entityId: "fresh",
        correlationId: "c-fresh",
        domain: "gaming",
        level: "high",
        overall: 0.71
      });
      // Use a "now" two hours after the seeded entry's timestamp: should
      // appear in 24h and 7d but NOT in 1h.
      const seededTs = Date.parse(tmp.getRecentEntries()[0]!.timestamp);
      const now = new Date(seededTs + 2 * 60 * 60 * 1000);
      const stats = tmp.getStats({ now });
      expect(stats.trends.byWindow.lastHour).toBe(0);
      expect(stats.trends.byWindow.last24Hours).toBe(1);
      expect(stats.trends.byWindow.last7Days).toBe(1);
    });
  });
});
