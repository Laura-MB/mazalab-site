# Design Plan Baseline – Risk Scoring Module (DP-2026-RS-BL)

**ID del plan:** DP-2026-RS-BL  
**Título:** Design Plan Baseline (as-built) — Risk Scoring  
**Versión:** 1.3  
**Fecha:** 2026-04-22 (actualizado 2026-05-28)  
**Estado:** **Approved with actions** (ver [DR-2026-RS-BL-001](../design-reviews/DR-2026-RS-BL-001.md))  
**Owner:** Chief Product Architect & Technical Lead  

**Referencias cruzadas:**  
[SOP-001](../../sop-design-and-development.md) · [SVMP](../../software-validation-master-plan.md) · [Gap Analysis](../../../qmsr-iso13485-gap-analysis.md) · [RVTM Light v1.1](../rvtm/rvtm-light-v1.1.md) · [MR Q2 2026](../management-reviews/mr-2026-q2.md) · [Management Sign-off Q2 2026](../management-signoff-q2-2026.md) · [PROJECT_CONTEXT.md](../../../PROJECT_CONTEXT.md)

**Resumen:**  
Este documento establece el **baseline as-built** del módulo **Risk Scoring** (scoring multi-dimensión, breakdown transparente y explicaciones accionables). Cierra la retroactividad de SOP-001 para este módulo y sirve como punto de referencia para futuros cambios bajo control regulatorio.

---

### 1. Project / Module Identification
- **Módulo:** `src/core/risk-scoring/`
- **Propósito:** Calcular riesgo de forma multi-dimensión, reproducible y con explicaciones accionables para analistas en entornos regulados.
- **Consumidores principales:** Assessment pipeline, API `/assess-risk`, Governance Layer.
- **Alcance de este DP:** Solo Risk Scoring (baseline). Integración con Entity Resolution y Governance se cubre en planes hermanos.

### 2. Design Inputs (DIs)

| ID         | Tipo / Fuente          | Descripción breve                                      | Riesgo |
|------------|------------------------|--------------------------------------------------------|--------|
| DI-RS-001  | User need              | Scoring multi-dimensión con breakdown transparente     | Alto   |
| DI-RS-002  | User need              | Explicaciones accionables y estructuradas             | Alto   |
| DI-RS-003  | User need              | Reproducibilidad y auditabilidad del score            | Alto   |
| DI-RS-101  | ISO 13485 / QMSR       | Design controls y trazabilidad                         | Alto   |
| DI-RS-201  | Risk (ISO 14971)       | Scoring incorrecto → decisión errónea                  | Alto   |

### 3. Design Outputs (DOs)

| ID         | Descripción                                      | Archivo principal |
|------------|--------------------------------------------------|-------------------|
| DO-RS-01   | Servicio principal de scoring                    | service.ts |
| DO-RS-02   | Motor multi-dimensión                            | scorer.ts |
| DO-RS-03   | Constructor de explicaciones accionables         | explanation-builder.ts |
| DO-RS-04   | Configuración de dominios y umbrales             | config/domain-config.ts |
| DO-RS-05   | Utilidades y combos de scoring                   | combos.ts, utils.ts |

### 4. Design Review
- Acta: [DR-2026-RS-BL-001](../design-reviews/DR-2026-RS-BL-001.md)
- Estado: **Approved with actions** (2026-05-05)

### 5. Verification & Validation
- Verificación: Tests unitarios completos (Vitest) incluyendo casos de gaming
- Validación: Referencia a [SVMP](../../software-validation-master-plan.md) y OQ light
- Re-validación: Cualquier cambio en algoritmo de scoring = nuevo review

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

**Acción siguiente:**

Reemplaza el contenido de `DP-2026-RS-BL.md` con esta versión y dime cuando esté listo.

¿Quieres que haga lo mismo con **DP-2026-GOV-001.md** ahora?

O dime si quieres ajustes en esta versión antes de continuar.  

Estoy listo para seguir revisando el PR #14.
