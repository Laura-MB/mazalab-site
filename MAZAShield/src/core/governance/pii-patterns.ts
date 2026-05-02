// DP-2026-GOV-001, DR-2026-GOV-001-001, RVTM v1.1 — data minimization: block obvious PII in governance strings.
import type { ComplianceMetadata } from "../../types/index.js";

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/i;
const LONG_DIGITS_RE = /\b\d{10,20}\b/;

/**
 * `true` if the string looks like a raw email or long digit sequence (e.g. phone).
 * Used to reject governance metadata, not to scan free-form assessment prose.
 */
export function stringContainsBlockedPiiPattern(s: string): boolean {
  if (s.length === 0) return false;
  if (EMAIL_RE.test(s)) return true;
  if (LONG_DIGITS_RE.test(s)) return true;
  return false;
}

/**
 * Throws if any field in the compliance object matches blocked PII heuristics.
 */
export function assertNoBlockedPiiInComplianceFields(meta: ComplianceMetadata): void {
  const fields: string[] = [
    meta.complianceSchemaVersion,
    meta.domain,
    meta.rulesVersion,
    meta.buildRef,
    meta.recordedAt
  ];
  for (const f of fields) {
    if (stringContainsBlockedPiiPattern(f)) {
      throw new Error("Governance metadata rejected: potential PII or disallowed pattern in field");
    }
  }
}
