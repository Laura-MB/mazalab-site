/**
 * MAZA Shield — Synthetic Data Engine
 * Statistical Primitives
 */

import { createHash } from "crypto";

// ---------------------------------------------------------------------------
// Seeded PRNG
// ---------------------------------------------------------------------------

export function createSeededPrng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function deriveChildSeed(parentSeed: number, key: string): number {
  const hash = createHash("sha256")
    .update(`${parentSeed}::${key}`)
    .digest("hex");
  return parseInt(hash.slice(0, 8), 16);
}

// ---------------------------------------------------------------------------
// Core Statistical Transforms
// ---------------------------------------------------------------------------

export function boxMuller(u1: number, u2: number): [number, number] {
  const r = Math.sqrt(-2 * Math.log(u1));
  const theta = 2 * Math.PI * u2;
  return [r * Math.cos(theta), r * Math.sin(theta)];
}

export function sampleNormal(
  rng: () => number,
  mean: number,
  stdDev: number
): number {
  const [z] = boxMuller(Math.max(rng(), 1e-10), rng());
  return mean + stdDev * z;
}

export function sampleLogNormal(
  rng: () => number,
  meanLog: number,
  sigmaLog: number
): number {
  const [z] = boxMuller(Math.max(rng(), 1e-10), rng());
  return Math.exp(meanLog + sigmaLog * z);
}

export function sampleGamma(
  rng: () => number,
  shape: number,
  rate: number
): number {
  if (shape < 1) {
    return sampleGamma(rng, shape + 1, rate) * Math.pow(rng(), 1 / shape);
  }
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  while (true) {
    let x: number, v: number;
    do {
      const [z] = boxMuller(Math.max(rng(), 1e-10), rng());
      x = z;
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = rng();
    const xSq = x * x;
    if (u < 1 - 0.0331 * xSq * xSq) return (d * v) / rate;
    if (Math.log(u) < 0.5 * xSq + d * (1 - v + Math.log(v))) {
      return (d * v) / rate;
    }
  }
}

// ---------------------------------------------------------------------------
// Hawkes Process
// ---------------------------------------------------------------------------

export function hawkesIntensity(
  mu: number,
  alpha: number,
  beta: number,
  history: number[],
  t: number
): number {
  const excitation = history.reduce((sum, ti) => {
    return ti < t ? sum + alpha * Math.exp(-beta * (t - ti)) : sum;
  }, 0);
  return mu + excitation;
}

export function sampleHawkesNextEvent(
  rng: () => number,
  mu: number,
  alpha: number,
  beta: number,
  history: number[],
  currentTime: number,
  maxSearchMs: number = 120_000
): number {
  let t = currentTime;
  const lambdaUpper = hawkesIntensity(mu, alpha, beta, history, t) + mu;

  while (true) {
    const u1 = Math.max(rng(), 1e-10);
    const candidate = t + -Math.log(u1) / lambdaUpper;

    if (candidate - currentTime > maxSearchMs) {
      return currentTime + sampleGamma(rng, 2, 1 / 28_000);
    }

    const lambdaCandidate = hawkesIntensity(mu, alpha, beta, history, candidate);
    const u2 = rng();
    if (u2 <= lambdaCandidate / lambdaUpper) {
      return candidate;
    }
    t = candidate;
  }
}

// ---------------------------------------------------------------------------
// Covert Channel Encoding
// ---------------------------------------------------------------------------

export function encodeTimingSignal(
  rng: () => number,
  signalValue: number,
  baseMs: number,
  quantumMs: number,
  noiseStdDev: number,
  bitsPerHand: number
): number {
  const maxSymbol = Math.pow(2, bitsPerHand) - 1;
  const clampedSignal = Math.max(0, Math.min(signalValue, maxSymbol));
  const quantizedInterval = baseMs + clampedSignal * quantumMs;
  const [z] = boxMuller(Math.max(rng(), 1e-10), rng());
  const noisyInterval = quantizedInterval + noiseStdDev * z;
  return Math.max(noisyInterval, baseMs * 0.1);
}

export function decodeTimingSignal(
  observedIntervalMs: number,
  baseMs: number,
  quantumMs: number,
  bitsPerHand: number
): number {
  const maxSymbol = Math.pow(2, bitsPerHand) - 1;
  const offset = observedIntervalMs - baseMs;
  const decoded = Math.round(offset / quantumMs);
  return Math.max(0, Math.min(decoded, maxSymbol));
}

// ---------------------------------------------------------------------------
// Casino-Specific Distributions
// ---------------------------------------------------------------------------

export function sampleHandOutcome(
  rng: () => number,
  isColluding: boolean,
  collusionSignal: number | null,
  gameType: "BLACKJACK" | "BACCARAT" | "THREE_CARD_POKER"
): { outcome: string; netPnlMultiplier: number } {
  const baseProbs =
    gameType === "BLACKJACK"
      ? { WIN: 0.425, LOSS: 0.49, PUSH: 0.075 }
      : gameType === "BACCARAT"
      ? { WIN: 0.4462, LOSS: 0.4586, PUSH: 0.0952 }
      : { WIN: 0.32, LOSS: 0.655, PUSH: 0.025 };

  if (isColluding && collusionSignal !== null) {
    const edgeBoost = collusionSignal >= 4 ? 0.12 : -0.08;
    const adjustedWinProb = Math.min(
      0.95,
      Math.max(0.05, baseProbs.WIN + edgeBoost)
    );
    const r = rng();
    if (r < adjustedWinProb) return { outcome: "WIN", netPnlMultiplier: 1.0 };
    if (r < adjustedWinProb + baseProbs.PUSH) return { outcome: "PUSH", netPnlMultiplier: 0 };
    return { outcome: "LOSS", netPnlMultiplier: -1.0 };
  }

  const r = rng();
  if (r < baseProbs.WIN) return { outcome: "WIN", netPnlMultiplier: 1.0 };
  if (r < baseProbs.WIN + baseProbs.PUSH) return { outcome: "PUSH", netPnlMultiplier: 0 };
  return { outcome: "LOSS", netPnlMultiplier: -1.0 };
}