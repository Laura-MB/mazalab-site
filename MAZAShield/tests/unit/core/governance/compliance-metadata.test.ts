// DP-2026-GOV-001, DR-2026-GOV-001-001, RVTM v1.1 — T-GOV-001
import { describe, expect, it } from "vitest";
import {
  buildComplianceMetadata,
  COMPLIANCE_SCHEMA_VERSION,
  decodeComplianceMetadataHeader,
  encodeComplianceMetadataHeader
} from "../../../../src/core/governance/compliance-metadata.js";

describe("T-GOV-001: compliance metadata (schema, roundtrip, minimization)", () => {
  it("uses fixed complianceSchemaVersion and ISO8601 recordedAt", () => {
    const m = buildComplianceMetadata({
      domain: "general",
      rulesVersion: "1",
      buildRef: "abc"
    });
    expect(m.complianceSchemaVersion).toBe(COMPLIANCE_SCHEMA_VERSION);
    expect(Number.isFinite(Date.parse(m.recordedAt))).toBe(true);
  });

  it("does not embed email-like or long digit patterns in metadata JSON", () => {
    const json = JSON.stringify(
      buildComplianceMetadata({ domain: "gaming", rulesVersion: "x", buildRef: "nope" })
    );
    expect(json).not.toMatch(/@/);
    expect(json).not.toMatch(/\b\d{10,}\b/);
  });

  it("header encode/decode is stable for a roundtrip", () => {
    const m = buildComplianceMetadata({
      domain: "general",
      rulesVersion: "rs-test",
      buildRef: "build"
    });
    const header = encodeComplianceMetadataHeader(m);
    const back = decodeComplianceMetadataHeader(header);
    expect(back).toEqual(m);
  });
});
