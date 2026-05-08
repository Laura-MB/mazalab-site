/**
 * MAZA Shield — Feature Engineering Pipeline
 * Converts CasinoEvent[] → Entity[] compatible with src/types/index.ts
 *
 * Output: dual format
 *   - NDJSON for immediate backend consumption (POST /assess-risk)
 *   - JSONL for DemoModal WebSocket stream
 *
 * @module synthetic-data-engine/feature-engineering
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { randomUUID } from "crypto";
import type { CasinoEvent } from "./types.js";
import type {
  Entity,
  RiskScoreComponent,
  SourceReference,
  ConfidenceMetrics,
} from "../../../types/index.js";

// ---------------------------------------------------------------------------
// Session Aggregator — groups raw events by dealer-player pair
// ---------------------------------------------------------------------------

interface SessionAggregate {
  dealerId: string;
  playerId: string;
  tableId: string;
  sessionId: string;
  events: CasinoEvent[];
  // Computed features
  peekDeltas: number[];
  betAmounts: number[];
  modifiedBets: number[];
  tokes: number[];
  wins: number;
  losses: number;
  pushes: number;
  collusionEventCount: number;
  totalHands: number;
  firstSeenAt: number;
  lastSeenAt: number;
}

function aggregateBySessions(events: CasinoEvent[]): Map<string, SessionAggregate> {
  const sessions = new Map<string, SessionAggregate>();

  for (const event of events) {
    const key = event.sessionId;

    if (!sessions.has(key)) {
      sessions.set(key, {
        dealerId: event.dealerId,
        playerId: event.playerId,
        tableId: event.tableId,
        sessionId: event.sessionId,
        events: [],
        peekDeltas: [],
        betAmounts: [],
        modifiedBets: [],
        tokes: [],
        wins: 0,
        losses: 0,
        pushes: 0,
        collusionEventCount: 0,
        totalHands: 0,
        firstSeenAt: event.timestampMs,
        lastSeenAt: event.timestampMs,
      });
    }

    const session = sessions.get(key)!;
    session.events.push(event);
    session.firstSeenAt = Math.min(session.firstSeenAt, event.timestampMs);
    session.lastSeenAt = Math.max(session.lastSeenAt, event.timestampMs);

    if (event._isCollusionEvent) session.collusionEventCount++;

    switch (event.eventType) {
      case "HOLE_CARD_PEEK":
        if (event.deltaFromDealStartMs !== null) {
          session.peekDeltas.push(event.deltaFromDealStartMs);
        }
        break;
      case "PLAYER_BET_PLACED":
        session.betAmounts.push(event.betAmountUsd);
        break;
      case "PLAYER_BET_MODIFIED":
        session.modifiedBets.push(event.betAmountUsd);
        break;
      case "TOKE":
        session.tokes.push(event.betAmountUsd);
        break;
      case "HAND_OUTCOME":
        session.totalHands++;
        if (event.outcome === "WIN") session.wins++;
        else if (event.outcome === "LOSS") session.losses++;
        else if (event.outcome === "PUSH") session.pushes++;
        break;
    }
  }

  return sessions;
}

// ---------------------------------------------------------------------------
// Statistical Helpers
// ---------------------------------------------------------------------------

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stddev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((a, b) => a + (b - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

function zScore(value: number, mu: number, sigma: number): number {
  if (sigma === 0) return 0;
  return (value - mu) / sigma;
}

/**
 * Autocorrelation at lag 1 — detects periodic patterns in timing.
 * High autocorrelation = regular intervals = covert channel signature.
 */
