# MAZALab Mother Brain v0.1 — Gaming Demo

**Risk Intelligence for the Regulated Casino Operator**

---

## Executive summary

Casino operators are overwhelmed by fragmented risk signals — chargebacks, KYC gaps, responsible-gaming flags, bonus-abuse patterns, and third-party vendor incidents — each arriving through a different channel, in a different format, on a different clock.

**MAZALab Mother Brain** is an AI-assisted Risk Intelligence platform that unifies those signals into a single, explainable decision surface. Every score is:

- **Traceable** — tied to an immutable audit entry via `correlationId`.
- **Explainable** — every dimension ships with a human-readable narrative, top drivers, and prioritized operator actions.
- **Gaming-native** — dimensions, weights, and recommended actions are tuned for G2E workflows (fraud, bonus abuse, player behavior, AML/KYC, responsible gaming, vendor risk).

This demo showcases the **v0.1 baseline engine** running the full end-to-end pipeline on six representative casino scenarios — including multi-entity batches for bonus-abuse rings and VIP syndicates sharing payment rails.

> **MVP v0.1 baseline — production version in progress.**
> Scores, drivers, and recommended actions are produced by the baseline pipeline for demonstration purposes; the production-grade scoring, resolution, and governance stack is under active development.

---

## What is Mother Brain?

Mother Brain is the orchestration core of the MAZALab platform. It turns raw entity signals into an auditable risk verdict through three composable stages:

1. **Entity Resolution** — canonicalize identities across brands, aliases, devices, and payment rails; detect conflicts; emit an explainable match score.
2. **Risk Scoring** — evaluate each resolved entity across domain-aware dimensions (`gaming` or `general`) with deterministic, transparent weights.
3. **Assessment** — roll up per-entity scores into a batch verdict with a short executive label, UI-ready color token, and prioritized operator actions.

Every stage writes to an append-only **audit log** keyed by `correlationId`, so any decision can be reconstructed weeks later from a single identifier — and aggregated across an entire portfolio in real time via `GET /audit-log/stats`.

---

## Technical flow

```mermaid
flowchart LR
  A[Raw Entities] --> B[Entity Resolution]
  B -->|canonical + matchScore + conflicts| C[Risk Scoring]
  C -->|per-dimension drivers + biasFlag| D[Assessment]
  D -->|batch verdict + color + actions| E[API / Dashboard]
  B -. correlationId .-> F[(Audit Log)]
  C -. correlationId .-> F
  D -. correlationId .-> F
  F -->|filters / stats| G[/audit-log endpoints]
```

### Key properties of the v0.1 pipeline

| Property | Implementation |
|----------|----------------|
| Deterministic scoring | Transparent weights per domain; no hidden priors. |
| Explainability | Per-dimension `explanationTemplate` + `drivers[]` + `biasFlag`. |
| Gaming specificity | Six native dimensions, tuned weights, operator-ready action templates. |
| Traceability | Explicit `correlationId` parameter threaded through all stages. |
| Multi-entity batches | Linked accounts, syndicates, rings scored as a cohesive batch. |
| Governance outputs | Human-readable `riskLevelLabel` and `domainName` on every audit entry. |
| Singleton audit log | Shared process-wide instance guarantees no torn snapshots under concurrent load. |
| Aggregated observability | On-demand stats (`total`, `avgRiskScore`, `countByLevel`, `countByDomain`, earliest/latest). |

### API surface (MVP v0.1)

```
GET  /health                                  → liveness probe
POST /resolve                                 → entity resolution only
POST /assess                                  → full pipeline (resolve → score → assess)
POST /assess-risk                             → scoring-only (compat with legacy flows)
GET  /audit-log                               → filtered, paginated audit trail
     ?limit=&offset=&domain=&minRiskLevel=&from=&to=
GET  /audit-log/stats                         → aggregate summary (real-time)
GET  /audit-log/:correlationId                → every entry for a correlation id
GET  /demo/gaming-dashboard.html              → stakeholder dashboard (same-origin)
```

