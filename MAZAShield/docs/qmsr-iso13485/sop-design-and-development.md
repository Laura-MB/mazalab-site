# SOP-001: Design and Development Procedure (ISO 13485:2016 Cláusula 7.3 & QMSR)

**Documento:** `sop-design-and-development.md`  
**Versión:** 1.0  
**Fecha:** 22 de abril de 2026  
**Autor:** Chief Product Architect & Technical Lead  
**Estado:** Draft para revisión  
**Referencia:** [Gap Analysis](../qmsr-iso13485-gap-analysis.md), [Software Validation Master Plan](./software-validation-master-plan.md) (SVMP), [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md), [ADR-001 / Architecture baseline](../DECISIONS.md) (`docs/DECISIONS.md`)

---

## 1. Purpose

Este procedimiento ( **SOP-001** ) establece los requisitos mínimos y el flujo **accionable** para la **planificación, entradas, salidas, revisiones, verificación, validación, transferencia y control de cambios** del diseño y desarrollo de software bajo el SMQ de MAZALab, alineado con **ISO 13485:2016 Cláusula 7.3** y con las expectativas de **QMSR (21 CFR Part 820)** en la medida en que apliquen al producto y al intended use (véase [Gap Analysis](../qmsr-iso13485-gap-analysis.md)).

**Objetivos operativos:**

- Garantizar **calidad prémium**, **modularidad**, **explicabilidad** y **minimización de datos personales (privacy-by-design)** en los módulos críticos (entidad, riesgo, API, gobernanza, QMS futura).
- Asegurar **trazabilidad** requisito ↔ implementación ↔ prueba ( **RVTM** ) y constancia de **verificación/validación** según [SVMP](./software-validation-master-plan.md).
- Integrar el diseño con **gestión de riesgos (ISO 14971)** e **IEC 62304** (clase de software) y con la arquitectura aprobada (**ADR-001** en `docs/DECISIONS.md`, coherente con `docs/PROJECT_CONTEXT.md`).

Quien desarrolle o apruebe cambios en el alcance de la regla `.cursor/rules/qmsr-iso13485-compliance.mdc` **debe** cumplir este SOP a menos que una **desviación aprobada** (sección 12) indique lo contrario.

---

## 2. Scope (aplica a Entity Resolution, Risk Scoring, API, QMS Layer y cualquier cambio en software regulado)

| Categoría | Alcance SOP-001 (v1.0) | Rutas de código (orientativas) |
|----------|-------------------------|----------------------------------|
| **Entity Resolution** | Normalización, **similitud** (p. ej. **Jaccard**, **Levenshtein** u homólogas), *fuzzy matching*, deduplicación, **resolución de conflictos**, umbrales, explicación de emparejamiento | `src/core/entity-resolution/**` |
| **Risk Scoring** | Scoring **multi-dimensión**, desglose, **explicaciones accionables**, patrones avanzados, umbrales y combos | `src/core/risk-scoring/**`, orquestación en `src/core/assessment/**` según arquitectura |
| **API (evaluación de riesgo)** | Endpoints (p. ej. **`/assess-risk`**, `/assess` vinculados), contrato, códigos de error, trazas de respuesta, cabeceras | `src/api/assess-risk.ts`, `src/api/assess.ts`, enrutado en `src/api/index.ts` |
| **Gobernanza y cumplimiento** | *Audit trail*, metadatos de cumplimiento, persistencia y consulta bajo control | `src/core/governance/**`, `src/api/audit.ts` |
| **QMS Layer (futura)** | Aprobaciones, documentos controlados, firmas, plantillas de protocolo: **a partir de** primera entrega a código/operación, entra en este SOP con **Plan de diseño** propio. | `TBD` bajo `docs/qmsr-iso13485/`, `src/**` |
| **Cambio en software “regulado”** | Cualquier modificación con impacto en **comportamiento observable**, **riesgo**, **datos personales** o **salida de cumplimiento** en los módulos anteriores. | Aplica según riesgo (secciones 5.2, 12). |

**Fuera de alcance de SOP-001 (pero gobernado por otros SOPs):** marketing, pricing, contratos comerciales puros, salvo cuando impacten requisitos de diseño aprobados.

