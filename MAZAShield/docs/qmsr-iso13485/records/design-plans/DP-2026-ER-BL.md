# Design Plan Baseline – Entity Resolution Module (DP-2026-ER-BL)

**ID del plan:** DP-2026-ER-BL  
**Título:** Design Plan Baseline (as-built) — Entity Resolution  
**Versión:** 1.3  
**Fecha:** 2026-04-22 (actualizado 2026-05-28)  
**Estado:** **Approved with actions** (ver [DR-2026-ER-BL-001](../design-reviews/DR-2026-ER-BL-001.md))  
**Owner:** Chief Product Architect & Technical Lead  

**Referencias cruzadas:**  
[SOP-001](../../sop-design-and-development.md) · [SVMP](../../software-validation-master-plan.md) · [Gap Analysis](../../../qmsr-iso13485-gap-analysis.md) · [RVTM Light v1.1](../rvtm/rvtm-light-v1.1.md) · [MR Q2 2026](../management-reviews/mr-2026-q2.md) · [Management Sign-off Q2 2026](../management-signoff-q2-2026.md) · [PROJECT_CONTEXT.md](../../../PROJECT_CONTEXT.md)

**Resumen:**  
Este documento establece el **baseline as-built** del módulo **Entity Resolution** (normalización, similitud Jaccard + Levenshtein, detección de conflictos y explicación estructurada). Cierra la retroactividad de SOP-001 para este módulo y sirve como punto de referencia para futuros cambios bajo control regulatorio.

---

### 1. Project / Module Identification
- **Módulo:** `src/core/entity-resolution/`
- **Propósito:** Unificar entidades a partir de texto con tolerancia a variaciones, generando explicaciones accionables y detección de conflictos.
- **Consumidores principales:** Assessment pipeline, API `/assess-risk`, Risk Scoring.
- **Alcance de este DP:** Solo Entity Resolution (baseline). Orquestación end-to-end se cubre en planes hermanos.

### 2. Design Inputs (DIs)

| ID         | Tipo / Fuente          | Descripción breve                                      | Riesgo |
|------------|------------------------|--------------------------------------------------------|--------|
| DI-ER-001  | User need              | Emparejamiento con tolerancia a variaciones ortográficas | Alto   |
| DI-ER-002  | User need              | Explicación estructurada del match/no-match            | Medio  |
| DI-ER-003  | User need              | Detección y señalización de conflictos                 | Alto   |
| DI-ER-101  | ISO 13485 / QMSR       | Design controls y trazabilidad                         | Alto   |
| DI-ER-201  | Risk (ISO 14971)       | Falso positivo/negativo en matching                    | Alto   |

### 3. Design Outputs (DOs)

| ID         | Descripción                                      | Archivo principal |
|------------|--------------------------------------------------|-------------------|
| DO-ER-01   | Normalizador de texto                            | normalizer.ts |
| DO-ER-02   | Motor de similitud (Jaccard + Levenshtein)       | similarity.ts |
| DO-ER-03   | Servicio principal de resolución                 | service.ts |
| DO-ER-04   | Detección de conflictos                          | conflict-detector.ts |
| DO-ER-05   | Constructor de explicaciones estructuradas       | explanation-builder.ts |

### 4. Design Review
- Acta: [DR-2026-ER-BL-001](../design-reviews/DR-2026-ER-BL-001.md)
- Estado: **Approved with actions** (2026-05-05)

### 5. Verification & Validation
- Verificación: Tests unitarios completos (Vitest)
- Validación: Referencia a [SVMP](../../software-validation-master-plan.md) y OQ light
- Re-validación: Cualquier cambio en algoritmos de similitud = nuevo review

### 6. Traceability
Ver [RVTM Light v1.1](../rvtm/rvtm-light-v1.1.md)

### 7. Change Control
Cualquier modificación futura a este módulo debe seguir **SOP-001 §12** y actualizar este DP o crear un addendum.

### 8. Approval

- **Chief Product Architect:** ________________ Date: ________  
- **QA/RA:** ________________ Date: ________  
- **Management (riesgos residuales):** ________________ Date: ________  

**Estado final:** Approved with actions – Baseline congelado para futuros cambios controlados.

**Historial**
- v1.3 – 28/05/2026 – Versión pulida post-revisión PR #14
- v1.2 – 2026-05-10 – RVTM integrado
- v1.0 – 2026-04-22 – Creación baseline

---

**¿Quieres que genere ahora las versiones corregidas de los otros DPs (Risk Scoring y Governance) con el mismo nivel de calidad?**

O dime qué archivo del PR quieres que revise y ajuste a continuación.

Estoy listo para continuar la revisión del PR #14 de forma ordenada.  

**¿Qué sigue?**