---

## Gaming dimensions (domain = `gaming`)

The v0.1 engine balances six casino-native dimensions. Weights reflect operator impact and regulatory exposure — bonus abuse, player behavior, and responsible gaming carry the heaviest relative impact.

| Dimension | Weight | Focus | Example recommended action |
|-----------|-------:|-------|----------------------------|
| Bonus abuse & promotional | **0.22** | Rollover arbitrage, linked accounts, gnoming, chip-dumping | `[Bonus] Review bonus rollover and linked-account chains, gnoming proxies, and chip-dump risk before releasing sticky funds.` |
| Player behavior & velocity | **0.20** | Session clustering, stake velocity, loss-chasing | `[Velocity] Enable 72h enhanced monitoring; cap bet velocity and deposit pace.` |
| Responsible gaming | **0.17** | Limit breaches, self-exclusion status, cooling-off | `[RG] Sync CRM limits, cooling-off windows, and self-exclusion status before outbound promos, limit increases, or high-value payouts.` |
| Payments & account integrity | **0.16** | Chargebacks, account takeover, stolen instruments | `[Fraud] Pull chargeback history and check linked accounts before releasing funds.` |
| AML / KYC | **0.15** | Identity strength, PEP/sanctions, source of funds | `[AML/KYC] Verify identity strength, PEP/sanctions alignment, and source-of-funds plausibility; escalate to EDD.` |
| Vendor & integration risk | **0.10** | PSP certification, incident history, rail exposure | `[Vendor] Validate PSP/aggregator certification and recent incident history before routing high-value rails.` |

Every dimension emits an **analyst-facing explanation** and feeds a **priority-tagged action list** — e.g. `[Gaming-P1]`, `[Bonus]`, `[AML/KYC]`, `[RG]`, `[Fraud]`, `[Velocity]`, `[Vendor]` — so the output is immediately routable to the right queue with an SLA.

---

## The six gaming scenarios

| # | Case | Entities | Primary vector | Expected tier |
|---|------|:--------:|----------------|----------------|
| 1 | VIP with repeated chargebacks & disputes | 1 | Payments & account integrity | **High** |
| 2 | RG breach — self-exclusion bypass intent | 1 | Responsible gaming | **High** |
| 3 | AML/KYC — PEP match + high-risk jurisdiction | 1 | AML / KYC | **High** |
| 4 | **Multi-entity** — bonus-abuse ring (2 linked) | **2** | Bonus abuse | **High** |
| 5 | **Multi-entity** — VIP syndicate, shared rails (3) | **3** | Payments + player behavior | **High** |
| 6 | Vendor / PSP compliance incident | 1 | Vendor & integration risk | **High** |

### Case 1 — VIP with repeated chargebacks & disputes

A VIP-platinum player with `disputed_deposits_90d = 4`, elevated velocity, and a flagged fraud pattern. Mother Brain produces a **high** tier verdict with `payments & account integrity` and `bonus abuse` as the dominant drivers. Recommended actions include `[Gaming-P2] Enable 72h enhanced monitoring`, `[Fraud] Pull chargeback history and check linked accounts`.

### Case 2 — RG breach, self-exclusion bypass intent

A player with an active self-exclusion on a sibling brand attempts to play on this one. Signals: `loss_chasing_flag = true`, `session_length = excessive`. The engine escalates **Responsible gaming** as the top dimension and recommends the RG sync + cooling-off action above.

### Case 3 — AML/KYC with PEP and jurisdiction risk

A high-deposit player ($185 k over 90 days) with a likely PEP match, partial KYC, and residency in a high-risk jurisdiction. The engine surfaces the AML/KYC verification-and-EDD-escalation action.

### Case 4 — Multi-entity bonus-abuse ring (2 linked accounts)

