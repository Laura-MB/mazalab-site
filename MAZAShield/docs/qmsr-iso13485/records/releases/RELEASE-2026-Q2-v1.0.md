# Release Record – MAZALab Core Baseline v1.0 (Q2 2026)

**Documento:** `RELEASE-2026-Q2-v1.0.md`  
**Versión:** 1.0  
**Fecha de release:** 2026-05-25 (propuesta)  
**Build / Tag:** `v1.0.0` — **placeholder;** sustituir por el *tag* Git real al ejecutar `git tag` y completar el SHA (§1)  
**Estado:** Draft for Approval → **Approved** (tras firmas §8)  
**Referencia normativa (espíritu):** [SOP-001](../../sop-design-and-development.md) §**11** *Design Transfer*; [SVMP](../../software-validation-master-plan.md) §**6.4** *Validation* & §**9** *Deliverables*; [MR-2026-Q2 v1.0](../management-reviews/mr-2026-q2.md) §4 & §5; [OQ-2026-Q2-Light](../validation/oq/OQ-2026-Q2-Light.md); [SOUP v1.0](../soup-register-v1.md); [RVTM *light* v1.0](../rvtm/rvtm-light-v1.md); [Gap Analysis](../../../qmsr-iso13485-gap-analysis.md) · [`.cursor/rules/qmsr-iso13485-compliance.mdc`](../../../../.cursor/rules/qmsr-iso13485-compliance.mdc)

**Archivo:** `docs/qmsr-iso13485/records/releases/RELEASE-2026-Q2-v1.0.md` — primer **Release Record** oficial *Mother Brain* *core*; incorporar al **DHF** (paquete equivalente) vía SOP-001 §13.

---

## 1. Release Identification (version, tag, commit SHA, date)

| Campo | Valor (completar al *tag* / aprobación) |
|--------|----------------------------------------|
| **Nombre comercial / línea** | MAZALab **Mother Brain** *core* — *baseline* regulado Q2 2026 |
| **Versión lógica** | **1.0** (alineada a *semver* *producto*; ver `package.json` *0.1.0* *repo* — reconciliar al etiquetar) |
| **Tag Git (propuesta)** | `v1.0.0` — *actualizar* si la política de *versionado* fija otra secuencia |
| **Commit SHA (full)** | *Placeholder:* `________________________________`  *(ejecutar `git rev-parse HEAD` en el *commit* etiquetado)* |
| **Fecha de *release* documentada** | **2026-05-25** (propuesta) |
| **Node.js (build host de referencia)** | *Placeholder:* `node -v` → `v20.x` / `v22.x` (registrar) |
| **npm** | *Placeholder:* `10.x` (registrar) |
| **Responsable *release* (técnico)** | Engineering Lead (según SOP-001) |

---

## 2. Scope of Release

