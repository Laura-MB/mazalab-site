# Design Output Specification – MAZA Shield v1.0
**Product:** MAZA Shield – Casino Risk Intelligence Platform  
**Version:** 1.0  
**Date:** April 28, 2026  
**Prepared by:** Laura (MAZALab)

## 1. Purpose

This Design Output Specification (DOS) documents **verified design outputs** realized for **MAZA Shield v1.0**—software architecture, modules, interfaces, artifacts, and records—that satisfy **DID-MAZA-Shield-v1.0** design inputs and are controlled under configuration management. It establishes traceability from stakeholder and system requirements (**UN-xxx**, **SR-xxx**) through implementation structures to **verification** evidence references and **risk controls** aligned with **RMF-MAZA-Shield-v1.0**.

The DOS constitutes the authoritative architecture-and-deliverables baseline for audits, design reviews, and release acceptance alongside **DP-MAZA-Shield-v1.0** and **DR-MAZA-001**.

## 2. Traceability to Design Inputs

### 2.1 User needs → primary realization locus

| User need | Primary design outputs (this DOS §4) |
|-----------|--------------------------------------|
| **UN-001** Explainable onboarding intelligence | Risk scoring explanations; gaming `gamingInsights`; dashboard KPI & tier presentation |
| **UN-002** Cross-alias entity correlation | Entity Resolution module (`src/core/entity-resolution/`); `/resolve`, `/assess` pipeline |
| **UN-003** Investigator drivers & combos | Gaming domain scoring; adaptive combos (`risk-scoring/combos.ts`); advanced pattern envelope (`src/core/gaming/`) |
| **UN-004** RG escalation cues | Session / high-stakes tilt detectors; playbook templates; RG metadata in gaming vertical |
| **UN-005** Append-only audit reconstruction | Governance audit service; JSON/SQLite backends; `/audit-log*` endpoints |
| **UN-006** Multilingual demo | `demo/gaming-dashboard.html` EN/ES/PT dictionary & persistence |
| **UN-007** Documented APIs & config | Express routers; `ConfigService`; `.env` + layered JSON |
| **UN-008** Residual risk acknowledgment | Disclaimers in UX copy; surveillance KPI alignment via observable metrics (audit stats, latency bounds) |

### 2.2 System requirements → output artifacts (summary)

| Requirement band | Realization |
|-------------------|-------------|
| **SR-F-001–SR-F-010** | `src/app.ts`, `src/index.ts`, `src/api/*`, assessment & gaming wiring per §4.1–4.2 |
| **SR-P-001–SR-P-003** | Performance envelope enforced by implementation + verification benchmarks (DP §7) |
| **SR-I-001–SR-I-003** | REST/JSON handlers; audit backend selection; dashboard `localStorage` / theme |
| **SR-D-001–SR-D-003** | Winston correlation loggers; append-only audit semantics; combo snapshots in audit entries |
| **SR-S-001–SR-S-003** | Correlation-ID semantics; bounded pagination/query caps on audit routes |
| **SR-U-001–SR-U-003** | Dashboard theme & export Markdown flows |

Full atomic matrices (**UN/SR ↔ module ↔ test ↔ RM**) are maintained under Quality records per **DR-MAZA-001** action items.

## 3. Architecture Overview

MAZA Shield v1.0 is implemented as a **Node.js (TypeScript)** service with a **modular monolith** layout:

```
┌─────────────────────────────────────────────────────────────────┐
│  Express application (src/app.ts)                             │
│  correlation-id middleware │ JSON body │ routers │ errors      │
└───────────────┬─────────────────────────────────────────────────┘
                │
    ┌───────────┴───────────┐
    │       API layer       │  /health /resolve /assess /assess-risk /audit-log /demo
    └───────────┬───────────┘
                │
    ┌───────────┴──────────────────────────────────────────────────┐
    │ Assessment orchestration (AssessmentService / pipeline)       │
    │   ├─ Entity Resolution                                         │
    │   ├─ Risk Scoring (general │ gaming)                         │
    │   └─ Gaming vertical v0.2 (advanced patterns + playbook)        │
    └───────────┬──────────────────────────────────────────────────┘
                │
    ┌───────────┴───────────┐
    │ AuditLogService      │  append-only │ JSON file │ SQLite optional
    └─────────────────────┘
```

**Design principles embodied:** dependency-injected assessment wiring; pure pipeline routing for general vs gaming; governance persistence abstracted behind `AuditLogPersistenceBackend`; correlation-scoped logging across middleware and assessment boundary.

## 4. Key Design Outputs

### 4.1 Core Modules