Two accounts under the same `displayName`, sharing a `device_fingerprint`, IP cluster, and e-wallet. One shows `bonus_abuse = rollover_arbitrage`, the other `chip_dump_pattern`. The batch is scored as a coherent unit; actions surface the bonus rollover + linked-account review action.

### Case 5 — Multi-entity VIP syndicate (3 accounts)

Three high-roller accounts with different identities but a shared PSP rail, distinct device fingerprints but heavy 7-day session overlap. This is the textbook "rail syndicate" pattern. Mother Brain escalates `player_behavior` and `payments` jointly and recommends step-up KYC and enhanced monitoring on the shared rail.

### Case 6 — Vendor / PSP compliance incident

A payment-gateway partner with expired PCI-DSS certification and a 12-month incident history including a chargeback spike and a data event. The engine triggers the vendor certification + incident-history validation action.

---

## Casino-specific benefits

### 1. Explainability on demand

Every composite score ships with:

- A **short executive label** (`High — expedite`, `Critical — escalate`) for triage queues.
- A **top-drivers list** sorted by contribution, so analysts see *why* before *what*.
- A **narrative** ready to paste into a case-management tool.

### 2. Traceability by design

`correlationId` is a **structural parameter**, not a log string. One call to `GET /audit-log/<id>` returns every entry (resolution + scoring + assessment) produced for that case. Regulators, internal audit, and post-incident reviews are served by the same primitive.

New in v0.1: rich filtering and real-time aggregate stats so observability is first-class, not an afterthought.

```
# filtered slices
GET /audit-log?domain=gaming&minRiskLevel=high
GET /audit-log?from=2026-04-16T00:00:00Z&to=2026-04-17T23:59:59Z

# aggregate stats (same payload the dashboard widget consumes)
GET /audit-log/stats
  → { total, avgRiskScore, countByLevel, countByDomain, earliestTimestamp, latestTimestamp }
```

### 3. Prioritized, gaming-native actions

Actions carry explicit priority tags (`[Gaming-P1]` → immediate escalation, `[Gaming-P4]` → routine) and dimension tags (`[Bonus]`, `[RG]`, `[AML/KYC]`, `[Fraud]`, `[Velocity]`, `[Vendor]`). Downstream sorting keeps SLA adherence coherent across narrative and batch outputs.

### 4. Multi-entity batches as first-class citizens

Bonus-abuse rings, collusive clusters, and VIP syndicates are not a nuisance — they are the shape of real casino risk. Mother Brain scores them as one batch, preserves per-entity detail, and rolls them up to a single verdict.

### 5. Privacy-first posture

Signals stay inside the operator's perimeter. No external calls are made for scoring in the v0.1 pipeline. Audit logs are local append-only files by default, swappable for Supabase or the operator's warehouse.

### 6. Speed & ergonomics

A full six-case batch completes well under a second on a developer laptop. The dashboard updates KPIs, the risk-distribution chart, and the Audit Log Overview widget **live** on each run — no page refresh, no external chart library.

### 7. Shareable by design

Every run is one click away from a **reviewer-grade Markdown report**. The artefact is structured the way an analyst would hand-assemble it — executive summary, detected combos, artefact checklist, per-scenario drivers and actions — and fits into any casino workflow tool that accepts Markdown.

---

## Demo report export

The Gaming Dashboard ships a gold-outlined **Export Report** button adjacent to **Run Full Demo**. The instant a run completes, the button enables and exposes two options:

- **Copy Markdown** — for pasting into Notion, Confluence, Slack, Jira, PR descriptions, or email bodies.
- **Download .md** — for case files, regulator bundles, leave-behind folders, or post-mortem drives. Filenames are stamped `mazalab-gaming-demo-report-YYYYMMDD-HHMMSS.md`.

The report is built entirely client-side from the last in-memory run — no server round-trip, no external service — and contains:

