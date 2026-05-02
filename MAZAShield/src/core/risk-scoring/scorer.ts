import type { ResolvedEntity, RiskDimension, RiskScoreComponent } from "../../types/index.js";
import type {
  DomainScoreBreakdown,
  DimensionSignal,
  RiskDomain,
  RiskDomainConfig,
  RiskSignalContext
} from "./types.js";
import { clamp01 } from "./utils.js";
import {
  GAMING_DOMAIN_CONFIG,
  GENERAL_DOMAIN_CONFIG
} from "./config/domain-config.js";
import {
  ComboDetector,
  DriverPrioritizer,
  DynamicSynergyEngine
} from "./combos.js";

/**
 * Produces per-dimension risk signals from resolved-entity evidence.
 *
 * Each dimension declared by the active domain configuration is scored
 * independently and emitted with the analyst-facing trace required by
 * downstream explanation builders. Pure function semantics: the same
 * input always yields the same `DimensionSignal[]`, so the engine remains
 * deterministic and reproducible across runs.
 */
export class DimensionScorer {
  private readonly dimensions: RiskDimension[];

  constructor(private readonly domainConfig: RiskDomainConfig = GENERAL_DOMAIN_CONFIG) {
    this.dimensions = this.getConfiguredDimensions(domainConfig);
  }

  scoreDimensions(resolvedEntity: ResolvedEntity): DimensionSignal[] {
    const context = this.buildSignalContext(resolvedEntity);
    return this.dimensions.map((dimension) => this.scoreSingleDimension(dimension, context));
  }

  private buildSignalContext(resolvedEntity: ResolvedEntity): RiskSignalContext {
    const entity = resolvedEntity.canonicalEntity;
    const confidencePrior = clamp01(entity.confidence.score);
    const identityUncertainty = clamp01(1 - resolvedEntity.matchScore);
    const conflictCount = resolvedEntity.conflicts.length;
    const aliasCount = entity.aliases.length;
    const aliasConflictRatio = clamp01(conflictCount / Math.max(1, aliasCount));
    const sourceStrength = this.average(entity.sources.map((source) => clamp01(source.confidence)));
    const tagDensity = clamp01(entity.tags.length / 12);
    const attributeEntries = Object.entries(entity.attributes).map(([k, v]) => ({
      key: k.toLowerCase(),
      value: String(v ?? "").toLowerCase()
    }));
    const attributeKeys = attributeEntries.map((entry) => entry.key);
    const attributeValuesText = attributeEntries.map((entry) => entry.value).join(" ");

    return {
      resolutionConfidence: confidencePrior,
      identityUncertainty,
      conflictCount,
      aliasConflictRatio,
      sourceStrength,
      tagDensity,
      hasKnownNationality:
        this.containsAny(attributeKeys, ["nationality", "country"]) ||
        this.containsAny([attributeValuesText], ["mexico", "spain", "usa", "france"]),
      hasDob: this.containsAny(attributeKeys, ["dob", "birth", "date_of_birth", "birthdate"]),
      hasJurisdiction: entity.jurisdiction !== undefined && entity.jurisdiction.trim().length > 0,
      attributeKeys,
      attributeValuesText
    };
  }

  private scoreSingleDimension(
    dimension: RiskDimension,
    context: RiskSignalContext
  ): DimensionSignal {
    const base =
      0.2 +
      0.24 * context.identityUncertainty +
      0.08 * (1 - context.sourceStrength) +
      0.07 * context.aliasConflictRatio;
    const evidenceWeight = 0.05 * context.sourceStrength + 0.04 * context.resolutionConfidence;
    const { signal, drivers } = this.dimensionSignal(dimension, context);
    const score = clamp01(base + evidenceWeight + signal);
    const confidence = clamp01(
      (this.domainConfig[dimension]?.confidenceFactor ?? 0.85) *
        (0.62 + 0.28 * context.sourceStrength + 0.1 * context.resolutionConfidence)
    );
    const biasFlag =
      Boolean(this.domainConfig[dimension]?.supportsBiasFlag) &&
      context.aliasConflictRatio > 0.5;

    return {
      dimension,
      score,
      strongSignal: score >= 0.72 || signal >= 0.18,
      drivers,
      confidence,
      biasFlag,
      justification: this.buildJustification(
        dimension,
        score,
        base,
        evidenceWeight,
        signal,
        confidence,
        biasFlag,
        drivers
      )
    };
  }

