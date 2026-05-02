# Quality Policy – MAZALab Quality Management System (ISO 13485:2016 Cláusula 5.3 & QMSR)

**Documento:** `quality-policy.md`  
**Versión:** 1.0  
**Fecha:** 22 de abril de 2026  
**Autor:** Chief Product Architect & Technical Lead  
**Estado:** Draft para aprobación por Management  
**Referencia:** [Gap Analysis](../qmsr-iso13485-gap-analysis.md) (`docs/qmsr-iso13485-gap-analysis.md`), [SVMP](./software-validation-master-plan.md) (`docs/qmsr-iso13485/software-validation-master-plan.md`), [SOP-001](./sop-design-and-development.md) (Design and Development, `docs/qmsr-iso13485/sop-design-and-development.md`), [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md), [ADR-001 / Architecture baseline](../DECISIONS.md) (`docs/DECISIONS.md`)

---

## 1. Purpose

Esta **Quality Policy** establece el compromiso de liderazgo (ISO 13485:2016 **5.3**) con respecto a la calidad, el cumplimiento y la mejora continua del **Sistema de Gestión de la Calidad (SMQ)** de MAZALab, y apoya el encuadre con **QMSR (21 CFR Part 820)** cuando el producto o el intended use apliquen. Es la declaración pública, revisada por la dirección, que orienta objetivos, procesos, diseño y despliegue descritos en `docs/PROJECT_CONTEXT.md`, [SOP-001](./sop-design-and-development.md) y el [SVMP](./software-validation-master-plan.md). La regla de proyecto `/.cursor/rules/qmsr-iso13485-compliance.mdc` vincula el trabajo de ingeniería a esta misma línea.

---

## 2. Scope

Aplica a todas las actividades, roles y entregables del QMS de MAZALab en el ecosistema **Risk Intelligence** del repositorio Mother Brain, incluidos diseño, desarrollo, prueba, *release*, gobernanza, auditoría, documentación e integración con terceros en la medida en que impacten requisitos de producto, seguridad, privacidad o trazabilidad. Los **módulos core** (Entity Resolution avanzada, Risk Scoring multi-dimensión, API de evaluación, capa de gobernanza y *audit trail*, y evolución futura de la capa QMS) se mantienen explícitamente bajo *design controls* (ISO 13485 7.3) y el [SOP-001](./sop-design-and-development.md).

---

## 3. Quality Policy Statement (declaración clara, concisa y memorable – 1 párrafo principal)

MAZALab se compromete a entregar **inteligencia de riesgo de clase mundial**—con **Entity Resolution** avanzada (emparejamiento robusto, similitud, detección de conflictos) y **Risk Scoring** transparente, **explicable** y trazable—cumpliendo de forma proactiva los requisitos del **QMSR**, **ISO 13485:2016** y la normativa aplicable, gestionando el **riesgo** en todo el ciclo de vida, protegiendo la **privacidad** de los titulares de datos, y gobernando el software con un SMQ en el que la **mejora continua**, la **auditabilidad** y la **satisfacción** de nuestros clientes y analistas (incluidos entornos regulados) constituyen criterio de éxito no negociable.

---

## 4. Commitments