---

## 3. Responsibilities (roles: Chief Product Architect, Engineering Lead, QA/RA, Management)

| Rol | Responsabilidades clave (no exhaustivas) |
|-----|-----------------------------------------|
| **Chief Product Architect** | Owner del **diseño de producto** e **intended use** (coherente con `PROJECT_CONTEXT.md`); aprobación o delegación de **Design Reviews** de alto riesgo; asegurar que **entradas de diseño** reflejen necesidades y regulación aplicable. |
| **Engineering Lead / Tech Lead** | **Design Plan** (Apéndice A), asignación de tareas, revisiones técnicas, asegurar **código, tests, documentación** bajo criterio de aceptación; trazas en PR. |
| **QA / Regulación (designado, interno o consultor)** | Revisión de adecuación **SMQ**: RVTM, cierre de V&V según [SVMP](./software-validation-master-plan.md), aprobación de desviaciones documentadas, auditoría de DHF. |
| **Management (p. ej. Management Representative / PRRC cuando se nombre)** | Recursos, priorización, escalación; aprobación final de SOPs y, cuando aplique, **aceptación de riesgo residual** formal. |
| **Seguridad / Privacidad (cuando asignado)** | Evaluación de impacto en datos, logs, retención; alineación con mínimización (Art. 5 GDPR cuando aplique) y con política de datos. |

Los nombres de personas y delegaciones se **registran** anualmente o al cambio (lista en eQMS o anexo a este SOP).

---

## 4. Definitions (Design Inputs, Outputs, Review, Verification, Validation, DHF, Traceability Matrix, etc.)