  private dimensionSignal(
    dimension: RiskDimension,
    context: RiskSignalContext
  ): { signal: number; drivers: string[] } {
    const keys = context.attributeKeys;
    const values = context.attributeValuesText;
    const conflicts = context.aliasConflictRatio;
    const drivers: string[] = [];

    const keyHit = (needles: string[]): boolean => this.containsAny(keys, needles);
    const valueHit = (needles: string[]): boolean => this.containsAny([values], needles);

    let signal = 0;
    switch (dimension) {
      case "sanctions":
        if (keyHit(["sanction", "watchlist", "pep"]) || valueHit(["sanction", "watchlist", "pep"])) {
          signal += 0.19;
          drivers.push("Sanctions/watchlist indicators detected.");
        }
        signal += 0.05 * context.identityUncertainty;
        break;
      case "fraud":
        if (keyHit(["fraud", "chargeback", "suspicious"]) || valueHit(["fraud", "chargeback"])) {
          signal += 0.17;
          drivers.push("Fraud behavior indicators present.");
        }
        signal += 0.06 * context.tagDensity;
        break;
      case "aml":
        if (keyHit(["aml", "kyc", "beneficial_owner"]) || valueHit(["aml", "kyc"])) {
          signal += 0.18;
          drivers.push("AML/KYC markers found.");
        }
        if (context.hasDob) {
          signal -= 0.03;
          drivers.push("DOB present reduces AML identity ambiguity.");
        }
        break;
      case "cyber":
        if (keyHit(["ip", "malware", "breach"]) || valueHit(["malware", "breach"])) {
          signal += 0.16;
          drivers.push("Cyber exposure terms detected.");
        }
        signal += 0.04 * context.identityUncertainty;
        break;
      case "reputation":
        if (keyHit(["adverse_media", "reputation", "news"]) || valueHit(["adverse", "media"])) {
          signal += 0.14;
          drivers.push("Adverse reputation signals present.");
        }
        if (conflicts > 0) {
          signal += 0.08 + 0.09 * conflicts;
          drivers.push("Alias conflicts penalize reputation reliability.");
        }
        break;
      case "compliance":
        if (keyHit(["license", "regulatory", "compliance"]) || valueHit(["regulatory", "non-compliant"])) {
          signal += 0.14;
          drivers.push("Regulatory/compliance indicators found.");
        }
        if (context.hasKnownNationality) {
          signal += 0.05;
          drivers.push("Known nationality boosts compliance screening signal.");
        }
        if (conflicts > 0) {
          signal += 0.07 + 0.08 * conflicts;
          drivers.push("Alias conflicts penalize compliance trust.");
        }
        break;
      case "geopolitical":
        if (keyHit(["country", "jurisdiction", "nationality"]) || context.hasJurisdiction) {
          signal += 0.15;
          drivers.push("Geographic/jurisdictional markers detected.");
        }
        if (context.hasKnownNationality) {
          signal += 0.04;
          drivers.push("Known nationality strengthens geopolitical signal.");
        }
        break;
      default:
        signal += 0.03;
        break;
    }

    if (drivers.length === 0) {
      drivers.push("No strong explicit markers; baseline dimension signal applied.");
    }
    return { signal, drivers };
  }

  private containsAny(keys: string[], needles: string[]): boolean {
    return needles.some((needle) => keys.some((key) => key.includes(needle)));
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0.45;
    return clamp01(values.reduce((sum, value) => sum + value, 0) / values.length);
  }

