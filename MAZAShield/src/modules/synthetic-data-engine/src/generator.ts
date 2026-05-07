/**
 * MAZA Shield — Synthetic Data Engine
 * Core Event Generator
 */

import { randomUUID } from "crypto";
import type {
  Agent,
  CasinoEvent,
  EventType,
  GeneratorConfig,
  GeneratorManifest,
  HandOutcome,
} from "./types.js";
import {
  createSeededPrng,
  deriveChildSeed,
  sampleNormal,
  sampleLogNormal,
  sampleGamma,
  sampleHawkesNextEvent,
  encodeTimingSignal,
  sampleHandOutcome,
} from "./statistics.js";

// ---------------------------------------------------------------------------
// Agent Factory
// ---------------------------------------------------------------------------

function createDealer(
  rng: () => number,
  tableId: string,
  shiftId: string,
  collusionGroupId: string | null
): Agent {
  return {
    id: randomUUID(),
    role: "dealer",
    tableId,
    shiftId,
    collusionGroupId,
    baseline: {
      meanDealIntervalMs: sampleNormal(rng, 28_000, 4_000),
      dealTimingCV: sampleNormal(rng, 0.15, 0.03),
      shufflePenetrationThreshold: 0.5 + rng() * 0.35,
      meanBetUsd: sampleLogNormal(rng, Math.log(75), 0.8),
      betSizeLogSigma: 0.6 + rng() * 0.4,
    },
  };
}

function createPlayer(
  rng: () => number,
  tableId: string,
  shiftId: string,
  collusionGroupId: string | null
): Agent {
  return {
    id: randomUUID(),
    role: "player",
    tableId,
    shiftId,
    collusionGroupId,
    baseline: {
      meanDealIntervalMs: 0,
      dealTimingCV: 0,
      shufflePenetrationThreshold: 0,
      meanBetUsd: sampleLogNormal(rng, Math.log(100), 1.2),
      betSizeLogSigma: 0.7 + rng() * 0.5,
    },
  };
}

// ---------------------------------------------------------------------------
// Session Generator
// ---------------------------------------------------------------------------

interface SessionContext {
  dealer: Agent;
  player: Agent;
  sessionId: string;
  shoeId: string;
  config: GeneratorConfig;
  sessionRng: () => number;
  startTimeMs: number;
}

interface EventParams {
  ctx: SessionContext;
  eventType: EventType;
  timestampMs: number;
  handNumber: number;
  shoePosition: number;
  collusionSignal: number | null;
  isCollusionEvent: boolean;
  deltaFromDealStartMs?: number | null;
  betAmountUsd?: number;
  outcome?: HandOutcome;
  netPlayerPnlUsd?: number;
}

function makeEvent(p: EventParams): CasinoEvent {
  const { ctx } = p;
  return {
    eventId: randomUUID(),
    sessionId: ctx.sessionId,
    shoeId: ctx.shoeId,
    dealerId: ctx.dealer.id,
    playerId: ctx.player.id,
    tableId: ctx.dealer.tableId,
    pitBossId: null,
    timestampMs: Math.round(p.timestampMs),
    eventType: p.eventType,
    deltaFromDealStartMs: p.deltaFromDealStartMs ?? null,
    gameType: "BLACKJACK",
    shoePosition: Math.min(1, Math.max(0, p.shoePosition)),
    handNumber: p.handNumber,
    betAmountUsd: p.betAmountUsd ?? 0,
    outcome: p.outcome ?? null,
    netPlayerPnlUsd: p.netPlayerPnlUsd ?? null,
    _syntheticCollusionSignal: p.collusionSignal,
    _isCollusionEvent: p.isCollusionEvent,
    _generatorRunId: ctx.config.runId,
  };
}