1. Header with UTC + local timestamp, scenario count, entity count, model version.
2. Correlation ID table (one row per scenario).
3. Executive summary (critical / high counts, average composite, combo count, peak synergy boost, lead combo, full tier distribution).
4. Adaptive combos table (dimensions, peak synergy, occurrences, scenarios) + analyst notes.
5. Key artefact checklist grouped by dimension.
6. Per-scenario detail (attribute table, headline, key drivers table, combos triggered, recommended actions).
7. Raw JSON appendix per scenario (collapsed `<details>` block, renders out-of-the-way in GitHub / GitLab / VSCode preview / Notion).

### Sample output (abridged)

> The following is a faithful, trimmed rendering of an actual export. The header, summary, adaptive-combo table, artefact groups, and a single scenario detail are shown; the other five scenarios and their raw-JSON appendices follow the same shape in the full artefact.

````markdown
# MAZALab Mother Brain — Gaming Demo Report

> Auto-generated from the Gaming Dashboard (`demo/gaming-dashboard.html`) against `POST /assess`.

| Field | Value |
|-------|-------|
| Generated (UTC) | `2026-04-17T14:02:11.482Z` |
| Generated (local) | Apr 17, 2026, 10:02:11 AM |
| Scenarios | **6** |
| Entities scored | 9 |
| Model version | `gaming-v0.1` |

### Correlation IDs

| Scenario | Correlation ID |
|----------|----------------|
| Chargebacks | `g2e-html-chargebacks-001` |
| RG breach | `g2e-html-rg-breach-002` |
| AML / PEP | `g2e-html-aml-pep-003` |
| Bonus-abuse ring | `g2e-html-bonus-ring-004` |
| VIP syndicate | `g2e-html-vip-syndicate-005` |
| Vendor incident | `g2e-html-vendor-006` |

## Executive Summary

- **Worst-tier scenarios:** 6 of 6 (critical 2 · high 4)
- **Average worst composite / batch:** `0.7812`
- **Adaptive combos detected:** 3 distinct combos across 4/6 scenarios
- **Peak synergy boost:** `+0.1200` (bounded ≤ 0.12)
- **Lead combo:** Apex critical (peak synergy `+0.1200`)

### Risk tier distribution

| Tier | Count | Share |
|------|-------|-------|
| Critical | 2 | 33.3% |
| High | 4 | 66.7% |
| Medium | 0 | 0.0% |
| Low | 0 | 0.0% |

## Adaptive Combos Detected

| # | Combo | Dimensions | Peak synergy | Occurrences | Scenarios |
|---|-------|------------|-------------:|------------:|----------:|
| 1 | **Apex critical** (`apex_critical`) | Bonus abuse + Player behavior + Payments | `+0.1200` | 2 | 1 |
| 2 | **VIP syndicate** (`syndicate`) | Player behavior + Payments | `+0.0900` | 3 | 1 |
| 3 | **Vulnerable AML** (`vulnerable_aml`) | AML/KYC + Responsible gaming | `+0.0700` | 2 | 2 |

**Analyst notes**

- **Apex critical:** Multi-vector convergence — freeze withdrawals, escalate to fraud + AML, open case with full linked-account chain.
- **VIP syndicate:** Shared payment rails with distinct device fingerprints — step-up KYC and monitor rail for coordinated high-value activity.
- **Vulnerable AML:** AML/KYC deficiency compounded by RG exposure — pause promos, trigger EDD, sync self-exclusion flags.

## Key Artefact Checklist

### Bonus abuse & promotional
`rollover_progress` · `linked_account_ids` · `promo_redemptions_30d` · `stake_vs_cohort_zscore`

### Player behavior & velocity
`session_length` · `bet_velocity_7d` · `loss_chasing_flag`

### Payments & account integrity
`chargeback_history_90d` · `device_fingerprint` · `disputed_deposits_90d`

### Responsible gaming
`self_exclusion_flag` · `cooling_off_active` · `limit_breaches_30d`

## Scenario Detail

