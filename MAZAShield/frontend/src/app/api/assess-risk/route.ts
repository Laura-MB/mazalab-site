import { NextResponse } from "next/server";
import { getMazalabApiBase } from "@/lib/config";

/**
 * Proxy: browser → `/api/assess-risk` → `{MAZALAB_API_BASE || NEXT_PUBLIC_API_BASE}/assess-risk`
 */
export async function POST(req: Request) {
  const base = getMazalabApiBase();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${base}/assess-risk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(req.headers.get("x-correlation-id")
          ? { "x-correlation-id": req.headers.get("x-correlation-id")! }
          : {})
      },
      body: JSON.stringify(body),
      cache: "no-store"
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network error";
    return NextResponse.json(
      {
        error: "Upstream unreachable",
        detail: message,
        base
      },
      { status: 502 }
    );
  }

  const text = await upstream.text();
  const correlationId = upstream.headers.get("x-correlation-id");

  let payload: unknown;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }

  const res = NextResponse.json(payload, { status: upstream.status });
  if (correlationId) res.headers.set("x-correlation-id", correlationId);
  const gov = upstream.headers.get("x-governance-metadata");
  if (gov) res.headers.set("x-governance-metadata", gov);
  const csv = upstream.headers.get("x-compliance-schema-version");
  if (csv) res.headers.set("x-compliance-schema-version", csv);

  return res;
}
