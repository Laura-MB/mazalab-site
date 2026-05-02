# OQ-GOV-SUP-001 – Operational Qualification Supplement (Governance Layer / Post-merge)

**Documento:** `OQ-GOV-SUP-001.md`  
**Versión:** 1.1 (*execution package — results as-run on dev env*)  
**Fecha de ejecución (evidencia *local* / CI *gate*):** 2026-04-22  
**Estado:** Ready for **Approved** (tras *merge* `main` + sustitución `__MERGE_SHA_MAIN__` / *PR* *URL* en §5)  
**Referencia:** [DR-2026-GOV-001-001 *AI-GOV-2*](../../design-reviews/DR-2026-GOV-001-001.md#decisions--action-items) · [DP-2026-GOV-001 v1.1](../../design-plans/DP-2026-GOV-001.md) · [RVTM Light v1.1](../../rvtm/rvtm-light-v1.1.md) · [SVMP §6.4 / §6.5](../../../software-validation-master-plan.md#64-validation-incluyendo-iqoqpq-si-aplica) · [SOP-001 §12](../../../sop-design-and-development.md#12-design-changes--change-control-integración-con-audit-trail-y-re-validation) · [Management Sign-off Q2 2026](../../management-signoff-q2-2026.md) · Baseline [RELEASE-2026-Q2-v1.0](../../releases/RELEASE-2026-Q2-v1.0.md)

**Commit de *feature* (implementación):** `7a630a5` (rama `feat/governance-dp-2026-gov-001`) · *Docs* cierre: `0e358e9` (según `git` local).

**Post-merge (main):** sustituir **`__MERGE_SHA_MAIN__`** con `git rev-parse main` (script [post-merge-governance-closure.ps1](../../../../../scripts/closed-loop/post-merge-governance-closure.ps1)).

**Relación con OQ *core*:** No sustituye [OQ-2026-Q2-Light.md](./OQ-2026-Q2-Light.md); **amplía** con *delta* *Governance* (metadata, *audit* *schema* v6, cabeceras `x-governance-metadata` / `x-compliance-schema-version`).

---

## 1. Purpose and Scope

| Tema | Contenido |
|------|------------|
| **Propósito** | Verificar bajo *design controls* que el *Governance Layer* operado en código cumple: *compliance* *metadata* no intrusiva, *append* *audit* con `compliance` opcional, cabeceras HTTP en `POST /assess-risk`, pruebas **T-GOV-001**…**T-GOV-005**. |
| **Alcance** | `npm run typecheck` · `npm test` (incl. `tests/unit/core/governance/**`, `tests/integration/api/assess-risk.test.ts`) · *privacy* (T-GOV-005) · *headers* (T-GOV-003 integración). |
| **Fuera de alcance** | PQ *staging*; Part 11 *full*; re-OQ *total* *SOUP*. |
| **Criterio** | §4 = **Pass**; §5 = SHA `main` + *PR* *URL*; §7 = firmas QA/RA + Eng. |

---

## 2. Environment (registro *as-run* 2026-04-22)

| Atributo | Valor |
|----------|--------|
| **OS** | Windows 10.0+ (*local*; CI: documentar *runner* si aplica) |
| **Node.js** | v22.22.0 (`node -v`) |
| **Commit bajo prueba (main *post-merge*)** | `__MERGE_SHA_MAIN__` |
| **Repositorio** | MAZALab; rama cierre: `main` |

---

## 3. Test cases / Checklist (OQ-GOV-SUP-001)

| ID | Categoría | Procedimiento | *Pass* = |
|----|------------|---------------|----------|
| **GOV-SUP-01** | Typecheck | `npm run typecheck` | *Exit* 0 |
| **GOV-SUP-02** | Full suite (incl. T-GOV) | `npm test` | 24 *files* / 220 *tests* *passed* (Vitest 4.1.x) |
| **GOV-SUP-03** | Headers *HTTP* | *Cubierto* en `assess-risk.test.ts` — *T-GOV-003* | `x-compliance-schema-version` + `x-governance-metadata`; *body* `governance` en `assessments[0]` |
| **GOV-SUP-04** | *Privacy* | `compliance-metadata.test.ts` · `pii-patterns.test.ts` | Rechazo patrones *PII* en *metadata*; JSON sin `@` *email-like* en *fixtures* *GOV* |
| **GOV-SUP-05** | *Audit* *schema* | `AuditLogService.compliance.test.ts` | *Append* con `compliance` en fila; `AUDIT_LOG_SCHEMA_VERSION` = **6** |
| **GOV-SUP-06** | *Stats* | `audit-log-stats.compliance.test.ts` | *Stats* *estables* con entradas que incluyen *compliance* |
| **GOV-SUP-07** | Trazas *docs* | [RVTM v1.1](../../rvtm/rvtm-light-v1.1.md) fila **1.1-impl** + *PR* *mergeado* | Sustituir `TBD_PR_URL` *post-merge* |

---

## 4. Results (*as-run* 2026-04-22 — *re-verificar* en `main` *post-merge*)

| ID | Resultado | Comentario / evidencia |
|----|------------|-------------------------|
| GOV-SUP-01 | **Pass** | `tsc` *app* + *test* *configs*; *exit* 0 |
| GOV-SUP-02 | **Pass** | **220** *tests* *passed* / 24 *files*; *duration* *order* 17–25 s *typical* *local* |
| GOV-SUP-03 | **Pass** | Integración: cabeceras + `governance` en primer *assessment*; *decode* *base64url* coherente |
| GOV-SUP-04 | **Pass** | T-GOV-001/005: *minimization*; `validateComplianceForAuditAppend` *rejects* *email* en *rulesVersion* *inject* *test* |
| GOV-SUP-05 | **Pass** | *Persistence* *in-memory* *append* con *compliance* en fila *audit* |
| GOV-SUP-06 | **Pass** | *countByLevel* / *total* coherentes *con* *metadata* *opcional* |
| GOV-SUP-07 | **Pass** *(*tras *sustituir* *TBD_PR_URL* *)* | *Placeholder* *PR* hasta *merge* *forja*; trazas RVTM §Historial 1.1-impl |

---

## 5. Evidence pointers

| Evidencia | Valor |
|-----------|--------|
| **Log Vitest (resumen)** | `npm test` — *Test Files* 24 *passed* · *Tests* 220 *passed* (2026-04-22) |
| **PR** *mergeado* | `TBD_PR_URL` — *sustituir* *post-**merge* |
| **Tag** *product* | `v1.1.0` (mensaje: ver [MERGE-FEAT-GOVERNANCE-TO-MAIN.md](../../change-control/MERGE-FEAT-GOVERNANCE-TO-MAIN.md) y *script* *tag* en *PR* *record*) |
| **SHA `main` *definitivo*** | `__MERGE_SHA_MAIN__` — *sustituir* con `git rev-parse main` *tras* *merge* |

---

## 6. Riesgos residuales aceptados (OQ *sup*)

| Tema | Riesgo aceptado | Nota / mitigación *post-OQ* |
|------|------------------|----------------------------|
| **Cobertura** | RVTM *light* *no* *full* repositorio | *Roadmap* RVTM *full*; *MR* *Q4* *track* [mr-2026-q4-agenda.md](../../management-reviews/mr-2026-q4-agenda.md) |
| **Entorno** | OQ *sup* *ejecutada* *local* *mayormente*; CI *debería* replicar | Añadir *log* *CI* *green* *anexo* *opcional* |
| **SOUP** | *No* *re-heat* *completo* *deps* en este *sup* | *Re-eval* *release* *siguiente* [SOUP v1.0](../../soup-register-v1.md) |
| **Part 11** | *Out of* *scope* | *Audit* *append-only* = *hacia* *futuro* *elección* *registrada* *Management* |

*Sin desviación que impida* **Pass** *de la tabla §4 para el alcance §1.*

---

## 7. Deviations / Notes

*Anexar *solo* si hay *waiver* formal QA/RA. Por defecto: **Ninguna** *para* *alcance* *OQ* *sup*.*

---

## 8. Approval (QA/RA + Eng)

| Rol | Nombre | Firma / Fecha |
|-----|--------|----------------|
| **QA/RA** | *TBD* |  |
| **Engineering Lead** | *TBD* |  |

**Estado:** [ ] Draft  [x] **Ready for sign-off** (evidencia §4–5 completa *tras* *merge* *main* y *sustitución* *TBD*/*SHA*)  [ ] **Approved**  [ ] Rejected (motivo: ____ )

---

## Historial

| Ver | Fecha | Descripción |
|-----|--------|------------|
| 1.0 | 2026-04-22 | Creación *OQ* *sup* *ligera*; *AI-GOV-2* |
| **1.1** | 2026-04-22 | *Results* reales (typecheck, 220 *tests*), *headers*/*privacy* *mapped*, *riesgos* *residuales*; *merge* *doc* + *placeholders* *SHA*/*PR* |

*Fin de OQ-GOV-SUP-001.*
