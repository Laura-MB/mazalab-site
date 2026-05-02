# Design and Development Plan – MAZA Shield
**Product:** MAZA Shield – Casino Risk Intelligence Platform  
**Version:** 1.0  
**Plan Date:** April 28, 2026  
**Prepared by:** Laura (MAZALab)

## 1. Purpose

This Design and Development Plan (DP) defines the controlled activities, deliverables, and review gates required to design, verify, validate, release, and maintain **MAZA Shield v1.0**, MAZALab’s Casino Risk Intelligence software offering built on the Mother Brain core (entity resolution, multi-domain risk scoring, assessment orchestration, governance-grade audit logging, and operator-facing demonstration assets).

The objectives of this plan are to:

- Ensure **design inputs** are traced to **design outputs** and verified against documented acceptance criteria.
- Integrate **risk management** (per ISO 14971 and MAZALab Risk Management File **RMF-MAZA-Shield-v1.0**) throughout development.
- Provide **audit-ready evidence** of planning, reviews, configuration management, and controlled transfer of release candidates suitable for management approval and regulatory inspection frameworks referenced in §3.

This DP constitutes the master schedule for MAZA Shield v1.0 design controls execution within MAZALab’s Quality Management System.

## 2. Scope

**In scope for MAZA Shield v1.0:**

| Layer | Components |
|--------|------------|
| **Mother Brain Core** | Modular Entity Resolution (normalization, similarity scoring, conflict detection, explanations); Risk Scoring (general + **gaming v0.2 closed** domains); composite scoring with bounded adaptive combos; driver prioritization and structured explanations. |
| **Assessment Pipeline** | Resolve → score → analyst-facing result; gaming branch with `gamingInsights`, advanced pattern detectors (session tilt, high-stakes tilt, PSP collusion, promo rail stack, AML sleeper lift), operator playbook metadata, batch recommendations. |
| **API Surface** | REST endpoints under Express: `/health`, `/resolve`, `/assess`, `/assess-risk`, `/audit-log`, `/audit-log/:correlationId`, `/audit-log/stats`; correlation-id middleware; structured logging. |
| **Governance & Audit** | Dual audit backends (JSON append-only; SQLite optional); persistence abstraction; append-only semantics; statistics and trends for operational oversight. |
| **Demonstration & UX** | Static Gaming Demo Dashboard (`/demo/*`): multilingual UI, theme persistence, KPI strip, tier distribution, comparative views, adaptive combos, operator playbook, audit overview, exportable Markdown reports. |
| **Tooling & Ops** | Configuration service (`.env` + layered JSON); presenter launcher scripts; daily engineering hygiene scripts aligned with MAZALab governance. |

**Out of scope for v1.0 (explicit exclusions):**

- Full OSINT / general-purpose Risk Intelligence vertical beyond casino-oriented pathways documented herein.
- Hardware deployment or on-premises appliance certification (software-only release model unless superseded by amendment).
- Regulatory submission packaging as a medical device; MAZA Shield is positioned as **risk-decision support software for casino operations**; jurisdictional positioning remains subject to Legal review.

Changes to scope require controlled revision of this DP per MAZALab Design Change procedure.

## 3. Regulatory References

Design and development activities shall be executed in alignment with the following framework (non-exhaustive; Legal may prescribe additional jurisdictional obligations):

| Reference | Application |
|-----------|-------------|
| **ISO 13485:2016** | Quality management system requirements—design and development (§7.3), risk-based thinking, document control, traceability. |
| **ISO 14971:2019** | Risk management of medical devices—risk analysis, evaluation, control, residual risk, production/post-production phases (mapped to MAZA Shield risk file). |
| **21 CFR Part 820** (where applicable via FDA QMSR alignment) | Design controls, CAPA interfaces, records integrity—interpreted per MAZALab policy for SaMD-like governance discipline. |
| **IEC 62304:2006 + A1:2015** | Software life-cycle processes—software safety classification posture, development/maintenance practices for auditability (Class B aligned documentation unless amended). |
| **MAZALab internal** | Corporate AI governance policy; correlation-ID traceability standard; commit conventions and release automation tied to baselines. |

