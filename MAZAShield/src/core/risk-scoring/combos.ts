import type { RiskDimension, RiskScoreComponent } from "../../types/index.js";
import type { DimensionSignal, GamingCombo, GamingKeyRiskDriver } from "./types.js";

/**
 * Single source of truth for gaming combo rules, dynamic-synergy math, and
 * Key-Risk-Driver prioritisation.
 *
 * The gaming scorer is intentionally split into three small single-responsibility
 * collaborators so each concern is auditable, unit-testable, and cheap to evolve:
 *
 * 1. {@link ComboDetector}       — pure pattern matcher over declarative rules.
 * 2. {@link DynamicSynergyEngine} — per-combo and global synergy-boost math.
 * 3. {@link DriverPrioritizer}    — combo-aware ranking of top gaming drivers.
 *
 * Rule authoring is a one-stop edit: add a candidate to {@link GAMING_COMBO_DEFINITIONS}
 * and it flows through detection → synergy → drivers → explanation narrative,
 * no other file needs to know.
 */

// =============================================================================
// Shared constants
// =============================================================================

/**
 * Adjusted-score threshold (post-evidence) at which a dimension is considered
 * "hot" enough to participate in a combo even without a `strongSignal` flag.
 * Lets the engine surface early-warning convergence before each dimension
 * would trip individually.
 */
const COMBO_ACTIVATION_FLOOR = 0.55;

/**
 * Hard global cap on the sum of per-combo synergies applied to the composite
 * score in `GamingMultiFactorScorer.buildBreakdown`. Ensures a single profile
 * cannot run away on stacked synergies.
 */
export const GAMING_SYNERGY_GLOBAL_CAP = 0.12;

/** How much excess score above `COMBO_ACTIVATION_FLOOR` feeds per-combo synergy. */
const SYNERGY_EXCESS_WEIGHT = 0.06;

/** Small bonus when a larger share of participating dimensions is `strongSignal`. */
const SYNERGY_STRONG_RATIO_WEIGHT = 0.015;

/**
 * Maximum contribution bump applied to a dimension's Key-Risk-Driver rank
 * because of combo participation. Big enough that a sustained convergence
 * can outrank an isolated peak; small enough that raw weighted contribution
 * still dominates.
 */
const PRIORITY_BUMP_CEILING = 0.06;

// =============================================================================
// Dimension metadata consumed by the DriverPrioritizer
// =============================================================================

/** Analyst-facing label + one-liner guidance for a gaming dimension. */
export interface GamingDimensionMeta {
  label: string;
  analystNote: string;
}

/**
 * Per-gaming-dimension analyst metadata used to render Key Risk Drivers in
 * the explanation narrative.
 */
export const GAMING_KEY_RISK_META: Partial<Record<RiskDimension, GamingDimensionMeta>> = {
  fraud: {
    label: "Payments & account integrity",
    analystNote:
      "Cross-check payment rails, chargeback queue, and linked accounts for collusion or account takeover before large payouts."
  },
  bonus_abuse: {
    label: "Bonus & promotional integrity",
    analystNote:
      "Review bonus eligibility and session patterns; validate rollover progress and promo rules before releasing sticky bonuses."
  },
  player_behavior: {
    label: "Behavior & velocity",
    analystNote:
      "Compare stakes, session length, and loss patterns to cohort baselines; escalate if velocity or tilt proxies persist."
  },
  aml_kyc: {
    label: "AML / KYC",
    analystNote:
      "Flag for enhanced KYC or source-of-funds verification when thresholds or jurisdictions warrant."
  },
  responsible_gaming: {
    label: "Responsible gaming",
    analystNote:
      "Align CRM limits, cooling-off, and self-exclusion flags before friction changes or outbound marketing."
  },
  vendor_risk: {
    label: "Vendor & PSP stack",
    analystNote:
      "Confirm PSP, aggregator, and KYC vendor posture; review contractual incident history and certifications."
  }
};

/** Safe lookup with a neutral fallback for unknown dimensions. */
export function resolveGamingKeyRiskMeta(dimension: RiskDimension): GamingDimensionMeta {
  return (
    GAMING_KEY_RISK_META[dimension] ?? {
      label: String(dimension),
      analystNote: "Review operational controls for this dimension."
    }
  );
}

// =============================================================================
// Casino artefact catalog (consumed by the explanation builder)
// =============================================================================

/** Group of operator-console artefacts surfaced under one dimension label. */
export interface GamingArtifactGroup {
  label: string;
  artifacts: string[];
}

/**
 * Console artefact keys commonly cited when advanced gaming patterns
 * (`promo_rail_stack`, `aml_sleeper_lift`) fire in the gaming enrichment
 * layer. Grouped with dimension-scoped {@link GAMING_ARTIFACT_CATALOG}
 * entries so operators see the same snake_case vocabulary end-to-end.
 */