  private buildJustification(
    dimension: RiskDimension,
    score: number,
    base: number,
    evidenceWeight: number,
    signal: number,
    confidence: number,
    biasFlag: boolean,
    drivers: string[]
  ): string {
    const template = this.domainConfig[dimension]?.explanationTemplate;
    const templatePrefix = template ? `${template} ` : "";
    const driverLine = drivers.length > 0 ? drivers.join(" ") : "Baseline dimension signal applied.";
    return `${templatePrefix}Drivers: ${driverLine} Score=${score.toFixed(4)} (base ${base.toFixed(3)} + evidence ${evidenceWeight.toFixed(3)} + signal ${signal.toFixed(3)}). Confidence=${confidence.toFixed(4)} biasFlag=${String(biasFlag)}.`;
  }

  private getConfiguredDimensions(config: RiskDomainConfig): RiskDimension[] {
    return Object.values(config)
      .map((dimensionConfig) => dimensionConfig?.id)
      .filter((id): id is RiskDimension => id !== undefined);
  }
}

/**
 * Aggregates dimension signals into a normalized overall score with transparent components.
 */
export class MultiFactorScorer {
  resolveDynamicWeights(
    signals: DimensionSignal[],
    baseWeights: Record<RiskDimension, number>,
    customWeights?: Partial<Record<RiskDimension, number>>
  ): Record<RiskDimension, number> {
    const dimensions = signals.map((signal) => signal.dimension);
    const merged: Record<RiskDimension, number> = { ...baseWeights };
    if (customWeights) {
      for (const dimension of dimensions) {
        const candidate = customWeights[dimension];
        if (candidate !== undefined && candidate >= 0) {
          merged[dimension] = candidate;
        }
      }
    }

    const amplified: Record<RiskDimension, number> = { ...merged };
    for (const signal of signals) {
      const signalAmplifier = 1 + clamp01(signal.score) * 0.35 + (signal.strongSignal ? 0.15 : 0);
      amplified[signal.dimension] = merged[signal.dimension] * signalAmplifier;
    }
    return this.normalizeWeights(amplified, baseWeights, dimensions);
  }

  buildBreakdown(
    signals: DimensionSignal[],
    weights: Record<RiskDimension, number>,
    confidenceWeight: number,
    evidenceSensitivity: number
  ): DomainScoreBreakdown {
    const evidenceStrength = this.computeEvidenceStrength(signals);
    const components: RiskScoreComponent[] = signals.map((signal) => {
      const weight = weights[signal.dimension];
      const evidenceAdjustedScore = this.applyEvidence(signal.score, evidenceStrength, evidenceSensitivity);
      const contribution = clamp01(evidenceAdjustedScore) * weight;
      return {
        dimension: signal.dimension,
        score: clamp01(evidenceAdjustedScore),
        weight,
        contribution,
        justification: signal.justification
      };
    });

    const weightedSum = components.reduce((sum, c) => sum + c.contribution, 0);
    const normalizedOverall = clamp01(weightedSum);
    const confidence = this.computeConfidence(components, confidenceWeight, evidenceStrength);
    const conflictIntensity = this.conflictIntensity(signals);
    const peakComponentScore = components.reduce((max, c) => Math.max(max, c.score), 0);

    return {
      domain: "general",
      overall: normalizedOverall,
      components,
      confidence,
      evidenceStrength,
      conflictIntensity,
      peakComponentScore
    };
  }

  private computeConfidence(
    components: RiskScoreComponent[],
    confidenceWeight: number,
    evidenceStrength: number
  ): number {
    const spread = this.componentSpread(components);
    const agreement = 1 - spread;
    return clamp01(0.45 + agreement * confidenceWeight + 0.2 * evidenceStrength);
  }

  private componentSpread(components: RiskScoreComponent[]): number {
    if (components.length === 0) return 1;
    const mean = components.reduce((sum, c) => sum + c.score, 0) / components.length;
    const variance =
      components.reduce((sum, c) => sum + (c.score - mean) ** 2, 0) / components.length;
    return clamp01(Math.sqrt(variance));
  }

  private applyEvidence(score: number, evidenceStrength: number, evidenceSensitivity: number): number {
    const k = clamp01(evidenceSensitivity);
    const lift = 0.85 + 0.3 * evidenceStrength;
    return clamp01(score * (1 - 0.4 * k + k * lift));
  }

