# Design Input Document – MAZA Shield
**Product:** MAZA Shield – Casino Risk Intelligence Platform  
**Version:** 1.0  
**Date:** April 28, 2026  
**Prepared by:** Laura (MAZALab)

## 1. Purpose

This Design Input Document (DID) defines **verified stakeholder needs** and **system-level requirements** for **MAZA Shield v1.0**. Together they constitute the **design inputs** (ISO 13485 §7.3 / analogous design-controls frameworks) for the Mother Brain–based software comprising Entity Resolution, multi-domain Risk Scoring (including closed gaming vertical v0.2), Assessment orchestration, governance-grade Audit Logging, and the Gaming Demo presentation surface.

The DID serves three objectives:

1. **Normalization:** Consolidate requirements from operators, compliance stakeholders, and internal MAZALab governance policies into a single controlled baseline suitable for traceability matrices (requirements ↔ architecture ↔ verification ↔ risk controls).

2. **Auditability:** Support inspections against referenced regulatory frameworks (§2) and demonstrate linkage to the **Risk Management File (RMF-MAZA-Shield-v1.0)** and Design & Development Plan (**DP-MAZA-Shield-v1.0**).

3. **Scope discipline:** Establish acceptance boundaries so downstream **design outputs** (architecture, APIs, UX copy, verification protocols) remain unambiguous.

This document shall not supersede Legal jurisdictional positioning regarding regulated gambling markets or AML statutes; operators retain statutory obligations independent of MAZA Shield deployment mode.

## 2. Regulatory References

Requirements herein shall be interpreted in conjunction with applicable frameworks listed below. MAZALab retains Legal oversight for jurisdiction-specific obligations beyond software capability statements.

| Reference | Usage |
|-----------|--------|
| **ISO 13485:2016** | Design and development inputs—controlled approval prior to realization (concept alignment); verification traceability to documented outputs. |
| **ISO 14971:2019** | Harm-oriented rationale informing usability, labeling, and residual-risk disclosures referenced under §5. |
| **21 CFR Part 820** | Where aligned via FDA QMSR posture—design controls discipline applicable to SaMD-like lifecycle artifacts maintained by MAZALab. |
| **IEC 62304:2006 + A1:2015** | Software lifecycle—requirements granularity adequate for verification procedures at documented safety classification (documentation posture aligned with Class B unless superseded). |
| **GDPR / analogous privacy regimes** | Influencing pseudonymization, confidentiality-by-design, and audit-log minimization principles (specific statutes delegated to Legal/Data Protection Officer where designated). |
| **Industry AML/Gaming norms** | Influencing semantic completeness for AML-aware workflows—operators enforce SAR/KYC obligations independently of MAZA Shield labeling as decision-support software. |

Controlled superseding revisions shall propagate trace updates across DID ↔ DP ↔ RMF cross-links.

## 3. User Needs (Stakeholder Requirements)

Identifiers below (**UN-xxx**) express stakeholder intentions independently of implementation. Acceptance criteria supplement qualitative statements.

| ID | User Need |
|----|-----------|
| **UN-001** | Operators shall integrate explainable risk intelligence during patron onboarding without ambiguous opaque scoring artifacts obstructing adjudication workflows. |
| **UN-002** | Surveillance analysts shall correlate entities across aliases, shared credentials, or fragmented identifiers visible across cage / kiosk / online journeys consistent with operational onboarding narratives. |
| **UN-003** | Fraud and AML investigation personnel shall obtain prioritized explanations highlighting dimensional drivers and optional synergistic combinations indicative of coordinated abuse patterns. |
| **UN-004** | Responsible Gaming personnel shall receive actionable escalation cues where behavioral indicators exceed configurable thresholds within gaming-domain pathways (without replacing statutory RG interventions where mandated locally). |
| **UN-005** | Compliance officers shall rely on append-only audit artifacts referencing immutable correlation identifiers spanning assessment lifecycle events suitable for inquiry reconstruction. |
| **UN-006** | Marketing / executive stakeholders shall demonstrate functionality via multilingual (EN / ES / PT) dashboard demonstrations reflecting credible enterprise UX parity during regulated conferences (e.g., G2E). |
| **UN-007** | Technical operators shall deploy via documented REST APIs & configuration surfaces minimizing undeclared implicit operational coupling to vendor-specific deployment stacks. |
| **UN-008** | Organizations shall retain oversight posture acknowledging residual inherent automation risks (false negatives / positives) requiring periodic calibration aligned with MAZALab Risk Management surveillance KPIs. |

