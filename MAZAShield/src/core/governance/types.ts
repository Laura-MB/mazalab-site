// DP-2026-GOV-001, DR-2026-GOV-001-001, RVTM v1.1
import type { ComplianceMetadata, RiskScore } from "../../types/index.js";
import type { RiskDomain } from "../risk-scoring/types.js";

/**
 * Persisted row shape for risk-score audit trail (Supabase / in-memory).
 */
export interface RiskScoreAuditLogRow {
  id: string;
  created_at?: string;
  correlation_id: string;
  domain: RiskDomain;
  input_summary: Record<string, unknown>;
  output_summary: Record<string, unknown>;
  overall_score: number;
  risk_level: RiskScore["level"];
  confidence: number;
  explanations: string;
  bias_flags: string[];
  model_version: string;
}

/**
 * One assessment outcome in the assessment-pipeline audit trail (append-only semantics).
 *
 * Human-readable fields (`riskScore.levelLabel`, `inputSummary.domainName`)
 * are derived from the canonical machine values (`level`, `domain`) and are
 * emitted on every new entry. They are marked optional so pre-existing
 * on-disk payloads (schema <= 3) continue to parse without migration; the
 * service fills them in on read transparently.
 */
export interface AuditEntry {
  timestamp: string;
  correlationId: string;
  inputSummary: {
    entityCount: number;
    domain: RiskDomain;
    /** Human-readable domain name (e.g. "Gaming", "General"). Derived from `domain`. */
    domainName?: string;
  };
  resolvedEntityIds: string[];
  riskScore: {
    overall: number;
    level: string;
    /** Human-readable risk level (e.g. "Low", "Medium", "High", "Critical"). Derived from `level`. */
    levelLabel?: string;
    topDimensions: Array<{
      dimension: string;
      weight: number;
      contribution: number;
    }>;
  };
  /**
   * Slim snapshot of the gaming combos detected on this batch (when
   * `domain === "gaming"` and at least one combo fired). Persisted in the
   * audit log so trend / top-combo aggregations do not need to replay
   * `/assess`. Schema v5+. Older entries omit this field.
   */
  combos?: AuditLogComboSnapshot[];
  /**
   * Minimized compliance metadata for this append (schema v6+). Omitted in legacy files.
   * DP-2026-GOV-001 — does not duplicate ER/RS explanation payloads.
   */
  compliance?: ComplianceMetadata;
  assessmentSummary: string;
  recommendedActions: string[];
}

/**
 * Compressed view of a gaming combo as persisted on an audit entry.
 *
 * Only the fields needed for trend dashboards are stored — the full
 * narrative + analyst notes can always be regenerated from the source
 * `/assess` payload via the correlation id.
 */
export interface AuditLogComboSnapshot {
  /** Stable combo id (matches `gamingInsights.detectedCombos[].id`). */
  id: string;
  /** Analyst-facing combo label. */
  label: string;
  /** Number of entities in this batch that tripped the combo. */
  occurrenceCount: number;
  /** Peak per-entity synergy boost observed for this combo in the batch. */
  maxSynergy: number;
  /** Dimensions participating in the combo (canonical machine ids). */
  dimensions: string[];
}

/**
 * Stored audit row with stable identifier (append-only store).
 */
export interface AuditLogEntry extends AuditEntry {
  id: string;
}
