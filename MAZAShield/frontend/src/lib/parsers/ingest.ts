import * as XLSX from "xlsx";
import Papa from "papaparse";
import type { AssessRiskRequestBody, Entity } from "@/lib/api/types";

const ISO_FALLBACK = new Date().toISOString();

function minimalSource() {
  return [
    {
      sourceId: "file-upload",
      sourceName: "dashboard-upload",
      sourceType: "internal" as const,
      collectedAt: ISO_FALLBACK,
      confidence: 0.9
    }
  ];
}

function normalizeEntity(raw: Record<string, unknown>, rowIndex: number): Entity {
  const id =
    (typeof raw.id === "string" && raw.id.trim()) ||
    `upload-row-${rowIndex + 1}`;
  const displayName =
    (typeof raw.displayName === "string" && raw.displayName.trim()) ||
    (typeof raw.name === "string" && raw.name.trim()) ||
    id;

  let aliases: string[] = [];
  if (Array.isArray(raw.aliases)) {
    aliases = raw.aliases.filter((a): a is string => typeof a === "string");
  } else if (typeof raw.aliases === "string" && raw.aliases.length > 0) {
    aliases = raw.aliases.split(/[|;]/).map((s) => s.trim()).filter(Boolean);
  }

  let attributes: Record<string, string | number | boolean | null> = {};
  if (raw.attributes && typeof raw.attributes === "object" && !Array.isArray(raw.attributes)) {
    attributes = raw.attributes as Record<string, string | number | boolean | null>;
  } else {
    const skip = new Set(["id", "displayName", "name", "aliases", "type", "tags"]);
    for (const [k, v] of Object.entries(raw)) {
      if (skip.has(k)) continue;
      if (v === null || typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        attributes[k] = v;
      }
    }
  }

  let tags: string[] = [];
  if (Array.isArray(raw.tags)) {
    tags = raw.tags.filter((t): t is string => typeof t === "string");
  }

  const confidenceScore =
    typeof raw.confidenceScore === "number"
      ? raw.confidenceScore
      : typeof raw.confidence === "number"
        ? raw.confidence
        : 0.85;

  return {
    id,
    type: typeof raw.type === "string" ? raw.type : "person",
    displayName,
    aliases,
    attributes,
    tags,
    sources: minimalSource(),
    confidence: {
      score: confidenceScore,
      lastUpdatedAt: ISO_FALLBACK
    },
    firstSeenAt:
      typeof raw.firstSeenAt === "string" ? raw.firstSeenAt : ISO_FALLBACK,
    lastSeenAt: typeof raw.lastSeenAt === "string" ? raw.lastSeenAt : ISO_FALLBACK
  };
}

export function parseAssessRiskJson(text: string): AssessRiskRequestBody {
  const data = JSON.parse(text) as unknown;
  if (Array.isArray(data)) {
    return {
      entities: data.map((row, i) =>
        normalizeEntity(row as Record<string, unknown>, i)
      )
    };
  }
  if (data && typeof data === "object" && "entities" in data) {
    const obj = data as { entities: unknown; correlationId?: unknown };
    const entities = obj.entities;
    if (!Array.isArray(entities)) {
      throw new Error("JSON must contain an array or { entities: [...] }");
    }
    return {
      entities: entities.map((row, i) =>
        normalizeEntity(row as Record<string, unknown>, i)
      ),
      correlationId:
        typeof obj.correlationId === "string" ? obj.correlationId : undefined
    };
  }
  throw new Error("JSON root must be an array of entities or { entities: [...] }");
}

export function parseAssessRiskCsv(text: string): AssessRiskRequestBody {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim()
  });
  if (parsed.errors.length > 0) {
    const msg = parsed.errors.map((e) => e.message).join("; ");
    throw new Error(`CSV parse error: ${msg}`);
  }
  const rows = parsed.data.filter((r) => Object.keys(r).length > 0);
  return {
    entities: rows.map((row, i) => {
      const obj: Record<string, unknown> = { ...row };
      return normalizeEntity(obj, i);
    })
  };
}

export function parseAssessRiskXlsx(buffer: ArrayBuffer): AssessRiskRequestBody {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) throw new Error("Excel workbook has no sheets");
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: ""
  });
  return {
    entities: rows.map((row, i) => normalizeEntity(row, i))
  };
}

export type SupportedUploadKind = "json" | "csv" | "xlsx";

export function detectKind(file: File): SupportedUploadKind {
  const name = file.name.toLowerCase();
  if (name.endsWith(".json")) return "json";
  if (name.endsWith(".csv")) return "csv";
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return "xlsx";
  throw new Error("Unsupported file type. Use .json, .csv, or .xlsx");
}

export async function parseUploadFile(file: File): Promise<AssessRiskRequestBody> {
  const kind = detectKind(file);
  if (kind === "json") {
    const text = await file.text();
    return parseAssessRiskJson(text);
  }
  if (kind === "csv") {
    const text = await file.text();
    return parseAssessRiskCsv(text);
  }
  const buf = await file.arrayBuffer();
  return parseAssessRiskXlsx(buf);
}
