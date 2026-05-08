/**
 * MAZA Shield — Synthetic Data Engine
 * CLI Entrypoint
 *
 * Usage:
 *   npx tsx src/cli.ts --events 1000000 --tables 20 --collusion 0.10 --seed 42
 */

import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { parseArgs } from "util";
import { generateEventBatches, buildManifest } from "./generator.js";
import type { GeneratorConfig } from "./types.js";

async function writeBatch(events: object[], outputPath: string): Promise<void> {
  const lines = events.map((e) => JSON.stringify(e)).join("\n");
  await writeFile(outputPath, lines + "\n", { encoding: "utf8" });
}

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      events:    { type: "string", default: "100000" },
      tables:    { type: "string", default: "20" },
      collusion: { type: "string", default: "0.065" },
      seed:      { type: "string", default: "42" },
      outdir:    { type: "string", default: "./data/synthetic" },
      batchsize: { type: "string", default: "10000" },
    },
  });

  const runId          = randomUUID();
  const targetEvents   = parseInt(values.events!, 10);
  const tableCount     = parseInt(values.tables!, 10);
  const collusionRate  = parseFloat(values.collusion!);
  const seed           = parseInt(values.seed!, 10);
  const batchSize      = parseInt(values.batchsize!, 10);
  const outputDir      = join(values.outdir!, runId);

  const config: GeneratorConfig = {
    runId,
    seed,
    outputDir,
    targetEventCount:    targetEvents,
    eventsPerParquetFile: batchSize,
    tableCount,
    dealersPerTable: 1,
    playersPerTable: { min: 1, max: 5 },
    sessionDurationMinutes: { min: 30, max: 240 },
    peakHourMultiplier: 1.8,
    collusionPrevalence: collusionRate,
    collusionMechanism: {
      type: "TIMING_CHANNEL",
      baseIntervalMs:  1_200,
      quantumMs:       38,
      bitsPerHand:     3,
      noiseStdDevMs:   45,
      injectionRate:   0.35,
    },
    falsePositiveNoiserate: 0.02,
  };

  console.log(`\n🧠 MAZA Shield — Synthetic Data Engine`);
  console.log(`   Run ID:    ${runId}`);
  console.log(`   Target:    ${targetEvents.toLocaleString()} events`);
  console.log(`   Tables:    ${tableCount} | Collusion: ${(collusionRate * 100).toFixed(1)}%`);
  console.log(`   Seed:      ${seed}\n`);

  await mkdir(outputDir, { recursive: true });

  const startMs = Date.now();
  let fileIndex = 0;
  let totalEvents = 0;
  let collusionEventCount = 0;
  let totalHands = 0;
  let totalSessions = 0;
  const files: string[] = [];

  for await (const batch of generateEventBatches(config, batchSize)) {
    const filename = `events_${fileIndex.toString().padStart(4, "0")}.ndjson`;
    const filepath = join(outputDir, filename);

    await writeBatch(batch, filepath);
    files.push(filename);

    totalEvents          += batch.length;
    collusionEventCount  += batch.filter((e) => e._isCollusionEvent).length;
    totalHands           += batch.filter((e) => e.eventType === "HAND_OUTCOME").length;
    totalSessions        += batch.filter((e) => e.eventType === "SHUFFLE_START").length;
    fileIndex++;

    const elapsed = ((Date.now() - startMs) / 1000).toFixed(1);
    const rate    = Math.floor(totalEvents / parseFloat(elapsed));
    process.stdout.write(
      `\r   Progress: ${totalEvents.toLocaleString()} events | ${rate.toLocaleString()} ev/s`
    );
  }

  const durationMs = Date.now() - startMs;
  console.log(`\n\n✅ Done in ${(durationMs / 1000).toFixed(2)}s`);
  console.log(`   Total events:     ${totalEvents.toLocaleString()}`);
  console.log(`   Collusion events: ${collusionEventCount.toLocaleString()} (${(collusionEventCount / totalEvents * 100).toFixed(2)}%)`);
  console.log(`   Hands simulated:  ${totalHands.toLocaleString()}`);
  console.log(`   Output:           ${outputDir}\n`);

  const manifest = buildManifest(config, {
    totalEvents, totalHands, totalSessions,
    collusionEventCount, parquetFiles: files, durationMs,
  });

  await writeFile(join(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
  console.log(`   Manifest: ${join(outputDir, "manifest.json")}\n`);
}

main().catch((err) => {
  console.error("\n❌ Error:", err);
  process.exit(1);
});