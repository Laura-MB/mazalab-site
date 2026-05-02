// DP-2026-GOV-001, DR-2026-GOV-001-001, RVTM v1.1
import type { ComplianceMetadata } from "../../types/index.js";
import { assertNoBlockedPiiInComplianceFields } from "./pii-patterns.js";
import type { RiskDomain } from "../risk-scoring/types.js";

/** Published schema id for this governance envelope (bump with migration plan). */
export const COMPLIANCE_SCHEMA_VERSION = "1.0.0" as const;

const MAX_FIELD_LEN = 64;

function truncateField(value: string, max: number): string {
  const t = value.trim();
  if (t.length <= max) return t;
  return t.slice(0, max);
}

/**
 * Build minimized compliance metadata after scoring — no feedback into ER/RS.
 * Call only after the assessment pipeline has produced a domain.
 */
export function buildComplianceMetadata(params: {
  domain: RiskDomain;
  /** Ruleset label (e.g. env or config id). */
  rulesVersion: string;
  /** Opaque, non-PII build reference. */
  buildRef: string;
}): ComplianceMetadata {
  return {
    complianceSchemaVersion: COMPLIANCE_SCHEMA_VERSION,
    domain: params.domain,
    rulesVersion: truncateField(params.rulesVersion, MAX_FIELD_LEN),
    buildRef: truncateField(params.buildRef, MAX_FIELD_LEN),
    recordedAt: new Date().toISOString()
  };
}

/**
 * Runtime validation before persisting to audit or emitting on the wire.
 * Throws if blocked PII-style patterns are detected in metadata strings.
 */
export function validateComplianceForAuditAppend(meta: ComplianceMetadata): void {
  assertNoBlockedPiiInComplianceFields(meta);
}

/**
 * Base64url JSON for compact HTTP header (`x-governance-metadata`).
 * Avoids changing the JSON array body for legacy clients. DP-2026-GOV-001.
 */
export function encodeComplianceMetadataHeader(meta: ComplianceMetadata): string {
  return Buffer.from(JSON.stringify(meta), "utf8")
    .toString("base64url")
    .replace(/=+$/, "");
}

/**
 * @internal Tests — decode base64url header back to object.
 */
export function decodeComplianceMetadataHeader(raw: string): ComplianceMetadata {
  const padded = raw.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4;
  const b64 = pad === 0 ? padded : padded + "=".repeat(4 - pad);
  const json = Buffer.from(b64, "base64").toString("utf8");
  return JSON.parse(json) as ComplianceMetadata;
}

/**
 * Resolves rules version from environment (QMS-traceable label, not a secret).
 */
export function resolveRulesVersion(): string {
  return process.env.MAZALAB_RULES_VERSION?.trim() || "rs-bl-v1.2";
}

/**
 * Resolves build reference: CI SHA, package version, or dev placeholder.
 */
export function resolveBuildRef(): string {
  const sha = process.env.GIT_SHA?.trim();
  if (sha && sha.length > 0) return sha;
  const ver = process.env.npm_package_version?.trim();
  if (ver && ver.length > 0) return `pkg:${ver}`;
  return "dev";
}
