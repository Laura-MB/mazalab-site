import { describe, expect, it } from "vitest";

import { DOMAIN_CONFIG_MAP } from "../../../../src/core/risk-scoring/config/domain-config.js";
import { RiskScoringService } from "../../../../src/core/risk-scoring/service.js";
import { RiskScoreAuditLogService } from "../../../../src/core/governance/risk-score-audit-log.service.js";
import type { ResolvedEntity } from "../../../../src/types/index.js";

const ISO = "2026-04-17T12:00:00Z";

function makeResolvedEntity(overrides?: Partial<ResolvedEntity>): ResolvedEntity {
  const base: ResolvedEntity = {
    canonicalEntity: {
      id: "ent-unit-001",
      type: "person",
      displayName: "Test Subject",
      aliases: ["T. Subject"],
      attributes: { nationality: "US" },
      tags: [],
      sources: [
        {
          sourceId: "src-1",
          sourceName: "unit",
          sourceType: "internal",
          collectedAt: ISO,
          confidence: 0.9
        }
      ],
      confidence: { score: 0.88, lastUpdatedAt: ISO },
      firstSeenAt: ISO,
      lastSeenAt: ISO
    },
    mergedEntityIds: ["ent-unit-001"],
    resolutionVersion: "test",
    matchStrategy: "hybrid",
    matchScore: 0.85,
    explanation: "Unit resolution baseline.",
    conflicts: [],
    resolvedAt: ISO
  };
  return {
    ...base,
    ...overrides,
    canonicalEntity: {
      ...base.canonicalEntity,
      ...(overrides?.canonicalEntity ?? {})
    }
  };
}

function sumComponentWeights(score: Awaited<ReturnType<RiskScoringService["calculateRiskScore"]>>): number {
  return score.components.reduce((s, c) => s + c.weight, 0);
}

