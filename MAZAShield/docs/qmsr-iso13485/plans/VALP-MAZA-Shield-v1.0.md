# Validation Plan – MAZA Shield v1.0
**Product:** MAZA Shield – Casino Risk Intelligence Platform  
**Version:** 1.0  
**Date:** April 28, 2026  
**Prepared by:** Laura (MAZALab)

## 1. Purpose

This Validation Plan (VALP) defines **how MAZALab demonstrates that MAZA Shield v1.0 meets documented user needs and intended use** under controlled conditions. Validation answers: **“Did we build the right product?”** distinct from **verification** (correct implementation of specifications per **VP-MAZA-Shield-v1.0**).

Objectives:

- Map validation evidence to **UN-xxx** stakeholder requirements in **DID-MAZA-Shield-v1.0**.
- Exercise **intended-use workflows** representative of casino operator investigation, compliance oversight, and executive demonstration—including the **Gaming Demo** (`demo/gaming-dashboard.html` served via `/demo/*`).
- Align high-impact scenarios with hazard controls and residual-risk narratives in **RMF-MAZA-Shield-v1.0** (e.g., RM-008, RM-010, RM-017, RM-019).
- Integrate with lifecycle gates in **DP-MAZA-Shield-v1.0** (design transfer, stakeholder rehearsal, release readiness).

Outputs are **records suitable for regulatory inspection**: scripted scenario transcripts, reviewer sign-offs, and remediation logs where acceptance criteria are not met.

## 2. Scope

**In scope:**

| Area | Description |
|------|-------------|
| **Intended-use pathways** | Risk-based patron assessment narratives (gaming domain); entity-centric explanation consumption; audit reconstruction by correlation identifier |
| **Demonstration fidelity** | Gaming Demo: multilingual UX (EN / ES / PT), Run Full Demo flow, KPI / tier / combo / playbook / audit overview / Markdown export |
| **Stakeholder rehearsal** | Operator-style walkthroughs; optional compliance observer participation |
| **Conference readiness** | G2E-style timed rehearsal against `demo/package` runbook materials |
| **Residual-risk acknowledgment** | Confirmation that outputs reinforce human review (no undisclosed replacement of regulatory judgment) |

**Out of scope:**

| Exclusion | Rationale |
|-----------|-----------|
| Production deployment in live regulated jurisdictions without operator-specific operational qualification | Covered under operator OQ/IQ programs external to MAZALab baseline |
| Substituting validation for statutory AML/SAR filing obligations | Operators retain legal accountability |
| Exhaustive adversarial red-teaming | Addressed under separate security assessment if commissioned |

Scope changes require revision of this VALP under change control and alignment with **DP** / **DID**.

## 3. Traceability to User Needs

Validation activities (**VL-xxx**) map to **UN-xxx** from the DID:

| UN ID | User need (summary) | Primary validation activities |
|-------|----------------------|------------------------------|
| **UN-001** Explainable onboarding intelligence | VL-02, VL-03 (scenario narrative review) |
| **UN-002** Cross-alias correlation | VL-02 (multi-entity / alias scenarios where scripted) |
| **UN-003** Investigator drivers & combos | VL-02, VL-03 (Adaptive Combos, drivers visibility) |
| **UN-004** RG escalation cues | VL-02 (tilt / RG pathway demonstration slice) |
| **UN-005** Audit reconstruction | VL-04 (correlation-ID drill from dashboard/API narrative) |
| **UN-006** Multilingual demonstration | VL-01 (locale switching acceptance) |
| **UN-007** Documented deployment path | VL-05 (environment/runbook adherence) |
| **UN-008** Residual automation risk transparency | VL-06 (disclaimer & human-review checklist) |

Atomic trace rows (**UN ↔ VL ↔ evidence ID**) reside in the Requirements Traceability Matrix maintained under Quality records.

## 4. Validation Strategy

Validation uses **layered stakeholder-facing evidence**:

| Layer | Description |
|-------|---------------|
| **V1 – Scripted demo scenarios** | Repeatable runs of Gaming Demo “Run Full Demo” plus curated POST payloads reflecting fraud/RG/AML storylines per **demo/package** scripts |
| **V2 – Structured walkthrough** | Moderated session simulating operator analyst tasks with capture forms (observations, severity, pass/fail vs acceptance criteria) |
| **V3 – Executive / conference rehearsal** | Time-boxed G2E-style dry run using presenter checklist; records timing, slides/runbook alignment, export handoff |
| **V4 – Risk-themed spot checks** | Targeted review that narrative outputs align with **RMF** priority themes (live collusion signals, RG tilt escalation path, syndicate/structuring pattern visibility—not algorithmic certification, but **intended-use plausibility**) |

