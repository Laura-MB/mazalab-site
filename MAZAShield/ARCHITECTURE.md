# MAZALab MVP Architecture

## Visión General
MAZALab es una plataforma SaaS de **Risk Intelligence con IA agentic** diseñada para competir con **Babel Street** (agentic risk intelligence, identity resolution, supply chain risk, multilingual OSINT) y complementar **QCI** en Las Vegas (QCI AGI Platform enfocada en operaciones internas de casinos: player development, marketing, slots y real-time analytics para +300 resorts y $42B+ en gaming revenue).

Nuestro diferenciador: 
- Más accesible y barato
- Mejor UX e explicabilidad ("por qué este riesgo")
- Fuerte soporte multilingual (español/Latam)
- Enfoque en OSINT externo + screening de riesgos para compliance, due diligence y vendor risk en gaming/fintech

## Stack Técnico (2026 - optimizado para velocidad MVP)
- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI (Python) + LangGraph (para agentes IA estructurados)
- **Vector DB**: Chroma (embedded y local - gratis y rápido para MVP)
- **Grafo simple**: NetworkX (para visualización básica de conexiones)
- **IA Agentic**: Groq (Llama 3.1 70B o similar - rápido y barato) + Claude como fallback
- **Despliegue local**: Docker Compose
- **Reportes**: HTML → PDF

## Flujo Principal del MVP
1. Usuario ingresa nombre / empresa / username en el dashboard
2. Frontend llama a Backend (/search)
3. Agent IA razona paso a paso: busca aliases → OSINT → cruza datos → detecta riesgos (sanciones, adverse media, conexiones)
4. Resultados se guardan en Chroma + grafo
5. Genera reporte automático con explicaciones y fuentes

## Roadmap Semanal (Semanas 1-4)
- Semana 1: Setup + dashboard básico + búsqueda simple
- Semana 2: Identity resolution + primer agente IA
- Semana 3: Reportes PDF + explicabilidad
- Semana 4: Testing + preparación para validación local en Las Vegas

## Próximos pasos
- Integrar fuentes OSINT éticas (news APIs, username lookup, etc.)
- Validar con contactos de compliance en casinos de Las Vegas (donde QCI es fuerte en datos internos pero débil en inteligencia externa de riesgo)

Fecha: Abril 2026