Acceptance criteria (representative examples—not exhaustive):

- Demonstrated reproducibility of assessment flows via scripted scenarios archived under verification records.
- Audit reconstruction demonstrating retrieval by correlation identifier without destructive mutation.

## 4. System Requirements

Each requirement (**SR-xxx**) includes verification method shorthand (**V** = verification protocol suite artifact planned under DP §7).

### 4.1 Functional Requirements

| ID | Requirement |
|----|----------------|
| **SR-F-001** | System shall expose `/health` returning operational readiness suitable for orchestrator probes (schema documented). |
| **SR-F-002** | System shall accept POST `/resolve` payloads conforming to documented JSON schema and return canonical entities with textual explanations enumerating similarity rationale & conflicts when detected. |
| **SR-F-003** | System shall execute POST `/assess` orchestrating entity resolution followed by risk scoring with configurable domain (`general` \| `gaming`). |
| **SR-F-004** | System shall execute POST `/assess-risk` producing array-aligned risk assessments suitable for batch adjudication flows. |
| **SR-F-005** | Gaming-domain assessments shall embed structured `gamingInsights` containing adaptive combo summaries bounded synergy uplift ≤ documented architectural ceiling (v0.2 enforcement). |
| **SR-F-006** | Gaming-domain pathway shall optionally enrich outputs via advanced pattern detectors (`session tilt`, `high-stakes tilt`, `psp collusion`, `promo rail stack`, `aml sleeper lift`) producing prioritized recommendation lines referencing playbook templates & artefact catalog identifiers without altering unrelated scoring dimensions illicitly. |
| **SR-F-007** | System shall emit correlation identifiers (`x-correlation-id`) validated against strictly enumerated charset `[A-Za-z0-9._:-]` with synthetic UUID fallback when inbound invalid/absent. |
| **SR-F-008** | Audit log retrieval endpoints (`GET /audit-log`, `/audit-log/:correlationId`, `/audit-log/stats`) shall expose pagination & filtering constraints documented to prevent unbounded queries. |
| **SR-F-009** | Dashboard static assets shall be served same-origin under `/demo/*` preserving demonstration reproducibility. |
| **SR-F-010** | Dashboard shall provide Run Demo capability invoking assessments against API endpoints producing KPI refresh consistent with returned scenario outcomes. |

### 4.2 Performance Requirements

| ID | Requirement |
|----|----------------|
| **SR-P-001** | Interactive demonstration workloads shall complete primary assessment round-trip within **800 ms p95** latency budget under documented baseline hardware profile (verification benchmark artifact). |
| **SR-P-002** | Streaming audit statistics aggregates (`trends`, rolling windows) shall compute within acceptable interactive thresholds preventing presenter-visible stalls (>2 s maximum tolerated except degraded operational anomaly scenarios documented separately). |
| **SR-P-003** | Append-only audit persistence shall sustain throughput consistent with concurrent presenter rehearsals without structural corruption (atomic flush semantics). |

### 4.3 Interface Requirements

| ID | Requirement |
|----|----------------|
| **SR-I-001** | External integration surface shall be **HTTPS-ready REST + JSON** (deployment TLS termination externalized unless expressly amended). |
| **SR-I-002** | Audit persistence abstraction shall support selectable backends (`json` append-only file vs `sqlite`) via configuration flag without consumer-side branching beyond documented bootstrap sequencing. |
| **SR-I-003** | Dashboard localization toggles shall persist user preference (`localStorage`) preventing unintended locale relapse mid-demonstration. |