describe("RiskScoringService", () => {
  const inMemoryRiskAudit = new RiskScoreAuditLogService(null, true);

  describe('domain "general"', () => {
    it("returns a bounded overall score with expected general dimensions", async () => {
      const service = new RiskScoringService(undefined, inMemoryRiskAudit);
      const score = await service.calculateRiskScore(makeResolvedEntity());

      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(1);
      expect(score.level).toMatch(/^(low|medium|high|critical)$/);
      const dims = score.components.map((c) => c.dimension);
      expect(dims).toContain("sanctions");
      expect(dims).toContain("fraud");
      expect(dims).toContain("aml");
      expect(dims).not.toContain("bonus_abuse");
    });

    it("includes domain-relevant wording in the explanation", async () => {
      const service = new RiskScoringService(undefined, inMemoryRiskAudit);
      const score = await service.calculateRiskScore(makeResolvedEntity());

      expect(score.explanation).toMatch(/general domain/i);
      expect(score.explanation?.length).toBeGreaterThan(80);
    });
  });

  describe('domain "gaming"', () => {
    it("scores with gaming-specific dimensions including bonus_abuse and player_behavior", async () => {
      const service = new RiskScoringService({ domain: "gaming" }, inMemoryRiskAudit);
      const score = await service.calculateRiskScore(makeResolvedEntity());

      const dims = score.components.map((c) => c.dimension);
      expect(dims).toHaveLength(6);
      expect(dims).toContain("fraud");
      expect(dims).toContain("bonus_abuse");
      expect(dims).toContain("player_behavior");
      expect(dims).toContain("aml_kyc");
      expect(dims).toContain("responsible_gaming");
      expect(dims).toContain("vendor_risk");
    });

    it("surfaces gaming analyst context in explanations", async () => {
      const service = new RiskScoringService({ domain: "gaming" }, inMemoryRiskAudit);
      const score = await service.calculateRiskScore(makeResolvedEntity());

      expect(score.explanation).toMatch(/gaming domain/i);
      expect(score.explanation).toMatch(/Casino \/ G2E analyst focus/i);
    });
  });

  describe("normalized weights", () => {
    it("exposes component weights that sum to ~1 for each domain", async () => {
      const general = new RiskScoringService({ domain: "general" }, inMemoryRiskAudit);
      const gaming = new RiskScoringService({ domain: "gaming" }, inMemoryRiskAudit);

      const gScore = await general.calculateRiskScore(makeResolvedEntity());
      const mScore = await gaming.calculateRiskScore(makeResolvedEntity());

      expect(sumComponentWeights(gScore)).toBeCloseTo(1, 5);
      expect(sumComponentWeights(mScore)).toBeCloseTo(1, 5);
    });

    it("applies custom dimension weight overrides relative to defaults", async () => {
      const baseline = new RiskScoringService({ domain: "general" }, inMemoryRiskAudit);
      const boostedFraud = new RiskScoringService(
        { domain: "general", dimensionWeights: { fraud: 0.55 } },
        inMemoryRiskAudit
      );

      const base = await baseline.calculateRiskScore(makeResolvedEntity());
      const tuned = await boostedFraud.calculateRiskScore(makeResolvedEntity());

      const fraudBase = base.components.find((c) => c.dimension === "fraud");
      const fraudTuned = tuned.components.find((c) => c.dimension === "fraud");
      expect(fraudBase?.weight).toBeDefined();
      expect(fraudTuned?.weight).toBeDefined();
      expect(fraudTuned!.weight).toBeGreaterThan(fraudBase!.weight);
    });
  });

  describe("risk separation: low-signal vs high-signal entity", () => {
    it("assigns a higher overall score to a high-risk profile than a minimal profile", async () => {
      const service = new RiskScoringService({ domain: "gaming" }, inMemoryRiskAudit);

      const lowRisk = makeResolvedEntity({
        canonicalEntity: {
          ...makeResolvedEntity().canonicalEntity,
          id: "low-1",
          attributes: { nationality: "CA", date_of_birth: "1990-01-01" },
          tags: ["verified"]
        },
        matchScore: 0.95
      });

      const highRisk = makeResolvedEntity({
        canonicalEntity: {
          ...makeResolvedEntity().canonicalEntity,
          id: "high-1",
          attributes: {
            chargeback: "multiple",
            aml_alert: "high",
            fraud_pattern: "bonus abuse ring",
            vendor_partner: "unverified",
            responsible_gaming: "limit_breach"
          },
          tags: ["chargeback", "aml", "fraud", "rg-alert"]
        },
        matchScore: 0.55,
        conflicts: [
          {
            field: "alias",
            values: ["A", "B"],
            selectedValue: "A"
          }
        ]
      });

      const low = await service.calculateRiskScore(lowRisk);
      const high = await service.calculateRiskScore(highRisk);

      expect(high.overall).toBeGreaterThan(low.overall);
    });
  });

  describe("domain config alignment", () => {
    it("loads non-zero priors from DOMAIN_CONFIG_MAP for active dimensions", async () => {
      const gamingConfig = DOMAIN_CONFIG_MAP.gaming;
      expect(gamingConfig.fraud?.weight).toBeGreaterThan(0);
      expect(gamingConfig.bonus_abuse?.weight).toBeGreaterThan(0);
      expect(gamingConfig.player_behavior?.weight).toBeGreaterThan(0);
    });

    it("keeps gaming-native dimensions with stronger relative weight than support dimensions", () => {
      const g = DOMAIN_CONFIG_MAP.gaming;
      const bonus = g.bonus_abuse?.weight ?? 0;
      const behavior = g.player_behavior?.weight ?? 0;
      const rg = g.responsible_gaming?.weight ?? 0;
      const fraud = g.fraud?.weight ?? 0;
      const aml = g.aml_kyc?.weight ?? 0;
      const vendor = g.vendor_risk?.weight ?? 0;

      expect(bonus).toBeGreaterThan(fraud);
      expect(bonus).toBeGreaterThan(aml);
      expect(bonus).toBeGreaterThan(vendor);
      expect(behavior).toBeGreaterThan(aml);
      expect(behavior).toBeGreaterThan(vendor);
      expect(rg).toBeGreaterThan(vendor);
    });

    it("sums to 1.00 across all six gaming dimensions", () => {
      const g = DOMAIN_CONFIG_MAP.gaming;
      const total = Object.values(g)
        .filter((d): d is NonNullable<typeof d> => d !== undefined)
        .reduce((s, d) => s + d.weight, 0);
      expect(total).toBeCloseTo(1.0, 5);
    });
  });

  describe("gaming explanation actionability", () => {
    it("surfaces priority-tagged operator actions in the gaming explanation", async () => {
      const audit = new RiskScoreAuditLogService(null, true);
      const service = new RiskScoringService({ domain: "gaming" }, audit);

      const highSignalPlayer = makeResolvedEntity({
        canonicalEntity: {
          ...makeResolvedEntity().canonicalEntity,
          id: "player-high-1",
          attributes: {
            bonus_abuse: "rollover arb",
            velocity_flag: "session binge",
            responsible_gaming: "limit breach",
            chargeback: "multiple"
          },
          tags: ["bonus", "velocity", "rg-alert"]
        },
        matchScore: 0.6
      });

      const score = await service.calculateRiskScore(highSignalPlayer);

      expect(score.explanation).toMatch(/\[Gaming-P(1|2|3|4)\]/);
      expect(score.explanation).toMatch(/\[Bonus\]|\[Velocity\]|\[RG\]|\[Fraud\]|\[AML\/KYC\]|\[Vendor\]/);
    });

    it("embeds the operational template wording in every component justification", async () => {
      const audit = new RiskScoreAuditLogService(null, true);
      const service = new RiskScoringService({ domain: "gaming" }, audit);
      const score = await service.calculateRiskScore(makeResolvedEntity());

      const bonus = score.components.find((c) => c.dimension === "bonus_abuse");
      const behavior = score.components.find((c) => c.dimension === "player_behavior");
      const rg = score.components.find((c) => c.dimension === "responsible_gaming");

      expect(bonus?.justification).toMatch(/rollover/i);
      expect(behavior?.justification).toMatch(/velocity/i);
      expect(rg?.justification).toMatch(/(limit|self-exclusion|cooling-off)/i);
      for (const component of [bonus, behavior, rg]) {
        expect(component?.justification).toMatch(/biasFlag=(true|false)/);
      }
    });
  });

  describe("general domain backward compatibility", () => {
    it("keeps general-dimension justifications emitting biasFlag token for bias screening", async () => {
      const audit = new RiskScoreAuditLogService(null, true);
      const service = new RiskScoringService({ domain: "general" }, audit);
      const score = await service.calculateRiskScore(makeResolvedEntity());

      for (const component of score.components) {
        expect(component.justification).toMatch(/biasFlag=(true|false)/);
      }
    });

    it("keeps general-domain explanation free of gaming-only priority tags", async () => {
      const audit = new RiskScoreAuditLogService(null, true);
      const service = new RiskScoringService({ domain: "general" }, audit);
      const score = await service.calculateRiskScore(makeResolvedEntity());

      expect(score.explanation ?? "").not.toMatch(/\[Gaming-P/);
      expect(score.explanation).toMatch(/general domain/i);
    });
  });

  describe("explicit correlationId plumbing (P0-3)", () => {
    it("uses the caller-provided correlationId in the emitted audit row", async () => {
      const audit = new RiskScoreAuditLogService(null, true);
      const service = new RiskScoringService({ domain: "general" }, audit);
      const correlationId = "p0-3-corr-2f9a-11ee";

      await service.calculateRiskScore(makeResolvedEntity(), { correlationId });
      const rows = await audit.getByCorrelationId(correlationId);

      expect(rows).toHaveLength(1);
      expect(rows[0]?.correlation_id).toBe(correlationId);
    });

    it("does not parse correlationId from the resolvedEntity explanation text", async () => {
      const audit = new RiskScoreAuditLogService(null, true);
      const service = new RiskScoringService({ domain: "general" }, audit);

      const resolvedWithEmbeddedCorr = makeResolvedEntity({
        explanation:
          "Unit baseline. Correlation: SHOULD-NOT-BE-USED-9999. (embedded for regression)"
      });

      await service.calculateRiskScore(resolvedWithEmbeddedCorr, {
        correlationId: "explicit-wins-0001"
      });

      const explicit = await audit.getByCorrelationId("explicit-wins-0001");
      const embedded = await audit.getByCorrelationId("SHOULD-NOT-BE-USED-9999");

      expect(explicit).toHaveLength(1);
      expect(embedded).toHaveLength(0);
    });

    it("falls back to a generated correlationId when none is provided", async () => {
      const audit = new RiskScoreAuditLogService(null, true);
      const service = new RiskScoringService({ domain: "general" }, audit);

      const explainedInput = makeResolvedEntity({
        explanation: "Resolution baseline. Correlation: regex-bait-4242."
      });

      await service.calculateRiskScore(explainedInput);

      const regexBait = await audit.getByCorrelationId("regex-bait-4242");
      expect(regexBait).toHaveLength(0);
    });
  });
});