export const GAMING_V02_ADVANCED_PATTERN_ARTEFACTS = {
  promo_rail_stack: [
    "rail_exposure_heatmap",
    "promo_redemptions_30d",
    "payment_rail_mix",
    "sticky_balance"
  ],
  aml_sleeper_lift: [
    "aml_case_workspace",
    "device_fingerprint_history",
    "sof_prefill_questionnaire",
    "large_deposit_90d_usd"
  ]
} as const;

export const GAMING_ARTIFACT_CATALOG: Record<string, GamingArtifactGroup> = {
  fraud: {
    label: "Fraud",
    artifacts: [
      "chargeback_history_90d",
      "disputed_deposits_90d",
      "payment_rail_mix",
      "linked_account_ids",
      "device_fingerprint",
      "shared_ip_cluster"
    ]
  },
  bonus_abuse: {
    label: "Bonus",
    artifacts: [
      "rollover_progress",
      "active_bonus_ids",
      "promo_redemptions_30d",
      "sticky_balance",
      "cashable_balance",
      "linked_account_ids",
      "device_fingerprint"
    ]
  },
  player_behavior: {
    label: "Velocity / Behavior",
    artifacts: [
      "session_length",
      "bet_velocity_7d",
      "stake_ramp",
      "loss_chase_index",
      "tilt_proxy",
      "stake_vs_cohort_zscore"
    ]
  },
  aml_kyc: {
    label: "AML / KYC",
    artifacts: [
      "kyc_strength",
      "pep_match",
      "sanctions_match",
      "source_of_funds_docs",
      "large_deposit_90d_usd",
      "cumulative_deposits_30d"
    ]
  },
  responsible_gaming: {
    label: "Responsible Gaming",
    artifacts: [
      "rg_limits",
      "cooling_off_status",
      "self_exclusion_flag",
      "loss_chasing_flag",
      "rg_intervention_history"
    ]
  },
  vendor_risk: {
    label: "Vendor / PSP",
    artifacts: [
      "psp_certification",
      "aggregator_contract_status",
      "kyc_vendor_sla",
      "incident_history_12m",
      "shared_psp_with_chargeback_history"
    ]
  }
};

// =============================================================================
// Combo rule definitions
// =============================================================================

/**
 * Context passed to every combo predicate. Built once per assessment in
 * {@link ComboDetector}.detect to keep rule predicates pure and trivially
 * testable.
 */
export interface GamingComboContext {
  /** Dimensions whose `strongSignal` flag is true. */
  strongSet: Set<RiskDimension>;
  /** Dimensions whose adjusted component score ≥ {@link COMBO_ACTIVATION_FLOOR}. */
  elevatedSet: Set<RiskDimension>;
  /** Adjusted components indexed by dimension for O(1) lookup. */
  componentByDim: Map<RiskDimension, RiskScoreComponent>;
  /** Convenience predicate: `strongSet ∪ elevatedSet` membership. */
  isHot(dim: RiskDimension): boolean;
}

/** Declarative combo rule — one entry = one casino pattern. */
export interface GamingComboDefinition {
  /** Stable id emitted on the assessment and consumed by dashboards/tests. */
  id: GamingCombo["id"];
  /** Short analyst-facing label (rendered in the narrative). */
  label: string;
  /** Dimensions that contribute to the combo. */
  dimensions: RiskDimension[];
  /** Floor synergy — per-combo dynamic synergy is capped at `baseSynergy + 0.04`. */
  baseSynergy: number;
  /** Actionable one-liner surfaced to the analyst. */
  analystNote: string;
  /** Predicate that decides whether the combo fires for this assessment. */
  matches(ctx: GamingComboContext): boolean;
}

/**
 * All gaming combos in detection/priority order.
 *
 * Each rule is a small, audit-friendly pattern ("if fraud AND bonus_abuse
 * are both hot, that is structurally a chip-dump shape"). Keeping rules
 * explicit, bounded, and declarative means every uplift is explainable and
 * never silently overwhelms the weighted signals.
 */
