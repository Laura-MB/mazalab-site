// DP-2026-GOV-001, DR-2026-GOV-001-001, RVTM v1.1
import {
  AuditLogService,
  getSharedAssessmentAuditLogService,
  type LogAssessmentContext
} from "../governance/audit-log.service.js";
import {
  buildComplianceMetadata,
  resolveBuildRef,
  resolveRulesVersion
} from "../governance/compliance-metadata.js";
import { EntityResolutionService } from "../entity-resolution/index.js";
import { GamingRiskScorer } from "../gaming/index.js";
import { logger as baseLogger, type Logger, withCorrelationId } from "../observability/logger.js";
import { RiskScoringService } from "../risk-scoring/index.js";
import { AssessmentPipeline } from "./pipeline.js";
import type {
  AssessmentInput,
  AssessmentRequestContext,
  AssessmentResult,
  Entity,
  RiskAssessment
} from "./types.js";

/**
 * Public entry point for the MAZALab end-to-end assessment pipeline.
 *
 * Orchestrates: entity resolution → risk scoring → batch explanation →
 * audit. Scoring and resolution are injected so the service stays easy to
 * unit-test and swap in production. The correlation identifier supplied in
 * {@link AssessmentRequestContext} is threaded structurally through the
 * pipeline (not parsed back from explanation text), reaching the
 * resolution layer for analyst-facing traceability and the risk-scoring
 * layer for audit-log linkage.
 *
 * The constructor is the **single source of default-wiring** for the
 * pipeline. The internal {@link AssessmentPipeline} is pure dependency
 * injection and makes no implicit choices — domain routing splits cleanly
 * into general and gaming paths, and the Gaming-vertical enrichment layer
 * is opt-out-able by passing `null` as the fourth constructor argument.
 */
export class AssessmentService {
  private readonly pipeline: AssessmentPipeline;
  private readonly auditLogService: AuditLogService;
  private readonly log: Logger;

  /**
   * Wires the assessment pipeline against injectable collaborators. All
   * arguments are optional; when omitted the service falls back to
   * production-grade defaults and the process-wide shared audit log.
   *
   * @param resolutionService  Custom entity resolution implementation.
   * @param riskScoringService Custom **general-domain** risk scoring
   *                           implementation. The gaming-domain scorer is
   *                           constructed internally with
   *                           `domain: "gaming"` because the gaming
   *                           dimension set is fixed.
   * @param auditLogService    Override the shared audit log (e.g. in tests).
   * @param gamingScorer       Override the Gaming-vertical enrichment
   *                           layer. Pass `null` to disable the
   *                           `gamingInsights.advanced` envelope entirely;
   *                           the gaming-domain combos, synergy boost, and
   *                           narrative still render identically. Pass an
   *                           explicit instance for tests or bespoke
   *                           thresholds. Defaults to a stock
   *                           {@link GamingRiskScorer}.
   */
  constructor(
    resolutionService = new EntityResolutionService(),
    riskScoringService = new RiskScoringService(),
    auditLogService?: AuditLogService,
    gamingScorer: GamingRiskScorer | null = new GamingRiskScorer()
  ) {
    const gamingRiskScoringService = new RiskScoringService({ domain: "gaming" });
    this.pipeline = new AssessmentPipeline(
      resolutionService,
      riskScoringService,
      gamingRiskScoringService,
      gamingScorer
    );
    this.auditLogService = auditLogService ?? getSharedAssessmentAuditLogService();
    this.log = baseLogger.child({ service: "assessment" });
  }

  /**
   * Convenience wrapper that returns only the per-entity {@link RiskAssessment}
   * array, delegating to {@link AssessmentService.assess}. Used by the
   * `POST /assess-risk` route to preserve a flat response shape.
   */
  async calculateRiskAssessment(
    entities: Entity[],
    context?: AssessmentRequestContext
  ): Promise<RiskAssessment[]> {
    const input: AssessmentInput = { entities };
    if (context) {
      input.context = context;
    }
    const { assessments } = await this.assess(input);
    return assessments;
  }

  /**
   * Runs the full assessment flow: resolve → score → build assessment
   * artifact. Every successful run is appended to the audit log (append-only)
   * before returning, with the request correlation identifier propagated
   * end-to-end.
   */
  async assess(input: AssessmentInput): Promise<AssessmentResult> {
    const startedAt = Date.now();
    const correlationId = input.context?.correlationId;
    const requestLog = withCorrelationId(correlationId, this.log);

    const result = await this.pipeline.run(
      input.entities,
      input.context,
      input.domain ?? "general"
    );

    const compliance = buildComplianceMetadata({
      domain: result.domain,
      rulesVersion: resolveRulesVersion(),
      buildRef: resolveBuildRef()
    });

    const logContext: LogAssessmentContext = {
      inputEntityCount: input.entities.length,
      compliance
    };
    if (correlationId !== undefined) {
      logContext.correlationId = correlationId;
    }
    await this.auditLogService.logAssessment(result, logContext);

    if (result.assessments.length > 0) {
      const first = result.assessments[0]!;
      result.assessments[0] = { ...first, governance: compliance };
    }

    // Single high-value boundary log: gives operators a per-request row to
    // pivot from {correlationId, latency, batch shape} to the audit entry.
    requestLog.debug("Assessment completed", {
      domain: result.domain ?? input.domain ?? "general",
      entityCount: input.entities.length,
      assessments: result.assessments.length,
      overallRiskLevel: result.summary?.overallRiskLevel,
      durationMs: Date.now() - startedAt
    });

    return result;
  }
}