### 4. 💸 Multi-entity — bonus abuse ring (2 linked)

| Attribute | Value |
|-----------|-------|
| Subject | Alexei Volkov _(+1 more)_ |
| Domain | `gaming` |
| Risk tier | **critical** (red) |
| Worst composite | `0.8421` |
| Identity match (avg) | `0.94` |
| Engine confidence (avg) | `0.91` |
| Correlation ID | `g2e-html-bonus-ring-004` |

> Critical — escalate. Coordinated bonus-abuse ring across linked accounts with shared device fingerprint and e-wallet.

#### Key risk drivers

| Rank | Dimension | Score | Weight | Contribution |
|-----:|-----------|------:|-------:|-------------:|
| 1 | Bonus abuse & promotional | `0.920` | `0.220` | `0.2024` |
| 2 | Player behavior & velocity | `0.810` | `0.200` | `0.1620` |
| 3 | Payments & account integrity | `0.770` | `0.160` | `0.1232` |

#### Combos triggered

- **Apex critical** (`apex_critical`) — dimensions: Bonus abuse + Player behavior + Payments · peak synergy `+0.1200` · occurrences: 2

_Total scenario synergy boost:_ `+0.1200`.

#### Recommended actions

- [Combo/apex_critical] Freeze pending withdrawals; open multi-dimension case with full linked-account chain and shared-device audit.
- [Gaming-P1] [Bonus] Review bonus rollover and linked-account chains, gnoming proxies, and chip-dump risk before releasing sticky funds.
- [Gaming-P1] [Fraud] Pull chargeback history and check linked accounts before releasing funds.
- [Gaming-P2] [Velocity] Enable 72h enhanced monitoring; cap bet velocity and deposit pace.
- [Gaming-P3] [AML/KYC] Verify source-of-funds plausibility and escalate to EDD.

<details>
<summary>Raw JSON response</summary>

```json
{ "domain": "gaming", "summary": { … }, "keyRiskDrivers": [ … ],
  "gamingInsights": { "detectedCombos": [ … ], "totalSynergyBoost": 0.12 },
  "recommendedActions": [ … ], "resolvedEntities": [ … ], "assessments": [ … ] }
```

</details>

---

*MAZALab · Mother Brain MVP v0.1 · Risk Intelligence with Explainable AI.*
````

Every section above is derived directly from the same `/assess` response the dashboard already renders — so the exported report is structurally identical to what the stakeholder just saw on screen.

---

## Current status

### Shipped in v0.1 baseline engine

