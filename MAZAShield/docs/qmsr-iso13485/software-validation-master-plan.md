# Software Validation Master Plan (SVMP) – MAZALab

**Documento:** `software-validation-master-plan.md`  
**Versión:** 1.0  
**Fecha:** 22 de abril de 2026  
**Autor:** Chief Product Architect & Technical Lead  
**Estado:** Draft para revisión  
**Referencia normativa (marco):** QMSR (21 CFR Part 820) / ISO 13485:2016 (incl. Cláusulas **4.1.6** Información documentada, **7.3** Diseño y desarrollo, **7.5.6** Validación de la producción y del servicio de la prestación) + **GAMP 5** (categoría de software / CSV) + **IEC 62304** (ciclo de vida del software de dispositivo médico)  
**Alineación con:** `docs/qmsr-iso13485-gap-analysis.md` (Gap Analysis v1.0, aprobado para implementación)

---

## 1. Purpose

Este **Software Validation Master Plan (SVMP)** define de forma unívoca el enfoque, el ciclo de vida, las responsabilidades, los criterios de aceptación y los entregables para la **verificación y validación (V&V)** del software de MAZALab en los módulos y capas alcanzadas por el alcance (sección 2). Cumple el rol de “plan rector” frente a:

- **QMSR / ISO 13485:2016:** diseño bajo control (7.3), documentación (4.1.6) y, donde proceda, validación de procesos/servicio (7.5.6) vía evidencia estructurada.
- **IEC 62304:** actividades y tareas de ciclo de vida de software de acuerdo con la **clase de seguridad del software (A, B, C)** asignada (sección 4).
- **GAMP 5:** adopción de enfoque **basado en riesgo (risk-based approach)** a la validación (Computerized Systems Validation) en contexto de software empresarial/operacional acoplado a un SMQ; las actividades y registros concretos se ajustan al nivel de riesgo y a la calificación del sistema (IQ/OO/PQ cuando aplique, sección 5–6).
- **ISO 14971:** riesgo de dispositivo/software—las actividades de V&V se trazan a riesgos y control de mitigación en el Dossier de riesgo (enlace bidireccional, no duplicar aquí el FMEA completo).

**Resultado deseado:** un paquete de **evidencia retirable (audit-ready)**: protocolos, reportes, matrices de trazabilidad, registros de release y registro de cambios, homologable con un **Design History File (DHF) / Technical File (TF)** o equivalente definido en la estructura documental de MAZALab.

---

## 2. Scope (qué se valida: Entity Resolution module, Risk Scoring module, API /assess-risk, QMS Layer futura)

| Componente / capa | Descripción (alcance v1.0) | Módulo de código (orientativo) | Notas de exclusión (v1.0) |
|-------------------|----------------------------|---------------------------------|-----------------------------|
| **Entity Resolution** | Normalización, similitud (p. ej. Jaccard, Levenshtein, deduplicación), detección de conflictos, umbral, salidas y explicación | `src/core/entity-resolution/**` | Fuentes de datos externas no controladas: **no** se valida el contenido de terceros; se valida **comportamiento** y **transformaciones** bajo supuestos documentados. |
| **Risk Scoring** | Scoring multi-dimensión, explicación y factores, umbrales, combos | `src/core/risk-scoring/**`, orquestación vía `src/core/assessment/**` según arquitectura | Modelos/LLM de terceros, si se incorporan, requieren **anexo SOUP/62304** y riesgo separado. |
| **API /assess-risk** (y rutas vinculadas) | Entrada, contrato, códigos de error, cabeceras, trazas de respuesta, idempotencia donde aplique | `src/api/assess-risk.ts`, `src/api/assess.ts`, `src/api/index.ts` (rutas) | Infra de despliegue (Kubernetes, etc.) v1.0: parcial; ver **QMS / IQ en roadmap**. |
| **Assessment pipeline** (si alimenta salida regulada) | Orden de fases, explicación agregada | `src/core/assessment/**` | Cualquier fase “passthrough” se declara o se excluye con justificación. |
| **Gobernanza / Audit trail (capa de cumplimiento)** | Registro de eventos, persistencia, consulta, integridad básica | `src/core/governance/**`, `src/api/audit.ts` | 21 CFR Part 11: **alcance TBD** según intended use; mínimo: controles técnicos y retención documentados. |
| **QMS Layer futura** | Workflows de aprobación, firmas, documentos controlados, plantillas de protocolo (no existente aún) | TBD bajo `docs/qmsr-iso13485/`, `src/**` cuando exista | En v1.0 del SVMP: **planteamiento y requisitos**; validación de producto al implementarse. |

