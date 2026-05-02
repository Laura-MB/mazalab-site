import { describe, expect, it, vi } from "vitest";

import { RiskScoreAuditLogService } from "../../../../src/core/governance/risk-score-audit-log.service.js";
import { RiskScoringService } from "../../../../src/core/risk-scoring/service.js";
import {
  ComboDetector,
  DriverPrioritizer,
  DynamicSynergyEngine,
  GAMING_ARTIFACT_CATALOG,
  GAMING_COMBO_DEFINITIONS,
  GAMING_SYNERGY_GLOBAL_CAP,
  GAMING_V02_ADVANCED_PATTERN_ARTEFACTS
} from "../../../../src/core/risk-scoring/combos.js";
import type { DimensionSignal, GamingCombo } from "../../../../src/core/risk-scoring/types.js";
import type { ResolvedEntity, RiskScoreComponent } from "../../../../src/types/index.js";

const ISO = "2026-04-15T00:00:00Z";

function makeResolvedEntity(overrides?: Partial<ResolvedEntity>): ResolvedEntity {
  const base: ResolvedEntity = {
    canonicalEntity: {
      id: "ent-gaming-001",
      type: "person",
      displayName: "Laura Mendoza",
      aliases: ["L. Mendoza", "Laura M."],
      attributes: {
        nationality: "MX",
        aml_alert: "true",
        vendor_partner: "third_party_gateway",
        responsible_gaming: "limit_breach_warning"
      },
      jurisdiction: "MX",
      tags: ["gaming", "high-velocity-transactions", "risk-monitoring"],
      sources: [
        {
          sourceId: "src-1",
          sourceName: "internal-risk-feed",
          sourceType: "internal",
          collectedAt: ISO,
          confidence: 0.9
        }
      ],
      confidence: {
        score: 0.86,
        lastUpdatedAt: ISO
      },
      firstSeenAt: ISO,
      lastSeenAt: ISO
    },
    mergedEntityIds: ["ent-gaming-001"],
    resolutionVersion: "0.2.0-placeholder-explainable",
    matchStrategy: "hybrid",
    matchScore: 0.74,
    explanation: "Resolution baseline explanation.",
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

describe("RiskScoringService domain routing", () => {
  it("keeps backward compatibility by defaulting to general domain", async () => {
    const service = new RiskScoringService();
    const risk = await service.calculateRiskScore(makeResolvedEntity());

    const dimensions = risk.components.map((c) => c.dimension);
    expect(dimensions).toContain("fraud");
    expect(dimensions).toContain("aml");
    expect(dimensions).not.toContain("aml_kyc");
    expect(dimensions).not.toContain("responsible_gaming");
    expect(dimensions).not.toContain("vendor_risk");
  });

  it("supports gaming domain with gaming-specific dimensions", async () => {
    const service = new RiskScoringService({ domain: "gaming" });
    const risk = await service.calculateRiskScore(makeResolvedEntity());

    const dimensions = risk.components.map((c) => c.dimension);
    expect(risk.components.length).toBe(6);
    expect(dimensions).toContain("fraud");
    expect(dimensions).toContain("bonus_abuse");
    expect(dimensions).toContain("player_behavior");
    expect(dimensions).toContain("aml_kyc");
    expect(dimensions).toContain("responsible_gaming");
    expect(dimensions).toContain("vendor_risk");
    expect(dimensions).not.toContain("sanctions");
  });
});

describe("RiskScoringService gaming explainability", () => {
  it("writes audit entry on calculateRiskScore", async () => {
    const auditLogService = new RiskScoreAuditLogService(null, true);
    const service = new RiskScoringService({ domain: "gaming" }, auditLogService);
    const appendSpy = vi.spyOn(auditLogService, "append");

    await service.calculateRiskScore(makeResolvedEntity());

    expect(appendSpy).toHaveBeenCalledTimes(1);
    const firstCall = appendSpy.mock.calls[0]?.[0];
    expect(firstCall?.domain).toBe("gaming");
    expect(firstCall?.overall_score).toBeTypeOf("number");
  });

  it("includes template/confidence/bias-flag details in gaming justifications", async () => {
    const service = new RiskScoringService({ domain: "gaming" });
    const risk = await service.calculateRiskScore(
      makeResolvedEntity({
        conflicts: [
          {
            field: "displayName_vs_alias",
            values: ["Laura Mendoza", "Completely Unrelated Alias"],
            selectedValue: "Laura Mendoza"
          }
        ]
      })
    );

    const justification = risk.components.map((c) => c.justification).join("\n");
    expect(justification).toMatch(/confidence=/i);
    expect(justification).toMatch(/biasFlag=/i);
    expect(justification).toMatch(/gaming/i);
  });

  it("produces actionable gaming explanation text", async () => {
    const service = new RiskScoringService({ domain: "gaming" });
    const risk = await service.calculateRiskScore(makeResolvedEntity());
    const explanation = risk.explanation ?? risk.components[0]?.justification ?? "";

    expect(explanation).toMatch(/gaming domain/i);
    expect(explanation).toMatch(
      /fraud|bonus_abuse|player_behavior|aml_kyc|responsible_gaming|vendor_risk/i
    );
    expect(explanation).toMatch(/Casino \/ G2E analyst focus/i);
  });

  it("raises gaming risk when strong fraud/vendor signals are present", async () => {
    const service = new RiskScoringService({ domain: "gaming" });

    const lowSignal = await service.calculateRiskScore(
      makeResolvedEntity({
        canonicalEntity: {
          ...makeResolvedEntity().canonicalEntity,
          attributes: { nationality: "MX" },
          tags: []
        }
      })
    );

    const highSignal = await service.calculateRiskScore(
      makeResolvedEntity({
        canonicalEntity: {
          ...makeResolvedEntity().canonicalEntity,
          attributes: {
            fraud_pattern: "bonus abuse ring",
            aml_alert: "high",
            vendor_partner: "unverified-third-party",
            responsible_gaming: "self exclusion flagged"
          },
          tags: ["bonus-abuse", "high-risk-vendor", "rg-alert"]
        },
        conflicts: [
          {
            field: "displayName_vs_alias",
            values: ["Laura Mendoza", "Mismatch Alias #1"],
            selectedValue: "Laura Mendoza"
          }
        ]
      })
    );

    expect(highSignal.overall).toBeGreaterThan(lowSignal.overall);
  });
});

describe("RiskScoringService gaming adaptive combos (Week-2)", () => {
  /**
   * Helper that builds an entity stuffed with the attributes/tags that trip
   * fraud + bonus_abuse + player_behavior signals simultaneously — a
   * chip-dump / syndicate composite.
   */
  function makeSyndicateEntity(): ResolvedEntity {
    return makeResolvedEntity({
      canonicalEntity: {
        ...makeResolvedEntity().canonicalEntity,
        attributes: {
          nationality: "MX",
          fraud_pattern: "account takeover",
          chargeback: "disputed payment",
          bonus_abuse: "rollover arb",
          rollover: "syndicate",
          promo_abuse: "gnoming",
          velocity: "session binge",
          stake_ramp: "loss chase",
          bet_velocity: "velocity spike",
          aml_alert: "true",
          responsible_gaming: "limit breach"
        },
        tags: [
          "gaming",
          "bonus-abuse",
          "fraud-ring",
          "high-velocity-transactions",
          "session-binge",
          "rg-alert"
        ]
      },
      conflicts: [
        {
          field: "displayName_vs_alias",
          values: ["Laura Mendoza", "Collusive Alias"],
          selectedValue: "Laura Mendoza"
        }
      ]
    });
  }

  it("produces a higher composite overall when multi-signal combos converge than when signals fire in isolation", async () => {
    const service = new RiskScoringService({ domain: "gaming" });

    // Strong only on fraud (no combo)
    const fraudOnly = await service.calculateRiskScore(
      makeResolvedEntity({
        canonicalEntity: {
          ...makeResolvedEntity().canonicalEntity,
          attributes: {
            nationality: "MX",
            fraud_pattern: "account takeover",
            chargeback: "disputed payment"
          },
          tags: ["gaming", "fraud-ring"]
        }
      })
    );

    // Fraud + bonus_abuse + player_behavior all strong → apex_critical combo
    const syndicate = await service.calculateRiskScore(makeSyndicateEntity());

    expect(syndicate.overall).toBeGreaterThan(fraudOnly.overall);
    // Synergy must be bounded; composite stays ≤ 1.0 by construction.
    expect(syndicate.overall).toBeLessThanOrEqual(1);
  });

  it("surfaces combo labels in the explanation narrative with artifact-rich actions", async () => {
    const service = new RiskScoringService({ domain: "gaming" });
    const risk = await service.calculateRiskScore(makeSyndicateEntity());
    const explanation = risk.explanation ?? "";

    // Narrative surfaces the adaptive combo section and combo IDs.
    expect(explanation).toMatch(/Adaptive combos detected/i);
    expect(explanation).toMatch(/\[syndicate\]|\[chip_dump\]|\[apex_critical\]/);

    // Artifact references the analyst actually cares about at a casino desk.
    expect(explanation).toMatch(/rollover_progress/);
    expect(explanation).toMatch(/session_length|bet_velocity_7d|stake_ramp/);
    expect(explanation).toMatch(/device_fingerprint/);

    // Combo-prefixed action must appear above priority actions for a
    // converged syndicate pattern.
    expect(explanation).toMatch(/\[Combo\/(syndicate|chip_dump|apex_critical)\]/);
    // Narrative cross-links core-engine combos vs v0.2 advanced patterns + artefact keys.
    expect(explanation).toMatch(/promo_rail_stack.*aml_sleeper_lift/);
    expect(explanation).toMatch(/rail_exposure_heatmap/);
  });

  it("does not tag combos when signals fire in isolation (backward compatibility)", async () => {
    const service = new RiskScoringService({ domain: "gaming" });
    // Vendor-only signal should not trip any casino combo.
    const risk = await service.calculateRiskScore(
      makeResolvedEntity({
        canonicalEntity: {
          ...makeResolvedEntity().canonicalEntity,
          attributes: {
            nationality: "MX",
            vendor_partner: "unverified-third-party"
          },
          tags: ["gaming", "vendor-risk"]
        }
      })
    );
    const explanation = risk.explanation ?? "";

    expect(explanation).not.toMatch(/Adaptive combos detected/i);
    expect(explanation).not.toMatch(/\[Combo\/(syndicate|chip_dump|vulnerable_aml|apex_critical)\]/);
  });

  it("includes [Fraud] and [Bonus] artifact-tagged actions with concrete casino fields", async () => {
    const service = new RiskScoringService({ domain: "gaming" });
    const risk = await service.calculateRiskScore(makeSyndicateEntity());
    const explanation = risk.explanation ?? "";

    expect(explanation).toMatch(/\[Fraud\][\s\S]*chargeback_history_90d/);
    expect(explanation).toMatch(/\[Bonus\][\s\S]*rollover_progress/);
  });
});

describe("RiskScoringService gaming structured narrative", () => {
  it("emits the full section ladder (Summary → Key Drivers → … → Artifact Checklist)", async () => {
    const service = new RiskScoringService({ domain: "gaming" });
    const risk = await service.calculateRiskScore(
      makeResolvedEntity({
        canonicalEntity: {
          ...makeResolvedEntity().canonicalEntity,
          attributes: {
            nationality: "MX",
            fraud_pattern: "account takeover",
            chargeback: "disputed payment",
            bonus_abuse: "rollover arb",
            velocity: "session binge",
            aml_alert: "true",
            responsible_gaming: "limit breach"
          },
          tags: ["gaming", "bonus-abuse", "fraud-ring", "session-binge"]
        }
      })
    );
    const explanation = risk.explanation ?? "";

    expect(explanation).toMatch(/=== Risk Assessment · gaming domain ===/);
    expect(explanation).toMatch(/^\[(LOW|MEDIUM|HIGH|CRITICAL)\] /m);
    expect(explanation).toMatch(/^Summary$/m);
    expect(explanation).toMatch(/Key Drivers \(Casino \/ G2E analyst focus\)/);
    expect(explanation).toMatch(/Dimension Breakdown \(by weighted contribution\)/);
    expect(explanation).toMatch(/Operator Recommendations \(Gaming playbook\)/);
    expect(explanation).toMatch(/Artifact Checklist \(open in ops console\)/);
    // The artefact checklist must surface casino-grade field names verbatim.
    expect(explanation).toMatch(/Fraud: chargeback_history_90d/);
    expect(explanation).toMatch(/Bonus: rollover_progress/);
  });

  it("keeps general-domain narrative structured but without gaming-only sections", async () => {
    const service = new RiskScoringService({ domain: "general" });
    const risk = await service.calculateRiskScore(makeResolvedEntity());
    const explanation = risk.explanation ?? "";

    expect(explanation).toMatch(/=== Risk Assessment · general domain ===/);
    expect(explanation).toMatch(/^Summary$/m);
    expect(explanation).toMatch(/Key Drivers \(weighted contribution\)/);
    expect(explanation).toMatch(/Operator Recommendations/);
    // No gaming-specific sections on general-domain output.
    expect(explanation).not.toMatch(/Casino \/ G2E analyst focus/);
    expect(explanation).not.toMatch(/Adaptive combos detected/);
    expect(explanation).not.toMatch(/Artifact Checklist/);
  });
});

describe("RiskScoringService gaming Week-2.5 combos & dynamic synergy", () => {
  /**
   * Parses a single line like:
   *   `01. [chip_dump] Chip-dump … (+0.0712 synergy) — dimensions: …`
   * out of the gaming explanation text and returns the float synergy value.
   */
  function extractSynergy(explanation: string, comboId: string): number | null {
    const re = new RegExp(`\\[${comboId}\\][^\\n]*\\(\\+([0-9]+\\.[0-9]+) synergy\\)`);
    const m = re.exec(explanation);
    return m && m[1] ? Number.parseFloat(m[1]) : null;
  }

  function extractTotalSynergy(explanation: string): number | null {
    const m = /Total synergy boost applied to composite: \+([0-9]+\.[0-9]+) \(global cap ([0-9.]+) on stacked per-combo uplift\)/.exec(
      explanation
    );
    return m && m[1] ? Number.parseFloat(m[1]) : null;
  }

  it("detects vendor_collusion when vendor + fraud signals converge (no bonus signal needed)", async () => {
    const service = new RiskScoringService({ domain: "gaming" });
    const risk = await service.calculateRiskScore(
      makeResolvedEntity({
        canonicalEntity: {
          ...makeResolvedEntity().canonicalEntity,
          attributes: {
            nationality: "MX",
            fraud_pattern: "account takeover",
            chargeback: "disputed payment",
            vendor_partner: "unverified-aggregator",
            psp: "rapid-aggregator-x"
          },
          tags: ["gaming", "fraud-ring", "vendor-risk", "high-risk-vendor"]
        }
      })
    );
    const explanation = risk.explanation ?? "";

    expect(explanation).toMatch(/Adaptive combos detected/);
    expect(explanation).toMatch(/\[vendor_collusion\] Vendor \/ PSP collusive payout pattern/);
    // Vendor combo should explicitly reference both participating dimensions.
    expect(explanation).toMatch(/\[vendor_collusion\][\s\S]*dimensions: vendor_risk, fraud/);
    // The combo-prefixed action line must appear in the operator playbook.
    expect(explanation).toMatch(/\[Combo\/vendor_collusion\][\s\S]*psp_certification/);
    // The artefact checklist must surface the new vendor field name verbatim.
    expect(explanation).toMatch(/Vendor \/ PSP:[^\n]*shared_psp_with_chargeback_history/);
  });

  it("detects high_velocity_syndicate when player_behavior + fraud are both strong (without bonus_abuse)", async () => {
    const service = new RiskScoringService({ domain: "gaming" });
    const risk = await service.calculateRiskScore(
      makeResolvedEntity({
        canonicalEntity: {
          ...makeResolvedEntity().canonicalEntity,
          attributes: {
            nationality: "MX",
            fraud_pattern: "account takeover",
            chargeback: "disputed payment",
            velocity: "session binge",
            stake_ramp: "loss chase",
            bet_velocity: "velocity spike",
            tilt: "sustained"
          },
          tags: [
            "gaming",
            "fraud-ring",
            "high-velocity-transactions",
            "session-binge",
            "tilt-watch"
          ]
        }
      })
    );
    const explanation = risk.explanation ?? "";

    expect(explanation).toMatch(/\[high_velocity_syndicate\] High-velocity fraud syndicate/);
    expect(explanation).toMatch(/\[high_velocity_syndicate\][\s\S]*dimensions: player_behavior, fraud/);
    expect(explanation).toMatch(/\[Combo\/high_velocity_syndicate\][\s\S]*bet_velocity_7d/);
    // Velocity action line must reference the cohort z-score artefact.
    expect(explanation).toMatch(/\[Velocity\][\s\S]*stake_vs_cohort_zscore/);
  });

  it("dynamic synergy: extreme convergences earn more total synergy than borderline ones (per-combo + global caps respected)", async () => {
    const service = new RiskScoringService({ domain: "gaming" });

    // Both entities trigger ONLY the chip_dump combo (fraud + bonus_abuse).
    // We deliberately keep player_behavior, aml_kyc, responsible_gaming, and
    // vendor_risk cold so the total synergyBoost line (printed at 4 decimals)
    // equals chip_dump's per-combo synergy and isolates the dynamic uplift.

    // Borderline: no alias conflicts, low tag density.
    const borderline = await service.calculateRiskScore(
      makeResolvedEntity({
        canonicalEntity: {
          ...makeResolvedEntity().canonicalEntity,
          attributes: {
            nationality: "MX",
            fraud_pattern: "chargeback queue rising",
            bonus_abuse: "rollover light"
          },
          tags: ["gaming"]
        },
        conflicts: []
      })
    );

    // Extreme: max alias conflicts (≥ aliases) + dense tag set.
    const extreme = await service.calculateRiskScore(
      makeResolvedEntity({
        canonicalEntity: {
          ...makeResolvedEntity().canonicalEntity,
          attributes: {
            nationality: "MX",
            fraud_pattern: "account takeover",
            chargeback: "disputed payment",
            bonus_abuse: "rollover arb",
            rollover: "syndicate"
          },
          tags: [
            "gaming",
            "fraud-ring",
            "bonus-abuse",
            "rollover-arbitrage",
            "linked-accounts",
            "shared-device"
          ]
        },
        conflicts: [
          {
            field: "displayName_vs_alias",
            values: ["Laura Mendoza", "Collusive Alias 1"],
            selectedValue: "Laura Mendoza"
          },
          {
            field: "displayName_vs_alias",
            values: ["Laura Mendoza", "Collusive Alias 2"],
            selectedValue: "Laura Mendoza"
          },
          {
            field: "displayName_vs_alias",
            values: ["Laura Mendoza", "Collusive Alias 3"],
            selectedValue: "Laura Mendoza"
          }
        ]
      })
    );

    // Sanity: the chip_dump combo line must be present in both; no other
    // combo line should appear (so total synergy isolates this combo).
    for (const result of [borderline, extreme]) {
      const text = result.explanation ?? "";
      expect(text).toMatch(/\[chip_dump\] Chip-dump/);
      expect(text).not.toMatch(/\[syndicate\]|\[vulnerable_aml\]|\[apex_critical\]|\[vendor_collusion\]|\[high_velocity_syndicate\]/);
    }

    const borderTotal = extractTotalSynergy(borderline.explanation ?? "");
    const extremeTotal = extractTotalSynergy(extreme.explanation ?? "");
    expect(borderTotal).not.toBeNull();
    expect(extremeTotal).not.toBeNull();

    const capLine = /global cap ([0-9.]+) on stacked per-combo uplift/.exec(extreme.explanation ?? "");
    expect(capLine?.[1]).toBe(GAMING_SYNERGY_GLOBAL_CAP.toFixed(2));

    // Dynamic synergy must scale with signal strength.
    expect(extremeTotal!).toBeGreaterThan(borderTotal!);
    // Per-combo cap = baseSynergy(0.05) + 0.04 = 0.09.
    expect(extremeTotal!).toBeLessThanOrEqual(0.09 + 1e-9);
    // Hard global cap at 0.12.
    expect(extremeTotal!).toBeLessThanOrEqual(0.12 + 1e-9);

    // Suppress unused-helper warning while keeping the API available for
    // ad-hoc per-combo extraction in future tests.
    void extractSynergy;
  });

  it("smarter priorityBump tags drivers with their *highest-synergy* combo (apex_critical wins over syndicate)", async () => {
    // Syndicate-style entity that trips both `syndicate` (player_behavior is
    // a participant) and `apex_critical` (also a participant). The driver's
    // comboTag should resolve to the higher-synergy combo (apex_critical).
    const service = new RiskScoringService({ domain: "gaming" });
    const risk = await service.calculateRiskScore(
      makeResolvedEntity({
        canonicalEntity: {
          ...makeResolvedEntity().canonicalEntity,
          attributes: {
            nationality: "MX",
            fraud_pattern: "account takeover",
            chargeback: "disputed payment",
            bonus_abuse: "rollover arb",
            rollover: "syndicate",
            promo_abuse: "gnoming",
            velocity: "session binge",
            stake_ramp: "loss chase",
            bet_velocity: "velocity spike"
          },
          tags: [
            "gaming",
            "bonus-abuse",
            "fraud-ring",
            "high-velocity-transactions",
            "session-binge"
          ]
        },
        conflicts: [
          {
            field: "displayName_vs_alias",
            values: ["Laura Mendoza", "Collusive Alias"],
            selectedValue: "Laura Mendoza"
          }
        ]
      })
    );
    const explanation = risk.explanation ?? "";

    // Apex-critical must fire for this convergence pattern.
    expect(explanation).toMatch(/\[apex_critical\]/);
    // The Key Drivers table entry for player_behavior (or any apex
    // participant) must surface the apex-critical combo tag — not syndicate
    // or chip_dump — because the priority bump now selects the
    // highest-synergy combo per dimension.
    expect(explanation).toMatch(
      /\(player_behavior\)[^\n]*\[combo: Apex critical/
    );
  });

  it("Mother Brain v0.2: advanced pattern IDs are not core combo IDs; artefact registry lists console keys", () => {
    const coreIds = new Set<string>(GAMING_COMBO_DEFINITIONS.map((d) => d.id));
    expect(coreIds.has("promo_rail_stack")).toBe(false);
    expect(coreIds.has("aml_sleeper_lift")).toBe(false);
    expect(GAMING_V02_ADVANCED_PATTERN_ARTEFACTS.promo_rail_stack).toContain("rail_exposure_heatmap");
    expect(GAMING_V02_ADVANCED_PATTERN_ARTEFACTS.aml_sleeper_lift).toContain("aml_case_workspace");
  });

  it("DynamicSynergyEngine hard-binds total uplift at GAMING_SYNERGY_GLOBAL_CAP when per-combo sums exceed it", () => {
    const engine = new DynamicSynergyEngine();
    const oversized: GamingCombo[] = [
      { id: "syndicate", label: "s", dimensions: ["bonus_abuse", "player_behavior"], analystNote: "t", synergy: 0.07 },
      { id: "chip_dump", label: "c", dimensions: ["fraud", "bonus_abuse"], analystNote: "t", synergy: 0.08 },
      { id: "vulnerable_aml", label: "v", dimensions: ["aml_kyc", "responsible_gaming"], analystNote: "t", synergy: 0.06 }
    ];
    expect(engine.computeOverallBoost(oversized)).toBe(GAMING_SYNERGY_GLOBAL_CAP);
  });
});

// =============================================================================
// Week-2 closure — modular refactor regression
// =============================================================================
//
// These tests exercise the small single-responsibility collaborators that
// GamingMultiFactorScorer now delegates to (ComboDetector,
// DynamicSynergyEngine, DriverPrioritizer) plus the shared registries
// (GAMING_COMBO_DEFINITIONS, GAMING_ARTIFACT_CATALOG).
//
// Their purpose is to lock in the modular structure: if a future refactor
// collapses these back into the orchestrator or silently drops the shared
// registries, these tests fail before any downstream narrative test does.

describe("Risk Scoring modular refactor (Week-2 closure)", () => {
  /** Helper: build a minimal DimensionSignal with sensible defaults. */
  function signal(overrides: Partial<DimensionSignal> & Pick<DimensionSignal, "dimension" | "score">): DimensionSignal {
    return {
      justification: "test",
      strongSignal: overrides.score >= 0.72,
      drivers: ["test driver"],
      confidence: 0.8,
      biasFlag: false,
      ...overrides
    };
  }

  /** Helper: build a RiskScoreComponent that mirrors the signal. */
  function component(dim: DimensionSignal["dimension"], score: number, weight = 0.2): RiskScoreComponent {
    return {
      dimension: dim,
      score,
      weight,
      contribution: score * weight,
      justification: "test"
    };
  }

  it("ComboDetector detects declared casino patterns directly from the shared definitions", () => {
    const detector = new ComboDetector(); // defaults to GAMING_COMBO_DEFINITIONS
    const signals: DimensionSignal[] = [
      signal({ dimension: "fraud", score: 0.85, strongSignal: true }),
      signal({ dimension: "bonus_abuse", score: 0.83, strongSignal: true })
    ];
    const components: RiskScoreComponent[] = [
      component("fraud", 0.85, 0.3),
      component("bonus_abuse", 0.83, 0.25)
    ];

    const hits = detector.detect(signals, components);
    const ids = hits.map((h) => h.id);

    expect(ids).toContain("chip_dump");
    // No vendor / responsible_gaming / apex activity — those combos must not fire.
    expect(ids).not.toContain("vendor_collusion");
    expect(ids).not.toContain("vulnerable_aml");
    expect(ids).not.toContain("apex_critical");
  });

  it("DynamicSynergyEngine respects per-combo + global caps and scales with signal strength", () => {
    const engine = new DynamicSynergyEngine();
    const detector = new ComboDetector(GAMING_COMBO_DEFINITIONS, engine);

    const borderlineSignals: DimensionSignal[] = [
      signal({ dimension: "fraud", score: 0.6, strongSignal: false }),
      signal({ dimension: "bonus_abuse", score: 0.6, strongSignal: false })
    ];
    const borderlineComponents: RiskScoreComponent[] = [
      component("fraud", 0.6, 0.3),
      component("bonus_abuse", 0.6, 0.25)
    ];
    const borderlineCombos = detector.detect(borderlineSignals, borderlineComponents);

    const extremeSignals: DimensionSignal[] = [
      signal({ dimension: "fraud", score: 0.98, strongSignal: true }),
      signal({ dimension: "bonus_abuse", score: 0.97, strongSignal: true })
    ];
    const extremeComponents: RiskScoreComponent[] = [
      component("fraud", 0.98, 0.3),
      component("bonus_abuse", 0.97, 0.25)
    ];
    const extremeCombos = detector.detect(extremeSignals, extremeComponents);

    const borderlineBoost = engine.computeOverallBoost(borderlineCombos);
    const extremeBoost = engine.computeOverallBoost(extremeCombos);

    // Extreme convergence must yield a larger boost than a borderline one.
    expect(extremeBoost).toBeGreaterThan(borderlineBoost);
    // Hard global cap.
    expect(extremeBoost).toBeLessThanOrEqual(GAMING_SYNERGY_GLOBAL_CAP + 1e-9);
    expect(GAMING_SYNERGY_GLOBAL_CAP).toBe(0.12);
    // Per-combo cap for chip_dump = baseSynergy(0.05) + 0.04 = 0.09.
    expect(extremeCombos[0]!.synergy).toBeLessThanOrEqual(0.09 + 1e-9);
  });

  it("DriverPrioritizer ranks top 3 drivers and tags them with the highest-synergy combo", () => {
    const prioritizer = new DriverPrioritizer();
    const components: RiskScoreComponent[] = [
      component("fraud", 0.9, 0.3),
      component("bonus_abuse", 0.88, 0.25),
      component("player_behavior", 0.85, 0.2),
      component("aml_kyc", 0.4, 0.1),
      component("responsible_gaming", 0.35, 0.08),
      component("vendor_risk", 0.3, 0.07)
    ];
    const combos = [
      {
        id: "syndicate" as const,
        label: "Syndicate / ring pattern",
        dimensions: ["bonus_abuse", "player_behavior"] as DimensionSignal["dimension"][],
        synergy: 0.06,
        analystNote: "…"
      },
      {
        id: "apex_critical" as const,
        label: "Apex critical — fraud + bonus + behavior",
        dimensions: ["fraud", "bonus_abuse", "player_behavior"] as DimensionSignal["dimension"][],
        synergy: 0.1, // higher synergy → should win the comboTag race
        analystNote: "…"
      }
    ];

    const drivers = prioritizer.build(components, combos);

    expect(drivers).toHaveLength(3);
    // Top 3 must be the 3 high-contribution dimensions.
    const dims = drivers.map((d) => d.dimension).sort();
    expect(dims).toEqual(["bonus_abuse", "fraud", "player_behavior"].sort());

    // Every combo participant should carry the apex_critical tag (highest synergy).
    for (const d of drivers) {
      expect(d.comboTag).toBe("Apex critical — fraud + bonus + behavior");
    }
  });

  it("GAMING_COMBO_DEFINITIONS exposes the canonical 6-combo registry in rule order", () => {
    const ids = GAMING_COMBO_DEFINITIONS.map((d) => d.id);
    expect(ids).toEqual([
      "syndicate",
      "chip_dump",
      "vulnerable_aml",
      "apex_critical",
      "vendor_collusion",
      "high_velocity_syndicate"
    ]);
  });

  it("GAMING_ARTIFACT_CATALOG keeps casino artefacts in one place (checklist parity with explanation narrative)", () => {
    expect(GAMING_ARTIFACT_CATALOG.fraud?.artifacts).toContain("chargeback_history_90d");
    expect(GAMING_ARTIFACT_CATALOG.bonus_abuse?.artifacts).toContain("rollover_progress");
    expect(GAMING_ARTIFACT_CATALOG.player_behavior?.artifacts).toContain("stake_vs_cohort_zscore");
    expect(GAMING_ARTIFACT_CATALOG.vendor_risk?.artifacts).toContain("shared_psp_with_chargeback_history");
    // Every gaming dimension must have a populated artefact group.
    for (const dim of [
      "fraud",
      "bonus_abuse",
      "player_behavior",
      "aml_kyc",
      "responsible_gaming",
      "vendor_risk"
    ]) {
      expect(GAMING_ARTIFACT_CATALOG[dim]?.artifacts.length).toBeGreaterThan(0);
    }
  });
});
