# Verification Plan – MAZA Shield v1.0
**Product:** MAZA Shield – Casino Risk Intelligence Platform  
**Version:** 1.0  
**Date:** April 28, 2026  
**Prepared by:** Laura (MAZALab)

## 1. Purpose

This Verification Plan (VP) defines **how MAZALab demonstrates that MAZA Shield v1.0 design outputs satisfy documented design inputs** (ISO 13485–aligned design verification discipline). Verification answers: **“Did we build the product correctly?”** against requirements stated in **DID-MAZA-Shield-v1.0** and realized per **DOS-MAZA-Shield-v1.0**.

Objectives:

- Establish **repeatable methods**, **acceptance criteria**, and **evidence retention** for each verification activity.
- Preserve **traceability** from requirements (**SR-xxx**, **UN-xxx**) through outputs (**DO-xxx**) to verification records.
- Align critical checks with **RMF-MAZA-Shield-v1.0** residual-risk and control narratives where hazard reduction depends on software behavior.
- Operate within the lifecycle framing of **DP-MAZA-Shield-v1.0** (design controls, configuration management, release gates).

**Validation** (intended-use fitness—“right product”) is addressed under companion protocols and demonstration rehearsal records referenced herein but not duplicated as formal VP scope except where explicitly noted.

## 2. Scope

**In scope:**

| Category | Boundaries |
|----------|------------|
| Software verification | Node.js / TypeScript service: Express application, core modules (`entity-resolution`, `risk-scoring`, `assessment`, `gaming`, `governance`, `config`, `observability`), API routers, static demo delivery |
| Interfaces | REST endpoints listed in DID §4.1; correlation-id middleware; audit retrieval contracts |
| Non-functional checks | Performance envelope pertinent to **SR-P-001** (demonstration profile); bounded audit queries (**SR-S-003**) |
| Evidence artifacts | Test logs, scripted API transcripts, benchmark captures, dashboard demo run exports archived under Quality-controlled storage |

**Out of scope:**

- Independent third-party penetration testing (unless separately commissioned and recorded).
- Clinical or jurisdictional regulatory submissions outside MAZALab’s documented software posture.
- Verification of operator-run infrastructure (TLS termination, network zoning)—documented as deployment prerequisites only.

Changes to scope require revision of this VP under change control and reconciliation with **DP** / **DID**.

## 3. Traceability Reference

Verification ties **inputs → outputs → evidence**:

| Controlled artifact | Role |
|---------------------|------|
| **DID-MAZA-Shield-v1.0** | Source of **UN-xxx** and **SR-xxx** acceptance obligations |
| **DOS-MAZA-Shield-v1.0** | Declares **DO-xxx** design outputs (modules, APIs, assets) subject to verification |
| **DP-MAZA-Shield-v1.0** | Master schedule; §7 Verification & Validation Plan informs activity sequencing |
| **RMF-MAZA-Shield-v1.0** | Informs risk-focused verification emphasis (e.g., RM-008, RM-010, RM-012, RM-014–RM-019) |
| **DR-MAZA-001** | Design Input Review acceptance; prerequisite for executing this VP against frozen DID baseline |

Requirement-to-output mapping remains authoritative in the **Requirements Traceability Matrix** (RTM) maintained per Quality procedure; this VP references **SR** bands without replacing atomic RTM rows.

## 4. Verification Strategy

Verification employs a **layered strategy**:

| Layer | Intent |
|-------|--------|
| **L1 – Automated** | Fast feedback on regressions: unit and integration tests targeting algorithms (entity resolution, scoring, combo bounds), audit append semantics, middleware behavior |
| **L2 – Scripted API** | Repeatable black-box checks against running service: HTTP contracts, status codes, pagination caps, correlation-id propagation |
| **L3 – Performance & resilience** | Benchmark round-trip latency vs **SR-P-001** under documented hardware baseline; audit throughput smoke under concurrent rehearsal load |
| **L4 – Demonstration transcript** | Frozen demo scenario execution with Markdown export capture for SR-F-010 / SR-U-003 linkage |

Failures at any layer block release candidate promotion until disposition (fix, waiver with documented rationale, or CAPA).

## 5. Verification Activities & Methods

### 5.1 Summary matrix