**Fuera de alcance inmediato (no invalida el SVMP, pero requiere anexo o versión 2.0 del plan):** UI comercial, integraciones a CRM no críticas, y datos reales de clientes (usar entornos de prueba o datos sintéticos).

---

## 3. Intended Use of MAZALab

MAZALab es una plataforma de **inteligencia de riesgo** que, en su núcleo, **procesa señales y entidades** (identidad, similitud, atributos) y **produce puntuaciones y explicaciones** orientadas a **analistas y organizaciones** que requieren transparencia y trazabilidad (gobierno, defensa, sectores regulados, cumplimiento). El **uso previsto (intended use)** debe formalizarse en un documento de producto aprobado (p. ej. *Intended Use / Indications for Use*), coherente con el Gap Analysis. El presente SVMP asume:

- El software **apoya** la toma de decisiones; la **responsabilidad** final de la acción (bloqueo, aprobación, reporte) recae en el **operador humano o política organizacional**, salvo que un cambio de alcance defina un **SaMD** con **indicación clínica** (requiere reevaluación de clase e intended use).
- Cualquier afirmación de “diagnóstico” o “tratamiento” **no** forma parte de intended use a menos que se documente y reclasifique el producto.

| Elemento | Declaración (trabajo v1.0) |
|----------|----------------------------|
| Usuarios previstos | Analistas de riesgo, cumplimiento, equipos técnicos autorizados |
| Entornos | Desarrollo, staging, producción; segregación y controles de acceso TBD/según SOP |
| Entradas típicas | Identificadores, atributos de entidad, contexto de evaluación vía API |
| Salidas típicas | Puntuación, explicación estructurada, metadatos de auditoría, códigos de servicio |
| Límites | No reemplaza juicio clínico ni legal; no almacenamiento de finalidad clínica salvo anexo |

*Actualizaciones a intended use = **change control** + posible re-validación (sección 6.5).*

---

## 4. Software Classification & Risk Level (según IEC 62304 y FDA guidance)

| Dimensión | Criterio | Decisión v1.0 (Draft) | Registro requerido |
|-----------|----------|------------------------|--------------------|
| **IEC 62304 – clase de software** | Impacto al paciente/usuario bajo **falla del software** (Annex) | Clase de seguridad: **B** (por defecto) salvo reevaluación: salidas que **pueden** afectar decisiones de riesgo operacional/reputacional/seguridad con daño indirecto. Si only internal analytics sin impacto: **A** requiere *justificación firmada* en el riesgo. **C** si se demuestra que un fallo puede provocar **daño serio o muerte** (p. ej. decisión de dispositivo clínico). | Actividad: **Software Safety Classification** (registro) + anexo en Risk File |
| **Nivel de preocupación (FDA, legacy SaMD context)** | Bajo / moderado / alto (según guidance IMDRF/FDA) | **Moderate** (trabajo) hasta refinar intended use; alinear con 62304. | Risk File |
| **GAMP 5** | Categoría de software (1–4, 4 custom, 5 custom + malformación, etc. según 2ª ed.) | **Categoría 4 / 5** (software a medida + lógica de negocio crítica): protocolos, trazas, aprobación de cambio. Ajuste fino a nomenclatura interna. | Categorization record |

**Risk classification table (resumen, para vinculación 14971 ↔ V&V):**

| Riesgo ID (plantilla) | Descripción (ejemplo) | Severidad (S) | P(O) | RPN / prioridad | Mitigación (controles) | Verificación/Validación (SVMP) |
|----------------------|------------------------|--------------|------|-----------------|-------------------------|---------------------------------|
| R-SW-001 | Salida de score incorrecta por bug en scorings | 4 | 2 | Alta | tests unit + integración, revisiones, feature flags | Suite Vitest, tests de regresión, reporte por release |
| R-SW-002 | Falsa unificación de entidades (ER) | 4 | 2 | Alta | umbral, conflict detector, explainability | Casos límite en `EntityResolution` tests, integration |
| R-SW-003 | Pérdida de audit trail | 3 | 2 | Media–alta | persistencia, integridad, acceso restringido | tests persistencia, API audit, revisión de logs |
| R-SW-004 | Fuga PII en logs | 4 | 1 | Media | minimización, máscara, policy | pruebas de no-registro, revisión estática, checklist |

*Los IDs reales y valores numéricos viven en el **archivo de riesgo**; esta tabla es plantilla alineada al SVMP v1.0.*

---

## 5. Validation Approach (risk-based)

