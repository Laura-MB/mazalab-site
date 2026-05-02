# OQ-2026-Q2-Light – Operational Qualification Light for MAZALab Core (Entity Resolution + Risk Scoring + API)

**Documento:** `OQ-2026-Q2-Light.md`  
**Versión:** 1.0  
**Fecha de ejecución (propuesta):** 2026-05-20  
**Estado:** Draft for QA Review → **Approved with actions**  
**Referencia:** [SVMP](../../../software-validation-master-plan.md) §6.4 *Validation* · §8 *Testing Strategy*; [SOP-001](../../../sop-design-and-development.md); [RVTM *light* v1.0](../../rvtm/rvtm-light-v1.md); [SOUP register v1.0](../../soup-register-v1.md); [Gap Analysis](../../../../qmsr-iso13485-gap-analysis.md) · [`.cursor/rules/qmsr-iso13485-compliance.mdc`](../../../../../.cursor/rules/qmsr-iso13485-compliance.mdc)

**Alineado a *design* baseline:** [DP-2026-ER-BL v1.2](../../design-plans/DP-2026-ER-BL.md) · [DP-2026-RS-BL v1.2](../../design-plans/DP-2026-RS-BL.md)

---

## 1. Purpose and Scope

| Tema | Contenido |
|------|-------------|
| **Propósito** | Demostrar bajo [SVMP §6.4](../../../software-validation-master-plan.md#64-validation-incluyendo-iqoqpq-si-aplica) que el **sistema *as-built*** en el repositorio **Mother Brain** opera conforme a los **requisitos de usuario / diseño** del núcleo: **Entity Resolution** (Jaccard + Levenshtein in-house, normalización, conflictos, explicación de *match*), **Risk Scoring** (*multi-dimension* transparente, explicaciones accionables, combos acotados), y **API** `POST /assess-risk` (contrato, errores, influencia *match*→*score*, *summary* y acciones), más **governanza** mínima (*correlation* en explicación, estructura enriquecida). |
| **Alcance (OQ *light*)** | Ejecución documentada de **typecheck**, **suite Vitest** (unit + integración Supertest), **integridad SOUP** (*lock*), **reproducibilidad** básica de *scores* en casos fijados, y **revisión puntual** de minimización de datos / no registro *PII* en rutas de prueba. **No** sustituye **PQ** en *staging* con carga, ni **UAT** firmado por cliente. |
| **Fuera de alcance** | Infra de despliegue (K8s, *ingress*), **21 CFR Part 11** *full*, datos reales de clientes, y validación de contenido de terceros. |
| **Criterio de *done* (*light*)** | Todas las filas de la tabla §4 con **Pass** o **Pass with observations**; desviaciones en §6; aprobación §7; evidencias listadas en §8. |

---

## 2. Test Environment

| Atributo | Valor (registrado o *placeholder* — completar al ejecutar) |
|----------|-----------------------------------------------------------|
| **OS** | *Placeholder:* Windows 10.0.19045 (64-bit) **o** Linux CI *runner* (Ubuntu *latest*). **Ejecución 2026-05-20 (prop.):** [ ] *local*  [ ] *CI*  [ ] *ambas* — anotar en §8. |
| **Node.js** | `engines`: **≥20** per [`package.json`](../../../../../package.json). **Registrar:** salida de `node -v` (ej. *v20.x* / *v22.x*). |
| **npm** | **Registrar:** `npm -v` (ej. *10.x*). Proyecto usa **lockfile** (`package-lock.json`); *no* se exige *yarn* en OQ. |
| **Repositorio / commit** | **SHA** del *commit* bajo prueba: `________________` (mismo *hash* en §5 y en *release* *record* si existe). |
| **Variables de entorno** | *Tests:* mínimo — sin *secrets* reales. Para *integration*, la app bajo `createApp()` usa configuración *default*; **no** requiere `SUPABASE_*` para *green* (cliente *lazy* / opcional). Documentar `NODE_ENV` si se fija. |
| **Herramientas** | `tsc` (TypeScript **5.9.x** lock), **Vitest** **4.1.x**, **Supertest** **7.2.x** (ver [SOUP v1.0](../../soup-register-v1.md) §3). |

---

## 3. Prerequisites

| # | Prerrequisito | Criterio | Evidencia / referencia |
|---|----------------|----------|------------------------|
| P1 | **SOUP** revisado y versionado | [SOUP register v1.0](../../soup-register-v1.md) refleja *direct* *deps*; riesgo y mitigaciones aceptables con *actions* (§5–6 SOUP) | *Baseline* 2026-05-15; *firma* SOUP = *TBD* Management |
| P2 | **RVTM** *light* v1.0 trazas DI→código→prueba | [RVTM](../../rvtm/rvtm-light-v1.md) aprobado *with actions*; filas **DI-ER/RS/AT** mapean a `tests/**` | Matriz principal §2 RVTM |
| P3 | **Instalación limpia** (recomendado para OQ *formal*) | `rm -rf node_modules` (o equivalente) + `npm ci` (preferido) **o** `npm install` documentado; mismo resultado **Pass** | *Opcional:* log *npm ci* anexo §8 |
| P4 | **Código y tests** presentes en el *commit* | Sin *skip* forzado en *suite* bajo *gate*; *branches* *feature* *mergeadas* a la línea base validada | *Git* *tag* sugerido post-OQ: `v0.1.x+oq-2026-q2` (discussión *release*) |

---

## 4. Test Cases / Checklist

*Método documentado: [SVMP §8](../../../software-validation-master-plan.md#8-testing-strategy-vitest-supertest-integration--regulatory-tests). IDs **OQ-L-xxx** para trazas futuras en RVTM *full*.*

| ID | Categoría | Procedimiento (accionable) | Resultado esperado | Trazas RVTM / módulo (indic.) |
|----|------------|----------------------------|--------------------|------------------------------|
| **OQ-L-001** | Typecheck / *build* | `npm run typecheck` (=`tsc --noEmit` *app* + *test* *tsconfig*) | *Exit code* 0; sin errores de tipos en `src/**` y `tests/**` | DI-ER-301, DI-RS-301; [SVMP §6.3](../../../software-validation-master-plan.md#63-verification) |
| **OQ-L-002** | Vitest **unit** — **Entity Resolution** | `npx vitest run tests/unit/core/entity-resolution/` (o `npm test` *full*) | *Pass*; valida *normalizer*, `similarity` (Jaccard/Levenshtein in-house), *conflict* detector, `EntityResolutionService` | DI-ER-001, 001b, 002, 003, 201; `similarity.ts` *no* SOUP |
| **OQ-L-003** | Vitest **unit** — **Risk Scoring** + *gaming* acotado | *Suite* `tests/unit/core/risk-scoring/**` + `tests/unit/core/gaming/**` según `npm test` | *Pass*; *breakdown* *multi-dim*, *explain builder*, *combos* acotados | DI-RS-001–003, 201; DI-RS-401 |
| **OQ-L-004** | Vitest **unit** — *Assessment* / orquestación | `tests/unit/core/assessment/AssessmentService.test.ts` (incluido en *full* *suite*) | *Pass*; *pipeline* ER+RS coherente | DI-ER-401, *pipeline*; [SVMP §2 scope](../../../software-validation-master-plan.md#2-scope) |
| **OQ-L-005** | **Supertest** — `POST /assess-risk` | `npx vitest run tests/integration/api/assess-risk.test.ts` | *Pass*; al menos: `returns RiskAssessment with resolvedEntity...` (200, *array*, *overall*, *level*, *components*); `assessmentSummary` + `recommendedActions` coherentes con *tier*; estructura enriquecida; **desigualdad** *matchScore* y *overall* en par *high* vs *low* alineación; *correlationId* en *explicación* si se envía | DI-AT-002; *explainability* [SVMP §7.1–7.2](../../../software-validation-master-plan.md#7-specific-validation-strategy-for-core-modules) |
| **OQ-L-006** | **Supertest** — *audit* API (trazas gobernanza) | `npx vitest run tests/integration/api/audit.test.ts` | *Pass*; consulta/append coherente con *governance* *design* | DI-AT-001; [SVMP §7.3](../../../software-validation-master-plan.md#73-audit-trail--compliance-metadata) |
| **OQ-L-007** | **SOUP** — integridad *lock* | (1) `git status package-lock.json` = limpio o *diff* revisado. (2) Comparar *top* *deps* con [SOUP §3](../../soup-register-v1.md#3-soup--ots-register-tabla-principal) (Express, TypeScript, Vitest, *winston*, etc.) | Sin cambio no documentado; versiones *lock* = coherente con filas SOUP **o** desviación en §6 | [SOUP](../../soup-register-v1.md) §5 re-eval. *release* |
| **OQ-L-008** | **Rendimiento / reproducibilidad** *light* | Misma carga fija en *dos* ejecuciones *seguidas* de `OQ-L-005` (mismo *commit*): *p. ej.* payload `ent-001` *Laura Mendoza* | `riskScore.overall` (y *match* components relevantes) **idénticos** *bit-a-bit* en número (o *delta* 0) entre ejecuciones; latencia *p99* *no* exigida en OQ *light* | *Determinism*; [SVMP §7.1](../../../software-validation-master-plan.md#71-entity-resolution-fuzzy-matching-jaccard-levenshtein-conflict-resolution-explainability) *nota* *performance* |
| **OQ-L-009** | **Privacidad / minimización** *spot-check* | *Code review* puntual: `src/core/observability/**`, `assess-risk` *path*, y política de no logar *bodies* sensibles; confirmar *tests* usan datos sintéticos | Sin hallazgo **bloqueante**; riesgo residual = *Accepted with action* (refinar política *logs* si *gap*) | *Gap* *PII*; [RVTM DI-ER-101 / DI-AT-001](../../rvtm/rvtm-light-v1.md) |
| **OQ-L-010** | **Evidencia** | (1) Guardar *stdout* *Vitest* *summary* o reporte. (2) *Opcional:* `npm test 2>&1 | tee oq-2026-q2-vitest.log`. (3) *Hash* SHA-256 de `package-lock.json` o del log: `_______` | Artefacto archivado o en §8; trazable al *commit* | [SVMP §9](../../../software-validation-master-plan.md#9-deliverables--records-design-history-file--technical-file-equivalents) *records* |

**Nota (acción menor recomendada):** en evolución **RVTM *full***, añadir nombres `it("…")` estables o IDs de caso para mapeo 1:1 (ver [RVTM §3 *Next steps*](../../rvtm/rvtm-light-v1.md#3-summary-of-traceability-coverage)).

---

## 5. Results (Pass/Fail + Comments)

*Valores *placeholder* asumiendo *suite* *green* en la línea base; **sustituir** *No* *→* *Sí* o *N/A* tras ejecución real.*

| ID | Resultado | Comentario (ej. *flaky*, *env*, *duración*) |
|----|------------|---------------------------------------------|
| OQ-L-001 | **Pass** *(asumido)* | *Typecheck* sin errores. |
| OQ-L-002 | **Pass** *(asumido)* | *ER* in-house *similarity*; *conflict* *paths* cubiertas. |
| OQ-L-003 | **Pass** *(asumido)* | *Gaming* / *combos* acotados alineados a [DP-2026-RS-BL](../../design-plans/DP-2026-RS-BL.md). |
| OQ-L-004 | **Pass** *(asumido)* | *Assessment* *orquesta* ER+RS. |
| OQ-L-005 | **Pass** *(asumido)* | *Explainability* *markdown* *summary*; *correlation* en *explanation*. |
| OQ-L-006 | **Pass** *(asumido)* | *Audit* *route* *integration*. |
| OQ-L-007 | **Pass** *(asumido)* | *Lock* = coherente con [SOUP v1.0](../../soup-register-v1.md) (o desviación §6). |
| OQ-L-008 | **Pass** *(asumido)* | Reproducibilidad *numérica* *match*+score *pair*. |
| OQ-L-009 | **Pass** *(asumido con actions)* | Acción: formalizar *checklist* *log* *PII* en *release* *siguiente*. |
| OQ-L-010 | **Pass** *(asumido)* | Log o *hash* enlazado en §8. |

**Resumen:** **10 / 10** criterios **Pass** o **Pass with actions** *(placeholder)*. **Bloqueante** si *Fail* en OQ-L-001, 002, 003, 005, 007: **re-validación** tras corrección, ver [SOP-001](../../../sop-design-and-development.md) *change* *control*.

---

## 6. Deviations / Observations

| # | Tipo | Descripción | Resolución |
|---|------|-------------|------------|
| D1 | *Observation* | OQ *light* no incluye *screenshots* *UI*; evidencia = consola/CI. | *OK* *para* *v1* *API*-*first*; *PQ* *staging* = *futuro*. |
| D2 | *Action* | [SOUP §6](../../soup-register-v1.md#6-approval-block-cpa-eng-lead-qara) y **OQ §7** *firmas* *TBD* (*Management*). | Completar en mismo *window* *MR* o *QAR* *review*. |
| D3 | *Optional* | Añadir *tag* *git* y *enlace* *Workflow* *run* a §8 (GitHub / otro) cuando el *pipeline* esté fijado. | *Backlog* *QA*. |

*Sin desviación funcional **abierta** si el *asumido* *Pass* se confirma en ejecución.*

---

## 7. Conclusion and Approval (CPA + QA/RA)

**Conclusión (borrador):** Con los resultados §5, el *Mother Brain* **core** (ER + RS + `POST /assess-risk` + *audit* *integration* *tests*) se considera **cualificado operacionalmente** en sentido *light* según [SVMP §6.4](../../../software-validation-master-plan.md#64-validation-incluyendo-iqoqpq-si-aplica), sujeto a: (1) *firmas* abajo, (2) *PQ* *staging* y *OQ* *re-run* *major* (ver *SOUP* *change* y [RVTM](../../rvtm/rvtm-light-v1.md)).

| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|--------|
| **Chief Product Architect (CPA)** | *TBD* | | 2026-05-20 |
| **Engineering Lead** | *TBD* | | 2026-05-20 |
| **QA / Regulación (QA/RA)** | *TBD* | | 2026-05-20 |

**Estado:** [x] *Draft* listo para *QA* *Review*  [ ] *Approved* *with* *actions*  [ ] *Rejected*

*Acción residual §7:* re-OQ o ampliación en **H2 2026** si *threshold* *scorer* o *Express* *major* (ver [SOUP](../../soup-register-v1.md) §5).

---

## 8. Evidence Attachments / Links (CI, test reports, etc.)

| Evidencia | Ubicación / *placeholder* |
|-----------|---------------------------|
| *Test* *report* (consola o artefacto) | `docs/qmsr-iso13485/records/validation/oq/artifacts/`*TBD* *— no versionar* *secrets*; preferir *CI* *URL* *externa* |
| *CI* *workflow* *run* (si existe) | *URL:* `https://...` (completar) |
| *Commit* *SHA* | *Ver* §2 |
| *Hash* `package-lock.json` (opcional) | `shasum -a 256 package-lock.json` o PowerShell *Get-FileHash* |
| *Código* *bajo* *prueba* | Mismo *SHA* que *release* *candidate* |
| *Cross-ref* *índice* | [`../README.md`](../README.md) apunta a este documento |

---

## Historial de versiones

| Versión | Fecha | Autor / Rol | Descripción |
|---------|--------|------------|-------------|
| 1.0 | 2026-05-20 (propuest.) | Chief Product Architect & Technical Lead | Primera **OQ** *light* Q2 2026: tablas OQ-L-001–010, *baseline* *SVMP* 6.4/8, *RVTM*+SOUP, DPs ER/RS. |

**Enlaces obligatorios:** [RVTM *light*](../../rvtm/rvtm-light-v1.md) · [SOUP v1.0](../../soup-register-v1.md) · [Validation *index*](../README.md) · [SVMP §6.4/§8](../../../software-validation-master-plan.md)

---

*Fin de `OQ-2026-Q2-Light.md`.*
