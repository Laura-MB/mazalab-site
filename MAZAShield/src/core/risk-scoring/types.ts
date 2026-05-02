import type {
  ResolvedEntity,
  RiskDimension,
  RiskScore,
  RiskScoreComponent
} from "../../types/index.js";

// =============================================================================
// Public API (re-exported from index.ts)
// =============================================================================

export type { RiskDimension, RiskScore, RiskScoreComponent };

export type RiskDomain = "general" | "gaming";

export interface RiskScoringOptions {
  domain?: RiskDomain;
  dimensionWeights?: Partial<Record<RiskDimension, number>>;
  confidenceWeight?: number;
  evidenceSensitivity?: number;
  modelVersion?: string;
}

/**
 * Per-call options threaded through the scoring pipeline.
 *
 * Primary use: supply an explicit `correlationId` so the audit trail can be
 * tied to the originating request without having to parse it back out of a
 * free-form explanation string.
 */
export interface RiskScoreCalculationOptions {
  /** Request correlation identifier to attach to the audit record. */
  correlationId?: string;
}

export interface DomainDimensionConfig {
  id: RiskDimension;
  name: string;
  weight: number;
  explanationTemplate: string;
  confidenceFactor: number;
  supportsBiasFlag: boolean;
}

export type RiskDomainConfig = Partial<Record<RiskDimension, DomainDimensionConfig>>;

// =============================================================================
// Internal module types (not re-exported from index.ts)
// =============================================================================

export interface DimensionSignal {
  dimension: RiskDimension;
  score: number;
  justification: string;
  strongSignal: boolean;
  drivers: string[];
  confidence: number;
  biasFlag: boolean;
}

export interface RiskSignalContext {
  resolutionConfidence: number;
  identityUncertainty: number;
  conflictCount: number;
  aliasConflictRatio: number;
  sourceStrength: number;
  tagDensity: number;
  hasKnownNationality: boolean;
  hasDob: boolean;
  hasJurisdiction: boolean;
  attributeKeys: string[];
  attributeValuesText: string;
}

/** Casino/G2E-oriented highlight for the strongest contributing gaming dimensions. */
export interface GamingKeyRiskDriver {
  dimension: RiskDimension;
  contribution: number;
  score: number;
  label: string;
  analystNote: string;
  /**
   * When the driver participates in a detected cross-dimension casino combo
   * (e.g. "Syndicate pattern"), this carries the human-readable combo label
   * so the analyst immediately sees the synergy context.
   */
  comboTag?: string;
}

/**
 * Adaptive multi-signal pattern detected across gaming dimensions. Combos are
 * the engine's way of making the score more intelligent and actionable: a
 * single high dimension is noise-prone, but converging strong signals on
 * casino-typical dimensions (fraud + bonus + behavior, etc.) change both the
 * composite score and the recommended playbook.
 */
export interface GamingCombo {
  /**
   * Stable identifier used by downstream UIs and analyst tooling.
   *
   * - `syndicate`              — bonus_abuse + player_behavior (ring / gnoming pattern)
   * - `chip_dump`              — fraud + bonus_abuse (collusive payout shape)
   * - `vulnerable_aml`         — aml_kyc + responsible_gaming (vulnerable player + AML risk)
   * - `apex_critical`          — fraud + bonus_abuse + player_behavior (three-signal apex)
   * - `vendor_collusion`       — vendor_risk + fraud (PSP / aggregator collusion)
   * - `high_velocity_syndicate` — player_behavior + fraud (fast-burn velocity-fraud syndicate)
   */
  id:
    | "syndicate"
    | "chip_dump"
    | "vulnerable_aml"
    | "apex_critical"
    | "vendor_collusion"
    | "high_velocity_syndicate";
  /** Short analyst-facing label (e.g. "Syndicate / ring pattern"). */
  label: string;
  /** Dimensions that triggered the combo. */
  dimensions: RiskDimension[];
  /**
   * Bounded synergy boost contributed to the composite overall. The per-combo
   * value is capped a hair above its base synergy (signal-strength dependent),
   * and the *sum* across all detected combos is hard-capped at 0.12 in the
   * scorer so a single profile cannot run away on stacked synergies.
   */
  synergy: number;
  /** Actionable note for the analyst. */
  analystNote: string;
}

export interface ScoreBreakdown {
  overall: number;
  components: RiskScoreComponent[];
  confidence: number;
  evidenceStrength: number;
  conflictIntensity: number;
  peakComponentScore: number;
  /** Present for `gaming` domain: top drivers with analyst-facing labels. */
  keyRiskDrivers?: GamingKeyRiskDriver[];
  /** Present for `gaming` domain when ≥1 multi-signal combo is detected. */
  detectedCombos?: GamingCombo[];
  /** Pre-clamp synergy boost added to `overall` from detected combos. */
  synergyBoost?: number;
}

export interface DomainScoreBreakdown extends ScoreBreakdown {
  domain: RiskDomain;
}

export interface LevelDecision {
  level: RiskScore["level"];
  rationale: string;
  adjustedOverall: number;
}

export interface ExplanationParts {
  domain: RiskDomain;
  resolvedEntity: ResolvedEntity;
  modelVersion: string;
  breakdown: DomainScoreBreakdown;
  levelDecision: LevelDecision;
}
