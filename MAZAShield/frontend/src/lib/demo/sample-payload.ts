import type { AssessRiskRequestBody, Entity } from "@/lib/api/types";

const ISO = "2026-04-14T12:00:00.000Z";

function baseEntity(
  id: string,
  displayName: string,
  aliases: string[] = [],
  attributes: Record<string, string | number | boolean | null> = {}
): Entity {
  return {
    id,
    type: "person",
    displayName,
    aliases,
    attributes,
    tags: ["demo"],
    sources: [
      {
        sourceId: "dashboard-demo",
        sourceName: "MVP Dashboard",
        sourceType: "internal",
        collectedAt: ISO,
        confidence: 0.95
      }
    ],
    confidence: {
      score: 0.88,
      lastUpdatedAt: ISO
    },
    firstSeenAt: ISO,
    lastSeenAt: ISO
  };
}

/** Two entities with similar names to exercise ER explanations in the Mother Brain API. */
export function getDemoAssessRiskPayload(): AssessRiskRequestBody {
  return {
    correlationId: `dashboard-demo-${globalThis.crypto?.randomUUID?.() ?? String(Date.now())}`,
    entities: [
      baseEntity("ent-demo-1", "Laura Mendoza", ["L. Mendoza", "Laura M."], {
        jurisdiction: "ES",
        segment: "vip"
      }),
      baseEntity("ent-demo-2", "Miguel Pérez", ["M. Perez"], {
        jurisdiction: "MX",
        segment: "standard"
      })
    ]
  };
}