1. **Cumplimiento con QMSR, ISO 13485:2016 y requisitos regulatorios aplicables** — Mantener y evolucionar el SMQ; demostrar conformidad con evidencia *retirable* (documentación, pruebas, *audit trail*), según se extiendan el *intended use* y las jurisdicciones.  
2. **Enfoque *risk-based* en todo el ciclo de vida del producto y procesos del QMS** — Priorizar análisis, V&V y documentación según severidad y probabilidad (ISO 14971, [SVMP](./software-validation-master-plan.md), GAMP 5 en la práctica de *computerized system*).  
3. **Precisión, explicabilidad, privacidad y velocidad como pilares de nuestra Risk Intelligence** — Las salidas de riesgo deben ser **correctas bajo criterio documentado**; la **explicación** (desglose, factores, límites) no es un adorno, sino salida de diseño; la **velocidad** nunca a expensas de trazas de cumplimiento o mínimización de datos.  
4. **Mejora continua y efectividad del QMS** — Revisar objetivos, NC/CAPA, datos de producto (cuando apliquen) y *feedback*; cerrar *gaps* identificados en el [Gap Analysis](../qmsr-iso13485-gap-analysis.md).  
5. **Satisfacción de clientes y usuarios (analistas en entornos regulados)** — Producto útil, trazable y defendible; formación, claridad de limitaciones, y vías de *feedback* a procesos.  
6. **Desarrollo y mantenimiento de módulos core (Entity Resolution y Risk Scoring) bajo *design controls* (Cláusula 7.3)** — Aplicar [SOP-001](./sop-design-and-development.md) a cambios con impacto en lógica de resolución, puntuación, explicación, API, auditoría.  
7. **Cultura de calidad, trazabilidad y auditabilidad** — Todos los colaboradores son responsables de la calidad; los registros son **atribuibles, legibles, contemporáneos, originales y exactos (ALCOA+)** en la medida requerida por el diseño; la trazabilidad requisito–código–prueba se mantiene vía RVTM ([SVMP §6.2](./software-validation-master-plan.md#62-design-outputs--traceability-matrix)).

---

## 5. Quality Objectives (framework para establecer objetivos medibles – ejemplos iniciales vinculados a precisión, explicabilidad y compliance)

| Dominio | Objetivo (plantilla) | Indicador sugerido (KPI) | Frecuencia de revisión |
|--------|----------------------|--------------------------|------------------------|
| **SMQ y cumplimiento** | Reducir *gaps* críticos del [Gap Analysis](../qmsr-iso13485-gap-analysis.md) en **módulos y evidencia** | % cierres planificados completados; hallazgos de auditoría interna (cuando exista) | Anual o trimestral |
| **Diseño y trazabilidad (7.3)** | Mantener y extender RVTM para **DIs/DOs** de ER y RS | % requisitos críticos con traza cerrada; PRs con nota de impacto 13485/QMSR | Por *release* mayor |
| **Precisión (Entity Resolution / Risk Scoring)** | Casos de prueba y regresión para **falsos positivos/negativos** acotados | Tasa de fallo en suites dedicadas; escapatorias en *staging* | Continuo (CI) + revisión *release* |
| **Explicabilidad** | Toda variación de score material tiene **explicación estructurada** (no solo texto generativo) | *Checklist* SOP-001; ausencia de regresión en *builders* | *Design review* o *release* |
| **Privacidad y datos** | PII mínima en *logs* y *audit*; retención acordada | No conformidades; revisiones de *logs*; incidentes (si aplica) | Semestral o tras cambio de uso |
| **Efectividad del QMS (5.1/8.1)** | Objetivos medibles, responsables, plazos | Cumplimiento de hitos; CAPA a tiempo (cuando se formalicen) | Anual (Management) |

*Los valores numéricos concretos y los *owners* se fijan en el primer ciclo de planificación aprobada por Management; esta tabla es el **marco** v1.0.*

---

## 6. Communication and Understanding (cómo se comunicará y revisará esta política)

- **Publicación** — `docs/qmsr-iso13485/quality-policy.md` bajo control de documentos; enlace desde [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md) (sección *Regulatory compliance*).  
- **Onboarding** — Lectura de esta política y de [SOP-001](./sop-design-and-development.md) para ingeniería y *product*; *QA/Reg* define profundidad según rol.  
- **Comunicación interna** — *All-hands* o canal interno al aprobar o revisar; resumen de un párrafo en repositorio *README* o *wiki* (opcional) sin sustituir el documento de fuente.  
- **Revisión de comprensión** — Checklist o confirmación de lectura (herramienta interna) para nuevas incorporaciones a módulos core.

---

## 7. Review and Maintenance (frecuencia de revisión por Management)

- **Frecuencia mínima:** anual, o **antes** si cambia *intended use*, mercado dispositivo/SaMD, o política de datos.  
- **Revisores:** *Management* (o CEO-equivalente) con aporte de *Chief Product Architect* y *QA/Reg*.  
- **Resultado:** Aprobación de nueva **versión** (historial) o *minor* sin cambio de *statement*; cualquier reformulación de la *Quality Policy Statement* requiere **nueva aprobación de Management** y se comunica al equipo.

---

## 8. Approval

Al firmar, Management manifiesta que la política es **apropiada** al contexto y propósito de la organización (5.3), y que se proveen recursos y responsabilidad para su cumplimiento.

| Rol | Nombre / Firma | Fecha (DD-MMM-YYYY) |
|-----|----------------|---------------------|
| **Management (CEO-equivalente o designado)** | _________________________ | __________________ |
| **Chief Product Architect & Technical Lead** (preparación del documento) | _________________________ | 22-Apr-2026 |
| **QA / Regulación (revisión, si asignada)** | _________________________ | __________________ |

**Efecto:** al aprobar, la versión 1.0 de esta política **sustituye** cualquier enunciado informal previo de “política de calidad” en MAZALab para el alcance de este repositorio y se usa como *input* a revisiones de dirección (5.1) y a objetivos de calidad (5.1 / 5.2). **Estado al firmar por Management (CEO o equivalente):** [ ] Aprobado — entra en vigor  [ ] Aprobado con comentario: ________________.

---

## Historial de versiones

| Versión | Fecha | Autor / Rol | Descripción de cambios |
|---------|--------|------------|-------------------------|
| 1.0 | 22 de abril de 2026 | Chief Product Architect & Technical Lead | Versión inicial (Draft): Quality Policy; ISO 13485 5.3; QMSR; *commitments*; objetivos; enlaces a Gap, SVMP, SOP-001, PROJECT_CONTEXT, ADR-001. |

---

*Fin del documento.*
