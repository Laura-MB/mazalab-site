# ADR-002 — Rejection of Redundant RiskFeatureVector Schema

**Status:** Accepted  
**Date:** 2026-05-13  
**Author:** Laura Maza — Lead Architect, MAZALab  
**Ref:** IP Ledger 07-May-2026 · src/types/index.ts  

---

## Context

During implementation of the Hawkes inference layer, a design question arose
regarding the data contract between the event ingestion pipeline and the risk
scoring module. The inference layer requires a structured representation of:

- DEAL_START to HOLE_CARD_PEEK interval (primary signal carrier)
- BET_PLACEMENT timing relative to dealer event (cross-excitation lag)
- Session and table identifiers
- Estimated coupling coefficient alpha_DP
- Log-likelihood ratio score (fed directly to IAL)

A proposal was made to introduce a standalone TypeScript interface
RiskFeatureVector in a new schema file, separate from src/types/index.ts.

src/types/index.ts is the canonical type definition module, imported by:
- Event ingestion pipeline
- IAL writer
- Multi-agent orchestration layer
- API surface for downstream risk score consumers

Introducing a parallel type file creates schema fragmentation risk: the
type graph becomes inconsistent across modules, and the IAL writer may
receive a type it does not recognize without additional adapter logic.

---

## Decision

**Reject** the standalone RiskFeatureVector interface.

Instead, extend src/types/index.ts with HawkesInferenceContext — a strict
extension of the existing SessionContext interface — adding only the fields
required by the Hawkes inference layer.

### Implementation

See src/types/index.ts — HawkesInferenceContext interface:

  export interface HawkesInferenceContext extends SessionContext {
    dealToHoleCardIntervalMs:   number;
    betPlacementLagMs:          number;
    couplingCoefficientAlphaDP: number;
    inferenceWindowRounds:      number;
    logLikelihoodRatioScore:    number;
  }

HawkesInferenceContext is a strict extension of SessionContext. All existing
consumers of SessionContext accept HawkesInferenceContext via TypeScript
structural subtyping — no adapter layer required.

### Key Architectural Property

The logLikelihoodRatioScore field being part of the same interface that feeds
AuditRecord means the Hawkes inference output is cryptographically sealed into
the IAL by construction. It is structurally impossible to produce a risk score
without simultaneously producing the auditable evidence that justifies it.

This satisfies the NGCB regulatory auditability requirement at the type level —
not as a runtime check, but as a compile-time guarantee.

---

## Consequences

- Single source of truth: all domain types remain in src/types/index.ts.
- Zero adapter logic: IAL writer and orchestration layer accept
  HawkesInferenceContext transparently via structural subtyping.
- Backward compatible: existing SessionContext consumers require no changes.
- Audit integrity by construction: LLR score and coupling coefficient are
  structurally bound to the AuditRecord — cannot be separated at compile time.
- GLI-33 alignment: any external audit of the codebase finds a single file
  defining the complete data contract of the system.

---

## Alternatives Rejected

| Alternative | Reason Rejected |
|---|---|
| Standalone RiskFeatureVector schema | Schema fragmentation; IAL writer type mismatch risk |
| Duplicate fields in new interface | Violates DRY; SessionContext fields maintained in two places |
| Runtime type mapping adapter | Adds latency; incompatible with sub-200ms inference target |