| Principio GAMP 5 / QMSR | Aplicación en MAZALab |
|--------------------------|------------------------|
| **Vida del sistema** | Inventario, owner, entorno, release semántica, SBOM/dependencias críticas (progresivo) |
| **Riesgo primero** | Frecuencia y severidad de fallos → plan de pruebas y profundidad de documentación; **no** cero documentos en componentes *high risk*. |
| **Trazabilidad** | User need → requisito → diseño → prueba (RVTM, sección 6.2) |
| **Cambio controlado** | PR, revisión, tests obligatorios, re-validación acotada (6.5) |
| **Calificación (IQ / OQ / PQ)** | Donde el software se despliega como “sistema computarizado” en un entorno validado, se aplican: **IQ** (instalación, configuración, versiones), **OQ** (funcionamiento bajo carga/escenarios), **PQ** (aceptación en condiciones reales o simuladas de uso). Para servicios *cloud* puramente PaaS, OQ/PQ se documentan con **configuración como código** y pruebas de regresión + monitoreo, según anexo. |
| **Data integrity (ALCOA+)** | Metadatos de auditoría, trazas inmutables donde sea exigible; 21 CFR Part 11: anexo si aplica. |

**Niveles de evidencia (resumen):**

| Nivel de riesgo del cambio | Evidencia mínima |
|---------------------------|-----------------|
| Bajo (doc, refactors internos, sin lógica) | Pruebas existentes + CI verde, revisión de pares |
| Medio (nuevo atributo de score, ajuste de API no breaking) | Nuevas pruebas + actualización RVTM + nota de release |
| Alto (cambio de algoritmo, umbral global, cálculo de riesgo) | Análisis de riesgo actualizado, pruebas amplias, re-OQ o subconjunto OQ, aprobación designado |

---

## 6. Validation Lifecycle (aligned with ISO 13485 Cl. 7.3)

El ciclo de V&V se alinea estructuralmente con **7.3** (D&D). La numeración 6.1–6.5 refleja fases; los registros viven en repositorio / herramienta de calidad aprobada.

### 6.1 User Needs & Design Inputs

- **Fuentes:** reglas de negocio, requisitos de regulación aplicables, riesgo (ISO 14971), expectativas de analistas, SLAs, seguridad y privacidad.
- **Formato:** IDs estables (p. ej. `UN-ER-001`), prioridad, criterio de aceptación medible.
- **Evidencia:** *Design Inputs* en DHF/TF, revisiones, actas.

### 6.2 Design Outputs & Traceability Matrix

- **Salidas de diseño:** especificaciones de módulo, esquemas de API, pseudocriterios algorítmicos, estructura de explicación (explainability), límites de performance.
- **RVTM (plantilla mínima):**

| ID User Need | Requisito / design input (resumen) | ID Design Output | Módulo | ID Test / protocolo | Resultado (P/F) | Evidencia (link) |
|--------------|------------------------------------|----------------|--------|---------------------|-----------------|-----------------|
| UN-ER-001 | Tolerancia a variaciones de texto | DO-ER-01 | entity-resolution | T-ER-100 | P | `tests/.../EntityResolution` |
| UN-RS-002 | Explicación accionable | DO-RS-01 | risk-scoring | T-RS-200 | P | `tests/.../RiskScoring` |
| *…* | *…* | *…* | *…* | *…* | *…* | *…* |

*Poblado formal en herramienta; la tabla es **template** aprobada en v1.0 del SVMP.*

### 6.3 Verification

- **Definición:** prueba de que el **diseño** se implementó **correctamente** (¿lo construimos bien?).
- **Métodos:** pruebas unitarias, de integración, de contrato API, análisis estático, revisiones, casos límite.
- **Aceptación:** criterio por requisito en RVTM; defectos bajo proceso NC o backlog según gravedad.

### 6.4 Validation (incluyendo IQ/OQ/PQ si aplica)

- **Definición:** prueba de que el **sistema** satisface **necesidades de usuario** bajo **uso previsto** (¿construimos el producto correcto?).
- **IQ (Installation Qualification):** versiones de Node/runtime, build hash, dependencias, variables de entorno, checklist de despliegue.
- **OQ (Operational Qualification):** flujos críticos (assess-risk end-to-end, resolución con casos de referencia, audit write/read).
- **PQ (Performance Qualification):** aceptación en entorno **staging/producción** o réplica, con carga o datos representativos (según riesgo); puede combinarse con **UAT** firmado.
- **Validación de procesos 7.5.6 (ISO 13485):** para **software como prestación** o proceso automatizado, la evidencia OQ/PQ + monitoreo post-release sustenta la **validación** del proceso; el **VMP** de proceso de empresa enlaza en versión actualizada.

### 6.5 Change Control & Re-validation

