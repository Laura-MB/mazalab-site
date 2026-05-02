// DP-2026-GOV-001, DR-2026-GOV-001-001, RVTM v1.1 — T-GOV-002
import { beforeEach, describe, expect, it } from "vitest";
import { AuditLogService } from "../../../../src/core/governance/audit-log.service.js";
import { buildComplianceMetadata } from "../../../../src/core/governance/compliance-metadata.js";
import type { AssessmentResult } from "../../../../src/core/assessment/types.js";

const ISO = "2026-04-14T00:00:00Z";

function minimalResult(entityId: string, domain: "general" | "gaming" = "general"): AssessmentResult {
  return {
    domain,
    summary: {
      overallRiskLevel: "low",
      overallRiskLevelLabel: "low",
      headline: "h"
    },
    keyRiskDrivers: [],
    recommendedActions: [],
    resolvedEntities: [
      {
        canonicalEntity: {
          id: entityId,
          type: "person",
          displayName: entityId,
          aliases: [],
          attributes: {},
          tags: [],
          sources: [],
          confidence: { score: 0.9, lastUpdatedAt: ISO },
          firstSeenAt: ISO,
          lastSeenAt: ISO
        },
        mergedEntityIds: [entityId],
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
        targetEntityId: entityId,
        riskScore: {
          overall: 0.2,
          level: "low",
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

describe("T-GOV-002: audit append carries compliance (DP-2026-GOV-001)", () => {
  let svc: AuditLogService;

  beforeEach(() => {
    svc = new AuditLogService({ persistFile: false, maxEntries: 100 });
  });

  it("persists compliance on the audit row when logContext.compliance is set", async () => {
    const c = buildComplianceMetadata({
      domain: "general",
      rulesVersion: "r-v1",
      buildRef: "build-x"
    });
    await svc.logAssessment(minimalResult("e1", "general"), {
      correlationId: "c-gov-1",
      inputEntityCount: 1,
      compliance: c
    });
    const [latest] = svc.getRecentEntries(1);
    expect(latest?.compliance).toEqual(c);
    expect(latest?.correlationId).toBe("c-gov-1");
  });
});