| Activity ID | Title | Method | Primary SR coverage | Primary DO coverage | Risk emphasis (RMF) |
|-------------|-------|--------|----------------------|----------------------|---------------------|
| **VA-01** | Automated test suite execution | `npm test` (or CI equivalent); coverage thresholds per Quality policy | SR-F-002–SR-F-006, SR-D-001 | DO-CORE-01–04, DO-GOV-01 | RM-007–RM-019 (logic correctness) |
| **VA-02** | API contract verification | Scripted requests (`curl`/HTTP client) to `/health`, `/resolve`, `/assess`, `/assess-risk`, `/audit-log*` | SR-F-001–SR-F-008 | DO-API-01–05 | RM-015 (timely retrieval pathway) |
| **VA-03** | Correlation-ID middleware | Negative & positive header injection; inspect response `x-correlation-id` | SR-F-007 | DO-API-07 | RM-014 traceability |
| **VA-04** | Audit integrity probes | Verify append-only semantics; correlation lookup O(k); corruption recovery drill on test fixture | SR-D-002, SR-D-003 | DO-GOV-01–03, DO-GOV-05 | RM-014, RM-015 |
| **VA-05** | Query bound enforcement | Request `/audit-log` with excessive `limit`; expect clamp / error per implementation | SR-F-008, SR-S-003 | DO-API-05 | RM-014 |
| **VA-06** | Performance benchmark | Measure p95 assessment round-trip vs **SR-P-001** (800 ms demo profile) | SR-P-001 | Pipeline + API stack | RM-012 |
| **VA-07** | Dashboard demo run | Execute “Run Full Demo”; capture KPI refresh + export Markdown artifact | SR-F-010, SR-U-003 | DO-UI-01 | RM-013 (human review narrative in materials) |

### 5.2 Execution prerequisites

| Prerequisite | Verification |
|--------------|--------------|
| Controlled software baseline | Git tag / merge commit referenced on VP execution record |
| Environment | `.env` and optional `config/*.json` documented; `NODE_ENV` stated |
| Service health | **VA-02** blocked until `GET /health` returns success |

### 5.3 Responsibility

| Role | Responsibility |
|------|----------------|
| Engineering | Execute VA-01–VA-06; archive logs |
| Quality | Witness sampling for VA-02 / VA-07; custody of evidence index |
| Risk liaison | Confirm risk-themed checks (VA-04 / VA-06) sampled before major baseline promotions |

## 6. Acceptance Criteria

Each activity **passes** only if **all** applicable rows succeed:

| Activity ID | Acceptance criteria |
|-------------|----------------------|
| **VA-01** | Zero failing tests; exit code 0; coverage meets internal Quality threshold where enforced |
| **VA-02** | All endpoints return documented HTTP semantics; JSON payloads validate against agreed schemas (spot-check fields per DOS) |
| **VA-03** | Invalid correlation IDs rejected or replaced per DID; valid IDs echoed intact |
| **VA-04** | No silent mutation of historical audit rows post-append; lookup returns full chain for injected correlation |
| **VA-05** | Server rejects or clamps out-of-range pagination consistent with SR-S-003 |
| **VA-06** | p95 round-trip ≤ **800 ms** under documented baseline hardware and payload profile; record ambient CPU/RAM notes |
| **VA-07** | Dashboard completes demo without console-blocking errors; Markdown export non-empty and references correlation-aware content |

**Conditional acceptance:** Permitted only with documented deviation approval referencing risk rationale and CAPA ID.

## 7. Records & Reporting

| Record | Content | Retention |
|--------|---------|-----------|
| **Verification Execution Record (VER)** | Per-release bundle: activity IDs, timestamps, commit SHA, environment fingerprint, pass/fail, linked logs | Minimum retention per MAZALab records policy |
| **Evidence attachments** | Test stdout, HTTP transcripts (redacted if PII risk), benchmark CSV/JSON, exported Markdown | Same |
| **Summary report** | Roll-up table SR ↔ VA ↔ result; outstanding defects | Submitted to Quality before DP §10 release gate |

Nonconformances escalate per **CAPA** procedure; VP execution may be **paused** until disposition.

## 8. Approval

This Verification Plan is approved for execution against MAZA Shield v1.0 baselines referenced in **DOS** and governed by **DP** / **DID** / **RMF**.

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Prepared by | Laura | | April 28, 2026 |
| Engineering lead | | | |
| Quality assurance | | | |