| Disparador | Acción mínima |
|------------|---------------|
| Parche de seguridad dependencia (sin cambio lógico) | CI + regresión + registro de release |
| Cambio algoritmo o umbral | Riesgo + RVTM + pruebas amplias + aprobación |
| Nuevo endpoint API | Especificación, pruebas contractuales, documentación, posible re-OQ de flujo |
| Cambio intended use | **Nuevo riesgo + SVMP amend + re-validación** acorde |

---

## 7. Specific Validation Strategy for Core Modules

### 7.1 Entity Resolution (fuzzy matching, Jaccard, Levenshtein, conflict resolution, explainability)

| Área | Estrategia de validación / verificación |
|------|----------------------------------------|
| **Fuzzy / similitud (Jaccard, Levenshtein, u otros)** | Conjunto de **casos de oro** (sintéticos y anonimizados) con pares *match / non-match* esperados; tolerancias y **regresión** al cambiar normalización o pesos. |
| **Resolución de conflictos (conflict detection)** | Escenarios con alias contradictorios, baja similitud, o duplicados; validar que se elevan flags y que la salida explica *por qué*. |
| **Normalización** | Invariantes de cadena, Unicode, colación; pruebas unitarias del normalizador. |
| **Explainability** | Presencia estructurada de factores (scores por componente, reglas) en la salida; tests de *snapshot* o contrato de esquema JSON. |
| **Rendimiento** (si es requisito) | Criterio documentado (p99 latencia) en **no-regresión** o benchmark acotado. |

### 7.2 Risk Scoring (multi-dimension, breakdown transparente, explicaciones accionables)

| Área | Estrategia |
|------|------------|
| **Multi-dimensión** | Matriz de pruebas por dimensión; sumas, ponderaciones, caps. |
| **Breakdown** | Cada sub-score documentado; tests de regresión por cambio de peso. |
| **Explicaciones accionables** | Criterios de aceptación en lenguaje de negocio; ausencia de contradicciones; **no** dependencia de texto libre alucinado para cumplir el requisito (consistencia con explain builder). |
| **Combos / patrones avanzados** | Casos de prueba en `tests/unit` e integración alineados a `advanced-patterns` (según repositorio). |

### 7.3 Audit Trail & Compliance Metadata

| Tema | Estrategia |
|------|------------|
| **Inmutabilidad lógica** | Append-only donde aplique; no borrado silencioso; políticas de retención documentadas. |
| **Contenido mínimo** | Quién, qué, cuándo, correlación request; PII bajo mínima necesidad. |
| **Integración API** | Pruebas `Supertest` / integración que validen códigos HTTP, esquemas, y trazas en backend simulado o test DB. |
| **Cumplimiento 21 Part 11** | Anexo si el sistema entra en *records* electrónicos regulados. |

---

## 8. Testing Strategy (Vitest, Supertest, integration + regulatory tests)

| Tipo de prueba | Herramienta (actual / plan) | Contenido |
|----------------|-----------------------------|-----------|
| **Unit** | **Vitest** | Funciones puras, scorers, normalizers, reglas, builders de explicación. |
| **API / integración** | **Supertest** (u homólogo) contra app instanciada | `/assess-risk` y rutas alineadas, contrato JSON, códigos de error. |
| **Integración de pipeline** | Vitest + fixtures | Flujos completos *light*; datos sintéticos. |
| **Regulatory / criterios aceptación** | Ubicación dedicada, p. ej. `tests/integration/**` con etiqueta `regulatory` o nombre explícito | Casos vinculados a IDs de requisito en RVTM; ejecutados en **CI** en cada relevancia. |
| **Cobertura** | Umbreales por módulo (definir en Quality Plan) | Módulos críticos: umbral **mayor** que utilidades generales. |
| **CI** | GitHub Actions / proveedor (definir) | Bloqueo de merge en fallo; artefacto de test report almacenado. |

**Validation Activities vs Modules (resumen):**

| Actividad | Entity Resolution | Risk Scoring | API /assess-risk | Audit / Governance | QMS futura |
|----------|:-----------------:|:------------:|:----------------:|:------------------:|:----------:|
| Unit | ● | ● | ○ (handlers) | ● | TBD |
| Integration API | ○ | ○ | ● | ● | TBD |
| E2E / staging | ○ | ○ | ● | ○ | TBD |
| IQ/OQ/PQ | \* OQ vía tests + env | \* | \* | \* | TBD |
| *leyenda:* **●** mandatorio; **○** según riesgo; **\*** vía anexo de entorno |

---

## 9. Deliverables & Records (Design History File / Technical File equivalents)

