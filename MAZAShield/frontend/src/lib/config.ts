/**
 * MAZALab Express API base URL (no trailing slash).
 *
 * **Server** (`getMazalabApiBase`): `MAZALAB_API_BASE` → `NEXT_PUBLIC_API_BASE` → `http://localhost:3000`.
 * Use `MAZALAB_API_BASE` in `.env.local` when the proxy should differ from the public hint.
 */

export const DEFAULT_API_BASE = "http://localhost:3000";

function pickBase(a: string | undefined, b: string | undefined): string {
  const x = a?.trim();
  if (x && x.length > 0) return x.replace(/\/$/, "");
  const y = b?.trim();
  if (y && y.length > 0) return y.replace(/\/$/, "");
  return DEFAULT_API_BASE;
}

/** Resolved on the server (Route Handlers, RSC). */
export function getMazalabApiBase(): string {
  return pickBase(process.env.MAZALAB_API_BASE, process.env.NEXT_PUBLIC_API_BASE);
}

/** Inlined at build for client bundles — for UI hints only. */
export function getClientApiBaseHint(): string {
  return pickBase(undefined, process.env.NEXT_PUBLIC_API_BASE);
}

/** @deprecated use DEFAULT_API_BASE */
export const DEFAULT_MAZALAB_API_BASE = DEFAULT_API_BASE;
