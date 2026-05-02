# Management Sign-off Package – Q2 2026 QMS Baseline (ISO 13485 & QMSR)

**Documento:** `management-signoff-q2-2026.md`  
**Versión:** 1.0  
**Fecha:** 2026-05-25  
**Estado:** Draft for Management Approval  
**Referencia:** [Quality Manual](../quality-manual.md) (§5 *Process map* / P-01, §6) · [MR-2026-Q2 v1.0](management-reviews/mr-2026-q2.md) · [SOP-001](../sop-design-and-development.md) · [SVMP](../software-validation-master-plan.md) · [`.cursor/rules/qmsr-iso13485-compliance.mdc`](../../../.cursor/rules/qmsr-iso13485-compliance.mdc)

**Ubicación:** `docs/qmsr-iso13485/records/management-signoff-q2-2026.md` — *registro único* de aprobación *Management* / producto *baseline* Q2; complementa firmas puntuales en OQ, SOUP, *Release* y [MR Q2](management-reviews/mr-2026-q2.md#6-approval--sign-off-management--cpa) §6.

---

## 1. Purpose

Concentrar en un **solo registro** la conciencia y la **aprobación** de la **Dirección (Management)**, con el apoyo de **Chief Product Architect (CPA)** y **QA/Regulación (QA/RA)**, de que el **QMS** aplicable al **Mother Brain** *core* alcanzó en **Q2 2026** un **baseline** documental coherente con **ISO 13485:2016** y el espíritu **QMSR (21 CFR Part 820)**, y que el conjunto de documentos listados en §2 es **suficiente** (con riesgos residuales explícitos en §3) para operar, auditar y evolucionar el producto bajo *design controls* ([SOP-001](../sop-design-and-development.md) Cl. 7.3) y [SVMP](../software-validation-master-plan.md).

**No** sustituye el *Dossier* legal por mercado ni la designación *PRRC*; **sí** ancla el hito *Management* para *Policy* / *Manual* y el paquete *records* Q2 vinculado a [Gap Analysis](../../qmsr-iso13485-gap-analysis.md).

---

## 2. Documents Included in this Sign-off

| Documento | Ruta (repo) / ID | Versión (documento) | Rol en el *package* |
|-----------|------------------|--------------------|------------------------|
| **Quality Policy** | [`../quality-policy.md`](../quality-policy.md) | 1.0 (2026-04-22) *Draft pending Management* en encabezado; **sujeta a §5** | Política 5.3; pilares *precision / explainability / privacy / speed* |
| **Quality Manual** | [`../quality-manual.md`](../quality-manual.md) | 1.0 (2026-04-22) *Draft pending Management*; **sujeta a §5** | Mapa QMS, P-01, cláusulas 4–8 |
| **SOUP / OTS Register** | [`soup-register-v1.md`](soup-register-v1.md) | 1.0 (2026-05-15) | Dependencias, riesgo, mitigación, §5 *monitoring* |
| **OQ *light* Q2** | [`validation/oq/OQ-2026-Q2-Light.md`](validation/oq/OQ-2026-Q2-Light.md) | 1.0 | Cualificación operacional *as-built* (211 tests, typecheck) |
| **Management Review Q2 2026** | [`management-reviews/mr-2026-q2.md`](management-reviews/mr-2026-q2.md) | 1.0 *Approved* (reunión 2026-05-20) | Entradas 5.6.2, acciones, outputs |
| **Release Record** *core* *baseline* | [`releases/RELEASE-2026-Q2-v1.0.md`](releases/RELEASE-2026-Q2-v1.0.md) | 1.0 (release 2026-05-25 prop.) | SOP-001 §11 *design transfer*; DHF puntero |
| **DP — Entity Resolution *baseline*** | [`design-plans/DP-2026-ER-BL.md`](design-plans/DP-2026-ER-BL.md) | v1.2 | D&D ER *as-built* |
| **DP — Risk Scoring *baseline*** | [`design-plans/DP-2026-RS-BL.md`](design-plans/DP-2026-RS-BL.md) | v1.2 | D&D RS *as-built* |
| **RVTM *light*** | [`rvtm/rvtm-light-v1.md`](rvtm/rvtm-light-v1.md) | 1.0 *Approved with actions* | Trazas DI→DO→prueba; ~55% C / ~40% P / ~5% O |
| **Gap Analysis** | [`../../qmsr-iso13485-gap-analysis.md`](../../qmsr-iso13485-gap-analysis.md) | 1.0 *aprobada para remediación* | Mapa de brechas y cierre *prioritized* |
| **SVMP** *(referencia rectora V&V)* | [`../software-validation-master-plan.md`](../software-validation-master-plan.md) | 1.0 *Draft* (estado en doc) | Validación, RVTM, *deliverables* |
| **SOP-001** | [`../sop-design-and-development.md`](../sop-design-and-development.md) | 1.0 *Draft* (estado en doc) | 7.3, DHF, *design transfer* §11 |

*Design Review* [DR-2026-ER-BL-001](design-reviews/DR-2026-ER-BL-001.md) / [DR-2026-RS-BL-001](design-reviews/DR-2026-RS-BL-001.md) y [validation/README.md](validation/README.md) se consideran **evidencia de apoyo** y están enlazados desde MR, OQ y *Release*.

---

## 3. Summary of QMS Status Q2 2026

**Fortalezas**

- **Design controls** aplicados a **Entity Resolution** y **Risk Scoring** como *baselines* v1.2 (DPs) con *design reviews* y trazas [RVTM](rvtm/rvtm-light-v1.md).  
- **Verificación/validación** *light*: **211** pruebas Vitest **passed** (20 archivos de prueba), `npm run typecheck` *green*, OQ y *Release* archivados.  
- **Explicabilidad** (builders ER/RS, *assessment* *summary*), **governance** *audit* y **privacidad** (minimización, política PII = evolución documentada) alineados a la misión **Risk Intelligence** premium.  
- **SOUP** inventariado y riesgo gestionado; [Gap Analysis](../../qmsr-iso13485-gap-analysis.md) como línea de base de mejora continua.

**Acciones** (síntesis; detalle en [MR §4](management-reviews/mr-2026-q2.md#4-decisions-and-action-items))

- **Cerradas / cumplidas en sustancia (Q2):** *baseline* ER/RS (DP+DR+RVTM), carpeta *validation* + OQ, registro SOUP, primer *Release Record*, documentación *records* bajo `docs/qmsr-iso13485/records/`.  
- **Pendientes / *ongoing*:** firma puntuale SOUP/OQ/RR (si no fusionadas en este *package*); *Policy*/*Manual* a estado *Approved* en metadatos de documento tras §5; CAPA/NC SOP; *Risk file* 14971 *formal*; RVTM *full*; *intended use* *one-pager*; *PQ* *staging*; próxima **MR Q4 2026** (*target* octubre).

**Riesgos residuales aceptados** (declaración de *Management* en §4)

- Operación *analytics* / *decision support* sin indicación clínica explícita en este *package*; responsabilidad del operador humano.  
- Trazas RVTM con filas *Partial* / *Open*; mitigación: roadmap RVTM v1.1, *change control* en cambios *high* *risk*.  
- SOUP *transitivos* sin SBOM *CycloneDX* completo; mitigación: *lock* + *npm audit* + §5 SOUP.  
- CAPA informal hasta SOP; plazo *target* 2026-12-31 (ver MR §4 ítem 8).

---

## 4. Management Declaration / Approval Statement

Por la presente, la **Dirección de MAZALab** (*Management*), habiendo recibido el informe del **Chief Product Architect** y de **QA/Regulación**, y habiendo constatado que la documentación y evidencias listadas en la sección 2 de este paquete reflejan el estado del **QMS** y del producto **Mother Brain** *core* en el **baseline Q2 2026**:

**Declaramos** que se reconoce y **aprueba** el **baseline de documentación y controles** descrito, como fundamento del cumplimiento del enfoque **ISO 13485:2016** (en particular **5.3**, **5.6** y **7.3**) y del marco **QMSR (21 CFR Part 820)** en la medida en que aplica al *software* y procesos de MAZALab en este alcance; que se **aceptan** los **riesgos residuales** identificados en la sección 3, bajo el compromiso de su **vigilancia** y **reducción** según *change control* ([SOP-001](../sop-design-and-development.md) §12), *monitoring* de dependencias ([SOUP](soup-register-v1.md) §5) y **revisiones periódicas** (*Management Review* [Q4 2026 *target*](management-reviews/mr-2026-q2.md#6-approval--sign-off-management--cpa) octubre); y que MAZALab **reafirma** su compromiso con la **precisión** de la inteligencia de riesgo, la **explicabilidad** de las salidas, la **protección de la privacidad** y la **velocidad responsable** de entrega, sin relajar la **exigencia documental** ni la **mejora continua** exigible a una plataforma **Risk Intelligence** de clase *premium*.

*La eficacia de este paquete queda sujeta a la firma de la tabla §5 y, para **Quality Policy** y **Quality Manual**, a la designación *Approved* en el propio documento o a una versión 1.0 *Approved* *minor* *amend* que referencie este registro.*

---

## 5. Sign-off Table

| Documento / ámbito | Versión (doc.) | Responsable (aprobación) | Fecha | Firma / Aprobado |
|--------------------|---------------|---------------------------|--------|------------------|
| **Management Sign-off Package** (este archivo) | 1.0 | **Management** | 2026-05-25 | [ ] Sí  [ ] No  [ ] Con comentarios: _______ |
| **Quality Policy** | 1.0 | Management | | [ ] Sí  [ ] No  [ ] Con comentarios |
| **Quality Manual** | 1.0 | Management | | [ ] Sí  [ ] No  [ ] Con comentarios |
| **QMS *baseline* Q2 (*records* y evidencias agregadas)** | — (referencia §2) | **CPA** (coordinación) + **QA/RA** (adecuación *reg*) | 2026-05-25 | [ ] Sí  [ ] No  [ ] Con comentarios |
| **Alineación a MR-2026-Q2 v1.0 y RELEASE-2026-Q2-v1.0** | 1.0 / 1.0 | **Management** (reconocimiento) | 2026-05-25 | [ ] Sí  [ ] No  [ ] Con comentarios |

*Opcional: una sola fila *global* *Management* si la política interna concentra la firma en un único registro; mantener rastro en control documental o eQMS.*

---

## 6. Next Steps

| Prioridad | Acción | Plazo *target* | Referencia |
|-----------|--------|----------------|------------|
| 1 | **MR Q4 2026** — entradas 5.6.2, cierre *gaps* y KPIs | *Octubre 2026* | [MR-2026-Q2 §6 *Next*](management-reviews/mr-2026-q2.md#6-approval--sign-off-management--cpa) |
| 2 | **Nuevo *Design Plan*** bajo SOP-001 para *feature* / módulo regulado **post-baseline** v1.0 | Según *roadmap* | SOP-001 Ap. A; *change control* |
| 3 | **RVTM *full***, IDs de caso *Vitest* estables | H2 2026 | RVTM §3 *Next* |
| 4 | **SOUP** §5 re-eval. por *release* + primer *tag* + SHA en [RELEASE](releases/RELEASE-2026-Q2-v1.0.md) §1 | Próximo *release* | *Release* · SOUP |
| 5 | **SOP *CAPA/NC** o *waiver* documentado* | 2026-12-31 *target* | MR §4 ítem 8 |
| 6 | **Policy/Manual** metadatos *Approved* (si aún *Draft* en encabezado) | Q3 2026 | §5 arriba |

---

## Historial de versiones

| Versión | Fecha | Autor / Rol | Descripción |
|---------|--------|------------|-------------|
| 1.0 | 2026-05-25 | Chief Product Architect & Technical Lead | Primer *Management Sign-off Package* Q2; tabla §2; declaración §4; alineado MR, OQ, SOUP, RR, DP, RVTM, Gap. |

*Archivo bajo* `docs/qmsr-iso13485/records/` *para trazabilidad §5* *Quality Manual* *y* *DHF* *equivalente*.

---

*Fin de `management-signoff-q2-2026.md`.*