This DP shall be read together with the **Risk Management File (RMF-MAZA-Shield-v1.0)** and applicable Standard Operating Procedures (Design & Development, Document Control, Risk Management).

## 4. Design Inputs

Design inputs are documented, reviewed for completeness and clarity, and approved prior to detailed implementation of each release slice. Primary categories:

| ID | Category | Description |
|----|-----------|-------------|
| DI-01 | **User needs** | Casino operators require explainable, timely risk signals for onboarding, ongoing monitoring, fraud/AML/RG workflows; auditors require immutable traceability (`correlationId`, append-only logs). |
| DI-02 | **Functional performance** | Sub-second interactive assessments for demo-grade workloads; bounded combo synergy; multilingual presentation (EN/ES/PT); dark/light operational viewing. |
| DI-03 | **Safety & ethics** | Human-in-the-loop expectations; bias visibility flags; no undisclosed automation replacing mandatory regulatory judgment; disclaimers in UX where applicable. |
| DI-04 | **Risk outputs** | Hazard-related inputs from **RMF-MAZA-Shield-v1.0** (e.g., RM-008, RM-010, RM-017, RM-019 high-RPN tracks) drive control design priorities in gaming scoring and audit behavior. |
| DI-05 | **Interface & integration** | REST/JSON API contracts; static dashboard same-origin delivery; optional SQLite audit backend; environment-driven configuration. |
| DI-06 | **Labeling & IFU** | Executive summaries, presenter runbooks (`demo/package`), Quality Records references for stakeholder demonstrations (G2E alignment). |

Design inputs are refined through stakeholder review (Product, Engineering, Compliance representative as designated by MAZALab).

## 5. Design Outputs

Design outputs shall uniquely trace to design inputs and shall be suitable for verification. Minimum outputs for MAZA Shield v1.0:

| Output | Description |
|--------|-------------|
| **Software architecture & modules** | Express bootstrap (`src/app.ts`, `src/index.ts`), API routers (`src/api/`), Entity Resolution (`src/core/entity-resolution/`), Risk Scoring (`src/core/risk-scoring/`), Assessment (`src/core/assessment/`), Gaming vertical (`src/core/gaming/`), Governance/Audit (`src/core/governance/`). |
| **Specifications** | API endpoint matrix (PROJECT_CONTEXT §3); JSON shapes for assessment and audit entries; configuration schema documentation. |
| **Records** | Risk Management File; Design Reviews (when scheduled); verification evidence repositories; release baseline tags; demo artifacts. |
| **Labeling & IFU** | Dashboard copy (multilingual strings); export report templates; presenter documentation (`README-DEMO`, demo launcher scripts). |

Design outputs are revision-controlled under configuration management (§9).

## 6. Design Reviews

Formal design reviews shall confirm adequacy of outputs against inputs before baseline promotion.

| Review | Timing | Focus |
|--------|--------|-------|
| **DR-MAZA-001** | End of core pipeline stabilization | Architecture, DI boundaries, audit abstraction, API surface completeness vs DI-02/DI-05. |
| **DR-MAZA-002** | Gaming v0.2 closure milestone | Advanced detectors, playbook alignment, synergy bounds, correlation coverage vs risk controls RM-007–RM-021. |
| **DR-MAZA-003** | Pre-release candidate | Dashboard parity with API; export flows; residual risk acceptance alignment; open remediations. |

Each review produces minutes: attendees, decisions, actions (owner + due date), and disposition (Pass / Pass with actions / Hold).

## 7. Design Verification & Validation Plan

**Verification** confirms that design outputs meet specified **design inputs** (Are we building the product right?).

| Activity | Method | Records |
|----------|--------|---------|
| Unit & integration tests | Automated test suite execution (`npm test` / CI when enabled) | Logs, coverage summaries |
| API verification | Contract checks against documented endpoints; `/health`, `/audit-log/stats` consistency | Test scripts, screenshots |
| Audit integrity | Append-only validation; correlation lookup correctness | Scripted probes, audit queries |

**Validation** confirms the product meets **user needs** under intended use (Are we building the right product?).