function autocorrelationLag1(arr: number[]): number {
  if (arr.length < 3) return 0;
  const m = mean(arr);
  const numerator = arr.slice(0, -1).reduce((sum, val, i) => {
    return sum + (val - m) * (arr[i + 1] - m);
  }, 0);
  const denominator = arr.reduce((sum, val) => sum + (val - m) ** 2, 0);
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Count intervals that fall near a 38ms quantum boundary.
 * This is the direct covert channel signal count.
 */
function countQuantumAlignedIntervals(
  deltas: number[],
  baseMs: number,
  quantumMs: number,
  toleranceMs: number = 15
): number {
  return deltas.filter((d) => {
    const offset = d - baseMs;
    const remainder = Math.abs(offset % quantumMs);
    return remainder < toleranceMs || remainder > quantumMs - toleranceMs;
  }).length;
}

// ---------------------------------------------------------------------------
// Risk Score Computation
// ---------------------------------------------------------------------------

interface RiskScores {
  fraud: number;
  player_behavior: number;
  bonus_abuse: number;
  aml: number;
  responsible_gaming: number;
  compliance: number;
}

function computeRiskScores(agg: SessionAggregate): RiskScores {
  const peekStddev = stddev(agg.peekDeltas);
  const peekMean = mean(agg.peekDeltas);

  // fraud: anomalous win rate
  const winRate = agg.totalHands > 0 ? agg.wins / agg.totalHands : 0;
  const expectedWinRate = 0.425;
  const winRateZScore = Math.abs(zScore(winRate, expectedWinRate, 0.05));
  const fraud = Math.min(1, winRateZScore / 4);

  // player_behavior: timing regularity (low stddev = suspicious)
  // Normal stddev ~183ms, colluding ~98ms
  const timingScore = peekStddev < 130
    ? Math.min(1, (130 - peekStddev) / 130)
    : 0;

  // Autocorrelation boost
  const autocorr = autocorrelationLag1(agg.peekDeltas);
  const player_behavior = Math.min(1, timingScore * 0.7 + Math.max(0, autocorr) * 0.3);

  // bonus_abuse: bet modification rate and magnitude
  const modRate = agg.totalHands > 0 ? agg.modifiedBets.length / agg.totalHands : 0;
  const avgModBet = mean(agg.modifiedBets);
  const avgBet = mean(agg.betAmounts);
  const betRatio = avgBet > 0 ? avgModBet / avgBet : 0;
  const bonus_abuse = Math.min(1, modRate * 2 + Math.max(0, betRatio - 2) * 0.1);

  // aml: toke pattern (consistent high tokes = relationship signal)
  const tokeRate = agg.totalHands > 0 ? agg.tokes.length / agg.wins : 0;
  const avgToke = mean(agg.tokes);
  const aml = Math.min(1, tokeRate * 0.5 + (avgToke > 12 ? 0.3 : 0));

  // responsible_gaming: session duration anomaly
  const sessionDurationMin = (agg.lastSeenAt - agg.firstSeenAt) / 60_000;
  const responsible_gaming = Math.min(1, sessionDurationMin > 180 ? 0.4 : 0.1);

  // compliance: quantum-aligned intervals
  const quantumCount = countQuantumAlignedIntervals(agg.peekDeltas, 1200, 38);
  const quantumRate = agg.peekDeltas.length > 0
    ? quantumCount / agg.peekDeltas.length
    : 0;
  const compliance = Math.min(1, quantumRate * 1.5);

  return { fraud, player_behavior, bonus_abuse, aml, responsible_gaming, compliance };
}

// ---------------------------------------------------------------------------
// Entity Builder — maps SessionAggregate → Entity (src/types/index.ts)
// ---------------------------------------------------------------------------

const SOURCE_REF: SourceReference = {
  sourceId: "synthetic-data-engine-v1",
  sourceName: "MAZA Shield Synthetic Data Engine",
  sourceType: "internal",
  collectedAt: new Date().toISOString(),
  confidence: 1.0,
};

function buildEntity(agg: SessionAggregate): Entity {
  const scores = computeRiskScores(agg);
  const peekMean = mean(agg.peekDeltas);
  const peekStddev = stddev(agg.peekDeltas);
  const autocorr = autocorrelationLag1(agg.peekDeltas);
  const quantumCount = countQuantumAlignedIntervals(agg.peekDeltas, 1200, 38);
  const winRate = agg.totalHands > 0 ? agg.wins / agg.totalHands : 0;
  const modRate = agg.totalHands > 0 ? agg.modifiedBets.length / agg.totalHands : 0;

  // Overall risk: weighted composite
  const overall = Math.min(1,
    scores.fraud * 0.25 +
    scores.player_behavior * 0.35 +
    scores.bonus_abuse * 0.20 +
    scores.aml * 0.10 +
    scores.compliance * 0.10
  );

  const confidence: ConfidenceMetrics = {
    score: Math.min(1, agg.totalHands / 50), // more hands = more confident
    methodology: "hawkes-coupled-simulation",
    rationale: `${agg.totalHands} hands observed, ${agg.peekDeltas.length} peek timing samples`,
    lastUpdatedAt: new Date(agg.lastSeenAt).toISOString(),
  };

  return {
    id: `${agg.dealerId}::${agg.playerId}::${agg.sessionId}`,
    type: "event",
    displayName: `Dealer-Player Session [${agg.tableId}]`,
    aliases: [agg.dealerId, agg.playerId, agg.sessionId],
    attributes: {
      // Timing channel features
      peekMeanMs: Math.round(peekMean * 100) / 100,
      peekStddevMs: Math.round(peekStddev * 100) / 100,
      peekAutocorrLag1: Math.round(autocorr * 1000) / 1000,
      quantumAlignedCount: quantumCount,
      quantumAlignedRate: Math.round((quantumCount / Math.max(1, agg.peekDeltas.length)) * 1000) / 1000,

      // Behavior features
      winRate: Math.round(winRate * 1000) / 1000,
      totalHands: agg.totalHands,
      betModificationRate: Math.round(modRate * 1000) / 1000,
      avgTokeUsd: Math.round(mean(agg.tokes) * 100) / 100,
      tokeCount: agg.tokes.length,

      // Risk scores (pre-computed for demo speed)
      riskFraud: Math.round(scores.fraud * 1000) / 1000,
      riskPlayerBehavior: Math.round(scores.player_behavior * 1000) / 1000,
      riskBonusAbuse: Math.round(scores.bonus_abuse * 1000) / 1000,
      riskAml: Math.round(scores.aml * 1000) / 1000,
      riskCompliance: Math.round(scores.compliance * 1000) / 1000,
      riskOverall: Math.round(overall * 1000) / 1000,

      // Ground truth (strip before production inference)
      _isColluding: agg.collusionEventCount > 0,
      _collusionEventCount: agg.collusionEventCount,
      _generatorRunId: agg.events[0]?._generatorRunId ?? "",
    },
    tags: [
      "synthetic",
      "casino-floor",
      "blackjack",
      agg.collusionEventCount > 0 ? "collusion-labeled" : "clean",
      overall > 0.7 ? "high-risk" : overall > 0.4 ? "medium-risk" : "low-risk",
    ],
    jurisdiction: "NV",
    sources: [SOURCE_REF],
    confidence,
    firstSeenAt: new Date(agg.firstSeenAt).toISOString(),
    lastSeenAt: new Date(agg.lastSeenAt).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Main Export — reads NDJSON, writes Entity NDJSON + JSONL
// ---------------------------------------------------------------------------

export async function extractFeatures(
  inputDir: string,
  outputDir: string
): Promise<{ entityCount: number; collusionCount: number }> {
  mkdirSync(outputDir, { recursive: true });

  // Read all NDJSON files in the input directory
  const { readdirSync } = await import("fs");
  const files = readdirSync(inputDir).filter((f) => f.endsWith(".ndjson") && f.startsWith("events_"));

  console.log(`   Reading ${files.length} event files from ${inputDir}`);

  const allEvents: CasinoEvent[] = [];
  for (const file of files) {
    const content = readFileSync(join(inputDir, file), "utf8");
    const lines = content.trim().split("\n").filter(Boolean);
    for (const line of lines) {
      allEvents.push(JSON.parse(line) as CasinoEvent);
    }
  }

  console.log(`   Loaded ${allEvents.length.toLocaleString()} events`);

  // Aggregate by session
  const sessions = aggregateBySessions(allEvents);
  console.log(`   Aggregated into ${sessions.size.toLocaleString()} sessions`);

  // Build entities
  const entities: Entity[] = [];
  for (const agg of sessions.values()) {
    if (agg.totalHands < 3) continue; // skip micro-sessions
    entities.push(buildEntity(agg));
  }

  const collusionCount = entities.filter(
    (e) => e.attributes._isColluding === true
  ).length;

  // Write NDJSON — for POST /assess-risk
  const ndjsonPath = join(outputDir, "entities.ndjson");
  writeFileSync(
    ndjsonPath,
    entities.map((e) => JSON.stringify(e)).join("\n") + "\n",
    "utf8"
  );

  // Write JSONL batches — for WebSocket stream (DemoModal)
  // Sorted by overall risk descending — highest risk surfaces first in demo
  const sorted = [...entities].sort((a, b) => {
    const ra = (a.attributes.riskOverall as number) ?? 0;
    const rb = (b.attributes.riskOverall as number) ?? 0;
    return rb - ra;
  });

  const jsonlPath = join(outputDir, "entities.jsonl");
  writeFileSync(
    jsonlPath,
    sorted.map((e) => JSON.stringify(e)).join("\n") + "\n",
    "utf8"
  );

  console.log(`\n✅ Feature extraction complete`);
  console.log(`   Entities:  ${entities.length.toLocaleString()}`);
  console.log(`   Collusion: ${collusionCount.toLocaleString()} (${(collusionCount / entities.length * 100).toFixed(2)}%)`);
  console.log(`   NDJSON:    ${ndjsonPath}`);
  console.log(`   JSONL:     ${jsonlPath}`);

  return { entityCount: entities.length, collusionCount };
}

// ---------------------------------------------------------------------------
// CLI — run directly
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const datasetId = args[0];

  if (!datasetId) {
    console.error("Usage: npx tsx feature-engineering.ts <dataset-run-id>");
    console.error("Example: npx tsx feature-engineering.ts 6f090203-ca07-4622-a710-9b4f2b8a4cea");
    process.exit(1);
  }

  const inputDir = join("data", "synthetic", datasetId);
  const outputDir = join("data", "features", datasetId);

  console.log(`\n🧠 MAZA Shield — Feature Engineering`);
  console.log(`   Dataset: ${datasetId}`);

  await extractFeatures(inputDir, outputDir);
}

main().catch((err) => {
  console.error("\n❌ Error:", err);
  process.exit(1);
});