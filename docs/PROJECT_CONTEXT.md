# PROJECT_CONTEXT.md
**MAZALab – MAZA Shield**  
**Versión:** 1 de mayo de 2026 (actualizado)  
**Estado:** Preparado para migración a hilo limpio  
**Rol:** Fuente de verdad única (Single Source of Truth) para arquitectura, decisiones técnicas, lógica de negocio, gobernanza y compliance.

## 1. System Architecture

**Mother Brain Core** es el cerebro central de inteligencia de riesgo. El flujo completo es determinístico, trazable y auditado end-to-end:

\\\
Entrada (POST /assess)
    ↓
1. Entity Resolution Engine
2. Risk Scoring Engine (6 dimensiones Gaming)
3. Assessment & Enrichment Pipeline
4. Governance & Audit Layer
    ↓
MAZA Shield Dashboard
\\\

**Frontend Flow:** Botón "Run Full Demo" → llamada real a /assess → renderizado de KPI, tarjetas, Adaptive Combos, Operator Playbook y Audit Log.

## 2. Data Schema

### Entity
\\\	s
interface Entity {
  id: string;
  name: string;
  aliases?: string[];
  dob?: string;
  nationality?: string[];
  documentIds?: Array<{type: string; value: string}>;
  domainContext: "gaming" | string;
}
\\\

### RiskScore
\\\	s
interface RiskScore {
  entityId: string;
  overallScore: number;        // 0-100
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  dimensions: { PEP, Sanctions, AdverseMedia, Transactional, Behavioral, GamingSpecific };
  adaptiveCombos: AdaptiveCombo[];
  synergyBoost: number;
  explanations: Explanation[];
  confidence: number;
  correlationId: string;
}
\\\

## 3. Logic Deep Dive

**Adaptive Combos:** Reglas declarativas que detectan riesgos emergentes cuando varias dimensiones se combinan (ej: PEP + High GamingSpecific).

**Synergy Boost:** Amplificación dinámica basada en matriz de correlación (máx +15 puntos), siempre explicada.

## 4. Infrastructure & DevOps

- Persistencia: JSON append-only (default) + better-sqlite3 (opcional)
- Branching: develop, eature/, ackup/YYYY-MM-DD, conventional commits
- Herramientas: Husky, Commitlint, Vitest, standard-version

## 5. Compliance & Audit (ISO 13485 / QMSR)

Mapeo completo documentado en docs/qmsr-iso13485/. Audit trail inmutable, explicabilidad total y traceability vía correlationId.

**Próximos pasos inmediatos:**
1. Conectar botón Run Full Demo al backend real.
2. Mejorar reportes PDF board-ready.
3. Pulir dashboard UX.
4. Migración a hilo limpio.