| Activity | Method | Records |
|----------|--------|---------|
| Demo scenario validation | Scripted casino scenarios (velocity, combos, RG tilt pathways) | Demo run logs, exported Markdown reports |
| Presenter rehearsal | Stakeholder walkthrough against runbook | Sign-off checklist |
| Operational rehearsal | Environment configuration drill (`ConfigService`, backends) | Deployment notes |

Residual linkage to software lifecycle classification shall be maintained per IEC 62304 alignment statement in the Device Master Record equivalent summary.

## 8. Risk Management Integration

- **RMF-MAZA-Shield-v1.0** is the authoritative hazard register for MAZA Shield v1.0.
- Design decisions affecting Severity 5 hazards or RPN ≥ thresholds per MAZALab policy require updates to risk controls and residual risk rationale prior to release approval.
- Verification activities shall demonstrate implementation of priority controls for **RM-008, RM-010, RM-017, RM-019** (graph/adaptive analytics, RG playbook, syndicate patterns, AML structuring monitors).
- Post-market surveillance inputs (false negative tracking, uptime, latency KPIs) feed annual risk review.

Cross-reference: **Risk Management Report – MAZA Shield v1.0** for executive consumption.

## 9. Configuration Management

- **Version control:** Git repository `main` / controlled feature branches; conventional commits where applicable; tagged releases for baselines.
- **Identification:** `package.json` version field; changelog automation (`standard-version`) where configured in repo policy.
- **Build artifacts:** TypeScript compilation outputs (`dist/` when applicable); static demo assets under `demo/`.
- **Controlled documents:** QMS records under `docs/qmsr-iso13485/`; DP revisions maintained under document control procedure.
- **Environment separation:** `.env` for secrets and ports; non-production vs staging naming conventions.

Unauthorized baseline modifications are prohibited; changes follow Design Change / Change Control procedures.

## 10. Design Transfer & Release Criteria

Design transfer is authorized when **all** of the following are satisfied:

| Criterion | Evidence |
|-----------|----------|
| Approved DP revision | Signed DP (management / designated QA role per RACI) |
| Verification closure | Critical automated checks passing; API smoke evidence archived |
| Risk acceptance | No unacceptable residual risks without documented justification per RMF |
| Configuration baseline | Tag or merge commit identified; `package.json` version coherent |
| Documentation package | RMF + Risk Management Report + DP + demo instructions current |

Transfer applies to designated deployment environments (demo servers, controlled pilot hosts). Production-scale scaling may require supplementary DP amendment.

## 11. Roles and Responsibilities

| Role | Responsibility |
|------|------------------|
| **Product Owner** | Prioritizes scope, accepts validation outcomes, aligns roadmap with revenue milestones (e.g., G2E). |
| **Lead Engineer / Architect** | Ensures modular boundaries, performance budgets, audit correctness. |
| **Quality / Regulatory liaison** | Maintains traceability matrices, review schedules, QMS record consistency. |
| **Risk Management Owner** | Maintains RMF updates, severity/RPN governance, surveillance KPI alignment. |
| **Laura (Author)** | Executes documentation, approval routing per MAZALab delegation of authority. |

Specific named substitutes may be documented in the Quality Manual roster.

## 12. Timeline & Milestones (Q2–Q3 2026)

| Period | Milestone | Deliverables |
|--------|-----------|----------------|
| **Apr 2026** | Technical polish closure (Mother Brain); Gaming v0.2 closed | Stable API + dashboard demo; audit backends verified |
| **May–Jun 2026** | Design review DR-MAZA-003; executive risk reporting | Risk Management Report v1.0; DP v1.0 approval |
| **Jun–Jul 2026** | Stakeholder demonstrations; rehearsal cycles | Updated presenter packages; scenario scripts |
| **Q3 2026** | Controlled pilot readiness (conditional) | Pilot checklist; enhanced insider-threat controls (RM-021 roadmap); post-market surveillance ramp |

Dates are planning estimates; slip triggers revision of this DP with rationale recorded under change control.

---

**Approval**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Prepared by | Laura | | April 28, 2026 |
| Quality / Management Review | | | |
