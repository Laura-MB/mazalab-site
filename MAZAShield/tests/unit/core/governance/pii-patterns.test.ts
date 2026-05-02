// DP-2026-GOV-001, DR-2026-GOV-001-001, RVTM v1.1 — T-GOV-005
import { describe, expect, it } from "vitest";
import {
  buildComplianceMetadata,
  validateComplianceForAuditAppend
} from "../../../../src/core/governance/compliance-metadata.js";
import {
  assertNoBlockedPiiInComplianceFields,
  stringContainsBlockedPiiPattern
} from "../../../../src/core/governance/pii-patterns.js";

describe("T-GOV-005: PII pattern rejection on governance fields", () => {
  it("rejects email-like rulesVersion in validateComplianceForAuditAppend", () => {
    const bad = {
      ...buildComplianceMetadata({ domain: "general", rulesVersion: "x", buildRef: "b" }),
      rulesVersion: "a@b.co"
    };
    expect(() => validateComplianceForAuditAppend(bad)).toThrow(/Governance metadata rejected/);
  });

  it("stringContainsBlockedPiiPattern flags email and long digit runs", () => {
    expect(stringContainsBlockedPiiPattern("u@v.w")).toBe(true);
    expect(stringContainsBlockedPiiPattern("1234567890")).toBe(true);
    expect(stringContainsBlockedPiiPattern("rs-bl-v1.2")).toBe(false);
  });

  it("assertNoBlockedPiiInComplianceFields passes for valid buildComplianceMetadata", () => {
    const m = buildComplianceMetadata({
      domain: "gaming",
      rulesVersion: "r1",
      buildRef: "sha1"
    });
    expect(() => assertNoBlockedPiiInComplianceFields(m)).not.toThrow();
  });
});
