// DP-2026-GOV-001, DR-2026-GOV-001-001, RVTM v1.1 — public governance / compliance API surface
export {
  buildComplianceMetadata,
  COMPLIANCE_SCHEMA_VERSION,
  decodeComplianceMetadataHeader,
  encodeComplianceMetadataHeader,
  resolveBuildRef,
  resolveRulesVersion,
  validateComplianceForAuditAppend
} from "./compliance-metadata.js";
export { assertNoBlockedPiiInComplianceFields, stringContainsBlockedPiiPattern } from "./pii-patterns.js";
export type { AuditLogComboSnapshot, AuditLogEntry, AuditEntry, RiskScoreAuditLogRow } from "./types.js";