export const GAMING_COMBO_DEFINITIONS: readonly GamingComboDefinition[] = [
  {
    id: "syndicate",
    label: "Syndicate / ring pattern",
    dimensions: ["bonus_abuse", "player_behavior"],
    baseSynergy: 0.05,
    analystNote:
      "Bonus-abuse indicators combined with abnormal velocity / session signals — treat as potential syndicate, gnoming ring, or collusive cluster before releasing sticky bonuses.",
    matches: (c) => c.isHot("bonus_abuse") && c.isHot("player_behavior")
  },
  {
    id: "chip_dump",
    label: "Chip-dump / collusive payout pattern",
    dimensions: ["fraud", "bonus_abuse"],
    baseSynergy: 0.05,
    analystNote:
      "Payment-integrity red flags combined with bonus manipulation — classic chip-dump or collusive-payout shape; freeze automated payouts and inspect shared-device / linked-account chains.",
    matches: (c) => c.isHot("fraud") && c.isHot("bonus_abuse")
  },
  {
    id: "vulnerable_aml",
    label: "Vulnerable player + AML risk",
    dimensions: ["aml_kyc", "responsible_gaming"],
    baseSynergy: 0.04,
    analystNote:
      "RG stress combined with AML/KYC markers — expedite vulnerable-player handling, enforce session-length / loss caps, and block limit increases until EDD clears.",
    matches: (c) => c.isHot("aml_kyc") && c.isHot("responsible_gaming")
  },
  {
    id: "apex_critical",
    label: "Apex critical — fraud + bonus + behavior",
    dimensions: ["fraud", "bonus_abuse", "player_behavior"],
    baseSynergy: 0.08,
    analystNote:
      "Three-signal convergence (fraud, bonus, behavior) — apex critical; block automation, lock wallet funding / withdrawals, and escalate to fraud-ops + AML leadership within SLA.",
    matches: (c) =>
      c.strongSet.has("fraud") &&
      c.strongSet.has("bonus_abuse") &&
      c.strongSet.has("player_behavior")
  },
  {
    // Week-2.5 — PSP / aggregator collusive payout shape.
    // Triggers when third-party rail risk converges with payment-integrity
    // red flags, regardless of bonus posture. Distinct from `chip_dump`
    // because it implicates the vendor surface, not the player promo.
    id: "vendor_collusion",
    label: "Vendor / PSP collusive payout pattern",
    dimensions: ["vendor_risk", "fraud"],
    baseSynergy: 0.04,
    analystNote:
      "Third-party / PSP / aggregator risk converging with payment-integrity red flags — review psp_certification, aggregator_contract_status, kyc_vendor_sla, and incident_history_12m before routing further high-value rails; freeze automated settlement to the affected partner.",
    matches: (c) => c.isHot("vendor_risk") && c.isHot("fraud")
  },
  {
    // Week-2.5 — fast-burn velocity + fraud convergence.
    // Distinct from `apex_critical` (which requires bonus_abuse to also be
    // strong). Catches card-not-present rapid stake/payout patterns where
    // the player is not abusing promos but is burning the rails fast.
    id: "high_velocity_syndicate",
    label: "High-velocity fraud syndicate",
    dimensions: ["player_behavior", "fraud"],
    baseSynergy: 0.05,
    analystNote:
      "Behavioral velocity (session_length, bet_velocity_7d, stake_ramp) converging with fraud markers (chargeback_history_90d, disputed_deposits_90d, ato_signals) — fast-burn syndicate shape; cap bet_velocity, lock high-value payouts, and pull device_fingerprint / shared_ip_cluster overlap before manual clearance.",
    matches: (c) => c.strongSet.has("player_behavior") && c.strongSet.has("fraud")
  }
];

// =============================================================================
// DynamicSynergyEngine — per-combo and global synergy math
// =============================================================================

/**
 * Computes the synergy uplift a combo contributes to the composite score.
 *
 * Two independent knobs:
 *
 * 1. **Signal strength** — each participating dimension's adjusted score above
 *    the activation floor (0.55) earns a small linear lift, so deeper
 *    convergences (scores near 1.0) earn meaningfully more synergy than
 *    borderline-elevated convergences.
 * 2. **Strong-ratio** — when *all* participating dimensions are flagged as
 *    `strongSignal`, an additional small bonus is added.
 *
 * Per-combo synergy is capped at `baseSynergy + 0.04` so one combo can never
 * dominate the composite; the total across all detected combos is further
 * capped at {@link GAMING_SYNERGY_GLOBAL_CAP} in {@link computeOverallBoost}.
 */
export class DynamicSynergyEngine {
  /** Per-combo synergy capped at `def.baseSynergy + 0.04`. */
  computePerComboSynergy(def: GamingComboDefinition, ctx: GamingComboContext): number {
    const dims = def.dimensions;
    if (dims.length === 0) return def.baseSynergy;

    const PER_COMBO_CEILING = def.baseSynergy + 0.04;
    const excessScores = dims.map((dim) => {
      const c = ctx.componentByDim.get(dim);
      return c ? Math.max(0, c.score - COMBO_ACTIVATION_FLOOR) : 0;
    });
    const avgExcess = excessScores.reduce((s, v) => s + v, 0) / dims.length;
    const strongRatio = dims.filter((d) => ctx.strongSet.has(d)).length / dims.length;

    const uplift = SYNERGY_EXCESS_WEIGHT * avgExcess + SYNERGY_STRONG_RATIO_WEIGHT * strongRatio;
    return Math.min(PER_COMBO_CEILING, def.baseSynergy + uplift);
  }