Failures trigger CAPA or deferral of promotion per **DP** §10 until disposition.

## 5. Validation Activities & Methods

### 5.1 Activity matrix

| Activity ID | Title | Method | UN coverage | RMF themes (illustrative) | Evidence artifact |
|-------------|-------|--------|-------------|---------------------------|-------------------|
| **VL-01** | Multilingual demo acceptance | Cycle EN → ES → PT; confirm ribbon, KPI labels, playbook strings coherent; persist preference reload | UN-006 | — | Screen capture set + signed checklist |
| **VL-02** | Scripted Gaming Demo scenario | Execute **Run Full Demo**; observe KPI population, tier chart, adaptive combos, playbook, audit overview; export Quick + Full Markdown | UN-001–UN-004 | RM-008, RM-010, RM-017 | Timestamped export files + observer notes |
| **VL-03** | Operator walkthrough (moderated) | Analyst persona follows investigator storyline using dashboard + API transcript snippets from rehearsal script | UN-001–UN-003 | RM-008, RM-019 | Moderator sign-off form |
| **VL-04** | Audit trace drill | Select correlation ID from VL-02 export; retrieve via `/audit-log/:correlationId`; reconcile counts vs dashboard stats | UN-005 | RM-014, RM-015 | HTTP transcript + screenshot |
| **VL-05** | Launcher / environment validation | Run `demo/start-demo.ps1` (or equivalent); confirm `/health` gate, dashboard URL, documented PORT behavior | UN-007 | RM-012 (availability narrative) | Launcher stdout log |
| **VL-06** | Labeling & human-review acknowledgement | Review dashboard disclaimers / playbook wording for explicit human-in-the-loop expectation | UN-008 | RM-013 | Text excerpt review sheet signed |

### 5.2 G2E rehearsal (conditional milestone)

| Step | Action | Owner | Record |
|------|--------|-------|--------|
| G2E-1 | Dry-run duration ≤ target window per runbook (`demo/package/README-DEMO.md` where applicable) | Presenter | Timer log |
| G2E-2 | Export leave-behind Markdown within session | Presenter | File hash / filename |
| G2E-3 | Capture audience Q&A themes for risk register feedback | Product | Meeting minutes |

G2E rehearsal is **required** before any public MAZALab-endorsed booth deployment referencing MAZA Shield v1.0.

### 5.3 Roles

| Role | Responsibility |
|------|----------------|
| Presenter / Lead Engineer | Executes VL-01, VL-02, VL-05; collects artifacts |
| Product Owner | Approves VL-03 moderator outcomes; owns G2E-3 feedback loop |
| Compliance / Risk liaison | Optional observer for VL-03 / VL-06; confirms alignment with RMF disclosure posture |
| Quality | Custodian of validation dossier index |

## 6. Acceptance Criteria

Each activity **passes** when **all** criteria in its row hold:

| Activity ID | Acceptance criteria |
|-------------|----------------------|
| **VL-01** | No untranslated blocking strings in primary flows; locale survives reload; documented exceptions listed if any |
| **VL-02** | Demo completes without blocking UI failure; KPIs non-empty post-run; Markdown exports non-empty and reference assessment-era timestamps or correlation context |
| **VL-03** | Moderator confirms storyline coherence (“explainability sufficient for adjudication rehearsal”)—binary pass at reviewer discretion |
| **VL-04** | Audit retrieval returns consistent entry count vs dashboard narrative within documented tolerance (zero discrepancy preferred) |
| **VL-05** | Health probe green before browser launch; dashboard reachable at documented URL |
| **VL-06** | Signed acknowledgment that human review remains mandatory where statute/policy requires; no contradictory marketing claims detected |

**Conditional acceptance:** Allowed only with documented risk rationale, CAPA linkage, and Management approval per **DP** / **RMF** acceptance rules.

## 7. Records & Reporting

| Record type | Contents | Retention |
|-------------|----------|-----------|
| **Validation Summary Report (VSR)** | Date, build SHA, activity IDs, pass/fail, hyperlinks to evidence | Per MAZALab records policy |
| **Evidence bundle** | Exports (Markdown), transcripts, screenshots, signed checklists, G2E minutes | Same |
| **Feedback log** | Operator / observer notes feeding risk register or backlog | Linked from VSR |

Nonconformances escalate per CAPA; validation cycle **cannot** substitute for closure of critical verification failures identified under **VP**.

## 8. Approval

This Validation Plan is approved for execution against MAZA Shield v1.0 intended-use baselines described in **DID**, **DP**, and **RMF**, using the Gaming Demo and supporting artifacts referenced herein.

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Prepared by | Laura | | April 28, 2026 |
| Product Owner | | | |
| Quality assurance | | | |