  private computeEvidenceStrength(signals: DimensionSignal[]): number {
    if (signals.length === 0) return 0.4;
    const meanScore =
      signals.reduce((sum, signal) => sum + clamp01(signal.score), 0) / signals.length;
    const strongRatio = signals.filter((signal) => signal.strongSignal).length / signals.length;
    return clamp01(0.55 * meanScore + 0.45 * strongRatio);
  }

  private conflictIntensity(signals: DimensionSignal[]): number {
    const relevant = signals.filter(
      (signal) => signal.dimension === "reputation" || signal.dimension === "compliance"
    );
    if (relevant.length === 0) return 0;
    const mean = relevant.reduce((sum, signal) => sum + signal.score, 0) / relevant.length;
    return clamp01(mean);
  }

  private normalizeWeights(
    candidate: Record<RiskDimension, number>,
    fallback: Record<RiskDimension, number>,
    dimensions: RiskDimension[]
  ): Record<RiskDimension, number> {
    const total = dimensions.reduce((sum, dimension) => sum + (candidate[dimension] ?? 0), 0);
    if (total <= 0) return fallback;
    const normalized = {} as Record<RiskDimension, number>;
    for (const dimension of dimensions) {
      normalized[dimension] = (candidate[dimension] ?? 0) / total;
    }
    return normalized;
  }
}

/**
 * Gaming-specific scorer with configurable dimensions and per-dimension confidence/bias metadata.
 */
export class GamingDimensionScorer {
  private readonly dimensions: RiskDimension[];

  constructor(private readonly domainConfig: RiskDomainConfig = GAMING_DOMAIN_CONFIG) {
    this.dimensions = this.getConfiguredDimensions(domainConfig);
  }

  scoreDimensions(resolvedEntity: ResolvedEntity): DimensionSignal[] {
    const baseContext = this.buildSignalContext(resolvedEntity);
    return this.dimensions.map((dimension) =>
      this.scoreDimension(resolvedEntity, dimension, baseContext)
    );
  }

  private buildSignalContext(resolvedEntity: ResolvedEntity): RiskSignalContext {
    const entity = resolvedEntity.canonicalEntity;
    const confidencePrior = clamp01(entity.confidence.score);
    const identityUncertainty = clamp01(1 - resolvedEntity.matchScore);
    const conflictCount = resolvedEntity.conflicts.length;
    const aliasCount = entity.aliases.length;
    const aliasConflictRatio = clamp01(conflictCount / Math.max(1, aliasCount));
    const sourceStrength = this.average(entity.sources.map((s) => clamp01(s.confidence)));
    const tagDensity = clamp01(entity.tags.length / 12);
    const attributeEntries = Object.entries(entity.attributes).map(([k, v]) => ({
      key: k.toLowerCase(),
      value: String(v ?? "").toLowerCase()
    }));
    const attributeKeys = attributeEntries.map((entry) => entry.key);
    const attributeValuesText = attributeEntries.map((entry) => entry.value).join(" ");

    return {
      resolutionConfidence: confidencePrior,
      identityUncertainty,
      conflictCount,
      aliasConflictRatio,
      sourceStrength,
      tagDensity,
      hasKnownNationality:
        this.containsAny(attributeKeys, ["nationality", "country"]) ||
        this.containsAny([attributeValuesText], ["mexico", "spain", "usa", "france"]),
      hasDob: this.containsAny(attributeKeys, ["dob", "birth", "date_of_birth", "birthdate"]),
      hasJurisdiction: entity.jurisdiction !== undefined && entity.jurisdiction.trim().length > 0,
      attributeKeys,
      attributeValuesText
    };
  }