  /** Hard-capped total synergy applied to the composite in `buildBreakdown`. */
  computeOverallBoost(combos: GamingCombo[]): number {
    return Math.min(
      GAMING_SYNERGY_GLOBAL_CAP,
      combos.reduce((sum, combo) => sum + combo.synergy, 0)
    );
  }
}

// =============================================================================
// ComboDetector — rule-driven pattern matching
// =============================================================================

/**
 * Pure pattern matcher over {@link GAMING_COMBO_DEFINITIONS}. Builds the
 * evaluation context once and attaches the dynamic synergy to each hit.
 */
export class ComboDetector {
  constructor(
    private readonly definitions: readonly GamingComboDefinition[] = GAMING_COMBO_DEFINITIONS,
    private readonly synergyEngine: DynamicSynergyEngine = new DynamicSynergyEngine()
  ) {}

  /** Returns the combos that fire for the given signals/components, in rule order. */
  detect(signals: DimensionSignal[], components: RiskScoreComponent[]): GamingCombo[] {
    const ctx = this.buildContext(signals, components);
    const hits: GamingCombo[] = [];
    for (const def of this.definitions) {
      if (!def.matches(ctx)) continue;
      hits.push({
        id: def.id,
        label: def.label,
        dimensions: def.dimensions,
        analystNote: def.analystNote,
        synergy: this.synergyEngine.computePerComboSynergy(def, ctx)
      });
    }
    return hits;
  }

  private buildContext(
    signals: DimensionSignal[],
    components: RiskScoreComponent[]
  ): GamingComboContext {
    const strongSet = new Set<RiskDimension>(
      signals.filter((s) => s.strongSignal).map((s) => s.dimension)
    );
    const elevatedSet = new Set<RiskDimension>(
      components.filter((c) => c.score >= COMBO_ACTIVATION_FLOOR).map((c) => c.dimension)
    );
    const componentByDim = new Map<RiskDimension, RiskScoreComponent>(
      components.map((c) => [c.dimension, c])
    );
    return {
      strongSet,
      elevatedSet,
      componentByDim,
      isHot: (dim) => strongSet.has(dim) || elevatedSet.has(dim)
    };
  }
}

// =============================================================================
// DriverPrioritizer — combo-aware Key Risk Driver ranking
// =============================================================================

/**
 * Ranks the top 3 gaming dimensions as analyst-facing Key Risk Drivers.
 *
 * The ranking is `contribution + bumpFor(dimension)`, where the bump is a
 * bounded reward for participating in detected combos:
 *
 * ```
 *   bump = min( PRIORITY_BUMP_CEILING,
 *               0.015                         ← base for any combo participation
 *             + 0.05 × Σ(combo.synergy)       ← intensity: deeper convergences rank higher
 *             + 0.012 × (# combos joined) )   ← multiplicity: more patterns rank higher
 * ```
 *
 * Each driver is tagged with the *highest-synergy* combo it participates in
 * (e.g. apex_critical outranks a plain syndicate participation) so the UI
 * shows the strongest converging pattern first.
 */
export class DriverPrioritizer {
  build(components: RiskScoreComponent[], combos: GamingCombo[]): GamingKeyRiskDriver[] {
    const synergyByDim = new Map<RiskDimension, number>();
    const countByDim = new Map<RiskDimension, number>();
    for (const combo of combos) {
      for (const dim of combo.dimensions) {
        synergyByDim.set(dim, (synergyByDim.get(dim) ?? 0) + combo.synergy);
        countByDim.set(dim, (countByDim.get(dim) ?? 0) + 1);
      }
    }

    const bumpFor = (dim: RiskDimension): number => {
      const synergySum = synergyByDim.get(dim) ?? 0;
      const count = countByDim.get(dim) ?? 0;
      if (count === 0) return 0;
      return Math.min(PRIORITY_BUMP_CEILING, 0.015 + 0.05 * synergySum + 0.012 * count);
    };

    const ranked = [...components].sort((a, b) => {
      const aScore = a.contribution + bumpFor(a.dimension);
      const bScore = b.contribution + bumpFor(b.dimension);
      return bScore - aScore;
    });

    return ranked.slice(0, 3).map((c) => {
      const meta = resolveGamingKeyRiskMeta(c.dimension);
      const combosForDim = combos.filter((cm) => cm.dimensions.includes(c.dimension));
      const topCombo = combosForDim.sort((a, b) => b.synergy - a.synergy)[0];
      return {
        dimension: c.dimension,
        contribution: c.contribution,
        score: c.score,
        label: meta.label,
        analystNote: meta.analystNote,
        ...(topCombo && { comboTag: topCombo.label })
      };
    });
  }
}