- **Entity resolution** — deterministic + probabilistic + hybrid, explainable narratives, conflict detection.
- **Risk scoring** — `general` and `gaming` domains, per-dimension drivers, bias flagging, analyst-facing justifications.
- **Adaptive multi-signal combos** — `syndicate`, `chip_dump`, `vulnerable_aml`, `apex_critical` casino patterns detected across converging gaming dimensions, with bounded synergy boost (≤ 0.12) and combo-tagged top drivers.
- **Assessment pipeline** — shortened executive labels, top-level `riskLevelColor`, priority-tagged recommended actions.
- **Gaming-native action templates** — 7 dimension tags (`[Fraud]` / `[Bonus]` / `[Velocity]` / `[AML/KYC]` / `[RG]` / `[Vendor]` / `[Gaming-Identity]`) + 4 priority tiers (`[Gaming-P1]` … `[Gaming-P4]`) + 4 combo tags (`[Combo/…]`), every line references concrete casino artefacts (`rollover_progress`, `session_length`, `bet_velocity_7d`, `device_fingerprint`, `chargeback_history_90d`, `linked_account_ids`, `self_exclusion_flag`, …) so analysts pivot straight to the right ops panel.
- **Structured gaming narrative** — every gaming assessment ships a seven-section ladder: Executive Headline → Summary → Key Drivers → Adaptive Combos → Dimension Breakdown → Operator Recommendations → Artifact Checklist.
- **Audit log (schema v4)** — append-only, correlation-id index, human-readable `levelLabel` / `domainName`, filtering by `domain` / `minRiskLevel` / date range, aggregate `/stats` endpoint.
- **REST API** — `/health`, `/resolve`, `/assess`, `/assess-risk`, `/audit-log` (filtered + paginated), `/audit-log/stats`, `/audit-log/:correlationId`.
- **G2E dashboard** — executive KPI strip, CSS-only risk-distribution chart, Audit Log Overview widget (live stats + loading state), comparative table with sticky `Subject` column, expandable case details, fully responsive (mobile → iPad portrait → iPad landscape → desktop).
- **Export Report (dashboard)** — gold-outlined button beside **Run Full Demo** that turns the live run into a reviewer-grade Markdown document: executive summary, adaptive combos, key artefact checklist, per-scenario drivers and actions, and a raw-JSON appendix per scenario (collapsed `<details>`). Two outputs — **Copy Markdown** (clipboard) and **Download .md** (timestamped file) — both generated client-side in under 200 ms, with a keyboard-accessible popover, disabled state until the first run, and a silent `<textarea>` fallback for non-secure contexts.
- **CLI demo script** — six realistic scenarios including two multi-entity batches.
- **75 unit tests** across 8 files covering scoring, resolution, assessment, governance, singleton audit behavior, filter/stats correctness, gaming-specific actionability, Week-2 adaptive multi-signal combos (`syndicate`, `chip_dump`, `vulnerable_aml`, `apex_critical`), and structured gaming-narrative section assertions.
- **One-click launcher** — idempotent PowerShell script with health-check polling, dated leave-behind snapshot generation, and zero `ExecutionPolicy` friction.

### Roadmap — next milestones

1. **Production scoring stack** — move from baseline formulas to a hybrid ensemble (rules + calibrated ML + graph signals) with the same explainability contract.
2. **Multilingual OSINT ingestion** — harvest, normalize, and score signals from multilingual news, social, sanctions, and adverse-media feeds.
3. **Graph & relational analytics** — first-class cluster/ring detection (shared devices, rails, IPs, KYC docs) with cycle and centrality metrics.
4. **Real-time stream scoring** — sub-200 ms decisions on high-velocity events (wallet funding, withdrawal, bonus redemption).
5. **Governance console** — model cards, reason-code explorer, bias monitoring dashboard, and one-click regulator-export bundles.
6. **Operator integrations** — native connectors for CRM, PAM, PSP hubs, sanction/PEP providers, KYC vendors, and the main casino management systems.
7. **Autonomous investigation copilots** — narrative assembly, evidence bundling, and case drafting for analyst workflows.

---

## How to run the demo

**Dashboard (recommended for executive briefings):**

```powershell
.\demo\start-demo.ps1
```

**Dashboard + timestamped leave-behind:**

```powershell
.\demo\start-demo.ps1 -WithPresentation
```

**CLI transcript (recommended for logs and CI):**

```powershell
# terminal A
npm run dev

# terminal B
npx tsx tests/manual/gaming-demo-final.ts
```

All three produce the **same six scenarios** against the same API. See `README-DEMO.md` for the full operating runbook (5–7 minute presenter script with beat-level timings).

---

## Mission

MAZALab is building the most **intelligent, fastest, most private, and most accessible** Risk Intelligence, Threat Intelligence, Identity Resolution, and OSINT platform in the market.

Accuracy and precision first. Privacy-first, responsible AI by default. Built for regulated operators, law enforcement, governments, and defense — and for casino floors where every second and every decision carries regulatory weight.

**mazalab.com**

---

*Document prepared as a leave-behind for the Mother Brain v0.1 gaming demo. Regenerated snapshots are produced by `.\demo\start-demo.ps1 -WithPresentation` as `demo-presentation-YYYYMMDD-HHMMSS.md` alongside this file.*
