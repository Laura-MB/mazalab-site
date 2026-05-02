# Management Review Template – MAZALab QMS (ISO 13485:2016 Cláusula 5.6 & QMSR)

**Documento:** `management-review-template.md`  
**Versión:** 1.0  
**Fecha:** 22 de abril de 2026  
**Autor:** Chief Product Architect & Technical Lead  
**Estado:** Draft para uso en la primera Management Review  
**Referencia:** [Quality Manual](./quality-manual.md) (§5 *Process map* / P-01, §6 *Management responsibility*), [Quality Policy](./quality-policy.md), [Gap Analysis](../qmsr-iso13485-gap-analysis.md), [SVMP](./software-validation-master-plan.md), [SOP-001](./sop-design-and-development.md), [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md) (*Regulatory compliance*), `docs/DECISIONS.md` (**ADR-001**), [`.cursor/rules/qmsr-iso13485-compliance.mdc`](../../.cursor/rules/qmsr-iso13485-compliance.mdc)

> **Uso:** Copiar secciones 7+ en un archivo `records/management-review-YYYY-NN.md` bajo `docs/qmsr-iso13485/records/` (o eQMS) para cada *review*; conservar enlace a esta plantilla y versión.

---

## 1. Purpose

Esta plantilla asegura que las **revisiones por la dirección (Management Review)** de MAZALab documenten, de forma **repetible y audit-ready**, las **entradas (5.6.2)**, el debate, las **decisiones** y el **seguimiento** requeridos por **ISO 13485:2016 Cl. 5.6** y el espíritu de **QMSR (21 CFR Part 820)**. Complementa el proceso **P-01** del [Quality Manual, §5](./quality-manual.md#5-process-map--high-level-process-interaction-descripción-textual--tabla-o-lista-de-procesos-clave-del-qms) y mantiene trazabilidad a **SOP-001** (*design controls* en **Entity Resolution** y **Risk Scoring**) y al [SVMP](./software-validation-master-plan.md) (validación, RVTM, re-validación).

**Principio premium:** calidad, **riesgo**, **explicabilidad**, **trazas de auditoría** y **privacidad** se tratan explícitamente en cada *review*, no como anexos.

---

## 2. Scope and Frequency (recomendación: al menos anual + *triggers*)

| Tipo de reunión | Frecuencia / disparador | Notas |
|-----------------|------------------------|--------|
| **Mínima** | **Anual** (al menos) | Suficiente para SMQ *baseline*; fijar mes *anchor* (p. ej. Q2) |
| **Recomendada (MAZALab)** | **Anual** + **Q2 2026** para la primera *review* con esta plantilla | Alinear cierre *Gap* y objetivos de calidad |
| ***Triggers* adicionales (obligatoria extra)** | (1) Cambio de **intended use** o mercado (SaMD / jurisdicción) — (2) *Major release* con riesgo alto — (3) hallazgo crítico de *audit* o incidente de seguridad/datos — (4) fusión/adquisición o cambio estructural del QMS — (5) petición *Management* | Registrar convocatoria y motivo en el *report* (§7) |

**Alcance:** todo el QMS aplicable al repositorio **Mother Brain** según [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md) y *pack* [`docs/qmsr-iso13485/`](../../docs/qmsr-iso13485) (módulos **Entity Resolution**, **Risk Scoring**, API, *governance* / *audit*). No sustituye una auditoría de tercero.

---

## 3. Attendees (roles obligatorios y opcionales)

| Rol | Obligatorio (Y/N) | Función en la *review* |
|-----|-------------------|------------------------|
| **Management** (CEO o equivalente) | **Y** | Aprobación final, recursos, riesgo residual aceptable |
| **Chief Product Architect** (y/o *Product Owner*) | **Y** | *Intended use*, *roadmap*, cierre *Gap* priorizado |
| **Engineering Lead / Tech Lead** | **Y** | SOP-001, CI, *release*, deuda de RVTM/DHF |
| **QA / Regulación** (designada o consultor) | **Y** (o delegado *quality* documentado) | Adecuación 13485/QMSR, *CAPA*, auditorías |
| **Seguridad / Privacidad** | Recomendado | PII, *logs*, *breach* (si aplica) |
| **Operaciones / SRE** (si asignada) | Opcional | Entorno, disponibilidad, *IQ/OQ* |
| *Invitado* (cliente, *partner* regulado) | Opcional | *Feedback*; sin voto; NDA según acuerdo |

**Quorum mínimo:** Management (o **delegado con poder escrito**) + al menos un representante de **Producto/Arquitectura** y uno de **Ingeniería/QA** (no la misma persona en roles duplicados *salvo* startup documentado).

---

## 4. Inputs (lista detallada según ISO 13485 5.6.2)

*Norma: ISO 13485:2016 **5.6.2**; la letra a–j sigue el orden lógico de la cláusula. La **k** es específica MAZALab.*

| ID | Tema (norma / MAZALab) | Entrada esperada (artefacto) |
|----|------------------------|------------------------------|
| **a** | *Status of actions from previous reviews* | Tabla cierre *action items* MR anterior; *open* y *overdue* |
| **b** | *Changes in external/internal issues* | Contexto de organización, mercado, *stack* (p. ej. [ADR-001](../DECISIONS.md)), cambios legales |
| **c** | *Customer and regulatory feedback* | *Feedback* de beta/piloto, *tickets* mayores, consultas *reg*; requisitos nuevos o *guidance* |
| **d** | *Process performance and product conformity* (precisión, explicabilidad) | CI, *escape rate*, RVTM % completo, métricas de **ER** (falsos positivo/negativo en suites) y **RS** (explicación estructurada, regresión *builders*); *audit log* *stats* (cuando apliquen) |
| **e** | *Status of risk management and opportunities* | *Risk file* o resumen; riesgos abiertos *high*; oportunidades (producto) |
| **f** | *Results of internal/external audits* | *Gap* actualizado, hallazgos *internal*, *FDA/NB* si existieran (TBD) |
| **g** | *Corrective and preventive actions (CAPA)* | *CAPA* abiertas/cerradas, eficacia, tendencias (cuando SOP *CAPA* exista: placeholder) |
| **h** | *Follow-up actions from previous reviews* | Duplicado intencional con (a) si la norma o auditor lo exigen como fila de seguimiento explícita |
| **i** | *Changes that could affect the QMS* | Cambio de *intended use*, despliegue crítico, nuevo *SOUP* mayor, cambio *policy* o *SOP* |
| **j** | *Recommendations for improvement* | Listado de *backlog* de mejora QMS / producto; priorización |
| **k** (MAZALab) | **Módulos core y validación / diseño** | **(k1) Entity Resolution** — umbrales, algoritmos (Jaccard, Levenshtein, *fuzzy*), *conflict resolution*, *explainability*; **(k2) Risk Scoring** — *multi-dimension**, explicaciones *accionables*; **(k3) [SVMP](./software-validation-master-plan.md)** — estado de validación, RVTM, IQ/OQ/PQ, re-validaciones; **(k4) [SOP-001](./sop-design-and-development.md)** — *design reviews*, DHF, desviaciones; **(k5) [Gap Analysis](../qmsr-iso13485-gap-analysis.md)** — *gaps* críticos no cerrados |

**Tabla de *Inputs* / *Status* / *Discussion* / *Action* (rellenar en la reunión o pre-reunión):**

| Input (a–k) | Tema | Estado resumido (G/Y/R) | *Discussion notes* (bullets) | *Action* (ref. a ítem) |
|-------------|------|------------------------|-----------------------------|------------------------|
| a | Acciones anteriores | | | |
| b | Contexto | | | |
| c | *Feedback* | | | |
| d | Desempeño / conformidad (ER, RS) | | | |
| e | Riesgo / oportunidades | | | |
| f | Auditorías | | | |
| g | *CAPA* | | | |
| h | *Follow-up* | | | |
| i | Cambios al QMS | | | |
| j | Mejoras | | | |
| k | **ER / RS / SVMP / SOP-001 / Gap** | | | |

*G/Y/R: Green (OK), Yellow (vigilado), Red (acuerdo o escalada en sesión).*

**KPIs sugeridos (vinculados a la misión — rellenar valor / tendencia / meta):**

| KPI | Módulo / ámbito | Definición (breve) | Valor (período) | Meta (ejemplo) | Propietario |
|-----|-----------------|--------------------|-----------------|----------------|-------------|
| **KPI-ER-1** | Entity Resolution | Tasa de fallo en *suite* de regresión ER / *edge cases* | | ≤ umbral aprobado | Eng |
| **KPI-ER-2** | Entity Resolution | Casos límite *conflict* con explicación presente (%) | | 100% casos *material* | Eng |
| **KPI-RS-1** | Risk Scoring | *Builds* de explicación estructurada sin *regresión* en *release* (SOP-001) | | 0 *escape* *high* | Eng / QA |
| **KPI-RS-2** | Risk Scoring | Cobertura *tests* en `risk-scoring` (%) | | ≥ mín. SVMP/Quality Plan | Eng |
| **KPI-AT-1** | *Audit trail* / *governance* | *Endpoints* *audit* operativos; *integrity checks* (si existen) | | 100% *uptime* acordado | Ops / Eng |
| **KPI-RVTM** | Trazabilidad | % requisitos *critical path* (ER/RS/API) con fila RVTM cerrada | | ↑ trimestre a trimestre | Eng |
| **KPI-VAL** | SVMP | *Re-validations* abiertas post-cambio *high risk* (conteo) | | 0 retraso > 30d | QA |
| **KPI-GAP** | *Gap* | *Gaps* críticos cerrados o con plan (%) | | 100% con plan/owner | Mgmt / Arch |
| **KPI-CI** | *Pipeline* | *Main* verde; tiempo medio de *merge* *blocked* | | 0 días *red* sostenida | Eng |

*Los valores y metas se acuerdan en *Quality Objectives* ([Quality Policy §5](./quality-policy.md#5-quality-objectives-framework-para-establecer-objetivos-medibles--ejemplos-iniciales-vinculados-a-precisión-explicabilidad-y-compliance)) y se reevalúan en §6 de los *outputs* (abajo).*

---

## 5. Agenda Template (con tiempos sugeridos)

*Duración sugerida **90 min** (ajustar a **60** si *startup*; **120** si primera MR anual o *post-audit*).*

| T (min) | Tema | Responsable (lead) | Salida |
|---------|------|--------------------|--------|
| 0–5 | Bienvenida, quorum, aprobación de agenda; conflicto de intereses (si aplica) | Chair (Mgmt o CPA) | Acta: quórum OK |
| 5–15 | **(a, h)** Acciones y *follow-up* anteriores | CPA / QA | Cierre o *re-open* con nuevas fechas |
| 15–30 | **(b, c, e, i)** Contexto, *feedback*, riesgo, cambios al QMS | Mgmt / CPA | Decisiones iniciales |
| 30–50 | **(d, k)** Desempeño, **ER** & **RS**, **SVMP**, **SOP-001**, *Gap* | Eng Lead + QA | Prioridades técnicas |
| 50–65 | **(f, g, j)** Auditorías, *CAPA*, mejoras | QA | *Backlog* QMS |
| 65–80 | **Objetivos de calidad** (actualizar) + **recursos** | Mgmt | Objetivos vivos |
| 80–90 | **Decisions & action items**; próxima *review*; *sign-off* | Chair | Lista firmada o constancia |

*Chair* puede ser Management o *Chief Product Architect* por delegación **documentada** para un ciclo.

---

## 6. Outputs and Records

- **Decisions and actions** — Cada decisión vinculada a un *owner*; **no** “acciones a la organización en general”.  
- **Updated quality objectives** — Referencia: [Quality Policy, §5](./quality-policy.md#5-quality-objectives-framework-para-establecer-objetivos-medibles--ejemplos-iniciales-vinculados-a-precisión-explicabilidad-y-compliance); anexar filas o versión de política (si *minor* aprobada).  
- **Resource needs** — FTE, herramienta (eQMS), *budget*, *consultor reg*, infra.  
- **QMS improvements** — Procedimientos nuevos, *SOUP* register, *CAPA* SOP, etc.

**Registros a archivar (ALCOA+):** acta o *Management Review Report* (§7), lista de asistentes, esta plantilla o versión, material de presentación, enlaces a *Gap*, SVMP *snapshot* de versión, *tag* de *release* citado.

---

## 7. Management Review Report Template (sección para completar **después** de la reunión)

**ID:** `MR-YYYY-NN` (ej. `MR-2026-01`)  
**Fecha de reunión:** _______________  **Lugar / medio:** _______________  
**Chair:** _______________  **Minuta:** _______________  

**Asistentes (nombre, rol, firmado / presente):**

| Nombre | Rol | Firma o “presente” (fecha) |
|--------|-----|----------------------------|
| | | |
| | | |

**Resumen ejecutivo (3–5 frases, incl. ER/RS y *compliance*):**



**Decisiones (lista numerada):**



**Tabla de *Decisions* & *Action items*** (usar o copiar; **ejemplo** de filas — **reemplazar** con datos reales):

| # | Tipo | Descripción | Responsable | Plazo (fecha) | Estado | *Evidence link* |
|---|------|-------------|---------------|---------------|--------|-----------------|
| 1 | *Decision* | Aprobar objetivo KPI-ER-1 con meta {X} para Q3 | Mgmt + Eng | 2026-04-30 | *Open* | *MR-2026-01* |
| 2 | *Action* | Completar filas RVTM para {DI-ER-00x} / *tests* T-ER-0xx | Eng Lead | 2026-05-15 | *Open* | *PR#…* / *tests/…* |
| 3 | *Action* | Cerrar *gap* “protocolos de validación archivados” (SVMP §9) con carpeta en `docs/qmsr-iso13485/records/validation/` | QA | 2026-06-30 | *Open* | *SVMP* ref |
| 4 | *Action* | *Design review* formal para cambio {hash} en *threshold* **Risk Scoring** | Eng + QA | 2026-05-01 | *Open* | *SOP-001* DR-xxx |
| 5 | *Resource* | Presupuesto *tooling* eQMS (si aplica) | Mgmt | TBD | *Open* | *Budget* ref |

*Estado: Open / In progress / Done / Cancelled (con justificación).*

**Objetivos de calidad actualizados (sí / no; si sí, referencia a documento y versión):**



**Riesgo residual aceptado por Management (sí / no / N/A; breve texto):**



**Nexus explícito (obligatorio en primera MR 2026):**  
- **Entity Resolution** — *status*: ___ ; *themes*: normalización, similitud, *conflict*, explicación.  
- **Risk Scoring** — *status*: ___ ; *themes*: *multi-dim*, *explainability*, *gaming* domain si aplica.  
- **[SVMP](./software-validation-master-plan.md)** — versión: ___ ; RVTM: ___ %; re-validación pendiente: ___.  
- **[SOP-001](./sop-design-and-development.md)** — *design reviews* en período: ___ ; desviaciones: ___.  
- **[Gap](../qmsr-iso13485-gap-analysis.md)** — *gaps* críticos abiertos: ___.  

**Aprobación del acta (firma o constancia en correo aprobado):**



---

## 8. Records Retention

| Registro | Retención mínima (indicativa) | Ubicación |
|----------|------------------------------|-----------|
| *Management Review Report* y minuta | Vida del producto + requisito legal; **mínimo 2** ciclos *review* o **5 años** (lo que sea mayor en la jurisdicción) | `docs/qmsr-iso13485/records/management-reviews/` o eQMS |
| Asistencia y *slides* | Igual o subconjunto; confidencialidad | Mismo *bucket* o acceso restringido |
| Evidencia de cierre de *action items* | Ligada a DHF/NC/CAPA según el caso | *PRs*, *tickets* |

*Alinear con [Quality Manual, §12](./quality-manual.md#12-records-control-and-retention) y política de datos.*

---

## 9. References (Quality Manual, Quality Policy, Gap Analysis, etc.)

| Documento | Ruta / rol |
|----------|------------|
| *Quality Manual* | [`docs/qmsr-iso13485/quality-manual.md`](./quality-manual.md) — §5 (P-01), §6 |
| *Quality Policy* | [`docs/qmsr-iso13485/quality-policy.md`](./quality-policy.md) — 5.3, objetivos |
| *Gap Analysis* | [`docs/qmsr-iso13485-gap-analysis.md`](../qmsr-iso13485-gap-analysis.md) |
| *SVMP* | [`docs/qmsr-iso13485/software-validation-master-plan.md`](./software-validation-master-plan.md) |
| *SOP-001* | [`docs/qmsr-iso13485/sop-design-and-development.md`](./sop-design-and-development.md) |
| *PROJECT_CONTEXT* | [`docs/PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md) — *Regulatory compliance* |
| *ADR-001* | [`docs/DECISIONS.md`](../DECISIONS.md) |
| *Rule* | [`.cursor/rules/qmsr-iso13485-compliance.mdc`](../../.cursor/rules/qmsr-iso13485-compliance.mdc) |

*Norma: ISO 13485:2016 Cl. **5.6**; QMSR: **5.1** (eficacia) y cierre de *records* 820.181; interpretación bajo *Quality Policy* aprobada.*

---

## 10. Approval / Sign-off

*Esta sección aplica a la **aprobación de la plantilla** (no a cada *Management Review* individual, aunque se puede reutilizar el mismo bloque para “plantilla aprobada para uso” en el DMS).*

| Rol | Nombre / firma | Fecha |
|-----|----------------|-------|
| **Chief Product Architect & Technical Lead** (autor) | __________________ | 22-Apr-2026 |
| **Management** (aceptación de plantilla para **uso** en *reviews*) | __________________ | ____________ |
| **QA / Regulación** (opcional) | __________________ | ____________ |

**Efecto:** con la aprobación, `management-review-template.md` v1.0 se declara la **plantilla de referencia** para MR hasta nueva versión; las actas reales se archivan como §7 bajo *records* (§8).

---

## Historial de versiones

| Versión | Fecha | Autor / Rol | Descripción de cambios |
|---------|--------|------------|-------------------------|
| 1.0 | 22 de abril de 2026 | Chief Product Architect & Technical Lead | Versión inicial (*Draft*): entradas 5.6.2 a–j + (k) MAZALab; agenda; KPIs ER/RS/*audit*; *SVMP*/*SOP-001*/*Gap*; tablas; report template; *records*; referencias. |

### Bloque de aprobación del documento (formalizar plantilla)

| Rol | Firma | Fecha (DD-MMM-YYYY) |
|-----|-------|---------------------|
| **Management** | | |
| **Chief Product Architect** | | |

**Estado:** [ ] Plantilla aprobada para uso  [ ] Rechazada / requiere revisión: ____________________

---

*Fin del documento.*