  private scoreDimension(
    resolvedEntity: ResolvedEntity,
    dimension: RiskDimension,
    context: RiskSignalContext
  ): DimensionSignal {
    const config = this.domainConfig[dimension];
    if (!config) {
      return {
        dimension,
        score: 0,
        justification: "Unsupported gaming dimension configuration.",
        strongSignal: false,
        drivers: ["No configuration found for this dimension."],
        confidence: 0.4,
        biasFlag: false
      };
    }

    const base = 0.18 + 0.24 * context.identityUncertainty + 0.08 * (1 - context.sourceStrength);
    const signal = this.dimensionSignal(dimension, context);
    const score = clamp01(base + signal.delta);
    const confidence = clamp01(
      config.confidenceFactor *
        (0.5 + 0.35 * context.sourceStrength + 0.15 * context.resolutionConfidence)
    );
    const biasFlag = config.supportsBiasFlag && context.aliasConflictRatio > 0.45;
    const templateText = config.explanationTemplate;
    const driverLine =
      signal.drivers.length > 0 ? signal.drivers.join(" ") : "Baseline gaming risk signal applied.";

    return {
      dimension,
      score,
      strongSignal: score >= 0.72 || signal.delta >= 0.2,
      drivers: signal.drivers,
      confidence,
      biasFlag,
      justification: `${templateText} Drivers: ${driverLine} Score=${score.toFixed(4)} (base ${base.toFixed(
        3
      )} + signal ${signal.delta.toFixed(3)}). Confidence=${confidence.toFixed(4)} biasFlag=${String(biasFlag)}.`
    };
  }

  private dimensionSignal(
    dimension: RiskDimension,
    context: RiskSignalContext
  ): { delta: number; drivers: string[] } {
    const keys = context.attributeKeys;
    const values = context.attributeValuesText;
    const drivers: string[] = [];
    const keyHit = (needles: string[]): boolean => this.containsAny(keys, needles);
    const valueHit = (needles: string[]): boolean => this.containsAny([values], needles);
    let delta = 0;

    if (dimension === "fraud") {
      if (
        keyHit(["fraud", "chargeback", "dispute", "stolen", "collusion", "multi_account", "ato"]) ||
        valueHit(["chargeback", "fraud", "disputed payment", "account takeover"])
      ) {
        delta += 0.28;
        drivers.push("Payment or account-integrity red flags (chargebacks, disputes, or collusion patterns).");
      }
      delta += 0.1 * context.aliasConflictRatio + 0.06 * context.tagDensity;
    } else if (dimension === "bonus_abuse") {
      if (
        keyHit([
          "bonus_abuse",
          "promo_abuse",
          "rollover",
          "matched_deposit",
          "gnoming",
          "syndicate",
          "chip_dump",
          "bonus_hunter"
        ]) ||
        valueHit(["bonus abuse", "promo farm", "rollover arb", "gnoming", "syndicate"])
      ) {
        delta += 0.3;
        drivers.push("Promotional or bonus-integrity abuse indicators (rollover, syndicate, or farming patterns).");
      }
      delta += 0.07 * context.tagDensity;
      if (context.aliasConflictRatio > 0.35) {
        delta += 0.06;
        drivers.push("Identity inconsistency increases bonus-eligibility review priority.");
      }
    } else if (dimension === "player_behavior") {
      if (
        keyHit([
          "velocity",
          "session_spike",
          "stake_ramp",
          "loss_chase",
          "cohort_outlier",
          "tilt",
          "bet_velocity"
        ]) ||
        valueHit(["loss chase", "velocity spike", "session binge"])
      ) {
        delta += 0.26;
        drivers.push("Behavioral stress: velocity, session clustering, or cohort deviation signals.");
      }
      delta += 0.09 * context.identityUncertainty + 0.05 * context.tagDensity;
    } else if (dimension === "aml_kyc") {
      if (keyHit(["aml", "kyc", "source_of_funds", "beneficial_owner", "pep"]) || valueHit(["aml", "kyc", "pep"])) {
        delta += 0.22;
        drivers.push("AML/KYC or source-of-funds markers detected.");
      }
      if (!context.hasDob) {
        delta += 0.05;
        drivers.push("Missing DOB increases KYC uncertainty.");
      }
      if (!context.hasKnownNationality) {
        delta += 0.05;
        drivers.push("Unknown nationality increases screening risk.");
      }
    } else if (dimension === "responsible_gaming") {
      if (
        keyHit(["responsible_gaming", "session_length", "loss_limit", "self_exclusion", "cooling_off"]) ||
        valueHit(["self exclusion", "limit breach", "rg alert"])
      ) {
        delta += 0.2;
        drivers.push("RG policy stress: limits, self-exclusion, or intervention triggers.");
      }
      delta += 0.08 * context.identityUncertainty;
    } else if (dimension === "vendor_risk") {
      if (
        keyHit(["vendor", "third_party", "psp", "aggregator", "kyc_vendor"]) ||
        valueHit(["third party", "payment provider", "integration outage"])
      ) {
        delta += 0.2;
        drivers.push("Third-party / PSP / platform integration exposure indicators.");
      }
      delta += 0.06 * (1 - context.sourceStrength);
    }

    if (drivers.length === 0) {
      drivers.push("Baseline gaming risk signal applied.");
    }
    return { delta: clamp01(delta), drivers };
  }

