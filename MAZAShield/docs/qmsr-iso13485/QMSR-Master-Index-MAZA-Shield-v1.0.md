# QMSR Master Index – MAZA Shield v1.0
**Product:** MAZA Shield – Casino Risk Intelligence Platform  
**Version:** 1.0  
**Index Date:** April 28, 2026  
**Prepared by:** Laura (MAZALab)

## 1. Purpose

This **QMSR Master Index** is the authoritative **register of controlled planning, risk, design, verification, validation, and release records** maintained for **MAZA Shield v1.0** under MAZALab’s FDA QMSR–aligned quality discipline (cross-referencing ISO 13485 design controls and ISO 14971 risk management conventions).

The index enables auditors, management, and authorized stakeholders to:

- Locate current revision baselines by **document identifier** and repository **path**.
- Understand **relationships** among design inputs, outputs, risk artifacts, V&V plans, and release authorization (**Section 2** and **Section 4**).
- Confirm **currency** through status and approval-date fields (superseded documents shall be explicitly marked under revision control).

This index **does not replace** document-specific approvals or configuration-management records; it **indexes** them.

## 2. Document Hierarchy

Controlled artifacts follow this logical dependency (informative, not a substitute for detailed trace matrices):

```
DP-MAZA-Shield-v1.0 (Design and Development Plan — master schedule & gates)
        │
        ├── DID-MAZA-Shield-v1.0 (Design Inputs: UN-xxx, SR-xxx)
        │         │
        │         ├── DR-MAZA-001 (Design Review — input completeness / coherence)
        │         │
        │         └── DOS-MAZA-Shield-v1.0 (Design Outputs — realization baseline)
        │                   │
        ├── RMF-MAZA-Shield-v1.0 + Risk Management Report (risk posture / hazards & executive summary)
        │         │
        │         └── informs VP / VALP emphasis & residual-risk disposition
        │
        ├── VP-MAZA-Shield-v1.0 (Verification — requirements vs implementation)
        │
        └── VALP-MAZA-Shield-v1.0 (Validation — intended use / stakeholder demonstration)

RR-MAZA-Shield-v1.0 (Release Record — authorization after criteria & evidence closure)
```

**Ordering principle:** Planning (**DP**) frames inputs (**DID**) and outputs (**DOS**); risk (**RMF**) runs in parallel; formal review (**DR-MAZA-001**) locks the input baseline; verification (**VP**) and validation (**VALP**) generate objective and stakeholder-facing evidence; release (**RR**) documents Management acceptance of residual risk and scope.

## 3. Complete Document List

| Category | Document ID | Title | Path | Status | Approval Date |
|----------|-------------|-------|------|--------|---------------|
| Planning — design & development | **DP-MAZA-Shield-v1.0** | Design and Development Plan | `docs/qmsr-iso13485/plans/DP-MAZA-Shield-v1.0.md` | Effective | April 28, 2026 |
| Planning — design inputs | **DID-MAZA-Shield-v1.0** | Design Input Document | `docs/qmsr-iso13485/plans/DID-MAZA-Shield-v1.0.md` | Effective | April 28, 2026 |
| Planning — verification | **VP-MAZA-Shield-v1.0** | Verification Plan | `docs/qmsr-iso13485/plans/VP-MAZA-Shield-v1.0.md` | Effective | April 28, 2026 |
| Planning — validation | **VALP-MAZA-Shield-v1.0** | Validation Plan | `docs/qmsr-iso13485/plans/VALP-MAZA-Shield-v1.0.md` | Effective | April 28, 2026 |
| Risk management | **RMF-MAZA-Shield-v1.0** | Risk Management File | `docs/qmsr-iso13485/records/risk-management/RMF-MAZA-Shield-v1.0.md` | Effective | May 28, 2026 |
| Risk management | **Risk-Management-Report-MAZA-Shield-v1.0** | Risk Management Report – MAZA Shield | `docs/qmsr-iso13485/records/risk-management/Risk-Management-Report-MAZA-Shield-v1.0.md` | Effective | April 28, 2026 |
| Design outputs | **DOS-MAZA-Shield-v1.0** | Design Output Specification | `docs/qmsr-iso13485/records/design-outputs/DOS-MAZA-Shield-v1.0.md` | Effective | April 28, 2026 |
| Design review | **DR-MAZA-001** | Design Review Record — Design Input Review *(record file: `DR-MAZA-Shield-v1.0.md`)* | `docs/qmsr-iso13485/records/design-reviews/DR-MAZA-Shield-v1.0.md` | Closed — acceptable | April 28, 2026 |
| Release | **RR-MAZA-Shield-v1.0** | Release Record | `docs/qmsr-iso13485/records/release-records/RR-MAZA-Shield-v1.0.md` | Effective upon signature | See record *(Release Date: April 28, 2026)* |
| Governance register | **QMSR-Master-Index-MAZA-Shield-v1.0** | QMSR Master Index – MAZA Shield v1.0 *(this document)* | `docs/qmsr-iso13485/QMSR-Master-Index-MAZA-Shield-v1.0.md` | Effective | April 28, 2026 |

**Supporting reference (non-substitutive for controlled QMSR packages):** Technical architecture and API narrative — `docs/PROJECT_CONTEXT.md` (engineering reference; cited by release and design artifacts where noted).

## 4. Traceability Summary

| Link | Description |
|------|-------------|
| **UN / SR → DID** | Stakeholder needs (**UN-001–UN-008**) and system requirements (**SR-xxx**) are defined in **DID-MAZA-Shield-v1.0**. |
| **DID → DOS → VP** | Design outputs in **DOS-MAZA-Shield-v1.0** realize requirements verified under **VP-MAZA-Shield-v1.0**. |
| **DID → VALP** | Intended-use validation activities (**VL-01–VL-06**) in **VALP-MAZA-Shield-v1.0** map to **UN-xxx** user needs. |
| **RMF ↔ VP / VALP** | Hazard and control identifiers (**RM-xxx**) in **RMF-MAZA-Shield-v1.0** inform verification and validation emphasis; **Risk Management Report** summarizes posture for executive and audit readers. |
| **DR-MAZA-001 → DID / DP / RMF** | **DR-MAZA-Shield-v1.0** records formal acceptance of the design input baseline against **DP** and representative **RMF** alignment. |
| **RR → all** | **RR-MAZA-Shield-v1.0** aggregates release criteria and references **DP, DID, DOS, DR, RMF, VP, VALP** prior to authorized baseline release. |

Atomic matrices (**UN/SR ↔ tests ↔ RM**) may be maintained in spreadsheets or tooling under Quality records; this index remains the **document locator** for the MAZA Shield v1.0 QMSR package.

## 5. Revision History

| Rev | Date | Description | Author |
|-----|------|-------------|--------|
| 1.0 | April 28, 2026 | Initial issuance: complete MAZA Shield v1.0 QMSR document register | Laura (MAZALab) |

## 6. Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Prepared by | Laura (MAZALab) | | April 28, 2026 |
| Product Owner | | | |
| Quality / Regulatory | | | |
