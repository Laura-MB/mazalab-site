# Quality Manual – MAZALab Quality Management System (ISO 13485:2016 & QMSR)

**Documento:** `quality-manual.md`  
**Versión:** 1.0  
**Fecha:** 22 de abril de 2026  
**Autor:** Chief Product Architect & Technical Lead  
**Estado:** Draft para aprobación por Management  
**Referencia:** [Quality Policy](./quality-policy.md) (`docs/qmsr-iso13485/quality-policy.md`), [Gap Analysis](../qmsr-iso13485-gap-analysis.md) (`docs/qmsr-iso13485-gap-analysis.md`), [SVMP](./software-validation-master-plan.md) (`docs/qmsr-iso13485/software-validation-master-plan.md`), [SOP-001](./sop-design-and-development.md) (`docs/qmsr-iso13485/sop-design-and-development.md`), [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md) (`docs/PROJECT_CONTEXT.md`)

*Cursor rule de apoyo: `/.cursor/rules/qmsr-iso13485-compliance.mdc`*

---

## 1. Introduction & Company Overview

**MAZALab** desarrolla plataformas de **Risk Intelligence** para analistas y organizaciones que requieren **precisión, transparencia y velocidad** en entornos exigentes (cumplimiento, gobierno, operaciones de riesgo). En este repositorio, el producto **Mother Brain** aporta un servicio **TypeScript + Node.js (Express)** con módulos centrales de **Entity Resolution** (normalización, similitud, detección de conflictos, explicación de emparejamiento) y **Risk Scoring** (puntuación multi-dimensión, *breakdown* explicable, dominios y patrones orquestados vía *pipeline* de evaluación), más **governance** (registro *append-only* de auditoría, API de consulta) y superficie API (`/resolve`, `/assess`, `/assess-risk`, `/audit-log/*`, etc.).

MAZALab asume, cuando el **intended use** y el mercado lo exijan, un **Sistema de Gestión de la Calidad (QMS / SMQ)** alineable con **ISO 13485:2016** y **FDA QMSR (21 CFR Part 820)**. Este *Quality Manual* describe la **estructura** del QMS, su **mapeo** a cláusulas de la norma, y el **hilo documental** (política, *gap*, diseño, validación, *records*) sin reemplazar los procedimientos y planes enlazados.

