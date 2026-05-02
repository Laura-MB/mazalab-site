# RVTM Light v1.1 – Traceability Matrix Update (Governance Layer + Audit Trail Enhancement)

**Documento:** `rvtm-light-v1.1.md`  
**Versión:** 1.1  
**Fecha:** 2026-05-28  
**Estado:** **Draft → Approved with actions** (filas *Governance* = *open* *hasta* *merge*; ER/RS *heredadas* *v1.0*)  
**Referencia:** [DP-2026-GOV-001 v1.0](../design-plans/DP-2026-GOV-001.md) · [DR-2026-GOV-001-001](../design-reviews/DR-2026-GOV-001-001.md) · [**RELEASE-2026-Q2-v1.0**](../releases/RELEASE-2026-Q2-v1.0.md) (baseline) · [RVTM Light v1.0](./rvtm-light-v1.md) · [Management Sign-off Q2 2026](../management-signoff-q2-2026.md) · [SVMP §6.2](../../software-validation-master-plan.md#62-design-outputs--traceability-matrix) · [Gap Analysis](../../../qmsr-iso13485-gap-analysis.md) · [Regla MDC](../../../../.cursor/rules/qmsr-iso13485-compliance.mdc)

> **Cambio de supersedencia:** v1.1 **añade** y **afina** trazas *Governance*; **no** *invalida* [RVTM v1.0](./rvtm-light-v1.md) para filas **ER/RS** — permanecen *frozen* *baseline*; la **fila lógica** *Mother Brain* = **v1.0 (ER+RS) + v1.1 (GOV delta)**. Fuente *DHF* = ambos *files* bajo *version* *control*.

**Pilares (v1.1):** *auditabilidad* reforzada, *explicabilidad* de *metadata* (sin opacidad), *privacidad por diseño* (*minimization* *hooks*), *change control* explícito al *baseline* [RELEASE-2026-Q2-v1.0](../releases/RELEASE-2026-Q2-v1.0.md).

---

## 1. Purpose and Changes from v1.0

| Tema | Contenido |
|------|-------------|
| **Propósito** | Publicar el **RVTM *light* v1.1** requerido por [DP-2026-GOV-001](../design-plans/DP-2026-GOV-001.md) §7 y cierre [DR-2026-GOV-001-001 **AI-GOV-1**](../design-reviews/DR-2026-GOV-001-001.md#decisions--action-items) — mapea **DI → DO → prueba (plan) / validación** para *Governance* *enhancement* *post*-[RELEASE-2026-Q2-v1.0](../releases/RELEASE-2026-Q2-v1.0.md). |
| **Cambios vs. v1.0** | (1) **Nuevas** filas **D** *Governance* (DI-GOV-xxx, *change control* *baseline*, *OQ* *suplemento*). (2) **Actualización** filas [DI-AT-001/002/003](./rvtm-light-v1.md#2-traceability-matrix-tabla-principal) — comentarios, DO *plan* (DO-GOV-0x), *tests* (T-GOV-xxx) y *status* *progreso* hacia *C*. (3) **Trazas** a [SOUP v1.0](../soup-register-v1.md) *optional* *sqlite* inalteradas salvo *bump* *bajo* *CC*. |
| **Alcance** | **Superset** *tabla* *v1.0* (sección **A–C** replicada) + secciones **D–E**; *columnas* *idénticas* a v1.0. |
| **Fuera de alcance** | Sustituir *RVTM* *full* *repositorio*; *T-xxx* *canonical* *stable* *names* *Vitest* = *H2* (misma nota *v1.0*). |

---

## 2. Updated Traceability Matrix (tabla completa)

*Leyenda **Status**:* **C** = Compliant · **P** = Partial · **O** = Open.  
*Leyenda **Risk**:* L / M / H.

*Filas **A–B** y **C** (AT-001…003) = *baseline* *heredada* v1.0 y **v1.1**; *celdas* *AT* *actualizadas* según *DP/DR* *Governance*. Filas **D–E** = *nuevas* v1.1.*

| Req ID | Requirement Description (breve) | Design Output / Code Reference | Verification Method / Test ID | Validation Reference (SVMP) | Status | Comments / Evidence Link | Risk |
|--------|--------------------------------|---------------------------------|------------------------------|-----------------------------|--------|-------------------------|------|
| **A. Entity Resolution (ER)** — *sin cambio; ver* [RVTM v1.0](./rvtm-light-v1.md#2-traceability-matrix-tabla-principal) *para historial* |
| **DI-ER-001** | Tolerancia / *fuzzy* *match* de texto; emparejamiento bajo variación | `DO-ER-02` `src/core/entity-resolution/similarity.ts` — *jaccard*, *levenshtein*, `pairSimilarity` | Vitest: `EntityResolutionService.test.ts` + *normalizer*; *static* SOP-001 | §6.3 · §7.1 | **C** | *Baseline*; [v1.0](./rvtm-light-v1.md) | M |
| **DI-ER-001b** | Normalización de entrada antes de similitud | `DO-ER-01` `normalizer.ts` | `EntityTextNormalizer.test.ts` | §6.3 · §7.1 | **C** | *Baseline* | M |
| **DI-ER-002** | Explicación estructurada *match* / *score* de par | `DO-ER-06` `explanation-builder.ts` | `EntityResolutionService.test.ts` + *manual review* *DR* | §6.3 · §6.4 | **P** | *Baseline*; *snapshot* *future* | M |
| **DI-ER-003** | Detección *conflict* (alias, baja similitud) | `DO-ER-05` `conflict-detector.ts` | `LowSimilarityAliasConflictDetector.test.ts` | §7.1 | **C** | *Baseline* [DR-ER-001](../design-reviews/DR-2026-ER-BL-001.md) | M |
| **DI-ER-101** | 7.3; privacidad *inputs*; SOP-001 | *DO-ER* `src/core/entity-resolution/**` | *Peer review*; `npm test`; `typecheck` | §6.2; §8 | **P** | *Baseline* | M |
| **DI-ER-102** | *Gap* 7.3; trazas | *Doc* + `DP-2026-ER-BL` v1.2 | *Doc review*; CI | §6.2 | **C** | *Baseline* | L |
| **DI-ER-201** | Riesgo *mismatch*; *tests* + umbrales | `DO-ER-03`–`04` *service* · *scorer* · `thresholds.ts` | *EntityResolutionService*; regresión | §6.5; §9 | **C** | *Baseline* | H |
| **DI-ER-301** | ADR-001 | *Layout*; `tsconfig` | `tsc` | §6.3 | **C** | [ADR-001](../../../DECISIONS.md) | L |
| **DI-ER-401** | Coherencia *PROJECT_CONTEXT* (ER) | *Pipeline* *consumer* | `AssessmentService.test.ts` | §6.4 | **P** | *Baseline* | M |
| **B. Risk Scoring (RS)** — *heredada* *v1.0* |
| **DI-RS-001** | *Score* agregado y por dimensión; reproducible | `DO-RS-02` `scorer.ts` · `DO-RS-01` *service* | `RiskScoringService.test.ts` | §6.3 · §7.2 | **C** | *Baseline* | H |
| **DI-RS-002** | Explicación accionable (no *LLM-only*) | `DO-RS-03` *explanation-builder* | *RiskScoring* + *gaming* tests | §6.3 · §7.2 | **C** | *Baseline* | M |
| **DI-RS-003** | Dominios y *combos* acotados | `DO-RS-05` *combos* · `DO-RS-06` *domain-config* | `RiskScoringService.gaming.test.ts` | §6.3 · §7.2 | **C** | *Baseline* | M |
| **DI-RS-101** | 7.3 + privacidad *drivers* | `src/core/risk-scoring/**` | *DR* + *tests* | §6.2 | **P** | *Baseline* | M |
| **DI-RS-102** | *Gap* V&V; trazas | Doc + [DP-2026-RS-BL](../design-plans/DP-2026-RS-BL.md) | *Doc* + CI | §6.2 | **C** | *Baseline* | L |
| **DI-RS-201** | Riesgo *score* / explicación | *Thresholds* + *scorer* | Vitest; regresión | §6.5 | **C** | *Baseline* | H |
| **DI-RS-301** | ADR-001 | *Same structural* *as ER* | *typecheck* | §6.3 | **C** | *Baseline* | L |
| **DI-RS-401** | *Gaming* *insights* / *combos* | `gaming/**` + *assessment* | *Gaming* tests · *integration* | §2 *scope* | **P** | *Baseline* | M |
| **C. Transversal — *Audit* / *pipeline* / *API* — *v1.1* *actualiza* *trazas* *GOV* |
| **DI-AT-001** | *Audit trail*; consulta; *metadata* riesgo en *governance*; **+** *compliance* *schema* *plan* | *Actual:* `src/core/governance/**` · `src/api/audit.ts` · *Plan* **DO-GOV-01**–**04** (tipos, *API*, *stats* *envelope*) [DP-2026-GOV-001](../design-plans/DP-2026-GOV-001.md#3-design-outputs-dos--planned) | *Actual:* *unit* *governance* + `audit.test.ts` · *Plan* **T-GOV-001**, **T-GOV-002** | [§7.3](../../software-validation-master-plan.md#73-audit-trail--compliance-metadata) | **P** | **v1.1:** trazas *DP*+*DR*+*RVTM*; **C** *target* *post* *merge* T-GOV-002; 21 *Part* *11* *full* TBD | M |
| **DI-AT-002** | *End-to-end* riesgo vía `POST` `/assess-risk` + coherencia *correlation* *governance* | `assessment/**` + `assess-risk.ts` · *Plan* *wire* *metadata* *boundary* *opcional* | *Integration* `assess-risk.test.ts` · **T-GOV-003** *smoke* *post* *GOV* *delta* | §6.4 · OQ-2026-Q2 *light*; **OQ-GOV** *sup* §*E* | **P** | **v1.1:** [OQ](../validation/oq/OQ-2026-Q2-Light.md) *cubierto* *baseline*; *suplemento* *post* *implement* [AI-GOV-2](../design-reviews/DR-2026-GOV-001-001.md#decisions--action-items) | M |
| **DI-AT-003** | *Gaming* *advanced* *patterns* (si *domain* *gaming*) | `gaming/**` + *assessment* | *assessment-gaming-advanced-patterns.test.ts* | §2 *scope* | **P** | *Baseline* (sin *cambio* *GOV* *blocker*) | M |
| **D. Governance enhancement (DP-2026-GOV-001) — *nuevas* *filas* *v1.1* |
| **DI-GOV-001** | *Compliance metadata* estructurada (*tier*, *domain*, *rules* *version*); *no* *bloat* *explain* *ER/RS* | `DO-GOV-01` `types.ts` *schema* · `DO-GOV-02` *append* *validation* | **T-GOV-001** *unit* *metadata* *roundtrip*; *regression* CI | §6.3 · §7.3 | **O** | *Implement* *bajo* *PR*; *DR* [B-6](../../sop-design-and-development.md#appendix-b-design-review-checklist) *privacidad* | M |
| **DI-GOV-101** | QMSR *records* *retirables*; *audit-ready* *artefactos* | `DO-GOV-D1` *doc* *delta* + *README*; *punteros* *DHF* | **T-GOV-DOC-001** *doc* *review* + `npm test` *gate* | §6.2 · §9 *Deliverables* | **O** | [Gap Analysis §8](../../../qmsr-iso13485-gap-analysis.md#8-software-validación-basada-en-riesgo-auditoría-trazabilidad) trazas | M |
| **DI-GOV-102** | ISO **4.2.4** *control* *documental*; cambio *governance* *trazado* | Mismo *DO* *doc*; *PR* *template* *CC* *ref* *baseline* | **T-GOV-DOC-001** *checklist* | *Records* 4.1.6 *spirit* | **O** | *Sign-off* *package* [MR](../management-reviews/mr-2026-q2.md) *coherent* | L |
| **DI-GOV-103** | ISO **7.5.6** *validation* *process* *hooks*; *stats* *audit* *vs* *pipeline* | `DO-GOV-05` *stats* *envelope* (si aplica) · *consistency* *tests* | **T-GOV-004** *stats* *contract* *test* *plan* | §6.4 · 7.5.6 *spirit* | **O** | *PQ* *staging* TBD | M |
| **DI-GOV-201** | *Loss/tamper* *audit*; fuga *PII* (14971 *spirit*) | `DO-GOV-02` *validation* + `DO-GOV-03` *integrity* *persistence* | **T-GOV-005** *negative* *inject*; *corruption* *recovery* *re-run* *existing* | §6.3; *risk* *table* *Gap* | **O** | *Residual* bajo *design*; *QA* *gate* [AI-GOV-4](../design-reviews/DR-2026-GOV-001-001.md#decisions--action-items) | H |
| **DI-GOV-301** | Regla MDC: *traceability*; sin *regresión* *silenciosa* | Todos *DO-GOV*; *PR* *mandatory* *line* *QMSR* | *Peer review* *QA* + *lint*; CI *green* | §6.2 | **O** | [`.mdc`](../../../../.cursor/rules/qmsr-iso13485-compliance.mdc) | M |
| **DI-GOV-401** | *Dual* *backend* JSON / SQLite; *WAL*; *ABI* *native* | `DO-GOV-03` `persistence/*` (opcional: *sequence* *monotone*) | **T-GOV-006** *sqlite* *integration* *when* *AUDIT_LOG_BACKEND=sqlite* | [SOUP](../soup-register-v1.md) *better-sqlite3*; §7.3 | **O** | *Optional* *dep* *SOUP* | M |
| **DO-GOV-04** (DO *requ*) | *API* *audit* *extensions* *documented*; *no* *breaking* *sin* *ADR* | `DO-GOV-04` `src/api/audit.ts` *query* / *envelope* | **T-GOV-002** *integration* *audit* *extended* | §8 *Supertest* | **O** | *OpenAPI* / *doc* *string* TBD *light* | M |
| **E. Change control, validation (post-baseline)** |
| **DI-CC-BL-001** | *Change control* explícito a [RELEASE-2026-Q2-v1.0](../releases/RELEASE-2026-Q2-v1.0.md) *product* *baseline* | *PR* *descriptions*; *link* *DP* §8 · *no* *overwrite* *DHF* *without* *version* | *Peer* *check*; *merge* *gate* | [SVMP §6.5](../../software-validation-master-plan.md#65-change-control--re-validation) | **P** | *Management* *Sign-off* *context* [signoff](../management-signoff-q2-2026.md) | L |
| **T-VAL-GOV-001** | *OQ* *suplemento* o *nota* *evidencia* *CI* *post* *GOV* *merge* | *N/A* *code* — *evidence* *record* [validation/](../validation/README.md) | **OQ-GOV-SUP-001** *run* *or* *append* *to* *OQ-2026-Q2* *annex* | §6.4 *validation* | **O** | [AI-GOV-2](../design-reviews/DR-2026-GOV-001-001.md#decisions--action-items) *Eng+QA* | M |
| **T-VAL-PIPE-001** | *Re-validación* *pipeline* *full* `npm test` + *typecheck* *post* *GOV* *delta* | *CI*; *local* *record* *optional* | *Same* *as* *OQ* *L-001* *scope* *extended* | §6.5 | **O** | *Gate* *before* *tag* | L |

*Conteo: **A**=9 filas **ER**; **B**=9 **RS**; **C**=3 **AT** *actualizadas*; **D**=10 (8 DI-GOV + fila **DO-GOV-04**); **E**=3. **Total aprox. = 34** filas *requirement* útiles; refinar si se consolidan filas *DO*.*

*Nota: **DO-GOV-01**–**05**, **T1**, **D1** están cubiertos en **DI-GOV-001/101/201/AT-001** *salvo* fila *explícita* **DO-GOV-04**.* 

---

## 3. Traceability Coverage Summary

| Métrica | v1.0 (referencia) | v1.1 (2026-05-28) | Nota |
|---------|------------------|------------------|------|
| **% *Compliant* (C)** | **~55%** (11/20) | **~40–45%** (14/34 *aprox*) | Nuevas filas *O* bajan *%* *hasta* *implement*; *ER/RS* *C* *preservado*. |
| **% *Partial* (P)** | **~40%** (8/20) | **~35–40%** | *AT-001/002* *siguen* *P* *con* *mejor* *traz*; *CC-BL* *P*. |
| **% *Open* (O)** | **~5%** (1/20) | **~20–25%** | *GOV* *implementation* *pending*; *normal* *pre-merge*. |
| **Cobertura *interpretada*** | *~90%* *V&V* *core* *ER+RS* | *Idem* + *plan* *GOV* *documental* *completo* | *Código* *GOV* *delta* = *post* *PR*. |

**Gaps *restantes***  

- **RVTM *full*:** nombres `it("…")` *estables*; *link* *CI* *build*; *T-GOV* *IDs* en *código* *post* *implement*.  
- **OQ-GOV-SUP-001** (§2 *T-VAL-GOV-001*): *archivado* bajo [validation](../validation/README.md) *al* *tag* *candidate*.  
- **21 Part 11** *full*; **SBOM** *transitivos*; **DPIA** — *unchanged* *Gap*.

**Next steps**  

1. *Merge* *implement* *bajo* *PR* *citando* *DP*+*DR*+*RVTM* *v1.1*.  
2. Cerrar *O*→*C* *donde* *evidencia*; *update* *Release* *Record* *successor* *o* *amend*.  
3. Sincronizar [DP-2026-GOV-001](../design-plans/DP-2026-GOV-001.md) *Estado* *Approved* *with* *actions* *tras* *signatures*.  
4. *Opcional* *RVTM* *v1.2* *minor* *solo* *IDs* *test* *exact*.

---

## 4. Approval Block (CPA, Eng Lead, QA/RA)

| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|--------|
| **Chief Product Architect** | *TBD* | | 2026-05-28 |
| **Engineering Lead** | *TBD* | | 2026-05-28 |
| **QA / Regulación (QA/RA)** | *TBD* | | 2026-05-28 |

**Decisión:** [x] **Approved with actions** (publicación matriz; *C/O* *pendiente* *implement*)  [ ] *Draft only*  [ ] *Reject*  

**Acciones residuales:** alinear con [DR-2026-GOV-001-001 *AI-GOV-1*…*5*](../design-reviews/DR-2026-GOV-001-001.md#decisions--action-items).

---

## Historial de versiones

| Versión | Fecha | Autor / Rol | Descripción |
|---------|--------|------------|-------------|
| 1.0 | 2026-05-10 | — | *Ver* [RVTM Light v1.0](./rvtm-light-v1.md) |
| **1.1** | **2026-05-28** | Chief Product Architect & Technical Lead | *Governance* *delta*; *AT* *updated*; *CC* *baseline*; *OQ* *sup* *placeholder*; *DP*/*DR* *links*. |
| **1.1-impl** | *post-merge* | Engineering / CPA | *Implementation* **DP-2026-GOV-001** — commit *feature* `7a630a5`; *merge* a `main` + **PR** `TBD_PR_URL` (sustituir por enlace real en GitHub/GitLab). [OQ-GOV-SUP-001](../validation/oq/OQ-GOV-SUP-001.md) *post-merge*. *Audit* *schema* v6; **T-GOV-001**…**T-GOV-005**. |

**Baseline *incorporado* por *referencia* (no *fork* *ER/RS*):** [RELEASE-2026-Q2-v1.0](../releases/RELEASE-2026-Q2-v1.0.md).

---

*Fin de `rvtm-light-v1.1.md`.*