### 4.4 Data Requirements

| ID | Requirement |
|----|----------------|
| **SR-D-001** | Structured logs shall encapsulate correlation-scoped child loggers preserving lineage across middleware → assessment boundary telemetry events. |
| **SR-D-002** | Audit entries shall preserve immutable append semantics prohibiting silent destructive edits; corruption detection pathways shall recover via staged backups/quarantine per governance architecture documentation. |
| **SR-D-003** | Gaming combo occurrences embedded within audit snapshots shall remain reproducible relative to originating correlation identifiers for longitudinal forensic alignment. |

### 4.5 Security & Privacy Requirements

| ID | Requirement |
|----|----------------|
| **SR-S-001** | Correlation identifiers shall not substitute lawful Know-Your-Customer identifiers where mandated externally—software labeling clarifies supportive linkage semantics only. |
| **SR-S-002** | Sensitive telemetry categorizations shall align with MAZALab governance minimizing plaintext spillover beyond necessity for investigative reproducibility (pattern masking strategies enumerated under governance annex where applicable). |
| **SR-S-003** | Administrative endpoints exposing aggregated audit statistics shall resist naive enumeration attacks via bounded pagination limits (maximum caps enforced server-side). |

### 4.6 Usability & Accessibility Requirements

| ID | Requirement |
|----|----------------|
| **SR-U-001** | Dashboard shall implement persistent theme toggle (`light` \| `dark`) honoring reduced glare modes typical for prolonged booth demonstrations. |
| **SR-U-002** | Explainability constructs shall prioritize actionable verbs enumerating recommended reviewer interventions aligned with operator playbook hierarchy where populated. |
| **SR-U-003** | Export pathways shall yield Markdown artifacts suitable for stakeholder distribution channels without proprietary binary dependencies blocking archival workflows. |

Trace shorthand aggregate (`SR-*`) tied into DP verification mapping spreadsheet maintained under Quality records repository.

## 5. Traceability to Risk Management File

Mapping aligns hazard mitigation posture encoded within requirements versus documented hazards (**RM-xxx**). Partial illustrative references:

| Requirement Cluster | Risk IDs Addressed (Representative) | Mitigation Mechanism |
|-----------------------|-------------------------------------|----------------------|
| Explainability & deterministic synergy boundaries (**SR-F-005 / SR-U-002**) | RM-008, RM-017, RM-018 | Transparent combo uplift ceilings & narrative explanations enabling investigator adjudication |
| Responsible Gaming pathway enrichment (**SR-F-006 / UN-004**) | RM-010 | Tilt detectors & playbook escalation scaffolding |
| AML structuring monitors (**SR-F-006**) | RM-019 | Structuring / velocity pattern integrations |
| Audit persistence integrity (**SR-D-002 / SR-F-008**) | RM-014, RM-015 | Append-only guarantees & bounded retrieval windows |
| Privacy posture (**SR-S-001 / SR-S-002**) | RM-014 | Identifier linkage semantics & minimization discipline |
| Performance resilience (**SR-P-001**) | RM-012 | Latency envelope sustaining timely interventions |

Complete atomic mapping resides in **Risk Traceability Matrix** spreadsheet revision synchronized with RMF updates—failure to maintain parity constitutes deviation requiring corrective action.

## 6. Design Input Review & Approval

Design inputs shall undergo structured review verifying completeness, absence of mutually contradictory constraints, and feasibility versus DP milestone sequencing prior to downstream realization baseline freeze.

| Checkpoint | Criteria |
|------------|----------|
| Completeness | All §4 requirement categories populated without unresolved TBD placeholders inhibiting verification drafting |
| Consistency | Cross-checked vs stakeholder interviews / PROJECT_CONTEXT authoritative narrative |
| Risk coherence | §5 mapping reconciled against latest approved RMF revision |
| Approval authority | Product Owner + Quality / Regulatory liaison signatories |

---

**Approval**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Prepared by | Laura | | April 28, 2026 |
| Product Owner | | | |
| Quality / Regulatory | | | |
