# RVTM Light v1.0 – Traceability Matrix for Entity Resolution & Risk Scoring Baselines (Q2 2026)

**Documento:** `rvtm-light-v1.md`  
**Versión:** 1.0  
**Fecha:** 2026-05-10  
**Estado:** **Approved with actions** (trazas principales *mapped*; **OQ/PQ** = *backlog*; **SOUP** v1.0 publicado en [`soup-register-v1.md`](../soup-register-v1.md) — *firma* §6 pendiente; ver §3)  
**Referencia:** [SOP-001 — §7 DO / §9 *Verification* / §14 RVTM](../../sop-design-and-development.md#14-traceability-matrix-rvtm--reference-al-svmp) · [SVMP §6.2 RVTM](../../software-validation-master-plan.md#62-design-outputs--traceability-matrix) · [DP-2026-ER-BL v1.2](../design-plans/DP-2026-ER-BL.md) · [DP-2026-RS-BL v1.2](../design-plans/DP-2026-RS-BL.md) · [DR-2026-ER-BL-001](../design-reviews/DR-2026-ER-BL-001.md) · [DR-2026-RS-BL-001](../design-reviews/DR-2026-RS-BL-001.md) · [Gap Analysis](../../../qmsr-iso13485-gap-analysis.md) · [Regla MDC](../../../../.cursor/rules/qmsr-iso13485-compliance.mdc)

**Pilares reforzados en este documento:** *precisión* (prueba explícita), *explicabilidad* (DO de *builders* trazados), *privacidad* (DIs 101 + separación *PII*), *modularidad* (`src/core/*` claro).  
**Governance / *audit* *delta* (post-baseline):** ver [**RVTM Light v1.1**](./rvtm-light-v1.1.md) — *v1.0* permanece *baseline* **ER/RS**; v1.1 añade trazas **DI-GOV-*** y actualiza **DI-AT-*** hacia [DP-2026-GOV-001](../design-plans/DP-2026-GOV-001.md) / [DR-2026-GOV-001-001](../design-reviews/DR-2026-GOV-001-001.md).

---

## 1. Purpose and Scope

| Tema | Contenido |
|------|-----------|
| **Propósito** | Sustituir el *placeholder* de los DP §7 y materializar el **RVTM *light*** aprobado vía [DR-2026-ER-BL-001](../design-reviews/DR-2026-ER-BL-001.md) / [DR-2026-RS-BL-001](../design-reviews/DR-2026-RS-BL-001.md), alineado a [SVMP §6.2](../../software-validation-master-plan.md#62-design-outputs--traceability-matrix) (*User need / DI → DO → prueba*). |
| **Alcance** | **DIs** de [DP-2026-ER-BL](../design-plans/DP-2026-ER-BL.md#2-design-inputs-dis--user-needs-regulatory-riesgo-adr-contexto-de-proyecto) (DI-ER-001 … DI-ER-401) y [DP-2026-RS-BL](../design-plans/DP-2026-RS-BL.md#2-design-inputs-dis--user-needs-regulatory-riesgo-adr-contexto-de-proyecto) (DI-RS-001 … DI-RS-401), **más** filas transversales *audit* / *pipeline* (Q2 2026). |
| **Fuera de alcance v1.0** | *RVTM* completo de todo el repositorio; **IQ/OQ/PQ** firmados (incl. **OQ** *light* bajo [validation](../validation/README.md)). **Registro SOUP** detallado: ver [`soup-register-v1.md`](../soup-register-v1.md) (v1.0). |
| **Criterio de *done* (light)** | Toda fila con **código o prueba** identificable en repo; *Validation* = referencia *SVMP*; **Status** *Open* solo donde la evidencia *release* aún no está archivada bajo [validation](../validation/README.md). |

---

## 2. Traceability Matrix (tabla principal)

*Leyenda **Status**:* **C** = Compliant · **P** = Partial (falta evidencia *release* o OQ) · **O** = Open.  
*Leyenda **Risk**:* L / M / H (bajo / medio / alto) — impacto operacional si falla el control.

| Req ID | Requirement Description (breve) | Design Output / Code Reference | Verification Method / Test ID | Validation Reference (SVMP) | Status | Comments / Evidence Link | Risk |
|--------|--------------------------------|---------------------------------|------------------------------|-----------------------------|--------|-------------------------|------|
| **A. Entity Resolution (ER)** |
| **DI-ER-001** | Tolerancia / *fuzzy* *match* de texto; emparejamiento bajo variación | `DO-ER-02` `src/core/entity-resolution/similarity.ts` — `jaccard`, `levenshtein`, `pairSimilarity` (blend 0.5/0.5) | Vitest: `tests/unit/core/entity-resolution/EntityResolutionService.test.ts` + implícito en *normalizer*; revisión *static* SOP-001 | [SVMP §6.3](../../software-validation-master-plan.md#63-verification) · §7.1 ER *strategy* | **C** | *Match* lógica documentada en código; CI `npm test` | M |
| **DI-ER-001b** | Normalización de entrada antes de similitud | `DO-ER-01` `src/core/entity-resolution/normalizer.ts` | Vitest: `tests/unit/core/entity-resolution/EntityTextNormalizer.test.ts` | §6.3 · §7.1 | **C** | *Precision* *token* / Unicode | M |
| **DI-ER-002** | Explicación estructurada *match* / *score* de par | `DO-ER-06` `src/core/entity-resolution/explanation-builder.ts` | Vitest: cobertura vía `EntityResolutionService.test.ts` (salidas estructuradas) + *manual review* *DR* | §6.3 · §6.4 (*explainability*) | **P** | *Snapshot* *JSON* en *regulatory* *suite* = *future* (marcar *Open* *sub*evidencia) | M |
| **DI-ER-003** | Detección *conflict* (alias, baja similitud) | `DO-ER-05` `src/core/entity-resolution/conflict-detector.ts` | Vitest: `tests/unit/core/entity-resolution/LowSimilarityAliasConflictDetector.test.ts` | §7.1 ER *conflict* | **C** | *Conflict* *paths* *peer-reviewed* [DR-2026-ER-BL-001](../design-reviews/DR-2026-ER-BL-001.md) | M |
| **DI-ER-101** | 7.3 *design controls*; privacidad *inputs*; SOP-001 | Todos *DO-ER* `src/core/entity-resolution/**` + `index.ts` | *Peer review* [DR-2026-ER-BL-001](../design-reviews/DR-2026-ER-BL-001.md); `npm test` *repo*; `npm run typecheck` | [SVMP §6.2](../../software-validation-master-plan.md#62-design-outputs--traceability-matrix) marco; SVMP §8 *Deliverables* | **P** | *Policy* *PII* = capa API; ER sin persistencia *opaque* | M |
| **DI-ER-102** | *Gap* 7.3; trazas requisito–prueba | Este documento + `DP-2026-ER-BL` v1.2 | *Doc review* + *matrix*; PR que añade `rvtm-light-v1.md` | §6.2 | **C** | Cierre acción *AI-ER-1* | L |
| **DI-ER-201** | Riesgo *mismatch*; mitigación *tests* + umbrales | `DO-ER-03`–`04` `service.ts` · `scorer.ts` · `thresholds.ts` | *Tests* *EntityResolutionService*; regresión CI | §6.5 *change*; §9 *risk* *table* *Gap* | **C** | *High* controlado = **H** riesgo residual sin CAPA *formal* | H |
| **DI-ER-301** | ADR-001: TS *strict*, ESM, *core* modular | *Package* *layout*; `tsconfig` + `src/core/entity-resolution` | `tsc --noEmit`; estructura *lint* *implicit* | §6.3 | **C** | [ADR-001](../../../DECISIONS.md) | L |
| **DI-ER-401** | Coherencia *PROJECT_CONTEXT* (ER) | Mismo módulo + *pipeline* *consumer* | `tests/unit/core/assessment/AssessmentService.test.ts` (orquesta ER+RS) | §6.4 *pipeline* | **P** | *E2E* *full* bajo *manual/* opcional | M |
| **B. Risk Scoring (RS)** |
| **DI-RS-001** | *Score* agregado y por dimensión; reproducible | `DO-RS-02` `src/core/risk-scoring/scorer.ts` · `DO-RS-01` `service.ts` | Vitest: `tests/unit/core/risk-scoring/RiskScoringService.test.ts` | [SVMP §6.3](../../software-validation-master-plan.md#63-verification) · [§7.2](../../software-validation-master-plan.md#72-risk-scoring-multi-dimension-breakdown-transparente-explicaciones-accionables) *multi-dim* | **C** | *Multi-dimension* *transparent* *breakdown* | H |
| **DI-RS-002** | Explicación accionable (no *LLM-only*) | `DO-RS-03` `src/core/risk-scoring/explanation-builder.ts` | Vitest: aserciones en `RiskScoringService.test.ts` + `...gaming.test.ts` | §6.3 · §7.2 *explainability* | **C** | *Deterministic* *builder* | M |
| **DI-RS-003** | Dominios y *combos* acotados | `DO-RS-05` `combos.ts` · `DO-RS-06` `config/domain-config.ts` | Vitest: `RiskScoringService.gaming.test.ts`; *combos* *bounded* *per* *PROJECT_CONTEXT* | §6.3 · §7.2 | **C** | *Synergy* *cap* | M |
| **DI-RS-101** | 7.3 + privacidad *drivers* | `src/core/risk-scoring/**` | *DR* + *tests*; sin PII en motor | §6.2 *matrix* | **P** | *Logs* = *downstream* | M |
| **DI-RS-102** | *Gap* V&V; trazas | Este doc + [DP-2026-RS-BL](../design-plans/DP-2026-RS-BL.md) | *Doc* + CI | §6.2 | **C** | Cierre *AI-RS-1* | L |
| **DI-RS-201** | Riesgo *score* / explicación erróneos | *Thresholds* + *scorer* `DO-RS-04` `thresholds.ts` | Vitest; *regression*; *change* 6.5 | [SVMP §6.5](../../software-validation-master-plan.md#65-change-control--re-validation) | **C** | *Threshold* *change* = *re-validate* | H |
| **DI-RS-301** | ADR-001 | *Same as ER* estructural | *typecheck* | §6.3 | **C** | | L |
| **DI-RS-401** | *Gaming* *insights* / *combos* *per* *PC* | `DO-RS-05/06` + *vertical* `src/core/gaming/**` (consumed by *assessment*) | `tests/unit/core/gaming/GamingRiskScorer.test.ts` · `assessment` / *integration* | [SVMP §2 *scope*](../../software-validation-master-plan.md#2-scope) *gaming* *path* | **P** | *Additive*; no rompe *scorer* *base* | M |
| **C. Transversal — *Audit* / *pipeline* / *API* (compliance *metadata*)** |
| **DI-AT-001** | *Audit trail*; consulta; *metadata* riesgo en entradas *governance* | `src/core/governance/**` · `src/api/audit.ts` | Vitest: `tests/unit/core/governance/AuditLogService.*.test.ts` · *Integration:* `tests/integration/api/audit.test.ts` | [SVMP §7.3](../../software-validation-master-plan.md#73-audit-trail--compliance-metadata) | **P** | *Append-only*; *backends* JSON/SQLite; 21 Part 11 TBD | M |
| **DI-AT-002** | *End-to-end* riesgo vía API (*assess-risk*) = validación *operacional* | *Pipeline* `src/core/assessment/**` + `src/api/assess-risk.ts` | *Integration:* `tests/integration/api/assess-risk.test.ts` | [SVMP §6.4](../../software-validation-master-plan.md#64-validation-incluyendo-iqoqpq-si-aplica) *OQ* *placeholder*; [§8](../../software-validation-master-plan.md#8-testing-strategy-vitest-supertest-integration--regulatory-tests) *Testing* *Supertest* | **P** | *PQ* = *staging* *customer* TBD; *partial* for *PQ* | M |
| **DI-AT-003** | *Gaming* *advanced* *patterns* (si *domain* *gaming*) | `src/core/gaming/**` + *assessment* *wire* | `tests/integration/assessment-gaming-advanced-patterns.test.ts` | [SVMP §2](../../software-validation-master-plan.md#2-scope) *assessment* *pipeline* | **P** | Trazas a *RS*+ *gaming*; *optional* for *general-only* *deploy* | M |

*Total de filas de requisito útiles en v1.0: **20** (incl. *sub* DI-ER-001b y transversales *AT*).*

---

## 3. Summary of Traceability Coverage

| Métrica | Valor (Q2 2026 *light*) | Nota |
|---------|------------------------|------|
| **% filas *Compliant*** | **~55%** (11/20) | *C* = prueba y código claramente enlazados. |
| **% filas *Partial*** | **~40%** (8/20) | Falta *OQ* archivada, *PQ*, *some* *snapshots* *regulatory*, *gaming* *full* *PQ*. |
| **% filas *Open* / riesgo documentado** | **~5%** (1/20) o *sub-filas* *explain* *snapshot* | Mejorar en v1.1. |
| **Cobertura *global* (interpretación)** | **~90%** *verification* de **ER+RS** *core* vía *unit*+CI | **SOUP** *direct* *deps* en [`soup-register-v1.md`](../soup-register-v1.md); *transitives* / SBOM = *H2* *roadmap*; *eQMS* = *future*. |

**Gaps (siguiente ciclo):**

- **RVTM *full*:** IDs *test* `it("...")` o *naming* *stable*; enlace a *CI run* y *tag* *semver*.  
- [Gap Analysis — trazas](../../../qmsr-iso13485-gap-analysis.md#8-software-validación-basada-en-riesgo-auditoría-trazabilidad): **SOUP** *register* = [`soup-register-v1.md`](../soup-register-v1.md) (v1.0); *protocol* *PDF* *archived* = *TBD*.  
- **OQ/PQ** según [SVMP §6.4](../../software-validation-master-plan.md#64-validation-incluyendo-iqoqpq-si-aplica): *checklist* en [validation/README.md](../validation/README.md) (*index*; expandir en v1.1 RVTM).  
- *Privacy* DPIA *formal* si *PII* *production* *material*.

**Next steps (inmediatos):**

1. Aprobar *formal* este **RVTM Light v1.0** (§4) y enlazarlo desde **DP/DR** (ya referenciado en PR).  
2. **v1.1 RVTM:** añadir columnas *Test case name* *exact* *Vitest* y *build ID*.  
3. **SOUP** [`soup-register-v1.md`](../soup-register-v1.md) (v1.0): *firma* §6 y re-evaluación por *release* (§5).  
4. Archivar *first* **OQ** *light* *run* bajo [../validation/](../validation/) (ver *checklist* en *index*).

---

## 4. Approval

| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|--------|
| **Chief Product Architect** | *TBD* | | 2026-05-10 |
| **Engineering Lead** | *TBD* | | 2026-05-10 |
| **QA / Regulación (QA/RA)** | *TBD* | | 2026-05-10 |

**Decisión:** [x] **Aprobado con acciones** — acciones: v1.1 *test* *granularity* + *validation* *index* + *SOUP*  [ ] Rechazado: ____________

**Nota:** La aprobación **no** sustituye *Management* en *Policy*; este documento es **L4** *record* bajo *Quality Manual* [§12](../../quality-manual.md#12-records-control-and-retention).

---

## Historial de versiones

| Versión | Fecha | Autor / Rol | Descripción |
|---------|--------|------------|-------------|
| 1.0 | 2026-05-10 | Chief Product Architect & Technical Lead | RVTM *light* inicial: DIs ER/RS + *audit* *pipeline*; *SVMP* 6.2; enlaces a DP v1.1, DR, *Gap*; *status* y riesgo. |

**Enlaces a baselines (no editar hilo *DP/DR* sin *CC*):**  
- [DP-2026-ER-BL v1.1](../design-plans/DP-2026-ER-BL.md) · [DP-2026-RS-BL v1.1](../design-plans/DP-2026-RS-BL.md)  
- [DR-2026-ER-BL-001](../design-reviews/DR-2026-ER-BL-001.md) · [DR-2026-RS-BL-001](../design-reviews/DR-2026-RS-BL-001.md)

---

*Fin del documento RVTM Light v1.0 (`rvtm-light-v1.md`).*
