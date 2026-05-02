# QMSR Overview – MAZA Shield v1.0
**Product:** MAZA Shield – Casino Risk Intelligence Platform  
**Version:** 1.0  
**Date:** April 28, 2026  
**Prepared by:** Laura (MAZALab)

## 1. Introduction and Purpose

This **Quality Manual Summary / QMSR Overview** describes how MAZALab applies a **FDA Quality Management System Regulation (QMSR)**–aligned quality discipline—cross-referenced with **ISO 13485** design-control expectations—to **MAZA Shield v1.0**, the Company’s software-centric **Casino Risk Intelligence** offering.

The Overview exists so **management, auditors, investors, and customer diligence teams** can grasp the scope of controlled processes, the location of authoritative documents, and the linkage among risk management, design controls, verification and validation, and release—without substituting for full controlled artifacts referenced herein.

## 2. Scope of the QMSR for MAZA Shield

The MAZA Shield v1.0 QMSR envelope addresses:

| In scope | Out of scope (declared) |
|----------|-------------------------|
| Software-only delivery (Mother Brain core, assessment pipeline, governance-grade audit logging, REST APIs, multilingual Gaming Demo, presenter tooling) per **DP-MAZA-Shield-v1.0** | Hardware appliance certification; medical-device submission positioning unless superseded by amendment |
| Design inputs (**UN-xxx**, **SR-xxx**) through outputs (**DOS**), formal **design review**, **verification**, **validation**, **release authorization** | Operator IQ/OQ in production estates; statutory AML/SAR filing obligations retained by licensees |

Changes to scope trigger revision under controlled procedures referenced in **DP** and captured in the **QMSR Master Index**.

## 3. Quality Policy & Objectives

MAZALab’s enterprise posture emphasizes **accuracy, privacy-first AI, scalability, and user-centric workflows for regulated analysts**. For MAZA Shield specifically, measurable objectives include:

- **Traceability:** Stakeholder and system requirements (**DID**) traced through outputs (**DOS**) to verification (**VP**) and validation (**VALP**) evidence.
- **Risk-informed engineering:** Hazards and controls documented in **RMF-MAZA-Shield-v1.0**, summarized for executives in the **Risk Management Report**.
- **Release discipline:** No endorsed baseline absent satisfactory disposition of **RR-MAZA-Shield-v1.0** release criteria (subject to Management authorization).

Formal governance records—including **Management Review**—confirm suitability at periodic intervals.

## 4. Key QMSR Processes Applied

| Process cluster | Representative artifact(s) | Intent |
|-----------------|---------------------------|--------|
| Planning | **DP-MAZA-Shield-v1.0** | Gates, milestones, configuration discipline |
| Design inputs | **DID-MAZA-Shield-v1.0** | UN/SR requirements baseline |
| Design outputs | **DOS-MAZA-Shield-v1.0** | Implemented architecture and interfaces |
| Design review | **DR-MAZA-001** (**DR-MAZA-Shield-v1.0**) | Formal acceptance of input baseline |
| Risk management | **RMF**, **Risk Management Report** | Hazard identification, controls, residual risk |
| Verification | **VP-MAZA-Shield-v1.0** | Objective evidence vs SR obligations |
| Validation | **VALP-MAZA-Shield-v1.0** | Intended-use demonstration (**VL-xxx**) |
| Release | **RR-MAZA-Shield-v1.0** | Criteria, residual acceptance, authorization |
| System oversight | **QMSR-Master-Index-MAZA-Shield-v1.0**, **MR-MAZA-Shield-v1.0** | Document registry; Management Review conclusions |

## 5. Document Hierarchy & Traceability

The following diagram summarizes logical layering (informative; matrices maintained under Quality records):

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     DP — Design & Development Plan                         │
│                    (schedule, gates, scope exclusions)                   │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          ▼                       ▼                       ▼
   DID (inputs)              RMF + Risk Report      VP / VALP plans
   UN / SR                   hazards / RM-xxx       V&V methods & IDs
          │                       │                       │
          ├────────► DR-MAZA-001 ─┴───────────────────────┤
          │       (design input review)                 │
          ▼                                             │
   DOS (outputs) ─────────────────────────────────────► Verification /
   modules / APIs                                      Validation evidence
          │                                             │
          └──────────────────────► RR ─────────────────► Authorized baseline
                                 (+ MR oversight)
```

**Registry:** **QMSR-Master-Index-MAZA-Shield-v1.0** lists canonical paths for each artifact.

## 6. Risk Management Integration

**RMF-MAZA-Shield-v1.0** maintains severity/probability/detectability analysis and control hierarchies for hazards relevant to casino operations (examples under scrutiny include live fraud patterns **RM-008**, RG tilt stress **RM-010**, syndicate abuse **RM-017**, laundering structuring **RM-019**, and automation reliance **RM-013**). The **Risk Management Report** provides a condensed posture narrative suitable for executive and diligence audiences.

Residual risks remain subject to Management acceptance rules cited in **RR** and reviewed within **Management Review**.

## 7. Design Controls Summary

Design controls operate as **DID → DR → DOS** closure:

1. **DID** captures user needs and decomposed system requirements.
2. **DR-MAZA-001** confirms completeness and coherence prior to downstream reconciliation locks.
3. **DOS** documents realized outputs suitable for verification and audits.

Supporting narrative references may cite **`PROJECT_CONTEXT.md`** for technical fidelity without superseding controlled baselines.

## 8. Verification & Validation Overview

| Question | Plan | Typical linkage |
|----------|------|-----------------|
| “Built correctly?” | **VP-MAZA-Shield-v1.0** | SR obligations ↔ automated/scripted evidence |
| “Right product for intended use?” | **VALP-MAZA-Shield-v1.0** | UN obligations ↔ VL activities / demos |

Evidence portfolios reside under Quality-controlled dossiers (benchmark captures for latency KPIs where gated—see **DR** sustaining actions).

## 9. Release Authorization

**RR-MAZA-Shield-v1.0** aggregates release criteria, residual-risk acknowledgement, configuration baseline identification, and signatories. Commercial distribution endorsed by MAZALab aligns with RR disposition plus completion of prerequisite verification and validation closures contemplated under **VP**/**VALP** and **MR**.

## 10. Post-Market Surveillance & Continuous Improvement

Post-release, MAZALab intends **feedback loops** consistent with **DP** and **RMF** surveillance clauses: CAPA interfaces where warranted; backlog ingestion from validation rehearsals (including executive demos); periodic Management Review (**MR-MAZA-Shield-v1.0**) cadence and risk-register refreshes after substantive technology or jurisdictional shifts.

## 11. Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Prepared by | Laura (MAZALab) | | April 28, 2026 |
| Product / Operations Owner | | | |
| Quality / Regulatory | | | |

**Controlled distribution:** Intended for qualified reviewers under MAZALab Document Control; excerpts require parity review prior to external redistribution.
