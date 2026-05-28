// ============================================================
// MAZALab / MAZA Shield — Core Type Definitions
// src/types/index.ts
// Lead Architect: Laura Maza
// Last updated: 2026-05-13
// ============================================================

export enum CasinoEventType {
  DEAL_START         = 'DEAL_START',
  HOLE_CARD_PEEK     = 'HOLE_CARD_PEEK',
  BET_PLACEMENT      = 'BET_PLACEMENT',
  CARD_REQUEST       = 'CARD_REQUEST',
  OUTCOME_SETTLEMENT = 'OUTCOME_SETTLEMENT',
}

export enum RiskLevel {
  NONE     = 'NONE',
  LOW      = 'LOW',
  MEDIUM   = 'MEDIUM',
  HIGH     = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface CasinoEvent {
  eventId:     string;
  eventType:   CasinoEventType;
  timestampMs: number;
  tableId:     string;
  sessionId:   string;
  dealerId:    string;
  playerId?:   string;
  metadata?:   Record<string, unknown>;
}

export interface SessionContext {
  sessionId:      string;
  tableId:        string;
  dealerId:       string;
  playerId:       string;
  sessionStartMs: number;
  roundNumber:    number;
}

export interface RiskScore {
  sessionId:   string;
  tableId:     string;
  riskLevel:   RiskLevel;
  score:       number;
  computedAtMs:number;
}

export interface AuditRecord {
  recordId:       string;
  sessionContext: SessionContext;
  riskScore:      RiskScore;
  sha256Hash:     string;
  sealedAtMs:     number;
  modelVersion:   string;
}

export interface HawkesInferenceContext extends SessionContext {
  dealToHoleCardIntervalMs:   number;
  betPlacementLagMs:          number;
  couplingCoefficientAlphaDP: number;
  inferenceWindowRounds:      number;
  logLikelihoodRatioScore:    number;
}
