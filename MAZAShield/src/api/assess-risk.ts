// DP-2026-GOV-001, DR-2026-GOV-001-001, RVTM v1.1
import { Router, type NextFunction, type Request, type Response } from "express";
import { randomUUID } from "node:crypto";
import { logHttpRequestCompleted } from "./http-log.js";
import type { ResolveEntitiesInput } from "../core/entity-resolution/index.js";
import { AssessmentService } from "../core/assessment/index.js";
import {
  COMPLIANCE_SCHEMA_VERSION,
  encodeComplianceMetadataHeader
} from "../core/governance/compliance-metadata.js";
import type { Entity, RiskAssessment } from "../types/index.js";

interface AssessRiskInput extends ResolveEntitiesInput {
  correlationId?: string;
}

const assessRiskRouter = Router();

/** Lazy singleton — see `src/api/assess.ts` for the rationale. */
let assessmentServiceInstance: AssessmentService | null = null;
function getAssessmentService(): AssessmentService {
  if (!assessmentServiceInstance) {
    assessmentServiceInstance = new AssessmentService();
  }
  return assessmentServiceInstance;
}

assessRiskRouter.post(
  "/",
  async (
    req: Request<unknown, RiskAssessment[], AssessRiskInput>,
    res: Response<RiskAssessment[]>,
    next: NextFunction
  ) => {
    const startedAt = Date.now();
    try {
      const input = req.body;
      if (!isValidResolveInput(input)) {
        logHttpRequestCompleted({
          correlationId: undefined,
          route: "POST /assess-risk",
          method: "POST",
          statusCode: 400,
          durationMs: Date.now() - startedAt
        });
        res.status(400).json([]);
        return;
      }

      const correlationId =
        typeof input.correlationId === "string" && input.correlationId.trim().length > 0
          ? input.correlationId
          : randomUUID();
      const context = { correlationId };
      const assessments = await getAssessmentService().calculateRiskAssessment(
        input.entities,
        context
      );
      logHttpRequestCompleted({
        correlationId,
        route: "POST /assess-risk",
        method: "POST",
        statusCode: 200,
        durationMs: Date.now() - startedAt,
        entityCount: input.entities.length
      });
      res.setHeader("x-correlation-id", correlationId);
      const gov = assessments[0]?.governance;
      if (gov) {
        res.setHeader("x-compliance-schema-version", COMPLIANCE_SCHEMA_VERSION);
        res.setHeader("x-governance-metadata", encodeComplianceMetadataHeader(gov));
      }

      res.status(200).json(assessments);
    } catch (error) {
      next(error);
    }
  }
);

function isValidResolveInput(input: unknown): input is AssessRiskInput {
  if (!input || typeof input !== "object") return false;
  if (!("entities" in input)) return false;

  const entities = (input as { entities?: unknown }).entities;
  if (!Array.isArray(entities)) return false;

  return entities.every(isMinimalEntity);
}

function isMinimalEntity(value: unknown): value is Entity {
  if (!value || typeof value !== "object") return false;
  const candidate = value as {
    id?: unknown;
    displayName?: unknown;
    aliases?: unknown;
    attributes?: unknown;
    tags?: unknown;
    sources?: unknown;
    confidence?: unknown;
    firstSeenAt?: unknown;
    lastSeenAt?: unknown;
  };

  return (
    typeof candidate.id === "string" &&
    candidate.id.trim().length > 0 &&
    typeof candidate.displayName === "string" &&
    candidate.displayName.trim().length > 0 &&
    Array.isArray(candidate.aliases) &&
    candidate.attributes !== null &&
    typeof candidate.attributes === "object" &&
    Array.isArray(candidate.tags) &&
    Array.isArray(candidate.sources) &&
    candidate.confidence !== null &&
    typeof candidate.confidence === "object" &&
    typeof candidate.firstSeenAt === "string" &&
    typeof candidate.lastSeenAt === "string"
  );
}

export { assessRiskRouter };
