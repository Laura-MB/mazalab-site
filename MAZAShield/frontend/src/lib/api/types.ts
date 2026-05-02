/**
 * Subset of MAZALab API types aligned with `POST /assess-risk` responses.
 * Keep in sync with `src/types/index.ts` in the core repo when evolving contracts.
 */

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface SourceReference {
  sourceId: string;
  sourceName: string;
  sourceType: "osint" | "internal" | "commercial" | "government" | "other";
  collectedAt: string;
  confidence: number;
  url?: string;
}

export interface ConfidenceMetrics {
  score: number;
  methodology?: string;
  rationale?: string;
  lastUpdatedAt: string;
}

export interface Entity {
  id: string;
  type?: string;
  displayName: string;
  aliases: string[];
  attributes: Record<string, string | number | boolean | null>;
  jurisdiction?: string;
  tags: string[];
  sources: SourceReference[];
  confidence: ConfidenceMetrics;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface ResolvedEntity {
  canonicalEntity: Entity;
  mergedEntityIds: string[];
  resolutionVersion: string;
  matchStrategy: "deterministic" | "probabilistic" | "hybrid";
  matchScore: number;
  explanation: string;
  conflicts: Array<{
    field: string;
    values: string[];
    selectedValue: string;
  }>;
  resolvedAt: string;
}

export interface RiskScoreComponent {
  dimension: string;
  score: number;
  weight: number;
  contribution: number;
  justification: string;
}

export interface RiskScoreGamingInsights {
  detectedCombos: Array<{
    id: string;
    label: string;
    dimensions: string[];
    synergy: number;
    analystNote: string;
  }>;
  synergyBoost: number;
}

export interface RiskScore {
  overall: number;
  level: RiskLevel;
  components: RiskScoreComponent[];
  confidence: number;
  calculatedAt: string;
  modelVersion: string;
  explanation?: string;
  gamingInsights?: RiskScoreGamingInsights;
}

export interface ComplianceMetadata {
  complianceSchemaVersion: string;
  domain: "general" | "gaming";
  rulesVersion: string;
  buildRef: string;
  recordedAt: string;
}

export interface RiskAssessment {
  id: string;
  targetEntityId: string;
  resolvedEntity?: ResolvedEntity;
  riskScore: RiskScore;
  threatIndicators: unknown[];
  relatedRelations: unknown[];
  assessmentSummary: string;
  recommendedActions: string[];
  analystNotes?: string;
  status: string;
  generatedAt: string;
  generatedBy: string;
  governance?: ComplianceMetadata;
}

export interface AssessRiskRequestBody {
  entities: Entity[];
  correlationId?: string;
}
