import { beforeEach, describe, expect, it } from "vitest";

import {
  AuditLogService,
  getSharedAssessmentAuditLogService,
  setSharedAssessmentAuditLogService,
  __resetSharedAssessmentAuditLogServiceForTests
} from "../../../../src/core/governance/audit-log.service.js";
import {
  RiskScoreAuditLogService,
  createDefaultRiskScoreAuditLogService,
  getSharedRiskScoreAuditLogService,
  __resetSharedRiskScoreAuditLogServiceForTests
} from "../../../../src/core/governance/risk-score-audit-log.service.js";

describe("Shared audit-log singletons (P0-4 / P0-6)", () => {
  beforeEach(() => {
    __resetSharedAssessmentAuditLogServiceForTests();
    __resetSharedRiskScoreAuditLogServiceForTests();
  });

  describe("AssessmentAuditLogService singleton guard", () => {
    it("returns the same instance across calls", () => {
      const first = getSharedAssessmentAuditLogService({
        persistFile: false,
        maxEntries: 100
      });
      const second = getSharedAssessmentAuditLogService();
      expect(second).toBeInstanceOf(AuditLogService);
      expect(second).toBe(first);
    });

    it("throws when options are supplied after initialization", () => {
      getSharedAssessmentAuditLogService({ persistFile: false });
      expect(() =>
        getSharedAssessmentAuditLogService({ persistFile: false, maxEntries: 42 })
      ).toThrow(/already initialized/i);
    });

    it("can be reset for tests and re-honor fresh options", () => {
      const initial = getSharedAssessmentAuditLogService({ persistFile: false });
      __resetSharedAssessmentAuditLogServiceForTests();
      const recreated = getSharedAssessmentAuditLogService({ persistFile: false });
      expect(recreated).not.toBe(initial);
    });

    it("setSharedAssessmentAuditLogService installs an externally-built instance", () => {
      const external = new AuditLogService({ persistFile: false });
      setSharedAssessmentAuditLogService(external);
      expect(getSharedAssessmentAuditLogService()).toBe(external);
    });

    it("setSharedAssessmentAuditLogService is idempotent on the same instance", () => {
      const external = new AuditLogService({ persistFile: false });
      setSharedAssessmentAuditLogService(external);
      expect(() => setSharedAssessmentAuditLogService(external)).not.toThrow();
      expect(getSharedAssessmentAuditLogService()).toBe(external);
    });

    it("setSharedAssessmentAuditLogService rejects swapping a different instance", () => {
      const a = new AuditLogService({ persistFile: false });
      const b = new AuditLogService({ persistFile: false });
      setSharedAssessmentAuditLogService(a);
      expect(() => setSharedAssessmentAuditLogService(b)).toThrow(
        /a different shared AuditLogService is already installed/
      );
    });
  });

  describe("RiskScoreAuditLogService singleton", () => {
    it("exposes a single shared instance", () => {
      const first = getSharedRiskScoreAuditLogService();
      const second = getSharedRiskScoreAuditLogService();
      expect(first).toBeInstanceOf(RiskScoreAuditLogService);
      expect(second).toBe(first);
    });

    it("routes createDefaultRiskScoreAuditLogService to the shared instance", () => {
      const shared = getSharedRiskScoreAuditLogService();
      const viaFactory = createDefaultRiskScoreAuditLogService();
      expect(viaFactory).toBe(shared);
    });

    it("propagates appended entries across every consumer of the shared log", async () => {
      const correlationId = "shared-log-unit-1111";
      const consumerA = getSharedRiskScoreAuditLogService();
      const consumerB = createDefaultRiskScoreAuditLogService();

      await consumerA.append({
        id: "row-shared-a",
        correlation_id: correlationId,
        domain: "gaming",
        input_summary: { canonicalEntityId: "shared-ent-a" },
        output_summary: { overall: 0.5, level: "medium", confidence: 0.7 },
        overall_score: 0.5,
        risk_level: "medium",
        confidence: 0.7,
        explanations: "shared log test",
        bias_flags: [],
        model_version: "test"
      });

      const viewFromB = await consumerB.getByCorrelationId(correlationId);
      expect(viewFromB).toHaveLength(1);
      expect(viewFromB[0]?.id).toBe("row-shared-a");
    });
  });
});
