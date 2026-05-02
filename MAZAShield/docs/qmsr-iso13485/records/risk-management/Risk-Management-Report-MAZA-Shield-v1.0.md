# Risk Management Report – MAZA Shield
**Product:** MAZA Shield – Casino Risk Intelligence Platform  
**Version:** 1.0  
**Report Date:** April 28, 2026  
**Prepared by:** Laura (MAZALab)  
**Reference:** ISO 14971:2019 + FDA QMSR

## Executive Summary

This report summarizes the risk management posture for MAZA Shield v1.0, an AI-powered Casino Risk Intelligence platform designed for explainable assessments, multi-dimensional scoring, and regulatory-grade auditability. Fifteen product risks (RM-007 through RM-021) were analyzed using MAZALab’s Severity × Probability × Detectability methodology; four risks register at the highest actionable band (RPN ≥ 60) and are subject to enhanced controls and monitoring. Overall residual risk is managed within documented acceptance criteria, with Severity 5 hazards targeted to ALARP through design measures, protective controls, and information for safety. Post-market surveillance and periodic management review ensure continuing suitability as deployments scale. This document is intended for executive readers and auditors seeking assurance without substituting for the full Risk Management File.

## 1. Scope

MAZA Shield is an AI-powered Risk Intelligence platform for casino operations, including entity resolution, multi-dimensional risk scoring (fraud, AML, Responsible Gaming, vendor risk, etc.), explainable assessments, and audit trail.

Intended use: Support casino operators in making risk-based decisions for player onboarding, ongoing monitoring, fraud prevention, compliance, and license protection.

## 2. Key Risks Identified

| Risk ID | Short Description | RPN | Residual Risk |
|---------|-------------------|-----|---------------|
| RM-007 | Failure in real-time entity resolution (aliases, shared devices) | 40 | Medium |
| RM-008 | Live collusion between players (chip dumping, signal sharing) | 60 | High |
| RM-009 | Systematic bonus and promotional abuse | 32 | Medium |
| RM-010 | Responsible Gaming — session tilt / loss of control | 60 | Medium-High |
| RM-011 | Vendor / PSP collusion or settlement failure | 45 | High |
| RM-012 | Operational downtime during peak hours | 8 | Low |
| RM-013 | Over-reliance on AI without human review | 48 | Medium-High |
| RM-014 | Accidental PII exposure in live operations | 10 | Low |
| RM-015 | Regulatory reporting delay for suspicious activity | 30 | Medium |
| RM-016 | Device or account takeover | 30 | Medium |
| RM-017 | Organized bonus ring / syndicate abuse | 60 | High |
| RM-018 | High-velocity betting fraud (AML / bonus exploitation) | 32 | Medium |
| RM-019 | Money laundering via structuring at cages / kiosks | 60 | High |
| RM-020 | Failure or corruption of third-party data integrations | 24 | Medium |
| RM-021 | Insider threat / employee-assisted fraud | 45 | Medium-High |

## 3. Highest Priority Risks (RPN ≥ 60)

**RM-008 — Real-time fraud (live collusion)**  
This risk is critical because collusion materializes on the casino floor in seconds and can drive substantial losses and regulatory scrutiny before manual review catches it. Controls include real-time graph analytics, adaptive combo detection, and live link analysis so operators receive timely, explainable signals alongside correlation-backed audit evidence.

**RM-010 — Responsible Gaming (session tilt)**  
Session tilt poses acute harm to vulnerable patrons and reputational exposure for operators; severity is magnified under peak-floor conditions. The High-stakes tilt detector and RG intervention playbook provide protective measures while preserving human escalation paths consistent with MAZALab’s hierarchy of controls.

**RM-017 — Bonus ring / syndicate**  
Organized syndicates exploit cross-terminal patterns that isolated rules miss, concentrating financial and promo integrity risk. Advanced pattern libraries plus graph link analysis reduce inherent likelihood of sustained abuse while supporting investigators with traceable outputs.

**RM-019 — Money laundering (structuring)**  
Structuring at cages and kiosks intersects AML obligations and gaming commissions’ expectations; failures can trigger outsized fines and license actions. Real-time transaction monitoring combined with structuring rules addresses velocity and layering signatures while feeding audit-ready narratives.

## 4. Risk Evaluation Summary

**Risk acceptability bands (MAZALab):**

| RPN range | Interpretation |
|-----------|----------------|
| ≥ 40 | Unacceptable — immediate risk reduction required |
| 20 – 39 | High — reduction or strong documented justification |
| 10 – 19 | Medium — reduce where reasonably practicable |
| &lt; 10 | Low — acceptable with monitoring |

**Severity 5 (catastrophic)** hazards must be driven to **ALARP** irrespective of RPN.

**Current portfolio snapshot (Section 5.3):**

| Risk Level | Number of Risks | Highest RPN | Status |
|------------|-----------------|-------------|--------|
| High | 8 | 60 | Risk reduction required |
| Medium | 6 | 32 | Monitoring + ALARP |
| Low | 1 | 8 | Acceptable with monitoring |

Residual risks at **RPN ≥ 20** or **Severity 5** require management review and documented acceptance. Reviews occur annually or when product, technology, or regulatory context changes materially.

## 5. Risk Controls Summary

MAZALab applies ISO 14971 control hierarchy: **(1)** inherent safety by design, **(2)** protective engineering and procedural measures, **(3)** information for safety (warnings, training, labeling). As of this report, listed controls for RM-007 through RM-020 are **implemented** in production or controlled release paths; RM-021 (insider threat) retains **planned** enhancements targeted for Q3 2026. Design-time explainability, correlation identifiers, human-in-the-loop workflows, and audit logging form the backbone of residual risk containment.

## 6. Post-Market Surveillance Plan

Surveillance spans daily/weekly performance metrics (accuracy, uptime, latency), monthly operator feedback and model drift reviews, continuous incident logging, weekly audit-log anomaly reviews, and quarterly regulatory intelligence. **KPIs** include: false-negative rate for high-risk patrons &lt; 2%, uptime ≥ 99.5%, explainable assessment latency &lt; 800 ms p95, all Severity 5 risks maintained at ALARP, and 100% of assessments carrying traceable `correlationId` with audit entries. Monthly summaries escalate to management; critical safety or compliance triggers activate CAPA.

## Approval

I confirm that the Risk Management activities for MAZA Shield v1.0 have been performed according to MAZALab policy and applicable standards.

**Approved by:** Laura  
**Date:** April 28, 2026
