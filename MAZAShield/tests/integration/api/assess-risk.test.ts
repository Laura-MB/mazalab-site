import type { Server } from "node:http";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createApp } from "../../../src/app.js";
import {
  COMPLIANCE_SCHEMA_VERSION,
  decodeComplianceMetadataHeader
} from "../../../src/core/governance/compliance-metadata.js";

const ISO = "2026-04-14T00:00:00Z";

function makeEntity(params: {
  id: string;
  displayName: string;
  aliases?: string[];
  attributes?: Record<string, string | number | boolean | null>;
}) {
  return {
    id: params.id,
    type: "person" as const,
    displayName: params.displayName,
    aliases: params.aliases ?? [],
    attributes: params.attributes ?? {},
    tags: [],
    sources: [
      {
        sourceId: "src-int-1",
        sourceName: "integration-test",
        sourceType: "internal" as const,
        collectedAt: ISO,
        confidence: 0.9
      }
    ],
    confidence: {
      score: 0.85,
      lastUpdatedAt: ISO
    },
    firstSeenAt: ISO,
    lastSeenAt: ISO
  };
}

describe("POST /assess-risk", () => {
  let server: Server;

  beforeAll(async () => {
    server = createApp().listen(0);
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  });

  it("returns RiskAssessment with resolvedEntity and riskScore for one entity", async () => {
    const payload = {
      entities: [
        makeEntity({
          id: "ent-001",
          displayName: "Laura Mendoza",
          aliases: ["L. Mendoza"]
        })
      ]
    };

    const response = await request(server).post("/assess-risk").send(payload);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    const assessment = response.body[0];
    expect(assessment?.resolvedEntity?.canonicalEntity?.id).toBe("ent-001");
    expect(assessment?.riskScore?.overall).toBeTypeOf("number");
    expect(assessment?.riskScore?.level).toMatch(/low|medium|high|critical/);
    expect(Array.isArray(assessment?.riskScore?.components)).toBe(true);
  });

  // T-GOV-003 — DP-2026-GOV-001, DR-2026-GOV-001-001, RVTM v1.1
  it("exposes governance metadata on first assessment and x-governance-metadata header", async () => {
    const response = await request(server)
      .post("/assess-risk")
      .send({
        entities: [
          makeEntity({
            id: "ent-gov",
            displayName: "Governance Test",
            aliases: []
          })
        ]
      });
    expect(response.status).toBe(200);
    const first = response.body[0];
    expect(first?.governance?.complianceSchemaVersion).toBe(COMPLIANCE_SCHEMA_VERSION);
    expect(first?.governance?.domain).toMatch(/general|gaming/);
    const raw = response.headers["x-governance-metadata"];
    expect(typeof raw).toBe("string");
    const decoded = decodeComplianceMetadataHeader(String(raw));
    expect(decoded.complianceSchemaVersion).toBe(COMPLIANCE_SCHEMA_VERSION);
  });

  it("supports multiple entities and returns one assessment per entity", async () => {
    const payload = {
      entities: [
        makeEntity({ id: "ent-002", displayName: "Ana Gomez", aliases: ["Ana Gómez"] }),
        makeEntity({ id: "ent-003", displayName: "Miguel Perez", aliases: ["M. Perez"] })
      ]
    };

    const response = await request(server).post("/assess-risk").send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0]?.targetEntityId).toBe("ent-002");
    expect(response.body[1]?.targetEntityId).toBe("ent-003");
  });

  it("returns 400 for invalid payloads (missing entities or malformed entities)", async () => {
    const missingEntities = await request(server).post("/assess-risk").send({
      correlationId: "corr-missing-entities"
    });
    const malformedEntity = await request(server)
      .post("/assess-risk")
      .send({ entities: [{ id: "x" }] });

    expect(missingEntities.status).toBe(400);
    expect(missingEntities.body).toEqual([]);
    expect(malformedEntity.status).toBe(400);
    expect(malformedEntity.body).toEqual([]);
  });

  it("returns assessmentSummary legible and recommendedActions coherent with risk level", async () => {
    const payload = {
      entities: [makeEntity({ id: "ent-004", displayName: "Executive Subject", aliases: [] })]
    };

    const response = await request(server).post("/assess-risk").send(payload);

    expect(response.status).toBe(200);
    const assessment = response.body[0];
    const summary = String(assessment?.assessmentSummary ?? "");
    expect(summary).toContain("## Assessment overview (general domain)");
    expect(summary).toMatch(/low|medium|high|critical/i);
    expect(summary).toMatch(/\d\.\d{4}/);
    const actions = assessment?.recommendedActions ?? [];
    expect(actions.length).toBeGreaterThan(0);
    const joined = actions.join(" ").toLowerCase();

    if (assessment?.riskScore?.level === "critical") {
      expect(joined).toMatch(/\[p1\]|senior analyst|compliance|evidence/);
    } else if (assessment?.riskScore?.level === "high") {
      expect(joined).toMatch(/\[p2\]|watchlist|validation|screening/);
    } else if (assessment?.riskScore?.level === "medium") {
      expect(joined).toMatch(/\[p3\]|cross-check|reassessment|audit/);
    } else {
      expect(joined).toMatch(/\[p4\]|monitoring|recalculate/);
    }
  });

  it("returns rich assessment structure: resolvedEntity, risk breakdown, summary and actions", async () => {
    const payload = {
      entities: [
        makeEntity({
          id: "ent-005",
          displayName: "Compliance Risk Persona",
          aliases: ["Conflicting Industrial Label Unrelated"],
          attributes: { compliance_flag: "true", sanction_hit: "possible" }
        })
      ]
    };

    const response = await request(server).post("/assess-risk").send(payload);

    expect(response.status).toBe(200);
    const assessment = response.body[0];
    expect(assessment?.resolvedEntity?.canonicalEntity?.displayName).toBe("Compliance Risk Persona");
    expect(assessment?.riskScore?.components?.length).toBeGreaterThan(0);
    expect(typeof assessment?.assessmentSummary).toBe("string");
    expect(assessment?.assessmentSummary.length).toBeGreaterThan(40);
    expect(Array.isArray(assessment?.recommendedActions)).toBe(true);
    expect(assessment?.recommendedActions?.length).toBeGreaterThan(0);
  });

  it("reflects resolution matchScore influence in downstream risk scoring", async () => {
    const payload = {
      entities: [
        makeEntity({
          id: "ent-006",
          displayName: "Maria Fernanda Ruiz",
          aliases: ["maria fernanda ruiz"]
        }),
        makeEntity({
          id: "ent-007",
          displayName: "Maria Fernanda Ruiz",
          aliases: ["Totally Different Company Label Unrelated"]
        })
      ]
    };

    const response = await request(server).post("/assess-risk").send(payload);

    expect(response.status).toBe(200);
    const highAlignment = response.body.find((x: { targetEntityId: string }) => x.targetEntityId === "ent-006");
    const lowAlignment = response.body.find((x: { targetEntityId: string }) => x.targetEntityId === "ent-007");

    expect(highAlignment?.resolvedEntity?.matchScore).toBeGreaterThan(
      lowAlignment?.resolvedEntity?.matchScore ?? 0
    );
    expect(highAlignment?.riskScore?.overall).not.toBe(lowAlignment?.riskScore?.overall);
  });

  it("appends correlationId in resolution explanation when provided", async () => {
    const payload = {
      correlationId: "corr-int-9988",
      entities: [
        makeEntity({
          id: "ent-correlation",
          displayName: "Correlation Probe",
          aliases: ["Correlation Probe"]
        })
      ]
    };

    const response = await request(server).post("/assess-risk").send(payload);

    expect(response.status).toBe(200);
    const explanation = String(response.body[0]?.resolvedEntity?.explanation ?? "");
    expect(explanation).toContain("Correlation: corr-int-9988");
  });
});