  private containsAny(haystack: string[], needles: string[]): boolean {
    return needles.some((needle) => haystack.some((value) => value.includes(needle)));
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0.45;
    return clamp01(values.reduce((sum, value) => sum + value, 0) / values.length);
  }

  private getConfiguredDimensions(config: RiskDomainConfig): RiskDimension[] {
    return Object.values(config)
      .map((dimensionConfig) => dimensionConfig?.id)
      .filter((id): id is RiskDimension => id !== undefined);
  }
}

/**
 * Orchestrator for the gaming composite score.
 *
 * Responsibilities are delegated to three collaborators authored in
 * `combos.ts`:
 *
 * - {@link ComboDetector}       — identifies casino-typical multi-signal patterns.
 * - {@link DynamicSynergyEngine} — computes bounded per-combo and global synergy.
 * - {@link DriverPrioritizer}    — produces the analyst-facing Key Risk Drivers.
 *
 * This class owns only (a) weight resolution (base + adaptive), (b) confidence /
 * evidence / conflict math, and (c) assembly of the final `DomainScoreBreakdown`.
 * Any senior engineer can understand this orchestrator end-to-end in under five
 * minutes by reading {@link buildBreakdown} top-to-bottom.
 */
export class GamingMultiFactorScorer {
  private readonly dimensions: RiskDimension[];
  private readonly comboDetector: ComboDetector;
  private readonly synergyEngine: DynamicSynergyEngine;
  private readonly driverPrioritizer: DriverPrioritizer;

  constructor(
    private readonly domainConfig: RiskDomainConfig = GAMING_DOMAIN_CONFIG,
    collaborators: {
      comboDetector?: ComboDetector;
      synergyEngine?: DynamicSynergyEngine;
      driverPrioritizer?: DriverPrioritizer;
    } = {}
  ) {
    this.dimensions = this.getConfiguredDimensions(domainConfig);
    this.synergyEngine = collaborators.synergyEngine ?? new DynamicSynergyEngine();
    this.comboDetector =
      collaborators.comboDetector ?? new ComboDetector(undefined, this.synergyEngine);
    this.driverPrioritizer = collaborators.driverPrioritizer ?? new DriverPrioritizer();
  }

  resolveWeights(customWeights?: Partial<Record<RiskDimension, number>>): Record<RiskDimension, number> {
    const base = this.domainWeightsFromConfig(this.domainConfig, this.dimensions);
    if (!customWeights) return base;
    const merged = { ...base };
    for (const dimension of this.dimensions) {
      const candidate = customWeights[dimension];
      if (candidate !== undefined && candidate >= 0) {
        merged[dimension] = candidate;
      }
    }
    return this.normalizeWeights(merged, base, this.dimensions);
  }

