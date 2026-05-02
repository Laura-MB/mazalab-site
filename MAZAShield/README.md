# MAZALab

AI-powered Risk Intelligence platform focused on precision, privacy, and speed.

## Main objectives

- High-precision risk intelligence
- Advanced entity resolution
- Relationship analysis and threat intelligence
- Intuitive interface for analysts
- Scalability with a privacy-first approach

Gaming and regulated-venue use cases (for example Las Vegas) are a primary vertical; see `docs/PROJECT_CONTEXT.md` for product context.

## Project structure

- `demo/` — **MAZA Shield** casino risk demo; see [`demo/README.md`](demo/README.md)
- `src/api/` — Endpoints (Express + TypeScript)
- `src/core/` — Core intelligence logic
- `src/modules/` — Functional modules
- `src/services/` — External services (vectors, graphs, etc.)
- `src/types/` — Shared types
- `src/utils/` — Utilities

## Technologies

- TypeScript
- Node.js
- Express
- tsx (development)

## How to run (Node API)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Type check

```bash
npm run typecheck
```

### Build

```bash
npm run build
```

### Run compiled build

```bash
npm run start
```

### Test health endpoint

```bash
curl http://localhost:3000/health
```

## Optional: Docker (full stack)

If you use `docker-compose.yml` (for example `frontend/`, `backend/`, and Chroma), copy env and start services:

```bash
cp .env.example .env
docker compose up --build
```

Adjust ports and services to match your local layout.
