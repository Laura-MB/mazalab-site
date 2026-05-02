import { randomUUID } from "node:crypto";
import type { ResolvedEntity } from "../../types/index.js";
import { logger as baseLogger, type Logger, withCorrelationId } from "../observability/logger.js";
import {
  RiskScoreAuditLogService,
  createDefaultRiskScoreAuditLogService
} from "../governance/risk-score-audit-log.service.js";
import {
  type RiskDomain,
  type RiskDimension,
  type RiskScore,
  type RiskScoreCalculationOptions,
  type RiskScoringOptions
} from "./types.js";
import { RiskLevelThresholds } from "./thresholds.js";
import { CompositeRiskScorer } from "./scorer.js";
import { RiskScoreExplanationBuilder } from "./explanation-builder.js";
import { DOMAIN_CONFIG_MAP } from "./config/domain-config.js";
import { clamp01 } from "./utils.js";

/**
 * Public orchestration service for per-entity risk scoring.
 *
 * Coordinates domain-aware signal extraction, thresholding, explanation
 * generation and append-only audit recording. Accepts a request-scoped
 * {@link RiskScoreCalculationOptions.correlationId} so the audit entry can be
 * linked deterministically back to the originating request without parsing
 * free-form explanation text.
 */
export class RiskScoringService {
  private static readonly DEFAULT_MODEL_VERSION = "0.2.0-mvp-advanced";
  private static readonly DEFAULT_CONFIDENCE_WEIGHT = 0.42;
  private static readonly DEFAULT_EVIDENCE_SENSITIVITY = 0.6;

  private readonly log: Logger = baseLogger.child({ service: "risk-scoring" });
  private readonly thresholds = new RiskLevelThresholds();
  private readonly compositeScorer = new CompositeRiskScorer();
  private readonly explanationBuilder = new RiskScoreExplanationBuilder();
  private readonly options: Required<RiskScoringOptions>;
  private readonly auditLogService: RiskScoreAuditLogService;

  /**
   * Constructs the scoring service with optional weight, sensitivity and
   * domain overrides. When `auditLogService` is omitted the default
   * Supabase-or-in-memory implementation is created lazily.
   *
   * @param options          Per-instance scoring configuration.
   * @param auditLogService  Override the risk-score audit sink (e.g. in tests).
   */
  constructor(options?: RiskScoringOptions, auditLogService?: RiskScoreAuditLogService) {
    this.options = {
      dimensionWeights: options?.dimensionWeights ?? {},
      confidenceWeight: options?.confidenceWeight ?? RiskScoringService.DEFAULT_CONFIDENCE_WEIGHT,
      evidenceSensitivity:
        options?.evidenceSensitivity ?? RiskScoringService.DEFAULT_EVIDENCE_SENSITIVITY,
      modelVersion: options?.modelVersion ?? RiskScoringService.DEFAULT_MODEL_VERSION,
      domain: options?.domain ?? "general"
    };
    this.auditLogService = auditLogService ?? createDefaultRiskScoreAuditLogService();
  }

  /**
   * Computes a full {@link RiskScore} for one resolved entity and appends an
   * audit record in the same operation.
   *
   * @param resolvedEntity Canonical resolution artifact to score.
   * @param callOptions    Optional per-call controls. Pass `correlationId` to
   *                       tie the emitted audit row to an upstream request.
   */
  async calculateRiskScore(
    resolvedEntity: ResolvedEntity,
    callOptions?: RiskScoreCalculationOptions
  ): Promise<RiskScore> {
    const startedAt = Date.now();
    const domain = this.options.domain;
    const confidenceWeight = clamp01(this.options.confidenceWeight);
    const evidenceSensitivity = clamp01(this.options.evidenceSensitivity);
    const modelVersion = this.options.modelVersion;

    const breakdown = this.compositeScorer.scoreDomain(domain, resolvedEntity, {
      confidenceWeight,
      evidenceSensitivity,
      customWeights: this.options.dimensionWeights,
      baseWeights: domain === "gaming" ? this.defaultGamingWeights() : this.defaultGeneralWeights()
    });
    const levelDecision = this.thresholds.decideLevel(breakdown, domain);

    const explanation = this.explanationBuilder.build({
      domain,
      resolvedEntity,
      modelVersion,
      breakdown,
      levelDecision
    });

    const score: RiskScore = {
      overall: breakdown.overall,
      level: levelDecision.level,
      components: breakdown.components.map((component) => ({ ...component })),
      confidence: breakdown.confidence,
      calculatedAt: new Date().toISOString(),
      modelVersion,
      explanation,
      ...(domain === "gaming" && breakdown.detectedCombos && breakdown.detectedCombos.length > 0
        ? {
            gamingInsights: {
              detectedCombos: breakdown.detectedCombos.map((combo) => ({
                id: combo.id,
                label: combo.label,
                dimensions: [...combo.dimensions],
                synergy: combo.synergy,
                analystNote: combo.analystNote
              })),
              synergyBoost: breakdown.synergyBoost ?? 0
            }
          }
        : {})
    };

    const correlationId = callOptions?.correlationId ?? randomUUID();
    const requestLog = withCorrelationId(correlationId, this.log);
    await this.auditLogService.append({
      id: randomUUID(),
      correlation_id: correlationId,
      domain,
      input_summary: this.toInputSummary(resolvedEntity),
      output_summary: {
        overall: score.overall,
        level: score.level,
        confidence: score.confidence
      },
      overall_score: score.overall,
      risk_level: score.level,
      confidence: score.confidence,
      explanations: explanation,
      bias_flags: this.extractBiasFlags(score),
      model_version: modelVersion
    });

    requestLog.debug("Risk score calculated", {
      domain,
      entityId: resolvedEntity.canonicalEntity.id,
      level: score.level,
      durationMs: Date.now() - startedAt
    });

    return score;
  }

  private defaultGeneralWeights(): Record<RiskDimension, number> {
    return this.weightsFromDomainConfig("general");
  }

  private defaultGamingWeights(): Record<RiskDimension, number> {
    return this.weightsFromDomainConfig("gaming");
  }

  private weightsFromDomainConfig(domain: RiskDomain): Record<RiskDimension, number> {
    const config = DOMAIN_CONFIG_MAP[domain];
    const weights: Record<RiskDimension, number> = {
      sanctions: 0,
      fraud: 0,
      aml: 0,
      aml_kyc: 0,
      cyber: 0,
      reputation: 0,
      compliance: 0,
      geopolitical: 0,
      responsible_gaming: 0,
      vendor_risk: 0,
      bonus_abuse: 0,
      player_behavior: 0
    };

    for (const dimensionConfig of Object.values(config)) {
      if (!dimensionConfig) continue;
      weights[dimensionConfig.id] = dimensionConfig.weight;
    }
    return weights;
  }

  private toInputSummary(resolvedEntity: ResolvedEntity): Record<string, unknown> {
    return {
      canonicalEntityId: resolvedEntity.canonicalEntity.id,
      canonicalType: resolvedEntity.canonicalEntity.type,
      matchScore: resolvedEntity.matchScore,
      conflictCount: resolvedEntity.conflicts.length,
      mergedEntityIds: resolvedEntity.mergedEntityIds
    };
  }

  private extractBiasFlags(score: RiskScore): string[] {
    const flags = score.components
      .filter((component) => /biasflag=true/i.test(component.justification))
      .map((component) => component.dimension);
    return [...new Set(flags)];
  }
}