| Término | Definición (uso MAZALab) |
|---------|-------------------------|
| **User Need (UN)** | Necesidad de usuario/negocio, identificable (p. ej. `UN-ER-00x`), verificable. |
| **Design Input (DI)** | Requisito físico, de rendimiento, de seguridad, de norma, de riesgo, que **alimenta** el diseño (ISO 13485 7.3.2). |
| **Design Output (DO)** | Especificación, arquitectura, código versionado, test, documento que **describe** o **concreta** el diseño; debe permitir verificación (7.3.3). Incluye esquemas de API, estructura de explicación de riesgo, parámetros de similitud (Jaccard, Levenshtein, etc.). |
| **Design Review** | Revisión **formal, documentada, multidisciplinaria** en hito (7.3.4), con criterio de aceptación y *action items* cerrables. |
| **Design Verification** | Evidencia de que **las salidas de diseño** cumplen **las entradas de diseño** (¿*built right*?) — pruebas, análisis, inspecciones, [`Vitest`][SVMP]. |
| **Design Validation** | Evidencia de que el dispositivo/software **cumple las necesidades del usuario** y el **use previsto** (¿*right product*?); criterios y métodos: [**SVMP** sección 6.4, IQ/OQ/PQ cuando aplique](./software-validation-master-plan.md). |
| **DHF (Design History File)** | Conjunto **versionado y retirable** de registros de diseño para un `product`/`release` dado (sección 13). Análogo de cumplimiento a lo esperado bajo 820 para historial de diseño. |
| **RVTM (Traceability / Requirements-Verification-Traceability Matrix)** | Matriz **User need / DI → DO → prueba/ protocolo**; plantilla y reglas: [**SVMP** 6.2](./software-validation-master-plan.md#62-design-outputs--traceability-matrix) y **Apéndice C** (este documento). |
| **Change Control** | Proceso para evaluar, aprobar, implementar y acreditar un cambio, con impacto en riesgo, validación, DHF, audit trail. |
| **SOUP** | *Software of Unknown Provenance* (IEC 62304) — tercero no desarrollado bajo 62304 completo; requiere registro y, si es crítico, verificación reforzada. |
| **GAMP** (contexto) | Categoría y CSV **basada en riesgo**; ver [SVMP](./software-validation-master-plan.md). |

---

## 5. Design and Development Planning

### 5.1 Design Plan template

Cada entrega o **éfeature** con impacto en módulos del §2 **debe** tener un **Design Plan** (mínimo “ligero” para riesgo bajo; ampliado para riesgo alto) que incluya:

- Identificador (p. ej. `DP-2026-ER-01`), título, **ámbito** (módulo), **owner** y **revisor QA**.  
- **User needs / DI** referenciados (IDs).  
- **Riesgo** (enlace a riesgo ISO 14971: ID, severidad, controles).  
- **Criterio de aceptación** (medible) y **salida de diseño (DO) previstos** (p. ej. “DO-ER-0x: ajuste umbral + tests T-ER-0x”).  
- **Plan de pruebas** (unidad, integración, *regulatory* **según SVMP** [§8][SVMP]).  
- **Calendario** e hito de **Design Review** (sí / no, motivo si se omite: solo con **justificación de riesgo bajo aprobada** por Product Architect o QA).  

Plantilla detallada: **Apéndice A**.

### 5.2 Risk-based planning

| Nivel de riesgo del cambio (indicativo) | Profundidad del Design Plan y evidencia |
|----------------------------------------|----------------------------------------|
| **Bajo** (refactor interno, sin lógica de riesgo/entidad) | Registro de PR, tests existentes, CI verde, sin Design Review completo **si** checklist rápida OK. |
| **Medio** (nuevo atributo de score, API no breaking) | Design Plan abreviado, actualización RVTM, 1 revisor mínimo. |
| **Alto** (algoritmos de similitud, umbrales globales, cálculo de riesgo, PII) | Design Plan completo, **Design Review formal**, riesgo actualizado, re-validación según [SVMP §6.5][SVMP6] |

*Referencia cruzada: [SVMP sección 5 (risk-based) y 6.5 (change & re-validation)](./software-validation-master-plan.md).*

[SVMP]: ./software-validation-master-plan.md
[SVMP6]: ./software-validation-master-plan.md#65-change-control--re-validation

---

## 6. Design Inputs (incluyendo User Needs, Regulatory Requirements, Risk Management outputs)

**Fuentes mínimas de entradas de diseño (7.3.2):**

1. **User needs** (analistas, operación, *stakeholders*).  
2. **Requisitos regulatorios aplicables** (QMSR, 13485, 62304, 11 si aplica, jurisdicción).  
3. **Salida de gestión de riesgos** (ISO 14971: controles, requisitos de *risk control* trazables a DI).  
4. **Seguridad y privacidad** (mínimización, retención, accesos, no registro de PII innecesario en *logs* / *audit*).  
5. **Rendimiento y disponibilidad** (SLA cuando conste en `PROJECT_CONTEXT` o en contrato).  
6. **Arquitectura aprobada** — **ADR-001** (`docs/DECISIONS.md`) y decisiones sucesivas (ADR-00x) que afecten módulos core.

**Criterio de aceptación:** todo DI lleva **ID** (`DI-ER-00x`, `DI-RS-00x`, `DI-API-00x`…), versión, y **revisión** de completitud **antes** de congelar salidas de diseño para un hito dado. Los DI para **Entity Resolution** deben, cuando apliquen, citar criterios de similitud (**Jaccard**, **Levenshtein** u otras) y criterio de **conflicto**; para **Risk Scoring**, deben citar requisito de **explicación accionable** (estructura, no discursiva *hallucination* como única prueba de cumplimiento).

---

## 7. Design Outputs (specifications, code, tests, documentation)

**Salidas aceptables (7.3.3) incluyen, según el caso:**

- Especificaciones (Markdown en `docs/`, *OpenAPI* si la API se publica, diagramas bajo `docs/` o `adr/`).  
- **Código** versionado (Git) con **mensajes y PRs** trazables a ticket / DI.  
- **Tests** (`tests/**`, p. ej. `Vitest`, integración, `Supertest` — ver [SVMP §8][svmp8]).  
- Estructura de **explicación** de riesgo (builders, *breakdown* transparente) y de **explicación de resolución de entidad** (factores, conflictos) **como** salida del diseño, no como “extra cosmética”.  
- **Documento de desviación** si se aparta de un DI (requiere aprobación, §12).  

[svmp8]: ./software-validation-master-plan.md#8-testing-strategy-vitest-supertest-integration--regulatory-tests

**Principio de calidad prémium:** la modularidad (capas `core/*`) se **mantiene**; los cambios de alto riesgo no se mezclan con refactors de estilo en el mismo PR sin plan explícito.

---

## 8. Design Reviews (formal, multidisciplinario, registros)

- **Obligatorio** para cambios de **riesgo ≥ medio** en lógica de **Entity Resolution** (similitud, *fuzzy* match, *conflict resolution*) o **Risk Scoring** (ponderaciones, *axes*, *thresholds* que alteren decisiones de negocio).  
- **Participantes mínimos:** quien represente **diseño de producto** (Chief Product Architect o delegado), **ingeniería** (Engineering Lead o delegado), **QA/RA** (o segundo ingeniero designado **sin** ser autor único).  
- **Entregable:** acta o comentario de **Design Review** en herramienta aprobada (o plantilla `DR-xxx` en `docs/qmsr-iso13485/records/`), con: lista de comprobación **Apéndice B**, conclusiones, acciones, **P/F** de cierre de fase.  
- **Criterio de aprobación:** cero o todas las acciones con plan de cierre o aceptación explícita de riesgo residual (Management si aplica).

---

## 9. Design Verification

- La **verificación** demuestra que el **diseño implementado** satisface los **DIs** (método: prueba, análisis, inspección).  
- **Cobertura mínima:** alineada con [SVMP — lifecycle 6.3][svmpe63] y suite automatizada.  
- **Módulo Entity Resolution:** pruebas de normalización, casos límite de similitud (**Jaccard** / **Levenshtein**), escenarios de **falso positivo/negativo** documentados, y **conflictos**.  
- **Módulo Risk Scoring:** pruebas por dimensión, regresión en *breakdown*, ausencia de contradicciones en explicación.  
- **Evidencia:** enlaces a CI, nombres de *test* o ID en **RVTM** (T-xxx, P).  

[svmpe63]: ./software-validation-master-plan.md#63-verification

---

## 10. Design Validation (referencia explícita al SVMP)

Toda actividad de **validación de diseño (diseño del “producto correcto” frente a necesidad de uso y intended use)** se ejecuta y documenta de acuerdo con el **Software Validation Master Plan**:

- **Documento rector:** [`docs/qmsr-iso13485/software-validation-master-plan.md`](./software-validation-master-plan.md)  
- Incluye: **6.1–6.4** (necesidades, RVTM, verificación, validación, **IQ/OQ/PQ** según entorno y riesgo), y **6.5** re-validación por cambio.  
- **No** se duplican en este SOP las tablas de protocolo completas: el **SVMP** es la **única** referencia normativa de profundidad para V&V; el SOP-001 asegura que el **D&D** *invoca* el SVMP en cada liberación afectada.

---

## 11. Design Transfer (a producción / release)

1. **Pre-requisitos:** DI/DO aprobados, verificación con evidencia, validación o plan de cierre aprobado según riesgo, RVTM actualizado, **registro de release** (versión, *build* hash, notas) — ver [SVMP §9 *Deliverables*][svmpe9].  
2. **Transferencia:** despliegue a **staging** primero (salvo excepción aprobada); luego **producción** con checklist **IQ** (entorno) / **OQ** (flujos) acorde al [SVMP][SVMP].  
3. **Formación** de operaciones: documentación de cambio visible, **sin** *breaking changes* en API documentados con versión.  
4. **Post-release:** monitorización, métricas, canal de *feedback* (alimenta 8.2 si se materializa SOP de quejas en SMQ).  

[svmpe9]: ./software-validation-master-plan.md#9-deliverables--records-design-history-file--technical-file-equivalents

---

## 12. Design Changes & Change Control (integración con audit trail y re-validation)

| Paso | Acción |
|------|--------|
| 1 | **Identificar** el cambio (bug, *feature*, refuerzo de seguridad). Clasificar **riesgo** (§5.2). |
| 2 | **Registro** en control de cambios (ticket / PR); para cambios *high* **actualizar riesgo** (14971). |
| 3 | **PR** con descripción, enlace a DI/DO, impacto en **QMSR/13485** (línea explícita en descripción, según regla de cumplimiento). |
| 4 | **Audit trail:** no suprimir eventos de gobernanza; si se corrige dato, usar **reversión controlada o asiento** según diseño (no “editar en silencio” salvo política aprobada). |
| 5 | **Re-validación:** según [SVMP 6.5][SVMP6] — mínimo regresión CI; ampliar OQ/suite *regulatory* en cambios de algoritmo o *threshold* global. |
| 6 | **Cierre** en DHF y acta o nota de release. |

---

## 13. Design History File (DHF) – qué debe contener y cómo se mantiene

El **DHF** (o paquete equivalente **TF/DHF** para el producto software) agrega, **por producto/versión mayor o *release* regulado**:

| Contenido mínimo | Origen / notas |
|-----------------|----------------|
| Resumen de **intended use** y *scope* | Product + Gap / SVMP |
| **Design Inputs** aprobados (lista versionada) | `docs/`, eQMS |
| **Design Outputs** (refs a ramas, tags, *specs*) | Git tag `vX.Y.Z`, *PR* |
| **Design Reviews** | Acta Apéndice B |
| **Verificación / Validación** (refs a protocolo, *report* CI) | RVTM, *artifacts* |
| **Análisis de riesgo** (enlace al *Risk File*) | No necesariamente en este repo completo |
| **Registro de release** y **cambio** (changelog) | `docs/qmsr-iso13485/records/releases/` o herramienta |
| **Desviaciones aprobadas** (si existen) | Con justificación y aprobación QA |

**Mantenimiento:** al etiquetar un *release* **regulado**, el **Engineering Lead** asegura que un **empaquetado** (carpeta o *export* eQMS) contiene los punteros anteriores. El **responsable QA** desafía muestreo en auditoría interna.

---

## 14. Traceability Matrix (RVTM) – referencia al SVMP

- La **RVTM** viva (User need / design input → design output → prueba) **sigue** la definición y plantilla del **SVMP [6.2][svmpe62]**.  
- **Columnas, IDs (T-xxx) y criterio P/F** se gestionan en la herramienta aprobada o en hoja bajo `docs/qmsr-iso13485/` con control de versión.  
- **Cambio de requisito** = fila RVTM nueva o versión, **no** *overwrite* no versionada.  
- **Apéndice C** (este SOP) enlaza a la plantilla; no se duplican celdas *master* en dos sitios: el **SVMP** mantiene la **plantilla canónica**.  

[svmpe62]: ./software-validation-master-plan.md#62-design-outputs--traceability-matrix

---

## 15. Records & Retention

| Tipo de registro | Retención mínima (indicativa) | Ubicación |
|------------------|-------------------------------|-----------|
| Design Plans, DR actas, RVTM | Vida del producto + **período reglamentario** (jurisdicción) | eQMS / repositorio controlado |
| *Logs* de auditoría (no PII excesivo) | Según política de retención aprobada | Infra, ver `governance` |
| SOP-001, SVMP, Gap Analysis (versiones) | Permanente (versionado) | `docs/qmsr-iso13485/`, `docs/` |
| *Pull requests* y CI | Típico: vida útil *host* o *mirror* anual | Plataforma Git |

*Ajuste legal (GDPR, *records* nacionales): SOP de privacidad y Management.*

---

## 16. References (ISO 13485 Cl. 7.3, QMSR, GAMP 5, Gap Analysis, SVMP)

| Documento / norma | Referencia |
|-------------------|------------|
| ISO 13485:2016 Cl. 7.3 | Diseño y desarrollo (planificación, entradas, salidas, revisión, verificación, validación, transferencia, cambio) |
| 21 CFR Part 820 (QMSR) | Sistema de calidad; homologación de *records* a DHF / DHR según estructura interna |
| ISO 14971:2019 | Riesgo |
| IEC 62304 | Ciclo de vida de software, SOUP, clase A/B/C |
| GAMP 5 | CSV basada en riesgo (soporte a validación) |
| [Gap Analysis](../qmsr-iso13485-gap-analysis.md) | `docs/qmsr-iso13485-gap-analysis.md` |
| [SVMP](./software-validation-master-plan.md) | `docs/qmsr-iso13485/software-validation-master-plan.md` **— fuente rectora de V&V e IQ/OQ/PQ** |
| [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md) | Contexto de producto y repositorio |
| **ADR-001** | `docs/DECISIONS.md` — *Architecture baseline* (base normativa de diseño arquitectónico) |
| *Regla Cursor* | `.cursor/rules/qmsr-iso13485-compliance.mdc` |

---

## 17. Appendices

### Appendix A: Design Plan Template

**ID del plan:** `DP-YYYY-NN`  
**Título:**  
**Módulo(s):** [ ] Entity Resolution  [ ] Risk Scoring  [ ] API  [ ] Governance  [ ] QMS (futuro)  
**Owner:** _____________ **Fecha apertura:** ___________  
**Resumen (1–3 frases):**  

| ID User Need / DI | Descripción breve | Riesgo (ID / nota) |
|-------------------|-------------------|---------------------|
| | | |

**Salidas de diseño previstas (DO-IDs):**  
**Criterio de aceptación (medible):**  
**Estrategia de pruebas (T-xxx, unidad/integración/regulatory):**  
**Design Review:** [ ] requerida  [ ] no — justificación: _______________________  
**Aprobación Product / Tech:** _____________ **Fecha:** _______

---

### Appendix B: Design Review Checklist

- [ ] **Intended use** y *scope* sin contradicción con documentos aprobados.  
- [ ] **DIs** completos, versionados, trazables a riesgo.  
- [ ] **DOs** (especificaciones, API, estructura de explicación) revisados.  
- [ ] **Entity Resolution:** criterios **Jaccard** / **Levenshtein** (u otros) y **umbral** *peer-reviewed*; *conflict* paths cubiertos.  
- [ ] **Risk Scoring:** **explicaciones accionables** coherentes; sin depender de texto generativo como única prueba.  
- [ ] **Privacidad:** PII, logs, retención evaluados.  
- [ ] **Verificación** planificada / ejecutada; **RVTM** filas afectadas listadas.  
- [ ] **Cambio** y **re-validación** (SVMP 6.5) si aplica.  
- [ ] **Acciones** con responsable y *due date*.  
**Conclusión del Design Review:** [ ] Aprobar  [ ] Aprobar con acciones  [ ] Rechazar  

**Firmas:** Arquitectura ___________ Ingeniería ___________ QA/RA ___________ Fecha ___________

---

### Appendix C: RVTM Template (link al SVMP)

**Plantilla canónica de RVTM** (columnas, ejemplo de fila y criterio de uso): ver **sección 6.2** del **Software Validation Master Plan**:

- **Enlace relativo directo:** [SVMP – §6.2 Design Outputs & Traceability Matrix](./software-validation-master-plan.md#62-design-outputs--traceability-matrix)  

*Este SOP-001 (Apéndice C) no duplica la tabla maestra: cualquier edición estructural de la RVTM se realiza en el **SVMP** o en hoja bajo su control, con versión y rastro en DHF.*

---

## Historial de versiones

| Versión | Fecha | Autor / Rol | Descripción de cambios |
|---------|--------|------------|-------------------------|
| 1.0 | 22 de abril de 2026 | Chief Product Architect & Technical Lead | Versión inicial (Draft): SOP-001 *Design and Development* alineada a ISO 13485 7.3 y QMSR; módulos core ER (Jaccard, Levenshtein, *fuzzy*, conflictos), RS (explicaciones accionables), API, gobernanza, QMS futura; SVMP + RVTM; DHF; ADR-001; `PROJECT_CONTEXT.md`. |

---

## Aprobación (DMS / documento controlado)

| Rol | Nombre / Firma | Fecha (DD-MMM-YYYY) |
|-----|----------------|---------------------|
| Autor (Chief Product Architect & Technical Lead) | _________________________ | __________________ |
| Ingeniería (Engineering Lead) | _________________________ | __________________ |
| Calidad / Regulación (QA/RA) | _________________________ | __________________ |
| Management (aceptación de implantación) | _________________________ | __________________ |

**Estado al firmar:** [ ] Aprobado — vigente  [ ] Aprobado con condiciones: ________________________________  
**Efecto:** Al aprobar, el SOP-001 sustituye a cualquier *practice* informa previa en D&D no documentada, salvo excepción firmada bajo el §12.

---

*Fin del documento SOP-001.*
