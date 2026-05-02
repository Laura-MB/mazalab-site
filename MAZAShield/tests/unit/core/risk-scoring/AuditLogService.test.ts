import { describe, expect, it } from "vitest";

import { RiskScoreAuditLogService } from "../../../../src/core/governance/risk-score-audit-log.service.js";

describe("RiskScoreAuditLogService", () => {
  it("appends and reads records by correlation id", async () => {
    const service = new RiskScoreAuditLogService(null, true);
    const correlationId = "a4f95a3b-42db-46f9-85f7-2039702a8be8";
    await service.append({
      id: "8f0f66f5-0fd2-4ec6-b213-e15ca4ecfce2",
      correlation_id: correlationId,
      domain: "gaming",
      input_summary: { canonicalEntityId: "ent-audit-001" },
      output_summary: { overall: 0.62, level: "high", confidence: 0.83 },
      overall_score: 0.62,
      risk_level: "high",
      confidence: 0.83,
      explanations: "Generated explanation block.",
      bias_flags: ["fraud"],
      model_version: "0.2.0-placeholder-advanced"
    });

    const logs = await service.getByCorrelationId(correlationId);
    expect(logs).toHaveLength(1);
    expect(logs[0]?.domain).toBe("gaming");
    expect(logs[0]?.risk_level).toBe("high");
    expect(logs[0]?.bias_flags).toContain("fraud");
  });
});
