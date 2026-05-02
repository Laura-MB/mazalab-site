# SOUP / OTS Register v1.0 – MAZALab Core Dependencies (Q2 2026)

**Documento:** `soup-register-v1.md`  
**Versión:** 1.0  
**Fecha:** 2026-05-15  
**Estado:** Draft for QA Review → **Approved with actions** (re-evaluación obligatoria por *release* con *lockfile* y CI; ver §5)  
**Referencia normativa (espíritu):** **IEC 62304** (cl. 5 *software development*, 5.3 *SOUP*, 7 *integration*), **8.1** *release*; [SVMP](../../software-validation-master-plan.md) §7.1–7.3, §9 *Deliverables*; [SOP-001](../../sop-design-and-development.md); riesgo **ISO 14971** (*spirit*); **GAMP 5** categoría 3 / 4.  
**Origen de versiones:** `package.json` + **`package-lock.json` resuelto** (a fecha de generación; **volver a leer** *lock* en cada auditoría).  
**Cruzado con:** [RVTM *light* v1.0](../rvtm/rvtm-light-v1.md) · [DP-2026-ER-BL v1.2](../design-plans/DP-2026-ER-BL.md) · [DP-2026-RS-BL v1.2](../design-plans/DP-2026-RS-BL.md) · [Gap Analysis](../../../qmsr-iso13485-gap-analysis.md#9-recomendaciones-y-plan-de-cierre-priorizado) · [validación/records](../validation/README.md) · [regla MDC](../../../.cursor/rules/qmsr-iso13485-compliance.mdc)

**Nota (similitud / *fuzzy*):** el **Jaccard** y **Levenshtein** para **Entity Resolution** están **implementados en propio** (`src/core/entity-resolution/similarity.ts`) — **no** constituyen SOUP. Solo entran aquí *dependencias* externas *npm*.

---

## 1. Purpose and Scope

| Tema | Contenido |
|------|-------------|
| **Propósito** | Inventariar el **SOUP** (Software of Unknown *Provenance* / tercero no desarrollado bajo el mismo 62304) y **OTS** (Off-The-Shelf) relevantes al **Mother Brain** con **riesgo**, **mitigación** y **trazas** a verificación, según *Gap* y [SVMP §7](../../software-validation-master-plan.md#7-specific-validation-strategy-for-core-modules). |
| **Alcance** | *Runtime* y *dependencies* de `package.json` usadas en **API** (`express`), **observabilidad** (*winston*), **configuración** (*dotenv*), **persistencia opcional** de auditoría (*better-sqlite3*), **integración** opcional (*@supabase/supabase-js*), **herramientas** de *build* / *test* (TypeScript, Vitest, Supertest, *tsx*), *chalk* / demostración. **Node.js** como plataforma. |
| **Fuera de alcance v1.0** | Todos los *transitive* *packages* (listar bajo riesgo en SBOM *future*); *firmware*; *IDE*; *LLM* externos (no hay en *dependencies* *core*). |
| **Regla de oro** | Cualquier **major** o *sub* que altere *routing*, *logging*, *persistence* o *schema* = **SOP-001** *change control* + re-verificación; ver [SVMP 6.5](../../software-validation-master-plan.md#65-change-control--re-validation). |

---

## 2. SOUP Identification Criteria (qué consideramos SOUP en MAZALab)

| Criterio | Incluido en este registro | Excluido (no entra o solo nota) |
|----------|----------------------------|----------------------------------|
| **Paquete** `npm` *direct* en *dependencies* / *devDependencies* / *optionalDependencies* con impacto en **comportamiento** *runtime*, **seguridad**, o **V&V** *release* | Sí, salvo puro *types-only* (agrupados) | *Transitives* (excepto riesgo crítico explícito en notas) |
| **Código de aplicación** (ER, RS) | No es SOUP | `similarity.ts`, *scorer*, *pipeline* |
| **Node.js *built-in*** (`node:crypto`, `node:fs`, `node:path`…) | Fila **Node.js** como *platform*; no *npm* *package* | — |
| **GAMP 5** | **Cat. 3** = producto COTS sin configurar para nuestro uso *menor*; **Cat. 4** = *configured* o *application* *stack* (Express, Winston, *sqlite* *backend*). | Cat. 5 = *bespoke* (nuestro código) |

**OTS vs SOUP (uso MAZALab):** tratamos términos de forma unificada en la **tabla §3** con columna *Purpose*; la auditoría exige trazas **IEC 62304** cl. **5.3.1–5.3.3** (documentación, riesgo, verificación) — cubierto en §4 y filas *Mitigation*.

---

## 3. SOUP / OTS Register (tabla principal)

*Versiones: **de `package-lock.json`** a menos que se indique otra nota. `express` en *lock* = **5.2.1** (aunque *package.json* pida `^5.1.0`).*

| Component Name | Version (*package-lock*) | Manufacturer / Provider | Purpose in MAZALab | GAMP 5 Category | Risk Classification (L / M / H) | Potential Hazards / Failure Modes | Risk Controls / Mitigation | Status | Evidence / Reference | Notes / Version History |
|----------------|-------------------------|------------------------|--------------------|-----------------|-----------------------------|-----------------------------------|-----------------------------|--------|---------------------|------------------------|
| **Node.js (runtime + built-ins: crypto, fs, http, path, …)** | `engines` ≥**20** (*semver* *host*) | **OpenJS** / *distro* *install* | *Runtime*; *crypto* (correlación *ids*), *fs* (audit JSON); **base** *stack* | 3 (platform) / *N/A* *GAMP* estricto | **M** | *CVE* en runtime; *deprecation*; *OpenSSL* (Node *bundle*) | *LTS* preferido; *lock* *CI* *matrix*; *npm audit* en *release*; *pin* *Docker* *base* (cuando exista) | **Accepted with controls** | *ADR-001*; CI *typecheck*+test; [RVTM DI-ER-301/RS-301](../rvtm/rvtm-light-v1.md) | No aparece *version* fija en *lock*; **registrar** `node -v` en *release* *record* |
| **TypeScript** | **5.9.3** | Microsoft (Apache-2.0) | *Compile-time*; tipos *strict* **ER/RS** | 3 (tool) | **L** (dev) / **M** (si *emit* *wrong*) | *Compiler* *bug* raro | *tsc* *noEmit* en CI; *lock* *typescript*; revisión *PR* | **Accepted** | `npm run typecheck`; [SOP-001 *DO*](../../sop-design-and-development.md) | *devDependency* |
| **tsx** | **4.21.0** | *Privado* / *esbuild* *based* | *Dev* *runner* `tsx watch`; *demo* *script* | 3 | **L** | *Behavior* *diff* *node* puro | *start:prod* usa *node* sin *tsx*; *prod* path verificado | **Accepted** | *package.json* *scripts* | *No* *prod* *server* *dependency* crítica |
| **Express** | **5.2.1** (MIT) | *Open* *Source* / *OpenJS* *influence* | **HTTP** *framework*; *routers* `assess`, `assess-risk`, *audit* | **4** (routes *configured*) | **H** (surface *attack*; *wrong* *route* path) | *CVE* *middleware*; *break* *semver*; *CORS* *misconfig* | *Unit/integr* *Supertest*; *central* *error* *handler*; *pin* *lock*; *review* *API* *changes* | **Accepted with controls** | `tests/integration/api/*.test.ts`; [SVMP §7.3 *audit*](../../software-validation-master-plan.md#73-audit-trail--compliance-metadata); *RVTM* *DI-AT-002* | **Núcleo** *API* |
| **winston** | **3.19.0** (MIT) | *Contributors* | *Structured* *logging*; *JSON* *prod*; *correlation* *id* | 4 (format *configured*) | **M** | **PII** en *logs*; *volume*; *fuga* *privacidad* | *Mínimización*; *no* *log* *body* *sens* *default*; *niveles*; *revisión* *code*; [SOP-001 *privacy*] | **Accepted with controls** | *tests* *observability*; *governance* *review*; [Gap §8](../../../qmsr-iso13485-gap-analysis.md#8-software-validación-basada-en-riesgo-auditoría-trazabilidad) *PII* | Pilar *privacidad* |
| **dotenv** | **17.4.2** (BSD-2) | *dotenv* *team* | Carga *`.env`* (dev) | 4 | **M** | *Config* *wrong*; *leak* *secrets* | *Prod*: preferir carga *nativa* (`--env-file` Node 20+); *secrets* vía *vault*; *no* *commit* `.env` | **Accepted with controls** | *ConfigService*; *PR* *checklist* | *secrets* = *ops* *risk* |
| **@supabase/supabase-js** | **2.103.3** (MIT) | *Supabase* *Inc* | *Opcional*: *risk*-*score* *audit* *remote*; *lazy* *client* | 4 (when used) | **H** (data *egress*; *key* *exposure*) | *Network* *fail*; *compliance* *cross*-*border* | *Optional*; *env* *guards*; *fallback* *in*-*memory*; *review* *PII* | **Accepted with controls** (si *enabled* en *deploy*) | `src/integrations/supabase/*`; *RVTM* *transversal* *audit* | *Disabled* = *no* *runtime* *risk*; **document* *env* *per* *release* |
| **chalk** | **5.6.2** (MIT) | *Sindre* *Sorhus* *et* *al* | *CLI* *UX*; *demo* *color*; no *en* *hot* *path* *risk* *score* | 3 | **L** | *None* *material* a *ER/RS* | *N/A* *critical* | **Accepted** | *demo*; *low* *usage* *core* | Trazabilidad *baja* *prioridad* |
| **better-sqlite3** (optional) | **12.9.0** (MIT) + *build* *script* | *Joshua* *Wise* / *WISC* | *Optional* *AuditLog* *persistence* *SQLite* *WAL* | 4 | **H** *when* *enabled* | *Native* *ABI*; *migrations*; *corrupt*; *concurrency* *misuse* | *Interface* *AuditLogPersistenceBackend*; *WAL*; *tests* *sqlite*; *opt* *in* *via* *env*; *backups* | **Accepted with controls** | [SVMP *governance*](../../software-validation-master-plan.md#2-scope); *tests* *sqlite*; *RVTM* *DI-AT-001* | *Optional*; *version* *native* *bind* |
| **vitest** | **4.1.4** (MIT) | *Vitest* *team* / *Vite* *ecosystem* | **V&V** *automated*; *ER/RS* *unit* *tests* | 3 (test *tool*) | **M** (if *flaky* *masks* *bugs*) | *False* *negative*; *version* *jump* *breaks* *expectations* | *lock*; *CI* *gate*; *regression*; [SVMP §8](../../software-validation-master-plan.md#8-testing-strategy-vitest-supertest-integration--regulatory-tests) | **Accepted with controls** | *RVTM*; `npm test` | *Pilar* *precisión* *via* *tests* |
| **@vitest/coverage-v8** + **@vitest/ui** | *4.1.4* (alineado) | *Open* *source* | *Coverage*; *UI* *local* *only* | 3 | **L** | *Misleading* *coverage* | *No* *gate* *only* *on* *%;* *review* *critical* *paths* | **Accepted** | *optional* *CI* | *devDependency* |
| **supertest** | **7.2.2** (MIT) | *ladjs* / *open* *source* | *HTTP* *integration* *tests* *API* | 3 (test) | **M** | *Mock* *differs* *from* *prod* | *Same* *app* *factory*; *Supertest* *against* *createApp* | **Accepted with controls** | [SVMP §8](../../software-validation-master-plan.md#8-testing-strategy-vitest-supertest-integration--regulatory-tests); *assess*-*risk* *tests* | *Core* *validation* *path* |
| **@types/express** / **@types/node** / **@types/supertest** / **@types/better-sqlite3** | **5.0.6** / **24.12.2** / **7.2.0** / **7.6.13** | *DefinitelyTyped* | *TypeScript* *definitions* *only* | 3 | **L** | *Type* *drift* *vs* *runtime* | *Paired* *with* *runtime* *packages*; `strict` en *tsconfig* | **Accepted** | *tsc* *noEmit* | *devOnly* |

*Dependencias *transitivas* críticas* (p. ej. *body*-*parser* bajo *express*, *semver* bajo múltiples) — **inherited risk**; mitigación: **lockfile** + *npm audit* + *Snyk* (futuro).*

---

## 4. Risk Assessment Summary

| Dimensión | Síntesis (Q2 2026) |
|-----------|--------------------|
| **Más alto riesgo operacional** | **Express** (superficie *HTTP*), **@supabase/supabase-js** (si *activo*), **better-sqlite3** (integridad *datos* *audit*). |
| **Privacidad** | **winston** + *callers* que *loggean* *payloads*; *control* = política *logs* + *code* *review* + [Gap *PII*](../../../qmsr-iso13485-gap-analysis.md#10-registro-de-riesgo-del-gap-analysis). |
| **Precisión ER (sin SOUP *similarity*)** | *No* *depende* *de* *lib* *fuzzy* *externa*; riesgo de **cambio** en *Node* *math* o *string* = **bajo**; *foco* *tests* *Vitest* en [RVTM *DI-ER-001*](../rvtm/rvtm-light-v1.md#2-traceability-matrix-tabla-principal). |
| **Explicabilidad RS** | *No* *LLM* *package*; *explicación* = código *propio*; riesgo **SOUP** = *indirect* *via* *typescript* *emit* o *data* *libs* mínimo. |
| **Modularidad** | *Interfaces* *backend* *audit*; *injection* *AssessmentService*; reduce *acoplamiento* *SOUP* *hard* *failure*. |

*Matriz 14971* *formal* = fuera de este *file*; coherente con *spirit* y [Gap *§9*](../../../qmsr-iso13485-gap-analysis.md#9-recomendaciones-y-plan-de-cierre-priorizado).*

---

## 5. Acceptance Criteria and Ongoing Monitoring (re-evaluación por *release*)

| Criterio / acción | Responsable | Frecuencia |
|-------------------|------------|------------|
| Revisar **diff** `package-lock.json` en *release* *candidate*; *major* = *change* *control* + *RVTM* *touch* *if* *risk* | Eng Lead + QA/RA | Cada *tag* o *milestone* |
| `npm audit` + acción *documentada* *CVE* (fix / *waiver* *signed*) | Eng / Sec | Cada *sprint* o *mín* *mensual* |
| *Record* *Node* *version* *exacta* en [validation](../validation/README.md) o *release* *record* (pendiente) | Eng | Cada *prod* *deploy* |
| *Re*-*run* *full* *test* *suite* + *integration* | CI | Cada *PR* a *default* *branch* |
| *Re*-*evaluar* *optional* *deps* *better*-*sqlite* y *supabase* *per* *environment* *matrix* | Ops / Eng | Cada *cambio* *infra* |
| *Próxima* *versión* *register* (v1.1): **SBOM** *CycloneDX* o *lock* *export* *adjunto* | QA/RA *roadmap* | H2 2026 |

**Criterio de aceptación v1.0 (este documento):** tabla *§3* *completa* *para* *direct* *deps*; *QA* *sign* *off* o *comment* bajo **§6**; *gaps* *transitivos* *tracked* in §3 *notes*.

---

## 6. Approval Block (CPA, Eng Lead, QA/RA)

| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|--------|
| **Chief Product Architect (CPA)** | *TBD* | | 2026-05-15 |
| **Engineering Lead** | *TBD* | | 2026-05-15 |
| **QA / Regulación (QA/RA)** | *TBD* | | 2026-05-15 |

**Estado del documento:** [x] **Draft** listo → **Approved with actions** (monitoreo §5)  [ ] Rechazado / revisión: ____________________

---

## Historial de versiones

| Versión | Fecha | Autor / Rol | Descripción |
|---------|--------|------------|-------------|
| 1.0 | 2026-05-15 | Chief Product Architect & Technical Lead | Registro *SOUP* *final* (v1.0) desde *lockfile*; GAMP/riesgo; *links* a RVTM, SVMP, SOP, *Gap*; criterio *ER* *sin* *lib* *fuzzy* *externa*. |

**Enlace a *records* *relacionados*:** [RVTM *light* v1.0](../rvtm/rvtm-light-v1.md) · [validation *index*](../validation/README.md) · [soup-register *draft* **superseded** → este archivo](../soup-register-draft.md) (*redirect*).

---

*Fin de `soup-register-v1.md`.*