function* generateShoeEvents(ctx: SessionContext): Generator<CasinoEvent> {
  const { dealer, player, sessionId, shoeId, config, sessionRng } = ctx;
  const { collusionMechanism } = config;
  const isColluding =
    dealer.collusionGroupId !== null &&
    dealer.collusionGroupId === player.collusionGroupId;

  let currentTimeMs = ctx.startTimeMs;
  let handNumber = 0;
  let shoePosition = 0;
  const dealHistory: number[] = [];

  const hawkesMu = 1 / dealer.baseline.meanDealIntervalMs;
  const hawkesAlpha = hawkesMu * 0.3;
  const hawkesBeta = 1 / 8_000;

  // SHUFFLE
  yield makeEvent({
    ctx, eventType: "SHUFFLE_START", timestampMs: currentTimeMs,
    handNumber, shoePosition: 0, collusionSignal: null, isCollusionEvent: false,
  });

  currentTimeMs += sampleNormal(sessionRng, 90_000, 15_000);

  yield makeEvent({
    ctx, eventType: "SHUFFLE_END", timestampMs: currentTimeMs,
    handNumber, shoePosition: 0, collusionSignal: null, isCollusionEvent: false,
  });

  currentTimeMs += sampleNormal(sessionRng, 5_000, 1_000);

  yield makeEvent({
    ctx, eventType: "CUT_CARD_PLACED", timestampMs: currentTimeMs,
    handNumber, shoePosition: 0, collusionSignal: null, isCollusionEvent: false,
  });

  // HAND LOOP
  while (shoePosition < dealer.baseline.shufflePenetrationThreshold) {
    handNumber++;
    shoePosition += 0.02 + sessionRng() * 0.015;

    const dealStartMs = sampleHawkesNextEvent(
      sessionRng, hawkesMu, hawkesAlpha, hawkesBeta, dealHistory, currentTimeMs
    );
    dealHistory.push(dealStartMs);
    if (dealHistory.length > 50) dealHistory.shift();
    currentTimeMs = dealStartMs;

    yield makeEvent({
      ctx, eventType: "DEAL_START", timestampMs: currentTimeMs,
      handNumber, shoePosition, collusionSignal: null, isCollusionEvent: false,
    });

    const betAmount = Math.round(
      sampleLogNormal(sessionRng, Math.log(player.baseline.meanBetUsd), player.baseline.betSizeLogSigma)
    );

    yield makeEvent({
      ctx, eventType: "PLAYER_BET_PLACED",
      timestampMs: currentTimeMs + sampleNormal(sessionRng, 3_000, 500),
      handNumber, shoePosition, betAmountUsd: betAmount,
      collusionSignal: null, isCollusionEvent: false,
    });

    // COVERT CHANNEL
    let collusionSignal: number | null = null;
    let holeCardDeltaMs: number;
    let isCollusionEvent = false;

    if (isColluding && sessionRng() < collusionMechanism.injectionRate) {
      collusionSignal = Math.floor(sessionRng() * Math.pow(2, collusionMechanism.bitsPerHand));
      isCollusionEvent = true;
      holeCardDeltaMs = encodeTimingSignal(
        sessionRng, collusionSignal,
        collusionMechanism.baseIntervalMs, collusionMechanism.quantumMs,
        collusionMechanism.noiseStdDevMs, collusionMechanism.bitsPerHand
      );
    } else {
      holeCardDeltaMs = sampleNormal(
        sessionRng,
        collusionMechanism.baseIntervalMs,
        collusionMechanism.baseIntervalMs * dealer.baseline.dealTimingCV
      );
    }

    const holeCardTimeMs = currentTimeMs + holeCardDeltaMs;

    yield makeEvent({
      ctx, eventType: "HOLE_CARD_PEEK", timestampMs: holeCardTimeMs,
      deltaFromDealStartMs: holeCardDeltaMs,
      handNumber, shoePosition, collusionSignal, isCollusionEvent,
    });

    // BET MODIFICATION
    if (isCollusionEvent && collusionSignal !== null) {
      if (sessionRng() < 0.6) {
        const isHighSignal = collusionSignal >= Math.pow(2, collusionMechanism.bitsPerHand - 1);
        const modifiedBet = isHighSignal
          ? Math.max(5, betAmount * (0.1 + sessionRng() * 0.3))
          : betAmount * (2 + sessionRng() * 3);

        yield makeEvent({
          ctx, eventType: "PLAYER_BET_MODIFIED",
          timestampMs: holeCardTimeMs + sampleNormal(sessionRng, 4_000, 800),
          handNumber, shoePosition, betAmountUsd: Math.round(modifiedBet),
          collusionSignal, isCollusionEvent: true,
        });
      }
    }

    // OUTCOME
    const { outcome, netPnlMultiplier } = sampleHandOutcome(
      sessionRng, isColluding, collusionSignal, "BLACKJACK"
    );
    const outcomeTimeMs = currentTimeMs + sampleNormal(sessionRng, 45_000, 8_000);

    yield makeEvent({
      ctx, eventType: "HAND_OUTCOME", timestampMs: outcomeTimeMs,
      deltaFromDealStartMs: outcomeTimeMs - currentTimeMs,
      handNumber, shoePosition, betAmountUsd: betAmount,
      outcome: outcome as HandOutcome,
      netPlayerPnlUsd: Math.round(betAmount * netPnlMultiplier * 100) / 100,
      collusionSignal, isCollusionEvent,
    });

    // TOKE
    const tokeProb = isColluding && outcome === "WIN" ? 0.65 : 0.15;
    if (outcome === "WIN" && sessionRng() < tokeProb) {
      const tokeAmount = isColluding
        ? sampleNormal(sessionRng, 15, 5)
        : sampleNormal(sessionRng, 8, 4);
      yield makeEvent({
        ctx, eventType: "TOKE",
        timestampMs: outcomeTimeMs + sampleNormal(sessionRng, 8_000, 2_000),
        handNumber, shoePosition,
        betAmountUsd: Math.max(1, Math.round(tokeAmount)),
        collusionSignal: null, isCollusionEvent: false,
      });
    }

    currentTimeMs = outcomeTimeMs + sampleNormal(sessionRng, 5_000, 1_000);
  }
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------

export async function* generateEventBatches(
    config: GeneratorConfig,
    batchSize: number = 10_000
  ): AsyncGenerator<CasinoEvent[]> {
    const rootRng = createSeededPrng(config.seed);
    let totalEvents = 0;
    let batch: CasinoEvent[] = [];
  
    const collusionGroupCount = Math.floor(config.tableCount * config.collusionPrevalence);
    const collusionGroupIds = Array.from({ length: collusionGroupCount }, () => randomUUID());
  
    const simulationStartMs = new Date("2024-01-15T00:00:00Z").getTime();
    let wallClockMs = simulationStartMs;
  
    // Outer loop: keep cycling through tables until we hit the target
    let cycleIdx = 0;
    while (totalEvents < config.targetEventCount) {
      const tableIdx = cycleIdx % config.tableCount;
      cycleIdx++;
  
      const tableId = `TABLE-${tableIdx.toString().padStart(3, "0")}`;
      const shiftId = `SHIFT-${Math.floor(tableIdx / 10)}`;
      // Use cycleIdx in seed so each cycle produces different data
      const tableRng = createSeededPrng(deriveChildSeed(config.seed + cycleIdx, tableId));
      const collusionGroupId = tableIdx < collusionGroupCount ? collusionGroupIds[tableIdx] : null;
  
      const dealer = createDealer(tableRng, tableId, shiftId, collusionGroupId);
      const playerCount =
        config.playersPerTable.min +
        Math.floor(tableRng() * (config.playersPerTable.max - config.playersPerTable.min + 1));
  
      for (let pIdx = 0; pIdx < playerCount; pIdx++) {
        if (totalEvents >= config.targetEventCount) break;
  
        const playerCollusionId = pIdx === 0 ? collusionGroupId : null;
        const player = createPlayer(tableRng, tableId, shiftId, playerCollusionId);
        const sessionRng = createSeededPrng(
          deriveChildSeed(config.seed + cycleIdx, `${tableId}::${player.id}`)
        );
  
        const ctx: SessionContext = {
          dealer, player,
          sessionId: randomUUID(),
          shoeId: randomUUID(),
          config, sessionRng,
          startTimeMs: wallClockMs + Math.floor(tableRng() * 3_600_000),
        };
  
        for (const event of generateShoeEvents(ctx)) {
          batch.push(event);
          totalEvents++;
          if (batch.length >= batchSize) {
            yield batch;
            batch = [];
          }
          if (totalEvents >= config.targetEventCount) break;
        }
      }
  
      wallClockMs += sampleGamma(rootRng, 2, 1 / 14_400_000);
    }
  
    if (batch.length > 0) yield batch;
  }
export function buildManifest(
  config: GeneratorConfig,
  stats: {
    totalEvents: number;
    totalHands: number;
    totalSessions: number;
    collusionEventCount: number;
    parquetFiles: string[];
    durationMs: number;
  }
): GeneratorManifest {
  return {
    runId: config.runId,
    generatedAt: new Date().toISOString(),
    config,
    stats: {
      ...stats,
      collusionPrevalenceActual: stats.collusionEventCount / stats.totalEvents,
    },
    schemaVersion: "1.0.0",
  };
}