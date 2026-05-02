# MAZALab

Risk Intelligence platform foundation implemented with Node.js, TypeScript, and Express.

## Source of truth

- `docs/PROJECT_CONTEXT.md` is the canonical project context and governance source.
- `docs/DECISIONS.md` records architecture decisions.

## Implemented scope

- Express bootstrap API service
- JSON body parsing middleware
- 404 and centralized 500 JSON handlers
- Endpoints: `GET /` and `GET /health`
- Shared type contracts in `src/types/index.ts`
- Runtime scripts in `package.json`: `dev`, `build`, `start`, `typecheck`

## Run locally

```bash
npm install
npm run dev
```

## Validate

```bash
npm run typecheck
```

## Health check

Use the runtime port shown at startup (`MAZALab Core API running on port <PORT>`).

```bash
curl http://localhost:<PORT>/health
```
