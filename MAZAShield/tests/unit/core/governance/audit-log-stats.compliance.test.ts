// DP-2026-GOV-001, DR-2026-GOV-001-001, RVTM v1.1 — T-GOV-004
import { beforeEach, describe, expect, it } from "vitest";
import { AuditLogService } from "../../../../src/core/governance/audit-log.service.js";
import { buildComplianceMetadata } from "../../../../src/core/governance/compliance-metadata.js";
import type { AssessmentResult } from "../../../../src/core/assessment/types.js";

const ISO = "2026-04-14T00:00:00Z";

function oneEntryResult(id: string, level: "low" | "high" = "low"): AssessmentResult {
  return {
    domain: "general",
    summary: {
      overallRiskLevel: level,
      overallRiskLevelLabel: level,
      headline: "h"
    },
    keyRiskDrivers: [],
    recommendedActions: [],
    resolvedEntities: [
      {
        canonicalEntity: {
          id,
          type: "person",
          displayName: id,
          aliases: [],
          attributes: {},
          tags: [],
          sources: [],
          confidence: { score: 0.9, lastUpdatedAt: ISO },
          firstSeenAt: ISO,
          lastSeenAt: ISO
        },
        mergedEntityIds: [id],
        resolutionVersion: "t",
        matchStrategy: "deterministic",
        matchScore: 0.9,
        explanation: "t",
        conflicts: [],
        resolvedAt: ISO
      }
    ],
    assessments: [
      {
        id: "a1",
        targetEntityId: id,
        riskScore: {
          overall: level === "high" ? 0.9 : 0.1,
          level,
          components: [],
          confidence: 0.8,
          calculatedAt: ISO,
          modelVersion: "t"
        },
        threatIndicators: [],
        relatedRelations: [],
        assessmentSummary: "s",
        recommendedActions: [],
        status: "draft",
        generatedAt: ISO,
        generatedBy: "system"
      }
    ]
  };
}

describe("T-GOV-004: getStats with compliance-carrying entries", () => {
  let svc: AuditLogService;

  beforeEach(() => {
    svc = new AuditLogService({ persistFile: false, maxEntries: 100 });
  });

  it("keeps countByLevel and totals stable when optional compliance is present", async () => {
    const c = buildComplianceMetadata({
      domain: "general",
      rulesVersion: "r",
      buildRef: "b"
    });
    await svc.logAssessment(oneEntryResult("e1", "high"), {
      correlationId: "c1",
      compliance: c
    });
    const stats = svc.getStats({ windowDays: 7, now: new Date("2026-05-01T12:00:00Z") });
    expect(stats.total).toBe(1);
    expect(stats.countByLevel.high).toBe(1);
    expect(stats.countByDomain.general).toBe(1);
  });
});
