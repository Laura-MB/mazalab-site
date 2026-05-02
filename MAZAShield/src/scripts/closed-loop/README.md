# Closed-loop scripts — MAZALab QMSR

| Script | Uso |
|--------|-----|
| `open-pr-governance-dp-2026-gov-001.ps1` | Abrir PR *Governance* con `gh` (cuerpo: `docs/qmsr-iso13485/records/change-control/pr-body-governance-dp-2026-gov-001.md`) |
| `post-merge-governance-closure.ps1` | Tras *merge* en `main`: `MERGED_PR_URL` → sustituye `TBD_PR_URL` (RVMT, *validation* README, OQ), `__MERGE_SHA_MAIN__` en OQ, `PENDING_V11_0_OP_CLOSE` en `PROJECT_CONTEXT.md`; `npm run typecheck` + `npm test`; *commit* documentación |
| `post-merge-governance-closure.sh` | Mismo flujo (Node para token en `PROJECT_CONTEXT`) |
| *Merge* `main` (mensaje regulatorio) | [`MERGE-FEAT-GOVERNANCE-TO-MAIN.md`](../../docs/qmsr-iso13485/records/change-control/MERGE-FEAT-GOVERNANCE-TO-MAIN.md) |
| *Tag* `v1.1.0` | [`TAG-v1.1.0.md`](../../docs/qmsr-iso13485/records/change-control/TAG-v1.1.0.md) |

**Trazas:** DP-2026-GOV-001, SOP-001 §12, baseline RELEASE-2026-Q2-v1.0.