| Entregable | Contenido | Ubicación / retención |
|------------|------------|------------------------|
| **SVMP (este documento)** | Plan rector v1.0 | `docs/qmsr-iso13485/software-validation-master-plan.md` |
| **Gap Analysis** | Brechas iniciales | `docs/qmsr-iso13485-gap-analysis.md` |
| **RVTM (viviente)** | Trazas UN ↔ DO ↔ Test | Git / GDoc / eQMS (definir) |
| **Protocolos y reportes** (IQ/OQ/PQ o V&V) | Checklists, resultados, desviaciones | `docs/qmsr-iso13485/records/` (recomendado) + artefacto CI |
| **Registro de release** | Build ID, versiones, aprobación, RVTM snapshot | `docs/qmsr-iso13485/records/releases/` o herramienta |
| **Risk file (ISO 14971)** | FME(A)/HARA, vinculación 62304 | Repositorio calidad (no obligatorio en este repo público) |
| **Listas SOUP** | Nombre, versión, CCL, riesgo | SBOM o `docs/qmsr-iso13485/soup-register.md` (roadmap) |
| **Trazas de diseño (DHF/TF pack)** | Actas, revisiones, firmas | eQMS o carpeta controlada equivalente |

---

## 10. Responsibilities

| Rol | Responsabilidad |
|-----|-----------------|
| **Chief Product Architect / Product Owner** | Intended use, priorización, aceptación de riesgo residual |
| **Tech Lead / Engineering** | Implementación, revisiones, tests, criterios de aceptación técnicos |
| **Quality / Regulatory (designado o externo)** | Aprobación de SVMP, auditoría de RVTM, cierre de desviaciones |
| **Ciberseguridad / Data Protection** | Privacidad, PII, evaluación de brechas, retención |
| **Operaciones / SRE (cuando exista)** | IQ de entorno, despliegue, monitorización, incidentes (CAPA) |

*Sustitución de nombres por personas: mantener matriz de delegación en eQMS.*

---

## 11. References (ISO 13485, QMSR, ISO 14971, GAMP 5, etc.)

| Referencia | Uso en SVMP v1.0 |
|------------|-----------------|
| ISO 13485:2016 (4.1.6, 7.1, 7.3, 7.4, 7.5.6, 8.x) | SMQ, D&D, validación, NC/CAPA, datos |
| 21 CFR Part 820 (QMSR) | Alineación de registros y controles; DHR/ DMR equivalentes bajo 820.181 / estructura interna |
| 21 CFR Part 11 (condicional) | Registros electrónicos, firmas |
| ISO 14971:2019 | Riesgo dispositivo/software |
| IEC 62304:2006 + Amd. 1, 2 | Clase, ciclo de vida, software safety |
| GAMP 5 (2nd ed. u homólogo) | CSV risk-based, categorías |
| IMDRF Software as a Medical Device (work items) | Contexto SaMD (no norma sola) |
| MAZALab Gap Analysis v1.0 | Brechas, roadmap de cumplimiento |
| *FDA Guidance: “General Principles of Software Validation”* (ref. general; complementar) | Buenas prácticas de validación (históricas) |

---

## 12. Approval

Este documento se aprueba en **Draft para revisión** (v1.0) y requiere firmas/constancias de aceptación formal para transición a **Aprobado** (estado documental) según el procedimiento de **control de documentos** (cuando el eQMS esté en vigor).

| Rol | Nombre / Firma | Fecha | Comentario |
|-----|----------------|-------|------------|
| Autor (Chief Product Architect & Technical Lead) | __________________ | ____ / ____ / 2026 | |
| Revisión Técnica (Tech Lead) | __________________ | | |
| Calidad / Regulación | __________________ | | |
| Product Owner (si distinto) | __________________ | | |

**Criterio de aprobación mínima para pasar a “Aprobado”:** revisión cíclica con Gap Analysis, responsables nombrados, y acuerdo sobre **clase 62304** e **intended use**; plan de carga del RVTM en 90 días o menos salvo excepción acreditada.

---

## Historial de versiones

| Versión | Fecha | Autor / Rol | Descripción de cambios |
|---------|--------|------------|-------------------------|
| 1.0 | 22 de abril de 2026 | Chief Product Architect & Technical Lead | Versión inicial (Draft para revisión): SVMP con alcance Entity Resolution, Risk Scoring, API /assess-risk, Gobernanza/audit, QMS futura; alineación ISO 13485 7.3, 7.5.6, 4.1.6; GAMP 5; IEC 62304; RVTM template; pruebas Vitest/Supertest; tablas de riesgo y aprobación. |

---

*Fin del documento.*
