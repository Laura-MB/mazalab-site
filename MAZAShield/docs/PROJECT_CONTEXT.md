# PROJECT_CONTEXT.md

**Versión 2.0 – 28 de mayo de 2026**  
**Fuente de verdad oficial de MAZALab**

## Misión

Crear la plataforma de Risk Intelligence superior en precisión, explicabilidad, privacidad y velocidad, centrada en Entity Resolution avanzada y Risk Scoring transparente para entornos regulados. Calidad premium obligatoria en código, tests, docs y UX.

## Estructura de productos

- **Mother Brain (Core Central – foco actual)**: El cerebro compartido.  
  - Entity Resolution modular (fuzzy matching + normalización + Jaccard + Levenshtein + resolución de conflictos y explicaciones).  
  - Risk Scoring multi-dimensión configurable (breakdown transparente, explicaciones accionables, confidence scores, bias flags, audit trail completo).  
  - Capa fuerte de Gobernanza ética (disclaimers automáticos, logs inmutables).  
  - API limpia (endpoint `/assess-risk` ya funcional).  
  - Estado técnico: arquitectura TypeScript + Node.js + Express + ESM, tests, gobernanza y vertical gaming documentados en las secciones 1–7 (Mother Brain v0.1, gaming v0.2 closed).

- **Producto Gaming / Casinos (prioridad revenue + G2E 2026)**: Aplicación vertical de la Mother Brain para casinos (detección de fraude, KYC/AML, responsible gaming, player risk scoring, entity resolution de identidades cross-platform, vendor risk). Esta es la que se llevará a G2E como demo.

- **Producto OSINT / Risk Intelligence general**: Competidor ágil y ético de Babel Street (se construye después sobre el mismo core).

## Principio rector

Calidad premium primero. Terminamos la Mother Brain con foco en el dominio Gaming/Casinos para tener una demo sólida y demostrable en 4-6 semanas. Todo reutilizable. No scope creep.

## Riesgo crítico reconocido

El ecosistema de casinos en Las Vegas es pequeño y exigente. Una demo inmadura puede dañar credibilidad de forma permanente. Por eso exigimos rigor absoluto en calidad, explicabilidad y gobernanza antes de mostrar nada públicamente.

## Nota estratégica (15-abr-2026)

Las presiones regulatorias en el uso de IA en gaming crecen significativamente. Existe un gap claro de gobernanza (solo 1 de cada 5 compañías tiene equipo dedicado a AI governance, score promedio 30/100 según el informe UNLV “State of AI in Gaming 2026” en colaboración con KPMG). Esto refuerza nuestra oportunidad: entregar Risk Intelligence con transparencia y auditabilidad nativa.

## AI Development Policy (vigente desde 15-abr-2026)

- **Cursor** → herramienta principal (IDE + Agent Mode).  
- **Grok 4 (SuperGrok)** → modelo principal para desarrollo diario y orquestación en el producto.  
- **Claude (Opus/Sonnet)** → deep thinking layer secundario (usar desde Semana 2 para arquitectura crítica, refactoring pesado y tests complejos).  
- Mantener un solo flujo principal para evitar tool hopping.

## Próxima milestone

MVP v0.1: Mother Brain pulida + demostrable en dominio Casinos (G2E-ready).  
Sprint actual: 5 semanas (inicio 15-abr-2026). El detalle técnico, API, paquete QMS y hoja de ruta v0.1/v0.2 figuran en **§ Estado del producto y gobernanza** y en las secciones numeradas **1–7** a continuación.

## Referencias

- PRD MVP v0.1

## Estado del producto y gobernanza

**Status:** **Mother Brain v0.1 — technical polish completed** (2026-04-20). **Gaming vertical v0.2 — closed.**

