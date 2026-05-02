/**
 * Shared primitive aliases used across MAZALab domain types.
 */
export type ISODateTimeString = string;
export type EntityId = string;
export type RelationId = string;
export type ThreatIndicatorId = string;
export type RiskAssessmentId = string;

/**
 * Enumerates the high-level entity categories handled by MAZALab.
 */
export type EntityType =
  | "person"
  | "organization"
  | "asset"
  | "device"
  | "location"
  | "event"
  | "object"
  | "unknown";

/**
 * Represents provenance metadata for a data source used in analysis.
 */
export interface SourceReference {
  sourceId: string;
  sourceName: string;
  sourceType: "osint" | "internal" | "commercial" | "government" | "other";
  collectedAt: ISODateTimeString;
  confidence: number;
  url?: string;
}

/**
 * Represents confidence details for analytical decisions and links.
 */
export interface ConfidenceMetrics {
  score: number;
  methodology?: string;
  rationale?: string;
  lastUpdatedAt: ISODateTimeString;
}

/**
 * Represents a raw or canonical entity observed in MAZALab pipelines.
 */
export interface Entity {
  id: EntityId;
  type: EntityType;
  displayName: string;
  aliases: string[];
  attributes: Record<string, string | number | boolean | null>;
  jurisdiction?: string;
  tags: string[];
  sources: SourceReference[];
  confidence: ConfidenceMetrics;
  firstSeenAt: ISODateTimeString;
  lastSeenAt: ISODateTimeString;
}

/**
 * Represents identity-resolution output where multiple records are merged
 * into one canonical entity profile with explainable merge evidence.
 */
export interface ResolvedEntity {
  canonicalEntity: Entity;
  mergedEntityIds: EntityId[];
  resolutionVersion: string;
  matchStrategy: "deterministic" | "probabilistic" | "hybrid";
  matchScore: number;
  explanation: string;
  conflicts: Array<{
    field: string;
    values: string[];
    selectedValue: string;
  }>;
  resolvedAt: ISODateTimeString;
}

/**
 * Enumerates the main dimensions used in risk-scoring decomposition.
 */
export type RiskDimension =
  | "sanctions"
  | "fraud"
  | "aml"
  | "aml_kyc"
  | "cyber"
  | "reputation"
  | "compliance"
  | "geopolitical"
  | "responsible_gaming"
  | "vendor_risk"
  | "bonus_abuse"
  | "player_behavior";

/**
 * Represents one weighted component of a final risk score.
 */
export interface RiskScoreComponent {
  dimension: RiskDimension;
  score: number;
  weight: number;
  contribution: number;
  justification: string;
}

/**
 * Represents a normalized risk score with transparent breakdown for auditability.
 */
/**
 * Machine-readable companion to the gaming narrative text: detected combos and
 * synergy boost surfaced structurally on the public {@link RiskScore} so
 * dashboards, APIs, and downstream pipelines can consume them without parsing
 * free-form explanation. Only populated when `domain === "gaming"` and at
 * least one combo fires; always optional for backward compatibility.
 */
export interface RiskScoreGamingInsights {
  /** Detected cross-dimension gaming combos in rule order (same data as in the narrative). */
  detectedCombos: Array<{
    id: string;
    label: string;
    dimensions: RiskDimension[];
    synergy: number;
    analystNote: string;
  }>;
  /** Aggregate synergy uplift applied to `overall` (≤ 0.12 by construction). */
  synergyBoost: number;
  // The optional `advanced?: GamingAdvancedInsights` field is contributed by
  // TypeScript module augmentation declared in `src/core/gaming/types.ts`.
  // Keeping the augmentation in the vertical module — and leaving this
  // shared type free of vertical imports — preserves a single dependency
  // direction (vertical → shared, never the reverse) while still giving
  // every consumer of `RiskScoreGamingInsights` a properly-typed `advanced`
  // accessor with no `unknown` casts.
}

export interface RiskScore {
  overall: number;
  level: "low" | "medium" | "high" | "critical";
  components: RiskScoreComponent[];
  confidence: number;
  calculatedAt: ISODateTimeString;
  modelVersion: string;
  /**
   * Structured analyst-facing narrative (domain-aware). Optional for backward compatibility.
   */
  explanation?: string;
  /**
   * Machine-readable gaming combo / synergy block. Present only for gaming
   * domain when at least one combo fires; absent for general domain.
   */
  gamingInsights?: RiskScoreGamingInsights;
}

/**
 * Enumerates operational states for detected threat indicators.
 */
export type ThreatIndicatorStatus = "active" | "monitoring" | "mitigated" | "false_positive";

/**
 * Represents a threat signal associated with an entity or relation.
 */
export interface ThreatIndicator {
  id: ThreatIndicatorId;
  type:
    | "sanction_hit"
    | "pep_match"
    | "adverse_media"
    | "suspicious_transaction_pattern"
    | "credential_exposure"
    | "network_association"
    | "other";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  status: ThreatIndicatorStatus;
  detectedAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
  relatedEntityIds: EntityId[];
  sourceRefs: SourceReference[];
  confidence: ConfidenceMetrics;
}

/**
 * Enumerates supported relationship semantics between entities.
 */
export type RelationType =
  | "owns"
  | "controls"
  | "employs"
  | "associated_with"
  | "transacts_with"
  | "located_at"
  | "family_link"
  | "other";

/**
 * Represents a directed or undirected link between two entities.
 */
export interface Relation {
  id: RelationId;
  fromEntityId: EntityId;
  toEntityId: EntityId;
  type: RelationType;
  direction: "directed" | "undirected";
  strength: number;
  evidenceSummary: string;
  sourceRefs: SourceReference[];
  confidence: ConfidenceMetrics;
  validFrom?: ISODateTimeString;
  validTo?: ISODateTimeString;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

// DP-2026-GOV-001, DR-2026-GOV-001-001, RVTM v1.1 — structured, minimized governance metadata (not a substitute for ER/RS explain fields).
/**
 * Optional compliance context attached to an assessment for audit and API consumers;
 * does not replace `riskScore` / narrative explanations.
 */
export interface ComplianceMetadata {
  /** Logical schema version of this object. */
  complianceSchemaVersion: string;
  /** Batch risk domain; mirrors pipeline routing, not a second opinion on score. */
  domain: "general" | "gaming";
  /** Ruleset / engine id (config-driven; not raw config dumps). */
  rulesVersion: string;
  /** Non-PII build or revision reference (e.g. short commit hash or package version). */
  buildRef: string;
  /** ISO-8601 instant when the metadata snapshot was recorded. */
  recordedAt: string;
}

/**
 * Represents the final risk analysis artifact for a target entity,
 * combining scoring, indicators, and recommended actions.
 */
export interface RiskAssessment {
  id: RiskAssessmentId;
  targetEntityId: EntityId;
  resolvedEntity?: ResolvedEntity;
  riskScore: RiskScore;
  threatIndicators: ThreatIndicator[];
  relatedRelations: Relation[];
  assessmentSummary: string;
  recommendedActions: string[];
  analystNotes?: string;
  status: "draft" | "reviewed" | "approved" | "rejected";
  generatedAt: ISODateTimeString;
  generatedBy: "system" | "analyst";
  reviewedAt?: ISODateTimeString;
  reviewOwnerId?: string;
  /**
   * When present, governance/compliance metadata for this response (typically only the
   * first assessment in a batch; omitted for clients that do not need it). DP-2026-GOV-001.
   */
  governance?: ComplianceMetadata;
}
