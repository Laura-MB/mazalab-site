# Release Record – MAZA Shield v1.0
**Product:** MAZA Shield – Casino Risk Intelligence Platform
**Version:** 1.0
**Release Date:** April 28, 2026
**Prepared by:** Laura (MAZALab)

## 1. Purpose
This Release Record (RR) constitutes the **controlled authorization record** for commercialization and controlled distribution of **MAZA Shield v1.0** as defined under the MAZALab Quality Management System. It demonstrates that **release criteria** prescribed in the **Design and Development Plan (DP-MAZA-Shield-v1.0)** have been evaluated, that **verification** and **validation** evidence is on file or formally dispositioned, and that **residual risks** identified in the **Risk Management File (RMF-MAZA-Shield-v1.0)** are understood and accepted by accountable roles prior to release baseline establishment.

This RR does not substitute for operator-specific regulatory filings, jurisdictional licensing conditions, or customer contractual obligations; it documents MAZALab’s internal release readiness for the **software-only** MAZA Shield v1.0 baseline.

## 2. Release Scope
The following baseline is **authorized for release** as MAZA Shield v1.0:

| Scope element | Description |
|---------------|-------------|
| **Product definition** | Casino Risk Intelligence platform: entity resolution, assessment orchestration, gaming-domain scoring (including adaptive combos and advanced pattern detectors), governance-grade audit logging, REST API surface, multilingual Gaming Demo dashboard (`/demo/*`), presenter tooling per DP scope |
| **Configuration baseline** | Revision-controlled source tree, documented environment configuration (layered JSON and environment variables), correlation-ID middleware, append-only audit semantics as specified in DOS |
| **Controlled artifacts** | Verification Plan (VP), Validation Plan (VALP), Design Review Record (DR-MAZA-001), Risk Management File and Risk Management Report |
| **Explicit exclusions** | Per DP: hardware appliance certification; medical-device regulatory submission; full non-casino OSINT vertical beyond documented pathways; operator production deployment qualification (IQ/OQ) |

## 3. Release Criteria Checklist

| ID | Release criterion | Satisfied (Y/N) | Evidence / disposition |
|----|-------------------|-----------------|-------------------------|
| RC-01 | Design inputs baselined and reviewed (DID v1.0) | Y | DR-MAZA-001; DID |
| RC-02 | Design outputs documented and traced (DOS v1.0) | Y | DOS |
| RC-03 | Design review completed (DR-MAZA-001) | Y | DR-MAZA-Shield-v1.0 |
| RC-04 | Verification executed per VP | Y | VP + verification records |
| RC-05 | Validation executed per VALP | Y | VALP + VSR |
| RC-06 | Risk management current (RMF) | Y | RMF + Risk Management Report |
| RC-07 | Security and privacy posture | Y | DOS + VP checks |
| RC-08 | Labeling and human-review acknowledgement | Y | VALP VL-06 |
| RC-09 | Configuration management baseline | Y | Git tag / commit |
| RC-10 | No open severity 1 defects without acceptance | Y | Defect register |
| RC-11 | DP lifecycle alignment | Y | DP |

## 4. Evidence Summary

| Artifact ID | Title | Path |
|-------------|-------|------|
| DP-MAZA-Shield-v1.0 | Design and Development Plan | `docs/qmsr-iso13485/plans/DP-MAZA-Shield-v1.0.md` |
| DID-MAZA-Shield-v1.0 | Design Input Document | `docs/qmsr-iso13485/plans/DID-MAZA-Shield-v1.0.md` |
| DOS-MAZA-Shield-v1.0 | Design Output Specification | `docs/qmsr-iso13485/records/design-outputs/DOS-MAZA-Shield-v1.0.md` |
| DR-MAZA-001 | Design Review Record | `docs/qmsr-iso13485/records/design-reviews/DR-MAZA-Shield-v1.0.md` |
| RMF-MAZA-Shield-v1.0 | Risk Management File | `docs/qmsr-iso13485/records/risk-management/RMF-MAZA-Shield-v1.0.md` |
| VP-MAZA-Shield-v1.0 | Verification Plan | `docs/qmsr-iso13485/plans/VP-MAZA-Shield-v1.0.md` |
| VALP-MAZA-Shield-v1.0 | Validation Plan | `docs/qmsr-iso13485/plans/VALP-MAZA-Shield-v1.0.md` |
| RR-MAZA-Shield-v1.0 | This Release Record | `docs/qmsr-iso13485/records/release-records/RR-MAZA-Shield-v1.0.md` |

## 5. Residual Risks Accepted
Residual risks are accepted per RMF Section 5. Highest priority risks (RPN ≥ 60) remain under enhanced monitoring.

| Theme | Representative risk IDs | Acceptance basis |
|-------|-------------------------|------------------|
| High-impact fraud / AML | RM-008, RM-017, RM-019 | Strong controls + human-in-the-loop |
| Responsible Gaming | RM-010 | Tilt detectors + playbook |
| Over-reliance on AI | RM-013 | Disclaimers + training |
| Operational availability | RM-012 | Health endpoints + failover |
| Privacy & audit | RM-014, RM-015 | Correlation-ID + append-only |

## 6. Approval & Authorization

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Prepared by | Laura (MAZALab) | ________________________ | April 28, 2026 |
| Product Owner | | ________________________ | April 28, 2026 |
| Quality / Regulatory | | ________________________ | April 28, 2026 |
| Management (release authorization) | | ________________________ | April 28, 2026 |

**Release baseline identifier (tag / commit / build):** _______________________________________________

---
