# Validation evidence index (MAZALab Mother Brain)

**Propósito:** Punto de anclaje para **OQ** / **PQ** (cuando apliquen) y enlace a artefactos de CI, *tags* y *protocolos* según [SVMP §9](../../software-validation-master-plan.md#9-deliverables--records-design-history-file--technical-file-equivalents).

| Artefacto | Ubicación / notas |
|----------|--------------------|
| **SOUP / OTS register** v1.0 (dependencias, riesgo, *lockfile*) | [`../soup-register-v1.md`](../soup-register-v1.md) — §5 monitoreo por *release*; §6 *firma* *pending* |
| **OQ *light* Q2 2026** (cualificación operacional *core* ER+RS+API) | [`oq/OQ-2026-Q2-Light.md`](oq/OQ-2026-Q2-Light.md) — §4 *checklist*; §5 *results*; §7 *approval*; §8 *evidencia* |
| RVTM *light* v1.0 (ER/RS *baseline*) | [`../rvtm/rvtm-light-v1.md`](../rvtm/rvtm-light-v1.md) |
| RVTM *light* v1.1 (*Governance* + *DI-AT* *delta*) | [`../rvtm/rvtm-light-v1.1.md`](../rvtm/rvtm-light-v1.1.md) — fila *1.1-impl*; *PR* `TBD_PR_URL` *post-merge* |
| **OQ suplemento Governance** (post-merge) | [`oq/OQ-GOV-SUP-001.md`](oq/OQ-GOV-SUP-001.md) — *AI-GOV-2*; *light* re-verification (*typecheck*, T-GOV, headers, privacy) |
| *Tests* automatizados | `tests/**`; ejecutar `npm test` (Vitest) |
| *Integration* API | `tests/integration/api/*.test.ts` |
| **OQ** *light* (primera pasada) | Cubierto por [`oq/OQ-2026-Q2-Light.md`](oq/OQ-2026-Q2-Light.md) (ejecutar/completar fechas, SHA, §5–7). *Checklist* resumida: (1) `npm run typecheck` + `npm test` *green*; (2) registrar `node -v` y *commit*; (3) *diff* *lock* vs. *release* previa; (4) cotejo §3 [SOUP](../soup-register-v1.md) si hubo *dep* *change*. |
| **Release Record** Q2 2026 (*core* v1.0) | [`../releases/RELEASE-2026-Q2-v1.0.md`](../releases/RELEASE-2026-Q2-v1.0.md) — *baseline*; §8 *approval*; completar SHA/tag §1 al *git tag* |
| *Release* *record* (plantilla genérica) | [`../releases/RELEASE-RECORD-TEMPLATE.md`](../releases/RELEASE-RECORD-TEMPLATE.md) |

**Fecha de creación del índice:** 2026-05-10 (alineado a [RVTM Light v1.0](../rvtm/rvtm-light-v1.md)). **Actualizado:** 2026-05-20 — *OQ* *light* `OQ-2026-Q2-Light.md` y plantilla *release* en `records/releases/`. **2026-05-28** — *index* RVTM v1.1. **2026-04-22** — *OQ-GOV-SUP-001* publicado; *TBD* *PR* *URL* en RVTM *1.1-impl* hasta *merge*.
