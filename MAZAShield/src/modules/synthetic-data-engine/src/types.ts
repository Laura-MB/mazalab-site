/**
 * MAZA Shield — Synthetic Data Engine
 * Core Type Definitions
 */

export type AgentRole = "dealer" | "player" | "pit_boss" | "surveillance";

export interface Agent {
  id: string;
  role: AgentRole;
  tableId: string;
  shiftId: string;
  baseline: AgentBaseline;
  collusionGroupId: string | null;
}

export interface AgentBaseline {
  meanDealIntervalMs: number;
  dealTimingCV: number;
  shufflePenetrationThreshold: number;
  meanBetUsd: number;
  betSizeLogSigma: number;
}

export type EventType =
  | "SHUFFLE_START"
  | "SHUFFLE_END"
  | "CUT_CARD_PLACED"
  | "DEAL_START"
  | "HOLE_CARD_PEEK"
  | "PLAYER_BET_PLACED"
  | "PLAYER_BET_MODIFIED"
  | "HAND_OUTCOME"
  | "TOKE"
  | "FILL_REQUEST"
  | "VOID_TRANSACTION";

export type HandOutcome = "WIN" | "LOSS" | "PUSH" | "BLACKJACK" | "BUST" | "SURRENDER";

export interface CasinoEvent {
  eventId: string;
  sessionId: string;
  shoeId: string;
  dealerId: string;
  playerId: string;
  tableId: string;
  pitBossId: string | null;
  timestampMs: number;
  eventType: EventType;
  deltaFromDealStartMs: number | null;
  gameType: "BLACKJACK" | "BACCARAT" | "THREE_CARD_POKER";
  shoePosition: number;
  handNumber: number;
  betAmountUsd: number;
  outcome: HandOutcome | null;
  netPlayerPnlUsd: number | null;
  _syntheticCollusionSignal: number | null;
  _isCollusionEvent: boolean;
  _generatorRunId: string;
}

export interface CollusionMechanism {
  type: "TIMING_CHANNEL" | "BET_MODULATION" | "TOKE_PATTERN" | "COMPOSITE";
  baseIntervalMs: number;
  quantumMs: number;
  bitsPerHand: number;
  noiseStdDevMs: number;
  injectionRate: number;
}

export interface GeneratorConfig {
  runId: string;
  seed: number;
  outputDir: string;
  targetEventCount: number;
  eventsPerParquetFile: number;
  tableCount: number;
  dealersPerTable: number;
  playersPerTable: { min: number; max: number };
  sessionDurationMinutes: { min: number; max: number };
  peakHourMultiplier: number;
  collusionPrevalence: number;
  collusionMechanism: CollusionMechanism;
  falsePositiveNoiserate: number;
}

export interface GeneratorManifest {
  runId: string;
  generatedAt: string;
  config: GeneratorConfig;
  stats: {
    totalEvents: number;
    totalHands: number;
    totalSessions: number;
    collusionEventCount: number;
    collusionPrevalenceActual: number;
    parquetFiles: string[];
    durationMs: number;
  };
  schemaVersion: string;
}