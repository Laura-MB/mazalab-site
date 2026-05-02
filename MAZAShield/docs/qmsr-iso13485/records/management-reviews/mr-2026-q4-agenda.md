# Management Review Q4 2026 – MAZALab Quality Management System (ISO 13485:2016 & QMSR)

**Documento:** mr-2026-q4-agenda.md  
**Versión:** 1.2  
**Fecha propuesta:** Miércoles 21 de octubre de 2026, 14:00 – 15:30 (90 minutos)  
**Chair:** Chief Product Architect & Technical Lead  
**Quorum requerido:** Management + CPA + QA/RA + Engineering Lead

### 1. Objetivo de la Reunión
Revisar el estado y efectividad del QMS durante el segundo semestre de 2026, validar el cierre del ciclo Q2 2026 (incluyendo Governance Layer v1.1.0), evaluar riesgos residuales, definir objetivos claros para Q1 2027 y asegurar el cumplimiento continuo con ISO 13485 y QMSR.

### 2. Prelectura Obligatoria (enviar mínimo 5 días antes)
- MR Q2 2026 v1.0
- Governance Layer v1.1.0 Package (DP-2026-GOV-001, DR, RVTM v1.1, OQ-GOV-SUP-001)
- Management Sign-off Q2 2026
- PROJECT_CONTEXT.md (sección QMS Status)
- Esta agenda + tabla de riesgos residuales

### 3. Agenda Detallada (90 minutos)

| Tiempo       | Tema                                              | Responsable          | Duración |
|--------------|---------------------------------------------------|----------------------|----------|
| 14:00-14:05  | Bienvenida y quorum                               | Chair                | 5 min   |
| 14:05-14:20  | Cierre Q2 2026 + Governance Layer v1.1.0         | CPA                  | 15 min  |
| 14:20-14:45  | Revisión de entradas 5.6.2 y KPIs Q3             | Todo el equipo       | 25 min  |
| 14:45-15:00  | Riesgos residuales y oportunidades               | CPA + QA/RA          | 15 min  |
| 15:00-15:20  | Objetivos Q4 2026 – Q1 2027                      | Eng Lead + CPA       | 20 min  |
| 15:20-15:30  | Action items, decisiones y cierre                 | Chair + Todo         | 10 min  |

### 4. Riesgos Residuales Aceptados

| ID     | Riesgo                                      | Nivel | Mitigación actual                     | Dueño     | Estado      |
|--------|---------------------------------------------|-------|---------------------------------------|-----------|-------------|
| RR-01  | Cambios inesperados en librerías SOUP       | Medio | SOUP Register v1.0 + version pinning  | Eng Lead  | Aceptado    |
| RR-02  | Cobertura RVTM parcial                      | Medio | Plan de ampliación Q4 2026            | CPA       | Monitoreo   |
| RR-03  | Exposición de PII en metadata               | Medio | PII patterns + tests automáticos      | QA/RA     | Aceptado    |
| RR-04  | Complejidad de documentación QMS            | Bajo  | Plantillas + scripts                  | CPA       | En progreso |
| RR-05  | Dependencia de herramientas externas        | Alto  | Migración progresiva                  | CPA       | En progreso |

### 5. Objetivos Propuestos Q4 2026 – Q1 2027
- RVTM coverage ≥ 85%
- 100% de nuevas features bajo full Design Controls (SOP-001)
- Completar OQ/PQ de todos los módulos críticos
- Realizar la primera auditoría interna formal del QMS
- Reducir en un 20% el tiempo promedio de Entity Resolution
- Definir roadmap hacia posible certificación ISO 13485 en 2027

### 6. Approval

- **Chief Product Architect & Technical Lead:** ________________ Date: ________  
- **Management:** ________________ Date: ________  

**Historial de versiones**  
- v1.2 – 28/05/2026 – Versión final para aprobación interna