Este *release* consolida el **estado *as-built*** bajo **design controls** (ISO 13485 Cl. 7.3) para el alcance aprobado en [SVMP](../../software-validation-master-plan.md) §2 y [Gap Analysis §9](../../../qmsr-iso13485-gap-analysis.md#9-recomendaciones-y-plan-de-cierre-priorizado).

| Módulo / capa | Inclusión en v1.0 (Q2 2026) | Referencia de diseño |
|---------------|----------------------------|----------------------|
| **Entity Resolution (ER)** | **Sí** — *baseline* formal: normalización, similitud **Jaccard + Levenshtein** (in-house), *conflict* detection, explicación de *match* | [DP-2026-ER-BL v1.2](../design-plans/DP-2026-ER-BL.md) · [DR-2026-ER-BL-001](../design-reviews/DR-2026-ER-BL-001.md) |
| **Risk Scoring (RS)** | **Sí** — *multi-dimension* transparente, *breakdown*, explicaciones accionables, *combos* acotados, dominios *general* / *gaming* según arquitectura | [DP-2026-RS-BL v1.2](../design-plans/DP-2026-RS-BL.md) · [DR-2026-RS-BL-001](../design-reviews/DR-2026-RS-BL-001.md) |
| **API** `POST /assess-risk` (y *pipeline* *assessment* asociado) | **Sí** — contrato, errores, *explainability* *downstream* de ER+RS | RVTM *DI-AT-002*; pruebas `tests/integration/api/assess-risk.test.ts` |
| **Gobernanza / *audit* (*governance* layer)** | **Sí** — rutas *audit*, persistencia *append-only* (JSON / SQLite opcional) según diseño | RVTM *DI-AT-001*; *integration* *audit* |

**Fuera de alcance de certificación con este *release*:** *PQ* *staging* con carga representativa; UI comercial; **21 CFR Part 11** *full*; datos reales de clientes (entornos de prueba / sintéticos).

**Declaración de madurez QMS:** Los módulos **ER** y **RS** quedan explícitamente bajo **design inputs/outputs, design reviews, verificación/validación** y trazas [RVTM](../rvtm/rvtm-light-v1.md), alineado con la misión **Risk Intelligence** premium (precisión, explicabilidad, trazas).

---

## 3. Pre-Release Verification (OQ *light*, tests, typecheck, SOUP)

| Criterio | Resultado (línea base documentada) | Evidencia |
|----------|-------------------------------------|-----------|
| **OQ *light* Q2** | *Protocol* [OQ-2026-Q2-Light v1.0](../validation/oq/OQ-2026-Q2-Light.md) — criterios OQ-L-001…010 **Pass** o **Pass with actions** (placeholder a sustituir por ejecución firmada) | OQ §5 |
| **Typecheck** | **Pass** — `npm run typecheck` (*tsc* *app* + *test* configs) | OQ OQ-L-001 |
| **Tests Vitest** | **211** *tests* **passed**, **20** *test files* (suite completa) | OQ; MR Q2; comando `npm test` |
| **Integración API** | *Pass* en `assess-risk` y *audit* (Supertest) | OQ-L-005, OQ-L-006 |
| **SOUP** | [soup-register-v1.md](../soup-register-v1.md) (v1.0) — *direct* *dependencies* con riesgo/mitigación; *lock* coherente (OQ-L-007) | SOUP §3–5 |
| **RVTM** *light* | Matriz aprobada *with actions*; cobertura resumida **~90%** *verification* *core* ER+RS; estados de fila: **~55% C**, **~40% P**, **~5% O** (métrica interna RVTM §3) | [RVTM §3 *Summary*](../rvtm/rvtm-light-v1.md#3-summary-of-traceability-coverage) |

**Nota:** Sustituir *placeholders* de SHA, `node -v` y *URL* CI en OQ §8 y en §1 de este registro al archivar *post-tag*.

---

## 4. Design Transfer Checklist (referencia SOP-001 §11)

*Basado en [SOP-001 — §11 *Design Transfer*](../../sop-design-and-development.md#11-design-transfer-a-producción--release) y cierre de [MR-2026-Q2](../management-reviews/mr-2026-q2.md#4-decisions-and-action-items) (acción 5).*

| # | Requisito SOP-001 / SVMP | Estado | Notas / *evidence pointer* |
|---|-------------------------|--------|----------------------------|
| D1 | **DI/DO** aprobados o *baseline* documentado (DP, DR) | [x] **Cumplido** | DPs v1.2; DR-2026-ER/RS-BL-001 *Approved with actions* |
| D2 | **Verificación** con evidencia (pruebas automatizadas) | [x] **Cumplido** | 211 *tests* *passed*; *typecheck* |
| D3 | **Validación** / cierre aprobado según riesgo (OQ *light*) | [x] **Cumplido** (*light*) | [OQ-2026-Q2-Light](../validation/oq/OQ-2026-Q2-Light.md) — *PQ* *staging* = *follow-up* |
| D4 | **RVTM** actualizado (*snapshot* lógico v1.0) | [x] **Cumplido** *light* | [RVTM v1.0](../rvtm/rvtm-light-v1.md) |
| D5 | **Registro de *release*** (versión, *build* hash, notas) | [x] **Este documento** | [SVMP §9](../../software-validation-master-plan.md#9-deliverables--records-design-history-file--technical-file-equivalents) |
| D6 | **Transferencia** *staging* → *prod* con IQ/OQ según entorno | [ ] *N/A* *repo-only*  [x] *Parcial* — OQ *light* *dev*/*CI*; *staging* *IQ* = *roadmap* | Despliegue producto = *out of scope* *documental* *here* *unless* *attach* *runbook* |
| D7 | **Formación** / visibilidad de cambio; sin *breaking* *API* no documentado | [x] **Parcial** | *CHANGELOG* / notas §6; *API* contract en tests *integration* |
| D8 | **Post-release** monitorización, *SOUP* §5, *change control* 6.5 | [x] **Ongoing** | [SOUP §5](../soup-register-v1.md#5-acceptance-criteria-and-ongoing-monitoring-re-evaluación-por-release); SOP-001 §12 |

---

## 5. Risk Assessment & Residual Risk

| Tema | Enlace / síntesis |
|------|-------------------|
| **SOUP (terceros)** | Riesgo controlado vía *pin* *lock* [soup-register-v1.md](../soup-register-v1.md) §3–4; re-evaluación por *release* §5; *residual:* dependencias *transitivas* sin SBOM completo (H2) |
| **RVTM (producto lógica propia)** | Falsos emparejamientos / scores — mitigado por pruebas, umbrales, *conflict* *detector*; *residual* filas P/O en RVTM (~40–5%) | [RVTM](../rvtm/rvtm-light-v1.md) |
| **14971** *formal* | *Risk file* completo = *TBD* externo; coherencia con *spirit* y [Gap Analysis](../../../qmsr-iso13485-gap-analysis.md) |
| **Capa *audit*** | Riesgo pérdida de trazas — *append-only*, tests *governance*; 21 Part 11 *full* TBD |
| **Aceptación Management** | Riesgo residual aceptado para *baseline* *non-clinical* *analytics*; revisión [MR-2026-Q2](../management-reviews/mr-2026-q2.md) |

---

## 6. Release Notes / Changes (baseline *as-built* + menores)

- **Hito Q2 2026:** Primera línea *release* con **ER** y **RS** bajo **design controls** formales (no solo implementación; incluye DPs, DRs, RVTM, OQ, SOUP, MR, este RR).  
- **Comportamiento *core*:** *Pipeline* *assessment* (resolve → score → *summary* / acciones), *gaming* *vertical* acotada según DP-RS, *audit* *metadata*.  
- **Cambios menores** posteriores al congelado lógico de documentación: solo vía *change control* (SOP-001 §12) y nuevo registro o *amend*.

*Changelog técnico detallado:* extraer de *git* `git log` entre *tags* o desde historial *PR* al fijar SHA §1.

---

## 7. Evidence Links (OQ, RVTM, SOUP, DPs, DRs, MR Q2)

| Tipo | Documento / artefacto |
|------|------------------------|
| **OQ** | [OQ-2026-Q2-Light.md](../validation/oq/OQ-2026-Q2-Light.md) |
| **RVTM** | [rvtm-light-v1.md](../rvtm/rvtm-light-v1.md) |
| **SOUP** | [soup-register-v1.md](../soup-register-v1.md) |
| **DP ER** | [DP-2026-ER-BL.md](../design-plans/DP-2026-ER-BL.md) v1.2 |
| **DP RS** | [DP-2026-RS-BL.md](../design-plans/DP-2026-RS-BL.md) v1.2 |
| **DR ER** | [DR-2026-ER-BL-001.md](../design-reviews/DR-2026-ER-BL-001.md) |
| **DR RS** | [DR-2026-RS-BL-001.md](../design-reviews/DR-2026-RS-BL-001.md) |
| **MR Q2 2026** | [mr-2026-q2.md](../management-reviews/mr-2026-q2.md) v1.0 *Approved* |
| **Validación (índice)** | [validation/README.md](../validation/README.md) |
| **SVMP** | [software-validation-master-plan.md](../../software-validation-master-plan.md) |
| **SOP-001** | [sop-design-and-development.md](../../sop-design-and-development.md) |
| **Gap Analysis** | [qmsr-iso13485-gap-analysis.md](../../../qmsr-iso13485-gap-analysis.md) |
| **Regla** | [`qmsr-iso13485-compliance.mdc`](../../../../.cursor/rules/qmsr-iso13485-compliance.mdc) |
| **Entorno (opc.)** | *URL* *CI* o log `npm test` / *vitest* *summary* anexar al archivar OQ §8 |

---

## 8. Approval Block (CPA, Eng Lead, QA/RA, Management)

| Rol | Nombre (impreso) | Firma | Fecha |
|-----|------------------|-------|--------|
| **Chief Product Architect (CPA)** | *TBD* | | 2026-05-25 |
| **Engineering Lead** | *TBD* | | 2026-05-25 |
| **QA / Regulación (QA/RA)** | *TBD* | | 2026-05-25 |
| **Management** (autoridad *release* regulado) | *TBD* | | 2026-05-25 |

**Estado del registro:** [x] *Draft* listo para aprobación  [ ] **Approved** (cuatro firmas o política *delegation* *documented*)  [ ] Rechazado / revisión: ___________

---

## Historial de versiones

| Versión | Fecha | Autor / Rol | Descripción |
|---------|--------|------------|-------------|
| 1.0 | 2026-05-25 (propuest.) | Chief Product Architect & Technical Lead | Primer **Release Record** oficial *core* Q2; alinea SOP-001 §11, SVMP 6.4/9, MR, OQ, SOUP, RVTM. |

**DHF (nota SOP-001 §13):** Este archivo es puntero canónico en el paquete *Design History File* / *Technical File* equivalente para *Mother Brain* *core* **v1.0**; retención bajo `docs/qmsr-iso13485/records/releases/` y control de versión Git.

**Plantilla de origen:** [RELEASE-RECORD-TEMPLATE.md](RELEASE-RECORD-TEMPLATE.md) v0.1.

---

*Fin de `RELEASE-2026-Q2-v1.0.md`.*