**QMS (Q2 2026 + Governance):** *Estado documental* **Governance Layer released as `v1.1.0` — Q2 2026 cycle closed with *full design controls*** bajo [DP-2026-GOV-001 v1.1](qmsr-iso13485/records/design-plans/DP-2026-GOV-001.md) (*Approved with actions*), [DR-2026-GOV-001-001](qmsr-iso13485/records/design-reviews/DR-2026-GOV-001-001.md), [RVTM Light v1.1](qmsr-iso13485/records/rvtm/rvtm-light-v1.1.md), [OQ-GOV-SUP-001](qmsr-iso13485/records/validation/oq/OQ-GOV-SUP-001.md) (*suplemento* *post-merge*), [SOP-001 §12 *change control*](qmsr-iso13485/sop-design-and-development.md#12-design-changes--change-control-integración-con-audit-trail-y-re-validation) y *merge* a `main` con trazas en [MERGE-FEAT-GOVERNANCE-TO-MAIN](qmsr-iso13485/records/change-control/MERGE-FEAT-GOVERNANCE-TO-MAIN.md). [Baseline *product* *core* **ER/RS**](qmsr-iso13485/records/releases/RELEASE-2026-Q2-v1.0.md) (RELEASE-2026-Q2-v1.0) e [integridad del *sign-off* Q2 2026](qmsr-iso13485/records/management-signoff-q2-2026.md) *preservados* — *sin* *breaking* a lógica de *scoring* / resolución. *Próxima revisión de dirección:* [MR Q4 2026 *agenda*](qmsr-iso13485/records/management-reviews/mr-2026-q4-agenda.md). [CLOSURE-CHECKLIST-GOV-2026-Q2](qmsr-iso13485/records/change-control/CLOSURE-CHECKLIST-GOV-2026-Q2.md) · *scripts* `scripts/closed-loop/`.

**Cierre operativo (`v1.1.0` en *main* / remoto):** `PENDING_V11_0_OP_CLOSE`

## 1. Summary
MAZALab is a TypeScript + Node.js Express API service with shared risk-domain type definitions and a modular entity resolution core. This is the official and primary codebase for the Mother Brain.

## 2. Current Scope
- Express app with JSON body parsing middleware and permissive CORS for the demo dashboard.
- Centralized 404 and 500 JSON error handlers with structured error logging (request method, path, correlation id, stack).
- **Per-request correlation-id middleware**: validates the inbound `x-correlation-id` header against a strict character set (`[A-Za-z0-9._:-]`, max 128 chars), generates a UUIDv4 when missing or rejected, attaches `req.correlationId` and a child logger `req.log`, and echoes the resolved value in the response header.
- REST surface: `GET /health`, `POST /resolve`, `POST /assess`, `POST /assess-risk`, `GET /audit-log`, `GET /audit-log/:correlationId`, `GET /audit-log/stats`. Every response carries `x-correlation-id`.
- Static serving of the Gaming Demo Dashboard under `GET /demo/*` (source at `demo/gaming-dashboard.html`). Presenter-facing UI: **language selector** (EN / ES / PT, client dictionary + `localStorage`), **dark/light theme toggle** (`data-theme`, persisted), **Operator Playbook** panel (priority-tagged actions and escalation context alongside scenarios), plus the **Adaptive Combos** card, **Audit Log Overview** (sparkline, top-combos leaderboard, rolling 1h/24h/7d windows), **Export Report** (Quick + Full Markdown), KPI strip, and comparative results table.
- **Centralized configuration** (`src/core/config/`):
  - Singleton `ConfigService` reads `.env`, then optional layered JSON (`config/default.json` + `config/<NODE_ENV>.json`), with environment variables always winning.
  - Typed accessors: `ServerConfig`, `LoggerConfig`, `AuditConfig`.
  - Idempotent initialization with conflict detection across re-entrant calls.
- **Structured logging** (`src/core/observability/`):
  - Winston-based `logger` factory: pretty in development, JSON in production, configurable level via `LOG_LEVEL`.
  - `withCorrelationId(id, parent)` produces request-scoped child loggers used by the API middleware and `AssessmentService` boundary telemetry.
- Modular Entity Resolution core (`src/core/entity-resolution/`) with normalization, similarity scoring, conflict detection, and explanation building.
- Risk Scoring (`src/core/risk-scoring/`) with `general` and `gaming` domains, composite multi-factor scoring, adaptive cross-dimension combos with bounded synergy boost (≤ 0.12), driver prioritization, and domain-specific explanations. Gaming combos and key artefact catalog are centralized in `src/core/risk-scoring/combos.ts`.
- Assessment pipeline (`src/core/assessment/`) orchestrating resolve → score → structured analyst-facing output. `AssessmentResult` exposes a top-level `gamingInsights` block (combos, total synergy boost, key artefact checklist, optional `advancedRecommendations`, optional `advancedPatternIds`) when `domain === "gaming"`. Emits a debug-level boundary log per request (`{correlationId, domain, entityCount, durationMs, overallRiskLevel}`). Internally the pipeline is **pure dependency injection** — the `AssessmentService` constructor is the single source of default-wiring (general scorer + gaming scorer + audit backend); the inner `AssessmentPipeline` makes no implicit choices and splits domain routing into two private paths (`scoreEntityGeneral` / `scoreEntityGaming`) so the gaming branch is a single, auditable site.
- **Gaming vertical** (`src/core/gaming/`, **v0.2 — closed**) — additive enrichment over the gaming-domain pipeline. Composes `RiskScoringService({ domain: "gaming" })` and contributes optional `riskScore.gamingInsights.advanced` (structured signals + templates + RG playbook steps + **`detectedPatternIds`**) plus batch-level **`advancedRecommendations`** (**priority-sorted** lines with `Pattern:` hints and merged **Artefacts:** from templates and pattern-level casino-console catalogues) and **`advancedPatternIds`**. Pattern payloads: **`psp_collusion`** (collusion tier `elevated` / `severe`, **`casinoConsoleArtefacts`**); **`high_stakes_tilt`** (financial stress tier, joint AML/RG **`casinoConsoleArtefacts`**); **`promo_rail_stack`** (bonus + fraud + vendor convergence, operator checklist templates); **`aml_sleeper_lift`** (AML + behaviour lift with fraud/RG ceilings, watch vs escalate tiers). Components:
  - `GamingRiskScorer` — public entry point; referentially safe when no signal applies; builds batch recommendation lines and **canonical template ordering** within each priority band.
  - **Advanced pattern detectors** (`advanced-patterns.ts`): `SessionTiltDetector`; `HighStakesTiltDetector`; `PspCollusionDetector`; `PromoRailStackDetector`; `AmlSleeperLiftDetector`.
  - Parameterised action templates (`action-templates.ts`): `withdrawal_freeze`, `psp_collusion_freeze`, `promo_rail_stack`, `aml_sleeper_lift`, `bonus_abuse_ring`, `high_stakes_tilt`, `session_tilt_intervention`, and RG playbook content. Each template carries `[P1..P4]` priority, escalation lane, SLA, regulator hint, and operator-console artefacts.
  - Per-dimension operator-playbook metadata (`domain-extensions.ts`) — SLA, escalation lane, regulator hint; pure data; never feeds back into score math.

  Wired explicitly through the `AssessmentService` constructor (fourth argument); pass `null` to opt out of the advanced envelope without disabling the gaming-domain surface. A TypeScript module augmentation in `src/core/gaming/types.ts` types `RiskScoreGamingInsights.advanced` as `GamingAdvancedInsights | undefined` for every consumer of `src/types/` — no `unknown` casts anywhere downstream, dependency direction stays one-way (vertical → shared).
- Governance layer (`src/core/governance/`) with **dual pluggable audit-log backend**:
  - **JSON file backend** (default) — append-only at `data/audit-log.json`. Atomic writes with temp-file + `fsync` + retry/backoff, `.bak` rotation on every flush, three-stage corruption recovery (primary → backup → quarantine), optional gzip compression, in-memory `entryById` index for O(k) correlation-id lookup, persisted `combos[]` snapshot per gaming entry.
  - **SQLite backend** (`src/core/governance/persistence/sqlite-backend.ts`) — pluggable `AuditLogPersistenceBackend` interface, dynamically loaded `better-sqlite3`, WAL mode for concurrent readers, prepared statements, indexed columns (`correlation_id`, `domain`, `risk_level`, `created_at`), internal `audit_meta` migration ledger separate from the wire-format `AUDIT_LOG_SCHEMA_VERSION`.
  - Backend selection is environment-driven (`AUDIT_LOG_BACKEND=json|sqlite`); the in-memory `AuditLogService` orchestrator and all `/audit-log/*` endpoints are backend-agnostic.
  - **Risk-score audit log** — Supabase-backed when configured, in-memory fallback otherwise.
- API handlers use **lazy singletons** (`getAssessmentService()`) so the bootstrap can wire the chosen audit backend before any consumer instantiates the shared `AuditLogService`.
- Shared domain types in `src/types/index.ts` (including `RiskScoreGamingInsights` on `RiskScore`).
- Port configurable via `.env` (`PORT`; repository default `3010`).
- `dotenv` loaded at startup; production launch (`npm run start:prod`) uses Node's native `--env-file` flag.

## 3. API Endpoints

| Method | Path                                    | Description |
|--------|-----------------------------------------|-------------|
| GET    | `/health`                               | Service status and version. |
| POST   | `/resolve`                              | Entity resolution; returns canonical entities with explanations. |
| POST   | `/assess`                               | End-to-end assessment: resolution + risk scoring + batch summary (`domain` optional: `general` \| `gaming`). When `gaming`, the response carries a top-level `gamingInsights` block. |
| POST   | `/assess-risk`                          | Per-entity risk assessments (same core pipeline, array response shape). |
| GET    | `/audit-log`                            | Paginated append-only audit entries. Query params: `?limit=` (max 500), `?offset=`, `?domain=general\|gaming`, `?minRiskLevel=low\|medium\|high\|critical`, `?from=<ISO>`, `?to=<ISO>` (range capped at 366 days). |
| GET    | `/audit-log/:correlationId`             | O(k) indexed lookup of every entry sharing the given correlation id; returns `404` when none exist. |
| GET    | `/audit-log/stats`                      | v5 stats envelope: `total`, `avgRiskScore`, `countByLevel`, `countByDomain`, `earliestTimestamp`, `latestTimestamp`, **`trends`** (`windowDays`, `dailyCounts[]`, `byWindow.{lastHour, last24Hours, last7Days}`), **`topCombos[]`** (id, label, dimensions, occurrenceCount, entryCount, maxSynergy), and **`generatedAt`**. Query params: `?windowDays=` (clamped `[1, 90]`, default 7), `?topCombosLimit=` (clamped `[1, 50]`, default 5). |
| GET    | `/demo/gaming-dashboard.html`           | Gaming Demo Dashboard (static, same-origin). |
| GET    | `/`                                     | Returns 404 (no root route). |

## 4. Project Structure

| Path                                 | Role |
|--------------------------------------|------|
| `src/index.ts`                       | Process bootstrap: `dotenv`, `ConfigService`, audit-backend wiring, `createApp`, `listen`. |
| `src/app.ts`                         | Express app factory: correlation-id middleware, CORS, JSON parser, router, structured error handler. |
| `src/api/`                           | API routers (`health`, `resolve`, `assess`, `assess-risk`, `audit`) + static `/demo` mount. Lazy singleton services. |
| `src/core/config/`                   | `ConfigService` (singleton) + typed accessors for server, logger, and audit-log configuration. |
| `src/core/observability/`            | Winston logger factory + `withCorrelationId` helper for request-scoped child loggers. |
| `src/core/entity-resolution/`        | Entity resolution core: service, normalizer, similarity, scorer, conflict detector, explanation builder. |
| `src/core/risk-scoring/`             | Risk scoring engine: general and gaming domain configs, dimension and multi-factor scorers, thresholds, explanations. |
| `src/core/assessment/`               | End-to-end assessment pipeline (pure DI; explicit gaming injection), service (single source of default-wiring), and explanation builder. |
| `src/core/gaming/`                   | **Gaming vertical (v0.2)** — additive enrichment: `GamingRiskScorer`, advanced pattern detectors (session tilt, high-stakes tilt, PSP collusion, promo rail stack, AML sleeper lift), granular templates, operator-playbook metadata, vertical types + module augmentation. |
| `src/core/governance/`               | Append-only audit log services (assessment + risk-score). |
| `src/core/governance/persistence/`   | `AuditLogPersistenceBackend` interface + `SqliteBackend` (WAL, migrations, prepared statements). |
| `src/integrations/supabase/client.ts`| Optional Supabase client (lazy; used by risk-score audit). |
| `src/types/index.ts`                 | Shared domain types. |
| `demo/gaming-dashboard.html`         | Standalone dashboard for G2E / casino walkthroughs: i18n (EN/ES/PT), theme toggle, **Operator Playbook** (aligned with live `[Gaming-P*]` / advanced semantics), KPIs, scenarios, Adaptive Combos, Audit Log Overview, Export Report. |
| `demo/start-demo.ps1` / `.cmd`       | One-click Windows launcher (idempotent server + browser). |
| `docs/PROJECT_CONTEXT.md`            | Source of truth (this file). |
| `docs/DECISIONS.md`                  | Architecture decisions. |
| `docs/qmsr-iso13485/*`                | QMS/ISO 13485 pack: Quality Policy, Quality Manual, Management Review template, *records* (MR minutes, *design plans*), Gap Analysis, SVMP, SOP-001; see *Regulatory compliance* above. |

## 5. Technology Stack

| Layer                | Choice |
|----------------------|--------|
| Runtime              | Node.js (>= 20) |
| Language             | TypeScript (strict) |
| API Framework        | Express |
| Module System        | ESM (NodeNext) |
| Dev Runner           | tsx |
| Build Tool           | tsc |
| Environment          | dotenv (dev) + `node --env-file` (prod) |
| Logging              | winston (JSON in production, pretty in development) |
| Audit persistence    | JSON file (default) **or** SQLite via `better-sqlite3` (optional, WAL + migrations) |
| Test Runner          | vitest |

## 6. Governance Note
This repository is the single source of truth for the MAZALab Mother Brain core. All core development (Entity Resolution, Risk Scoring, etc.) must happen here with premium quality standards. Other chats/experiments are considered secondary.

### Regulatory compliance (QMSR / ISO 13485)

The Mother Brain is aligned, where product scope and *intended use* require, with a **Quality Management System** posture consistent with **FDA QMSR (21 CFR Part 820)** and **ISO 13485:2016** (design, validation, *audit trail*). The following documents (under `docs/qmsr-iso13485/`) and decisions form the *regulatory pack* for this codebase; the Cursor project rule `/.cursor/rules/qmsr-iso13485-compliance.mdc` applies when working in scope.

**Q2 2026 — *QMS Baseline Signed-off* (paquete único):** *Management Sign-off* [management-signoff-q2-2026.md](qmsr-iso13485/records/management-signoff-q2-2026.md) (v1.0, 2026-05-25) como registro de aprobación *Management* / CPA / QA-RA del *baseline* documental, junto con *Management Review* [MR-2026-Q2 v1.0 *Approved*](qmsr-iso13485/records/management-reviews/mr-2026-q2.md) (2026-05-20) y **Release Record** [RELEASE-2026-Q2-v1.0](qmsr-iso13485/records/releases/RELEASE-2026-Q2-v1.0.md) (*Mother Brain* *core* v1.0). Evidencia: design controls **ER/RS** (DPs v1.2, DRs, RVTM *light*), [SOUP v1.0](qmsr-iso13485/records/soup-register-v1.md), [OQ-2026-Q2-Light](qmsr-iso13485/records/validation/oq/OQ-2026-Q2-Light.md), **211** *tests* Vitest *passed*. Completar casillas §5 del *Sign-off* y, si aplica, marcar *Policy*/*Manual* *Approved* en metadatos de documento. Próxima MR: **Q4 2026** (*target* octubre).

| Document | Role |
|----------|------|
| [`docs/qmsr-iso13485/records/management-signoff-q2-2026.md`](qmsr-iso13485/records/management-signoff-q2-2026.md) | **Management Sign-off Package** Q2 2026 — aprobación *baseline* (tabla §5; *Policy*/*Manual* en *package*) |
| [`docs/qmsr-iso13485/quality-policy.md`](qmsr-iso13485/quality-policy.md) | **Quality Policy** (ISO 13485 5.3) — *Draft* en encabezado; *Approved* vía *Sign-off* §5 o DMS |
| [`docs/qmsr-iso13485/quality-manual.md`](qmsr-iso13485/quality-manual.md) | **Quality Manual** (QMS structure, Cl. 4–8) — *Draft*; *Approved* vía *Sign-off* §5 o DMS |
| [`docs/qmsr-iso13485/management-review-template.md`](qmsr-iso13485/management-review-template.md) | **Management Review** template (ISO 13485 5.6) — *Draft for first review* |
| [`docs/qmsr-iso13485/records/management-reviews/mr-2026-q2.md`](qmsr-iso13485/records/management-reviews/mr-2026-q2.md) | **MR minutes Q2 2026 (v1.0 Approved)** — 5.6; *supersedes* `mr-2026-q2-draft.md` |
| [`docs/qmsr-iso13485-gap-analysis.md`](qmsr-iso13485-gap-analysis.md) | Gap analysis vs. QMSR / ISO 13485 (v1.0) |
| [`docs/qmsr-iso13485/software-validation-master-plan.md`](qmsr-iso13485/software-validation-master-plan.md) | **SVMP** — Software validation master plan |
| [`docs/qmsr-iso13485/sop-design-and-development.md`](qmsr-iso13485/sop-design-and-development.md) | **SOP-001** — Design and development (Cl. 7.3) |
| [`docs/qmsr-iso13485/records/design-plans/DP-2026-ER-BL.md`](qmsr-iso13485/records/design-plans/DP-2026-ER-BL.md) / [`DP-2026-RS-BL.md`](qmsr-iso13485/records/design-plans/DP-2026-RS-BL.md) | **Design Plan baselines** (ER, RS) v1.2 — *Approved (with actions)*; [DR-2026-ER-BL-001](qmsr-iso13485/records/design-reviews/DR-2026-ER-BL-001.md) / [DR-2026-RS-BL-001](qmsr-iso13485/records/design-reviews/DR-2026-RS-BL-001.md) |
| [`docs/qmsr-iso13485/records/design-plans/DP-2026-GOV-001.md`](qmsr-iso13485/records/design-plans/DP-2026-GOV-001.md) | **Design Plan v1.1** — *Governance* / *audit* & *compliance metadata* post-baseline [RELEASE-2026-Q2-v1.0](qmsr-iso13485/records/releases/RELEASE-2026-Q2-v1.0.md); [DR-2026-GOV-001-001](qmsr-iso13485/records/design-reviews/DR-2026-GOV-001-001.md); [RVTM v1.1](qmsr-iso13485/records/rvtm/rvtm-light-v1.1.md). **Tag *product* sugerido post-cierre:** `v1.1.0` (ver *closure* y [OQ-GOV-SUP-001](qmsr-iso13485/records/validation/oq/OQ-GOV-SUP-001.md)) |
| [`docs/qmsr-iso13485/records/rvtm/rvtm-light-v1.md`](qmsr-iso13485/records/rvtm/rvtm-light-v1.md) | **RVTM Light v1.0** — trazas DI→DO→prueba (ER, RS, *audit*/*pipeline*); alineado a [`software-validation-master-plan.md`](qmsr-iso13485/software-validation-master-plan.md) §6.2 |
| [`docs/qmsr-iso13485/records/rvtm/rvtm-light-v1.1.md`](qmsr-iso13485/records/rvtm/rvtm-light-v1.1.md) | **RVTM Light v1.1** — *Governance* *delta* + *DI-AT* *refresh*; *baseline* ER/RS en v1.0; [SVMP](qmsr-iso13485/software-validation-master-plan.md) §6.2 · [DP-2026-GOV-001](qmsr-iso13485/records/design-plans/DP-2026-GOV-001.md) |
| [`docs/qmsr-iso13485/records/validation/README.md`](qmsr-iso13485/records/validation/README.md) | *Index* de evidencia de **validación** (OQ *light* / PQ, CI) — ver tabla en *index* |
| [`docs/qmsr-iso13485/records/releases/RELEASE-2026-Q2-v1.0.md`](qmsr-iso13485/records/releases/RELEASE-2026-Q2-v1.0.md) | **Release Record** Q2 2026 — *core* *baseline* v1.0 (SOP-001 §11 *design transfer*; enlaces OQ, RVTM, SOUP) |
| [`docs/qmsr-iso13485/records/soup-register-v1.md`](qmsr-iso13485/records/soup-register-v1.md) | **SOUP / OTS register** v1.0 (dependencias y riesgo; *lockfile*) |
| [`docs/qmsr-iso13485/records/soup-register-draft.md`](qmsr-iso13485/records/soup-register-draft.md) | *Redirect* — *superseded* por `soup-register-v1.md` |
| [`docs/DECISIONS.md`](DECISIONS.md) | **ADR-001** — Architecture baseline; engineering decisions that intersect with design controls |

### Ready for G2E

**Mother Brain v0.1 — technical polish completed.** **Gaming vertical v0.2 — closed.** The gaming demo dashboard is labeled **Mother Brain v0.1 — Ready for G2E demo** in the UI for presenter identification.

**5–7 minute demo flow**

1. **Launch** — `demo/start-demo.ps1` or `npm run dev` + open `http://localhost:<PORT>/demo/gaming-dashboard.html` (default port from `.env`, typically `3010`).
2. **Run** — **Run Full Demo** executes bundled scenarios against **`POST /assess`** with `domain: "gaming"` (live API).
3. **Scan** — **KPIs**, **risk tier bar**, **comparative cards** (one card per scenario).
4. **Deepen** — **Adaptive Combos** (first three rows + expand), **Operator Playbook** (first three actions + expand), **Case details** accordions.
5. **Close** — **Audit Log Overview**, **Export Report** (Quick / Full Markdown).

**Stakeholders see:** entity resolution output, composite **gaming** scores with tier colours, adaptive **combos** and synergy cap, **`gamingInsights`** (including advanced patterns when signal applies), operator-facing **recommendations**, and **audit** lineage with exportable artefacts. **EN / ES / PT** and **dark / light** theme are client-persisted.

## Technical Polish (Option A) completed

The Option A pass is **closed**: test and coverage work for gaming advanced patterns and assessment integration paths; JSDoc and comment consistency across `src/core/`; structured logging aligned on core services and primary HTTP routes. All changes remained additive; public API contracts are unchanged.

## 7. Roadmap — Mother Brain v0.1 (technical polish completed) · Gaming vertical v0.2 (closed)

**Status (2026-04-20):** **Mother Brain v0.1 — technical polish completed.** **Gaming vertical v0.2 — closed.** The v0.1 core API and governance baseline is frozen. The gaming layer ships advanced patterns (`psp_collusion`, `high_stakes_tilt`, `promo_rail_stack`, `aml_sleeper_lift`, session tilt), priority-sorted batch **`advancedRecommendations`** with merged **Artefacts**, **`advancedPatternIds`**, per-entity **`detectedPatternIds`**, and operator-grade templates (SLA, lane, console, regulator copy) as documented.

**Delivered capability areas**

| Area | Capability | Where it lives |
|------|------------|----------------|
| Entity Resolution | Modular pipeline (normalization, similarity, conflict detection, transparent multi-factor blend, deterministic explanation banner) | `src/core/entity-resolution/` |
| Risk Scoring | Multi-domain composite scorer (`general`, `gaming`); declarative configs; adaptive combos with bounded synergy (≤ 0.12); driver prioritization | `src/core/risk-scoring/`, `src/core/risk-scoring/combos.ts` |
| Assessment | Pipeline with correlation-id propagation; batch `gamingInsights` (combos, synergy, artefact checklist, optional `advancedRecommendations`, optional `advancedPatternIds`) | `src/core/assessment/` |
| Gaming vertical (v0.2) | Additive enrichment: pattern detectors and templates for `psp_collusion`, `high_stakes_tilt`, `promo_rail_stack`, `aml_sleeper_lift`, session tilt; tier metadata; casino-console artefact lists; enriched batch `advancedRecommendations`; `gamingInsights.advanced` with `detectedPatternIds` | `src/core/gaming/` |
| Operator Recommendations | `[Gaming-P1..P4]` lines and dimension-tagged actions; casino artefact references | `src/core/risk-scoring/explanation-builder.ts`, gaming vertical |
| Audit & stats | JSON or SQLite audit persistence; v5 stats API (`GET /audit-log/stats`) | `src/core/governance/`, `src/api/audit.ts` |
| Demo UX | Responsive dashboard; **EN / ES / PT** i18n; **dark/light** theme; **Operator Playbook** (aligned with advanced gaming lines); Adaptive Combos; Audit Log Overview; Export Report | `demo/gaming-dashboard.html`, `demo/start-demo.ps1` |
| Demo collateral | Presenter runbook and leave-behind materials | `demo/package/` |

**Quality gates (release standard)**

- `npm run typecheck` — `tsc --noEmit` for `tsconfig.json` and `tsconfig.test.json`.
- `npm test` — vitest suite covering entity resolution, risk scoring (including gaming), assessment pipeline (DI contract, gaming enrichment opt-out), gaming vertical (advanced patterns, templates), audit log (JSON + SQLite), config, logging, and API middleware.
- `npm run build` — `tsc -p tsconfig.json`.

**Backward compatibility**

Public API contracts for v0.1 are stable: `domain === "general"` responses remain unchanged; gaming and audit fields are additive. Default runtime configuration (JSON audit file, port `3010`, development logging) matches the documented baseline.

**Forward horizon**

Subsequent releases extend this foundation without replacing published contracts: additional risk domains, richer scoring and threat surfaces, operational scale-out, and deeper integrations — aligned with `docs/DECISIONS.md` and the guiding principle below.

### Guiding principle

Premium quality first: no shortcuts that compromise correctness, explainability, governance integrity, security posture, or long-term maintainability.

## Historial de cambios

- **2026-05-28:** Merge Governance Layer v1.1.0 + Q2 2026 QMS baseline (tag v1.1.0)


# PROJECT_CONTEXT.md

**Versión 2.0 – 28 de mayo de 2026**  
**Fuente de verdad oficial de MAZALab**

## Misión

Crear la plataforma de Risk Intelligence superior en precisión, explicabilidad, privacidad y velocidad, centrada en Entity Resolution avanzada y Risk Scoring transparente para entornos regulados. Calidad premium obligatoria en código, tests, docs y UX.

## Estructura de productos

- **Mother Brain (Core Central – foco actual)**: El cerebro compartido.  
  - Entity Resolution modular (fuzzy matching + normalización + Jaccard + Levenshtein + resolución de conflictos y explicaciones).  
  - Risk Scoring multi-dimensión configurable (breakdown transparente, explicaciones accionables, confidence scores, bias flags, audit trail completo).  
  - Capa fuerte de Gobernanza ética (disclaimers automáticos, logs inmutables).  
  - API limpia (endpoint `/assess-risk` ya funcional).  
  - Estado técnico: arquitectura TypeScript + Node.js + Express + ESM, tests, gobernanza y vertical gaming documentados en las secciones 1–7 (Mother Brain v0.1, gaming v0.2 closed).

- **Producto Gaming / Casinos (prioridad revenue + G2E 2026)**:  
  **MAZA Shield** — Casino Risk Intelligence by MAZALab  
  Aplicación vertical de la Mother Brain para casinos (detección de fraude, KYC/AML, responsible gaming, player risk scoring, entity resolution de identidades cross-platform, vendor risk). Esta es la que se llevará a G2E como demo.

- **Producto OSINT / Risk Intelligence general**: Competidor ágil y ético de Babel Street (se construye después sobre el mismo core).

## Principio rector

Calidad premium primero. Terminamos la Mother Brain con foco en el dominio Gaming/Casinos para tener una demo sólida y demostrable en 4-6 semanas. Todo reutilizable. No scope creep.

## Riesgo crítico reconocido

El ecosistema de casinos en Las Vegas es pequeño y exigente. Una demo inmadura puede dañar credibilidad de forma permanente. Por eso exigimos rigor absoluto en calidad, explicabilidad y gobernanza antes de mostrar nada públicamente.

## Nota estratégica (15-abr-2026)

Las presiones regulatorias en el uso de IA en gaming crecen significativamente. Existe un gap claro de gobernanza (solo 1 de cada 5 compañías tiene equipo dedicado a AI governance, score promedio 30/100 según el informe UNLV “State of AI in Gaming 2026” en colaboración con KPMG). Esto refuerza nuestra oportunidad: entregar Risk Intelligence con transparencia y auditabilidad nativa.

## AI Development Policy (vigente desde 15-abr-2026)

- **Cursor** → herramienta principal (IDE + Agent Mode).  
- **Grok 4 (SuperGrok)** → modelo principal para desarrollo diario y orquestación en el producto.  
- **Claude (Opus/Sonnet)** → deep thinking layer secundario (usar desde Semana 2 para arquitectura crítica, refactoring pesado y tests complejos).  
- Mantener un solo flujo principal para evitar tool hopping.

## Próxima milestone

MVP v0.1: Mother Brain pulida + demostrable en dominio Casinos (G2E-ready).  
Sprint actual: 5 semanas (inicio 15-abr-2026). El detalle técnico, API, paquete QMS y hoja de ruta v0.1/v0.2 figuran en **§ Estado del producto y gobernanza** y en las secciones numeradas **1–7** a continuación.

## Referencias

- PRD MVP v0.1

## Estado del producto y gobernanza

**Status:** **Mother Brain v0.1 — technical polish completed** (2026-04-20). **Gaming vertical v0.2 — closed.**  
**Producto principal:** **MAZA Shield** — Casino Risk Intelligence by MAZALab (versión final aprobada por Laura).

**QMS (Q2 2026 + Governance):** *Estado documental* **Governance Layer released as `v1.1.0` — Q2 2026 cycle closed with *full design controls*** bajo [DP-2026-GOV-001 v1.1](qmsr-iso13485/records/design-plans/DP-2026-GOV-001.md) (*Approved with actions*), [DR-2026-GOV-001-001](qmsr-iso13485/records/design-reviews/DR-2026-GOV-001-001.md), [RVTM Light v1.1](qmsr-iso13485/records/rvtm/rvtm-light-v1.1.md), [OQ-GOV-SUP-001](qmsr-iso13485/records/validation/oq/OQ-GOV-SUP-001.md) (*suplemento* *post-merge*), [SOP-001 §12 *change control*](qmsr-iso13485/sop-design-and-development.md#12-design-changes--change-control-integración-con-audit-trail-y-re-validation) y *merge* a `main` con trazas en [MERGE-FEAT-GOVERNANCE-TO-MAIN](qmsr-iso13485/records/change-control/MERGE-FEAT-GOVERNANCE-TO-MAIN.md). [Baseline *product* *core* **ER/RS**](qmsr-iso13485/records/releases/RELEASE-2026-Q2-v1.0.md) (RELEASE-2026-Q2-v1.0) e [integridad del *sign-off* Q2 2026](qmsr-iso13485/records/management-signoff-q2-2026.md) *preservados* — *sin* *breaking* a lógica de *scoring* / resolución. *Próxima revisión de dirección:* [MR Q4 2026 *agenda*](qmsr-iso13485/records/management-reviews/mr-2026-q4-agenda.md). [CLOSURE-CHECKLIST-GOV-2026-Q2](qmsr-iso13485/records/change-control/CLOSURE-CHECKLIST-GOV-2026-Q2.md) · *scripts* `scripts/closed-loop/`.

**Cierre operativo (`v1.1.0` en *main* / remoto):** `PENDING_V11_0_OP_CLOSE`

## 1. Summary
MAZALab is a TypeScript + Node.js Express API service with shared risk-domain type definitions and a modular entity resolution core. This is the official and primary codebase for the Mother Brain.

(El resto del documento original se mantiene igual desde aquí en adelante, solo se actualizaron los nombres y branding donde correspondía).

**Esta es la versión final aprobada por Laura.**

**Last updated:** 2026-05-28
