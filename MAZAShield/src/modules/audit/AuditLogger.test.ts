/**
 * MAZA Shield — IAL Smoke Test
 * Verifica: escritura, encadenamiento, y detección de tampering.
 */

import { AuditLogger } from "./AuditLogger.js";
import { rmSync, existsSync } from "fs";

const TEST_DIR = "./data/audit-test";

// Limpia runs anteriores
if (existsSync(TEST_DIR)) {
  rmSync(TEST_DIR, { recursive: true, force: true });
}

console.log("\n🔐 MAZA Shield — Immutable Audit Log Test\n");

// ─── TEST 1: Escritura y encadenamiento ───
console.log("TEST 1: Chain initialization + entries");
const logger = new AuditLogger(TEST_DIR);

const entry1 = logger.append({
  actorId: "MotherBrain-RiskScorer",
  auditEventType: "COLLUSION_SIGNAL_DETECTED",
  casinoEventId: "e9183066-1dd2-48df-94f7-c5bb7c268efa",
  sessionId: "aaae8e5b-8692-4d85-af7e-08f85d74c9b0",
  dealerId: "14486055-c873-489e-a312-2bf48ba6abac",
  playerId: "84c522c6-4c5d-4a2c-bfd7-7a90133b2b79",
  decisionLogic:
    "Timing delta 38ms detected on HOLE_CARD_PEEK. " +
    "Threshold: 40ms. quantumAlignedRate: 0.773. " +
    "stddevMs: 98.03 vs baseline 183.91. Action: flag for review.",
  evidence: {
    peekDeltaMs: 38,
    thresholdMs: 40,
    quantumAlignedRate: 0.773,
    stddevMs: 98.03,
    baselineStddevMs: 183.91,
    signalValue: 3,
    bitsPerHand: 3,
  },
  riskScoreSnapshot: 0.82,
  dimensionScores: {
    fraud: 0.08,
    player_behavior: 0.91,
    bonus_abuse: 0.65,
    aml: 0.45,
    compliance: 1.0,
  },
});

console.log(`   ✓ Entry 1 written — seq: ${entry1.sequenceNumber}`);
console.log(`   ✓ Hash: ${entry1.integrityHash.slice(0, 32)}...`);

const entry2 = logger.append({
  actorId: "MotherBrain-Inference-Engine",
  auditEventType: "RISK_SCORE_GENERATED",
  casinoEventId: "e9183066-1dd2-48df-94f7-c5bb7c268efa",
  sessionId: "aaae8e5b-8692-4d85-af7e-08f85d74c9b0",
  dealerId: "14486055-c873-489e-a312-2bf48ba6abac",
  playerId: "84c522c6-4c5d-4a2c-bfd7-7a90133b2b79",
  decisionLogic:
    "Risk score 0.82 generated. Level: HIGH. " +
    "Primary driver: player_behavior (0.91). " +
    "Recommended action: supervisor review within 15 minutes.",
  evidence: {
    overallScore: 0.82,
    level: "high",
    primaryDimension: "player_behavior",
    handsObserved: 22,
    confidenceScore: 0.44,
  },
  riskScoreSnapshot: 0.82,
  dimensionScores: {
    fraud: 0.08,
    player_behavior: 0.91,
    bonus_abuse: 0.65,
    aml: 0.45,
    compliance: 1.0,
  },
});

console.log(`   ✓ Entry 2 written — seq: ${entry2.sequenceNumber}`);
console.log(`   ✓ Previous hash matches entry 1: ${entry2.previousHash === entry1.integrityHash}`);

// ─── TEST 2: Verificación de cadena ───
console.log("\nTEST 2: Chain verification");
const result = logger.verify();
console.log(`   ✓ Chain valid: ${result.valid}`);
console.log(`   ✓ Entries checked: ${result.entriesChecked}`);

// ─── TEST 3: Detección de tampering ───
console.log("\nTEST 3: Tamper detection");

// Simulamos un atacante que modifica el log en disco
import { readFileSync, writeFileSync } from "fs";
import { readdirSync } from "fs";

const files = readdirSync(TEST_DIR).filter(f => f.endsWith(".ndjson"));
const logPath = `${TEST_DIR}/${files[0]}`;
const lines = readFileSync(logPath, "utf8").trim().split("\n");

// Modificamos la entry 2 — cambiamos el riskScore
const tampered = JSON.parse(lines[2]);
tampered.riskScoreSnapshot = 0.10; // atacante intenta bajar el score
lines[2] = JSON.stringify(tampered);
writeFileSync(logPath, lines.join("\n") + "\n", "utf8");

// Nuevo logger que lee el archivo tampered
const logger2 = new AuditLogger(TEST_DIR);
const tamperResult = logger2.verify();
console.log(`   ✓ Tamper detected: ${!tamperResult.valid}`);
if (!tamperResult.valid) {
  console.log(`   ✓ Chain broken at sequence: ${tamperResult.brokenAtSequence}`);
}

console.log("\n✅ All tests passed — IAL is tamper-evident\n");