  /**
   * Raises relative weight on dimensions with stronger live signals so gaming composites
   * track casino-relevant spikes more aggressively than a flat prior.
   */
  resolveAdaptiveGamingWeights(
    signals: DimensionSignal[],
    customWeights?: Partial<Record<RiskDimension, number>>
  ): Record<RiskDimension, number> {
    let base = this.resolveWeights(customWeights);
    const boosted = { ...base } as Record<RiskDimension, number>;
    const emphasis: RiskDimension[] = ["fraud", "bonus_abuse", "player_behavior", "aml_kyc"];
    for (const signal of signals) {
      const dim = signal.dimension;
      let factor = 1 + 0.14 * clamp01(signal.score - 0.42);
      if (signal.strongSignal) {
        factor += 0.08;
      }
      if (emphasis.includes(dim)) {
        factor += 0.06;
      }
      boosted[dim] = (boosted[dim] ?? 0) * factor;
    }
    return this.normalizeWeights(boosted, base, this.dimensions);
  }

  /**
   * Computes the gaming composite breakdown end-to-end. Read top-to-bottom:
   *
   *  1. Compute evidence-adjusted components from raw dimension signals.
   *  2. Detect cross-dimension casino combos → bounded synergy uplift.
   *  3. Blend weighted sum + synergy into the composite `overall`.
   *  4. Attach confidence / conflict-intensity / peak component metadata.
   *  5. Ask the prioritizer for the top 3 analyst-facing Key Risk Drivers.
   *
   * Every piece of combo / synergy / driver math lives in `combos.ts`; this
   * method is pure orchestration.
   */
  buildBreakdown(
    signals: DimensionSignal[],
    weights: Record<RiskDimension, number>,
    confidenceWeight: number,
    evidenceSensitivity: number
  ): DomainScoreBreakdown {
    const evidenceStrength = this.computeEvidenceStrength(signals);
    const components: RiskScoreComponent[] = signals.map((signal) => {
      const weight = weights[signal.dimension] ?? 0;
      const evidenceAdjustedScore = this.applyEvidence(signal.score, evidenceStrength, evidenceSensitivity);
      const contribution = clamp01(evidenceAdjustedScore) * weight;
      return {
        dimension: signal.dimension,
        score: clamp01(evidenceAdjustedScore),
        weight,
        contribution,
        justification: signal.justification
      };
    });

    const weightedSum = components.reduce((sum, c) => sum + c.contribution, 0);
    const detectedCombos = this.comboDetector.detect(signals, components);
    const synergyBoost = this.synergyEngine.computeOverallBoost(detectedCombos);
    const overall = clamp01(weightedSum + synergyBoost);
    const confidence = this.computeConfidence(signals, components, confidenceWeight, evidenceStrength);
    const conflictIntensity = this.conflictIntensity(signals);
    const peakComponentScore = components.reduce((max, c) => Math.max(max, c.score), 0);
    const keyRiskDrivers = this.driverPrioritizer.build(components, detectedCombos);

    return {
      domain: "gaming",
      overall,
      components,
      confidence,
      evidenceStrength,
      conflictIntensity,
      peakComponentScore,
      keyRiskDrivers,
      ...(detectedCombos.length > 0 && { detectedCombos }),
      ...(synergyBoost > 0 && { synergyBoost })
    };
  }

  private domainWeightsFromConfig(
    config: RiskDomainConfig,
    dimensions: RiskDimension[]
  ): Record<RiskDimension, number> {
    const base = {} as Record<RiskDimension, number>;
    for (const dimension of dimensions) {
      base[dimension] = config[dimension]?.weight ?? 0;
    }
    return this.normalizeWeights(base, base, dimensions);
  }

  private normalizeWeights(
    candidate: Record<RiskDimension, number>,
    fallback: Record<RiskDimension, number>,
    dimensions: RiskDimension[]
  ): Record<RiskDimension, number> {
    const total = dimensions.reduce((sum, d) => sum + (candidate[d] ?? 0), 0);
    if (total <= 0) return fallback;
    const normalized = {} as Record<RiskDimension, number>;
    for (const dimension of dimensions) {
      normalized[dimension] = (candidate[dimension] ?? 0) / total;
    }
    return normalized;
  }

