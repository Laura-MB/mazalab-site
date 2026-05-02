# PROJECT_CONTEXT.md
**Versión 1.7 – 15 de abril de 2026**  
**Fuente de verdad oficial de MAZALab**

## Misión
Crear la plataforma de Risk Intelligence superior en precisión, explicabilidad, privacidad y velocidad, centrada en Entity Resolution avanzada y Risk Scoring transparente para entornos regulados. Calidad premium obligatoria en código, tests, docs y UX.

## Estructura de productos
- **Mother Brain (Core Central – foco actual)**: El cerebro compartido.  
  - Entity Resolution modular (fuzzy matching + normalización + Jaccard + Levenshtein + resolución de conflictos y explicaciones).  
  - Risk Scoring multi-dimensión configurable (breakdown transparente, explicaciones accionables, confidence scores, bias flags, audit trail completo).  
  - Capa fuerte de Gobernanza ética (disclaimers automáticos, logs inmutables).  
  - API limpia (endpoint `/assess-risk` ya funcional).  
  - Estado técnico: ~30 % completado con arquitectura TypeScript + Node.js + Express + ESM, tests premium y gobernanza sólida.

- **Producto Gaming / Casinos (prioridad revenue + G2E 2026)**: Aplicación vertical de la Mother Brain para casinos (detección de fraude, KYC/AML, responsible gaming, player risk scoring, entity resolution de identidades cross-platform, vendor risk). Esta es la que se llevará a G2E como demo.

- **Producto OSINT / Risk Intelligence general**: Competidor ágil y ético de Babel Street (se construye después sobre el mismo core).

## Principio rector
Calidad premium primero. Terminamos la Mother Brain con foco en el dominio Gaming/Casinos para tener una demo sólida y demostrable en 4-6 semanas. Todo reutilizable. No scope creep.

## Riesgo crítico reconocido
El ecosistema de casinos en Las Vegas es pequeño y exigente. Una demo inmadura puede dañar credibilidad de forma permanente. Por eso exigimos rigor absoluto en calidad, explicabilidad y gobernanza antes de mostrar nada públicamente.

## Nota estratégica (15-abr-2026)
Las presiones regulatorias en el uso de IA en gaming crecen significativamente. Existe un gap claro de gobernanza (solo 1 de cada 5 compañías tiene equipo dedicado a AI governance, score promedio 30/100 según el informe UNLV “State of AI in Gaming 2026”). Esto refuerza nuestra oportunidad: entregar Risk Intelligence con transparencia y auditabilidad nativa.

## AI Development Policy (vigente desde 15-abr-2026)
- **Cursor** → herramienta principal (IDE + Agent Mode).  
- **Grok 4 (SuperGrok)** → modelo principal para desarrollo diario y orquestación en el producto.  
- **Claude (Opus/Sonnet)** → deep thinking layer secundario (usar desde Semana 2 para arquitectura crítica, refactoring pesado y tests complejos).  
- Mantener un solo flujo principal para evitar tool hopping.

## Próxima milestone
MVP v0.1: Mother Brain pulida + demostrable en dominio Casinos (G2E-ready).  
Sprint actual: 5 semanas (inicio 15-abr-2026).

## Referencias
- PRD MVP v0.1