| Output ID | Module path (repository) | Description | DID / risk linkage (representative) |
|-----------|--------------------------|-------------|--------------------------------------|
| **DO-CORE-01** | `src/core/entity-resolution/` | Normalization, similarity (e.g., Jaccard / Levenshtein pathways per PROJECT_CONTEXT), conflict detection, explanation builder | UN-002; SR-F-002; RMF RM-007 |
| **DO-CORE-02** | `src/core/risk-scoring/` | General + gaming configurations; multi-factor composite scoring; bounded adaptive combos (`combos.ts`); drivers & explanations | UN-001, UN-003; SR-F-005; RM-008–RM-019 clusters |
| **DO-CORE-03** | `src/core/assessment/` | Assessment pipeline (resolve → score → structured result); explicit gaming branch; `AssessmentService` as single DI wiring point | SR-F-003, SR-F-004; RM-013 (human-in-loop narrative in outputs) |
| **DO-CORE-04** | `src/core/gaming/` | Gaming vertical v0.2 closed: `GamingRiskScorer`, advanced detectors (session tilt, high-stakes tilt, PSP collusion, promo rail stack, AML sleeper lift), templates (`action-templates.ts`), domain extensions | UN-003, UN-004; SR-F-006; RM-008, RM-010, RM-017, RM-019 |
| **DO-CORE-05** | `src/core/config/` | `ConfigService`: `.env` + optional `config/default.json` / `config/<NODE_ENV>.json` layering | UN-007; SR-I-002 conceptually |
| **DO-CORE-06** | `src/core/observability/` | Winston logger factory; `withCorrelationId` for request-scoped child loggers | SR-D-001 |
| **DO-CORE-07** | `src/types/` | Shared domain types including `RiskScoreGamingInsights` surfaces | Traceability typing for API contracts |

### 4.2 API Surface

| Output ID | Delivery | Endpoints / behavior | DID linkage |
|-----------|----------|----------------------|-------------|
| **DO-API-01** | `src/api/*`, `src/app.ts` | `GET /health` | SR-F-001 |
| **DO-API-02** | | `POST /resolve` | SR-F-002 |
| **DO-API-03** | | `POST /assess` with `domain` general \| gaming | SR-F-003 |
| **DO-API-04** | | `POST /assess-risk` | SR-F-004 |
| **DO-API-05** | | `GET /audit-log`, `GET /audit-log/:correlationId`, `GET /audit-log/stats` with documented query caps | SR-F-008; SR-S-003 |
| **DO-API-06** | | Static `/demo/*` mount | SR-F-009 |
| **DO-API-07** | Middleware | Correlation-id validation `[A-Za-z0-9._:-]`; UUID fallback; `x-correlation-id` on responses | SR-F-007 |

### 4.3 Dashboard & Demo Assets

| Output ID | Artifact | Description | DID linkage |
|-----------|----------|-------------|-------------|
| **DO-UI-01** | `demo/gaming-dashboard.html` | Presenter dashboard: KPI strip, tier distribution, player cards, combos, playbook, audit overview, export Quick/Full Markdown, theme toggle, EN/ES/PT | UN-006; SR-F-009, SR-F-010; SR-U-001–SR-U-003 |
| **DO-UI-02** | `demo/start-demo.ps1`, `demo/start-demo.cmd` (when present) | Launcher resolving port, health probe, browser open | Operational demonstration |
| **DO-UI-03** | `demo/package/*` runbooks | Presenter documentation (`README-DEMO`, presentation scripts per repo) | DI-06 / labeling channel |

### 4.4 Governance & Audit Layer

| Output ID | Artifact | Description | DID / RMF linkage |
|-----------|----------|-------------|-------------------|
| **DO-GOV-01** | `src/core/governance/` — `AuditLogService` | Orchestrator; backend-agnostic API used by `/audit-log*` routes | UN-005; SR-D-002; RM-014, RM-015 |
| **DO-GOV-02** | JSON file backend | Append-only `data/audit-log.json`; atomic flush; `.bak`; corruption recovery stages | SR-D-002 |
| **DO-GOV-03** | `sqlite-backend.ts` | Optional SQLite persistence implementing shared backend interface; WAL; indexed correlation lookup | SR-I-002; SR-D-002 |
| **DO-GOV-04** | Risk-score audit integration | Supabase path when configured (per PROJECT_CONTEXT); in-memory fallback | Supplementary trace |
| **DO-GOV-05** | Audit entry schema / versioning | Wire-format versioning and combo snapshots embedded per gaming assessments | SR-D-003; forensic reproducibility |

## 5. Verification Mapping

Design outputs listed in §4 shall be verified against **DID** requirements using methods identified in **DP-MAZA-Shield-v1.0** §7. The following mapping defines **minimum** evidence categories (records filed under Quality verification dossier):

| Evidence type | Scope | Typical linkage |
|---------------|-------|-----------------|
| Automated tests | Unit/integration for entity-resolution, risk-scoring, assessment, governance modules | SR-F-002–SR-F-006; SR-D-001 |
| API contract checks | Scripted calls to `/health`, `/assess`, `/audit-log`, `/audit-log/stats` | SR-F-001, SR-F-003, SR-F-008 |
| Performance benchmark | Round-trip latency measurement vs **SR-P-001** (800 ms p95 demonstration profile) | SR-P-001; RM-012 |
| Audit integrity probes | Append-only validation; correlation-ID round-trip; pagination bound enforcement | SR-D-002; SR-S-003 |
| Demo validation | Scripted scenario run + Markdown export capture | SR-F-010; SR-U-003 |

Residual verification gaps shall trigger CAPA or controlled deferrals recorded under change control.

## 6. Approval

This DOS accurately reflects MAZA Shield v1.0 design outputs under revision control at the **April 28, 2026** baseline and satisfies traceability expectations to **DID-MAZA-Shield-v1.0** subject to completion of sustaining trace matrix artifacts per **DR-MAZA-001**.

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Prepared by | Laura | | April 28, 2026 |
| Technical review | Lead Engineer / Architect | | |
| Quality / Regulatory | Quality / Regulatory liaison | | |