  private computeConfidence(
    signals: DimensionSignal[],
    components: RiskScoreComponent[],
    confidenceWeight: number,
    evidenceStrength: number
  ): number {
    const signalConfidence =
      signals.length === 0
        ? 0.5
        : signals.reduce((sum, signal) => sum + signal.confidence, 0) / signals.length;
    const spread = this.componentSpread(components);
    const agreement = 1 - spread;
    return clamp01(
      0.42 +
        agreement * confidenceWeight +
        0.2 * evidenceStrength +
        0.18 * clamp01(signalConfidence)
    );
  }

  private componentSpread(components: RiskScoreComponent[]): number {
    if (components.length === 0) return 1;
    const mean = components.reduce((sum, c) => sum + c.score, 0) / components.length;
    const variance =
      components.reduce((sum, c) => sum + (c.score - mean) ** 2, 0) / components.length;
    return clamp01(Math.sqrt(variance));
  }

  private applyEvidence(score: number, evidenceStrength: number, evidenceSensitivity: number): number {
    const k = clamp01(evidenceSensitivity);
    const lift = 0.86 + 0.28 * evidenceStrength;
    return clamp01(score * (1 - 0.35 * k + k * lift));
  }

  private computeEvidenceStrength(signals: DimensionSignal[]): number {
    if (signals.length === 0) return 0.4;
    const meanScore =
      signals.reduce((sum, signal) => sum + clamp01(signal.score), 0) / signals.length;
    const strongRatio = signals.filter((signal) => signal.strongSignal).length / signals.length;
    return clamp01(0.5 * meanScore + 0.5 * strongRatio);
  }

  private conflictIntensity(signals: DimensionSignal[]): number {
    const relevant = signals.filter(
      (signal) =>
        signal.dimension === "fraud" ||
        signal.dimension === "aml_kyc" ||
        signal.dimension === "bonus_abuse" ||
        signal.dimension === "player_behavior"
    );
    if (relevant.length === 0) return 0;
    const mean = relevant.reduce((sum, signal) => sum + signal.score, 0) / relevant.length;
    return clamp01(mean);
  }

  private getConfiguredDimensions(config: RiskDomainConfig): RiskDimension[] {
    return Object.values(config)
      .map((dimensionConfig) => dimensionConfig?.id)
      .filter((id): id is RiskDimension => id !== undefined);
  }
}

/**
 * Domain-aware composite scorer used by {@link RiskScoringService}.
 *
 * Centralizes per-domain signal extraction and weighted aggregation while
 * keeping the composite scoring behaviour deterministic, explainable, and
 * back-compatible across the `general` and `gaming` domains.
 */
export class CompositeRiskScorer {
  private readonly generalDimensionScorer = new DimensionScorer(GENERAL_DOMAIN_CONFIG);
  private readonly generalMultiFactorScorer = new MultiFactorScorer();
  private readonly gamingDimensionScorer = new GamingDimensionScorer(GAMING_DOMAIN_CONFIG);
  private readonly gamingMultiFactorScorer = new GamingMultiFactorScorer(GAMING_DOMAIN_CONFIG);

  scoreDomain(
    domain: RiskDomain,
    resolvedEntity: ResolvedEntity,
    options: {
      confidenceWeight: number;
      evidenceSensitivity: number;
      customWeights?: Partial<Record<RiskDimension, number>>;
      baseWeights: Record<RiskDimension, number>;
    }
  ): DomainScoreBreakdown {
    if (domain === "gaming") {
      const signals = this.gamingDimensionScorer.scoreDimensions(resolvedEntity);
      const weights = this.gamingMultiFactorScorer.resolveAdaptiveGamingWeights(signals, {
        ...options.baseWeights,
        ...options.customWeights
      });
      return this.gamingMultiFactorScorer.buildBreakdown(
        signals,
        weights,
        options.confidenceWeight,
        options.evidenceSensitivity
      );
    }

    const signals = this.generalDimensionScorer.scoreDimensions(resolvedEntity);
    const weights = this.generalMultiFactorScorer.resolveDynamicWeights(
      signals,
      options.baseWeights,
      options.customWeights
    );
    return this.generalMultiFactorScorer.buildBreakdown(
      signals,
      weights,
      options.confidenceWeight,
      options.evidenceSensitivity
    );
  }
}
