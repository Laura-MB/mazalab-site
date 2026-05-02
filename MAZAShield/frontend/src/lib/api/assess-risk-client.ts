import type { AssessRiskRequestBody, RiskAssessment } from "@/lib/api/types";

export interface AssessRiskResult {
  ok: boolean;
  status: number;
  assessments: RiskAssessment[];
  correlationId?: string;
  governanceHeader?: string;
  errorMessage?: string;
}

function extractErrorMessage(data: unknown, status: number): string {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    const err = typeof o.error === "string" ? o.error : null;
    const detail = typeof o.detail === "string" ? o.detail : null;
    if (err && detail) return `${err}: ${detail}`;
    if (err) return err;
    if (typeof o.message === "string") return o.message;
  }
  return `Request failed (${status})`;
}

export async function assessRisk(
  body: AssessRiskRequestBody
): Promise<AssessRiskResult> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (body.correlationId) {
    headers["x-correlation-id"] = body.correlationId;
  }

  let res: Response;
  try {
    res = await fetch("/api/assess-risk", {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    return {
      ok: false,
      status: 0,
      assessments: [],
      errorMessage: `No se pudo contactar al proxy Next.js: ${msg}`
    };
  }

  const correlationId = res.headers.get("x-correlation-id") ?? undefined;
  const governanceHeader = res.headers.get("x-governance-metadata") ?? undefined;

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      assessments: [],
      correlationId,
      governanceHeader,
      errorMessage: extractErrorMessage(data, res.status)
    };
  }

  if (!Array.isArray(data)) {
    return {
      ok: false,
      status: res.status,
      assessments: [],
      correlationId,
      governanceHeader,
      errorMessage: "Unexpected response shape (expected array)"
    };
  }

  return {
    ok: true,
    status: res.status,
    assessments: data as RiskAssessment[],
    correlationId,
    governanceHeader
  };
}