**Fuente de verdad técnica** del repositorio: [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md) — sección [Regulatory compliance (QMSR / ISO 13485)](../PROJECT_CONTEXT.md#6-governance-note).

---

## 2. Purpose and Scope of the QMS

| Dimensión | Contenido |
|-----------|-----------|
| **Propósito** | Asegurar que el producto y los procesos que lo sustentan cumplan requisitos **regulatorios y de producto** aplicables, con **pensamiento basado en riesgo**, **mejora continua** y **evidencia retirable (audit-ready)**. |
| **Alcance de este manual** | Aplica al diseño, desarrollo, *release* y *post-market* inmediato (en la medida documentada) del **Mother Brain** y extensiones bajo el mismo repositorio; excluye explícitamente otras celdas de negocio o repos no enlazados salvo *procedure* o acuerdo de interfaz. |
| **Límites** | Jurisdicción, clasificación (p. ej. SaMD) y *intended use* final se formalizan en documento de producto; este manual **no** sustituye el **Technical File** / **Dossier** legal por mercado. |
| **Módulos bajo atención reforzada** | **Entity Resolution** (similitud, *fuzzy* match, Jaccard/Levenshtein u homólogas, *conflict resolution*, explicación) y **Risk Scoring** (factores, umbral, explicaciones *accionables*); orquestación en `src/core/assessment/`; API; `src/core/governance/`. |

---

## 3. Quality Policy (incluir el texto completo de la Quality Policy Statement + referencia al documento)

**Texto completo de la *Quality Policy Statement* (párrafo principal) —** copia fiel a [Quality Policy](./quality-policy.md) (sección 3) (`quality-policy.md` v1.0):

> MAZALab se compromete a entregar **inteligencia de riesgo de clase mundial**—con **Entity Resolution** avanzada (emparejamiento robusto, similitud, detección de conflictos) y **Risk Scoring** transparente, **explicable** y trazable—cumpliendo de forma proactiva los requisitos del **QMSR**, **ISO 13485:2016** y la normativa aplicable, gestionando el **riesgo** en todo el ciclo de vida, protegiendo la **privacidad** de los titulares de datos, y gobernando el software con un SMQ en el que la **mejora continua**, la **auditabilidad** y la **satisfacción** de nuestros clientes y analistas (incluidos entornos regulados) constituyen criterio de éxito no negociable.

**Documento de política (fuente de verdad de los *commitments*, objetivos de calidad, comunicación, revisión y aprobación):** [`docs/qmsr-iso13485/quality-policy.md`](./quality-policy.md). Toda modificación de la *Statement* o de los *commitments* se controla allí, con aprobación de **Management** según ISO 13485 **5.3** y 5.4.

---

## 4. QMS Structure and Documentation Hierarchy

| Nivel (ejemplo) | Tipo | Contenido MAZALab | Control |
|-----------------|------|-------------------|--------|
| **L0** | Contexto y arquitectura | `docs/PROJECT_CONTEXT.md`, `docs/DECISIONS.md` (**ADR-001** baseline) | Git; revisiones *peer*; cambios estructurales con consciencia de 7.3 |
| **L1** | *Quality Policy* y **este *Quality Manual*** | `quality-policy.md`, `quality-manual.md` | Aprobación **Management**; versión, historial |
| **L2** | *Gap* y planes | `qmsr-iso13485-gap-analysis.md` | *Living document*; alimenta hoja de ruta de cierre de brechas |
| **L3** | Procedimientos y planes | SOP-001 (D&D), SVMP (V&V) | *Draft* → aprobado; vinculación a RVTM / DHF |
| **L4** | Registros (DHF, RVTM, *release records*, *audit*, NC/CAPA cuando existan) | `docs/qmsr-iso13485/records/` (recomendado), CI, repositorio | ALCOA+; retención sección 12 |

**Ingeniería y agentes (Cursor):** la regla `qmsr-iso13485-compliance.mdc` asegura que *pull requests* en alcance consideren 7.3, *audit* y re-validación según riesgo; no sustituye revisión humana ni *sign-off*.

---

## 5. Process Map / High-Level Process Interaction (descripción textual + tabla o lista de procesos clave del QMS)

| ID | Nombre (proceso) | Entradas (resumen) | Salidas (resumen) | Cláusula 13485 (pista) | Documento clave |
|----|------------------|--------------------|--------------------|------------------------|-----------------|
| **P-01** | *Management review* | Política, *feedback*, riesgo, *NC*, objetivos | Acciones, recursos, cambios a política u objetivos | 5.1, 5.3, 5.6 | [Plantilla de *Management review* (5.6)](./management-review-template.md); *input* de [Quality Policy](./quality-policy.md) |
| **P-02** | Planificación y *roadmap* de producto | *Backlog*, riesgo, *Gap* | Prioridades, requisitos de producto iniciales | 5.4, 7.1 | [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md), *Gap* |
| **P-03** | **Design & development** (ER, RS, API, *governance*) | DIs, riesgo, ADR-001 | DOs, código, pruebas, *DHF* / RVTM | 7.3 | [SOP-001](./sop-design-and-development.md) |
| **P-04** | **Validation & release** (software) | SVMP, entorno, *build* | Reportes, IQ/OQ/PQ o equivalente, nota de *release* | 7.3.6, 7.5.6 | [SVMP](./software-validation-master-plan.md) |
| **P-05** | *Supplier / SOUP* (bibliotecas, *cloud*) | Criterio de riesgo | Registro, versiones, acuerdos | 4.1.4, 4.1.5, 7.4 | Roadmap: *soup* register (Gap) |
| **P-06** | *Feedback* y *complaints* (cuando se formalicen) | Usuario, *tickets* | Clasificación, riesgo, CAPA *trigger* | 8.2.1 | SOP a futuro |
| **P-07** | **NC, CAPA, análisis de datos** | Desviación, *bugs* críticos, métricas | Acciones, eficacia | 8.3, 8.4, 8.5 | SOP a futuro; *logs* y auditoría hoy bajo *governance* |
| **P-08** | **Protección de datos y ciberseguridad** (transversal) | Política de privacidad, *threat model* mínimo | Controles, retención, mínimización PII en *logs* | 4.1, 4.2, 7.1 | SOP-001 + *audit* + políticas internas |

*Flujo resumido:* **P-02** alimenta **P-03**; **P-03** se verifica/valida con **P-04**; hallazgos alimentan **P-07** y **P-01**; riesgo cruza **P-03**–**P-08** (ISO 14971).

---

## 6. Management Responsibility (Cláusula 5)

| 5 | Requisito (síntesis) | Cómo se cubre en MAZALab (hoy) |
|---|----------------------|--------------------------------|
| 5.1 | Compromiso; enfoque al cliente; calidad; integración riesgo | *Quality Policy*; principios de producto en `PROJECT_CONTEXT` (*premium*, explicación, *audit*). |
| 5.2 | Política; objetivos; planificación; cambios a política | [quality-policy.md](./quality-policy.md); marco de objetivos §5; manual §3 |
| 5.3 | Responsabilidad, autoridad, comunicación | Roles en SOP-001, SVMP; *Chief Product Architect*; *PRRC* a nombrar si mercado 13485 *full* |
| 5.4 | Revisión por la dirección | *Management review* P-01 (frecuencia y plantilla: ver siguiente paso lógico) |
| 5.5 | Responsable de la dispositivo / PRR / PRRC | Definir según jurisdicción; placeholder hasta *Designation* formal |
| 5.6 | Infra, ambiente, recursos, mantenimiento | *README*, `ConfigService`, entornos en despliegue; *scale-out* *roadmap* en `PROJECT_CONTEXT` |

**Principio:** Management **no** delega en la herramienta (Cursor) la aprobación documental: la regla MDC asiste a ingeniería; el **control** permanece con personas y eQMS / Git aprobado.

---

## 7. Resource Management (Cláusula 6)

| 6 | Tema | Práctica |
|---|------|----------|
| 6.1 | *Provision* de recursos | Fijación de *capacity* y prioridades; revisión con *backlog* y *roadmap* |
| 6.2 | *Human resources* | *Onboarding* a política, SOP-001, SVMP (según rol); *pair review* en cambios *high risk* |
| 6.3 | Infraestructura, ambiente, SW | `package.json` / lockfile; *runtime* >=20; repositorio único; *audit* back-end configurable |
| 6.4 | Contaminación y *prevention* (donde toque) | Carga controlada, sin datos reales de clientes en *tests* salvo anexo; datos sintéticos (SVMP) |

**Competencia:** revisiones técnicas y *design reviews* bajo SOP-001; formación *security/privacy* según crecimiento del equipo.

---

## 8. Product Realization (Cláusula 7) – con énfasis en Design & Development (SOP-001) y Software Validation (SVMP)

| Subcláusula (13485) | Tema | MAZALab |
|---------------------|------|--------|
| 7.1 | Planificación | *Backlog* + riesgo + *Gap*; criterio de aceptación por *feature* |
| **7.3** | **Diseño y desarrollo** | **[SOP-001](./sop-design-and-development.md)**: *design inputs* (incl. **Entity Resolution** con similitud y conflictos, **Risk Scoring** con explicación estructurada), *outputs*, *reviews*, *verification*, *validation* referida al **SVMP**, *transfer* y *change control* con *audit trail* y re-validación |
| 7.4 | Compras y evaluación de *suppliers* | *Dependencies*; registro *SOUP* (roadmap); re-evaluación en cambio mayor de versión |
| 7.5 | *Production and service* | **Entrega *software*:** *build* reproducible, tag, *release record*; *config-as-code*; *audit* y trazas |
| 7.5.6 (cuando aplica) | Validación de proceso/*service* | **SVMP** e IQ/OQ/PQ o equivalente para entorno; pruebas de aceptación en *staging* |
| 7.6 | Control de equipos *monitoring* (si aplica) | Métricas y *health* (`/health`); calibración N/A a software puro; si hardware *future*, anexo |

**Módulos core (trazabilidad reforzada):**

- **Entity Resolution** — Toda variación de algoritmo o umbral afecta DIs, pruebas de regresión, y filas RVTM (Jaccard, Levenshtein, *fuzzy*, *conflict* paths).  
- **Risk Scoring** — *Breakdown* y explicación **no opcionales**; cambios de peso o *combo* requieren análisis de riesgo y evidencia bajo SOP-001 + SVMP.

**Validación de software:** criterio **único** y operativo: [SVMP](./software-validation-master-plan.md) (ciclo 6.1–6.5, *Vitest* / *Supertest*, RVTM §6.2, re-validación §6.5).

---

## 9. Measurement, Analysis and Improvement (Cláusula 8)

| 8 | Tema | Acción (resumen) |
|---|------|-----------------|
| 8.1 | *Feedback*, vigilancia, servicio *post-market* | *Audit log* + *stats* API; *feedback* formal pendiente SOP; *tickets* a CAPA *when defined* |
| 8.2 | *Internal audit* | Plan a definir; *gap* y revisiones *peer* mientras |
| 8.3 | **NC y CAPA** | *Major bugs*; proceso formal en *roadmap*; trazas en repositorio |
| 8.4 | *Analysis of data* | Métricas de CI, *release*, defect *escape*; *dashboard* operativo a futuro |
| 8.5 | *Improvement* | Cierre *Gap*; *Management review*; mejora de *pipelines* y documentación |

**Indicadores:** alineados a [Quality Policy §5 (Quality Objectives)](./quality-policy.md#5-quality-objectives-framework-para-establecer-objetivos-medibles--ejemplos-iniciales-vinculados-a-precisión-explicabilidad-y-compliance).

---

## 10. Risk-Based Thinking (integrado en todo el QMS y alineado con ISO 14971)

- **Pensamiento basado en riesgo (ISO 13485 0.1 / 4.1):** toda *feature*, dependencia, *release* o cambio de *intended use* se evalúa con severidad, probabilidad, controles y trazas a DIs, pruebas y *audit* (ver [Gap Analysis, resumen de riesgo](../qmsr-iso13485-gap-analysis.md)).  
- **ISO 14971 (dispositivo / software *medical*):** el *Risk File* (FMEA, HARA, o equivalente) es la **fuente** de requisitos de riesgo; SOP-001 y SVMP **implementan** mitigación y V&V; no duplican el *Risk File* en el manual.  
- **IEC 62304:** *software safety class* (A/B/C) documentada en SVMP; actividades de ciclo de vida y *SOUP* alineados.  
- **GAMP 5:** *CSV* basada en riesgo; categoría 4/5 (software a medida) con protocolos e incidentes.  
- **Principios de producto MAZALab:** *precisión* (salidas defensibles), *explicabilidad* (estructura, no discurso vacío), *privacidad* (mínimización, retención), *velocidad* (con CI y *observability*, sin recortar trazas obligatorias).

---

## 11. Key Procedures and References (tabla con enlaces a SOP-001, SVMP, Gap Analysis, etc.)

| ID / nombre | Título | Ruta relativa a `docs/` | Rol en el QMS |
|------------|--------|------------------------|---------------|
| **QP-001** | *Quality Policy* | [`qmsr-iso13485/quality-policy.md`](./quality-policy.md) | 5.3; *commitments*; objetivos |
| **QM-001** | *This Quality Manual* | [`qmsr-iso13485/quality-manual.md`](./quality-manual.md) (este documento) | Mapa 4.x–8.x; estructura |
| **SOP-001** | Design and Development | [`qmsr-iso13485/sop-design-and-development.md`](./sop-design-and-development.md) | 7.3; ER/RS/API; *DHF*; RVTM *link* a SVMP |
| **SVMP** | Software Validation Master Plan | [`qmsr-iso13485/software-validation-master-plan.md`](./software-validation-master-plan.md) | *V&V*; RVTM plantilla; IQ/OQ/PQ; módulos |
| **GAP-001** | *Gap Analysis* (QMSR/13485) | [`qmsr-iso13485-gap-analysis.md`](../qmsr-iso13485-gap-analysis.md) | Brechas, priorización, remediación |
| **PC-001** | *Project context* (técnico) | [`PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md) | Alcance, API, *stack*, *compliance* link |
| **ADR-001** | *Architecture baseline* | [`DECISIONS.md`](../DECISIONS.md) | Design input arquitectónico |

*Regla Cursor:* [`.cursor/rules/qmsr-iso13485-compliance.mdc`](../../.cursor/rules/qmsr-iso13485-compliance.mdc) — referencia obligatoria al *Gap* en su texto.

---

## 12. Records Control and Retention

| Tipo de registro | Mínima retención (indicativa) | Almacenamiento / control |
|------------------|------------------------------|-------------------------|
| Política, manual, SOP, SVMP, *gap* | Vida del producto + requisito legal (jurisdicción) | Git + tag; *DMS* cuando exista |
| RVTM, *protocol* results, *release* | Misma que DHF/TF *expectation* | `docs/qmsr-iso13485/records/` o eQMS |
| *Commit*, PR, CI, *tag* | *Lifecycle* repositorio + *backup* | Plataforma Git; artefactos CI |
| *Audit log* (operación) | Según política de privacidad y uso | *JSON* / SQLite; acceso restringido |
| PII en pruebas | **Evitado**; si inevitable, *NDA* + anonimización | SOP-001, SVMP |

*Identificabilidad* de documentos: versión, fecha, historial, autor (este manual cumple 4.1.4 / 4.1.5 en *spirit*; detalle SOP a futuro).

---

## 13. Approval and Revision History

| Rol | Nombre / firma | Fecha |
|-----|----------------|-------|
| **Management (CEO o equivalente)** | _________________________ | __________________ |
| **Chief Product Architect & Technical Lead** (preparación) | _________________________ | 22-Apr-2026 |
| **QA / Regulación (revisión)** | _________________________ | __________________ |

**Efecto:** con la aprobación de **Management**, la versión 1.0 de este *Quality Manual* y la [Quality Policy](./quality-policy.md) se declaran el **juego documental mínimo** de primer nivel del QMS para el alcance de este repositorio, sujeto a *records* y procedimientos adicionales a medida que el negocio los adopte. **Cambio de política o de estructura normativa 13485/820 = revisión** de este manual o nueva versión.

### Historial de versiones (documento *Quality Manual*)

| Versión | Fecha | Autor / Rol | Descripción de cambios |
|---------|--------|------------|-------------------------|
| 1.0 | 22 de abril de 2026 | Chief Product Architect & Technical Lead | Versión inicial (*Draft*): estructura QMS 4–8; mapeo a ER/RS; *Quality Policy* incorporada; referencias a SOP-001, SVMP, *Gap*, `PROJECT_CONTEXT`, regla *compliance*; riesgo 14971; *records*. |

### Bloque de aprobación formal (Management) — cierre

| Nombre (impreso) | Cargo | Firma | Fecha |
|------------------|-------|-------|--------|
| | CEO / Management | | |

**Estado:** [ ] Aprobado — *Quality Manual* v1.0 en vigor  [ ] Aprobado con comentario: ________________________

---

*Fin del documento.*
