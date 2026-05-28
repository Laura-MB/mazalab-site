# ADR-001 — Coupled Hawkes Process Modeling for 38ms Timing-Channel Detection

**Status:** Accepted  
**Date:** 2026-05-13  
**Author:** Laura Maza — Lead Architect, MAZALab  
**Ref:** IP Ledger 07-May-2026 · Mother Brain v1.0  

---

## Context

In a regulated blackjack environment, the observable event stream produces
timestamped actions: DEAL_START, HOLE_CARD_PEEK, BET_PLACEMENT, CARD_REQUEST,
and OUTCOME_SETTLEMENT. Under normal gameplay, the DEAL_START to HOLE_CARD_PEEK
interval follows a distribution shaped by dealer motor patterns and table load.

The threat model: a colluding dealer modulates this interval by introducing a
deliberate timing offset at a quantum of Q = 38ms — calibrated to the human
just-noticeable difference (JND) threshold for temporal perception (30-50ms).
At 38ms the signal is sub-perceptual to human observers and video surveillance,
but statistically detectable in the event stream with the correct model.

Heuristic anomaly detection fails here. Threshold-based systems produce
catastrophic false positive rates because normal dealer variance overlaps
extensively with the signal range. What is required is a model that captures
the self-exciting, causally structured nature of intentional collusion.

---

## Decision

Adopt **Coupled Hawkes Processes** as the primary generative model for the
DEAL_START to HOLE_CARD_PEEK timing channel.

### Formal Definition

A Hawkes process is a self-exciting point process where the conditional
intensity function lambda(t) depends on event history:

  lambda(t) = mu + SUM phi(t - t_i) for all t_i < t

where mu is the baseline intensity and phi is the excitation kernel:

  phi(t) = alpha * exp(-beta * t)

MAZA Shield implements a **coupled bivariate Hawkes process** over two streams:
- D(t): dealer event stream (DEAL_START to HOLE_CARD_PEEK intervals)
- P(t): player event stream (BET_PLACEMENT events)

The coupling is represented by a 2x2 excitation matrix:

  Lambda = [[alpha_DD, alpha_DP],
            [alpha_PD, alpha_PP]]

Under genuine collusion, alpha_DP is statistically elevated — a dealer-side
timing event causally increases the probability of a player-side bet modification
within a lag window consistent with Q=38ms and human reaction time.
Under independent play, alpha_DP converges to zero.

### Inference

Detection reduces to estimating alpha_DP via maximum likelihood estimation
of the Hawkes log-likelihood, then testing whether alpha_DP is statistically
distinguishable from zero (p < 0.05).

The 38ms quantum Q constrains the excitation kernel support to integer
multiples of Q, reflecting the quantized encoding protocol structure.

Adversarial probabilistic modeling (multi-agent generative simulation) produces
synthetic null-hypothesis event streams against which a log-likelihood ratio
test is computed. The detection decision is the LLR score against a threshold
calibrated to the target false positive rate (<5%).

---

## Consequences

- Detection operates on causal stream structure, not individual event values —
  robust against adaptive adversaries who vary timing within the quantum.
- alpha_DP provides a continuous risk score enabling cross-session evidence
  accumulation — critical when collusion is sparse and distributed.
- Every detection is a function of auditable parameters, directly supporting
  the SHA-256 Immutable Audit Log (IAL) for NGCB regulatory review.
- Computational cost: MLE requires iterative optimization. Architecture
  pre-computes baseline parameters and updates alpha_DP incrementally
  to achieve sub-200ms end-to-end inference latency.

---

## Alternatives Rejected

| Alternative | Reason Rejected |
|---|---|
| Threshold-based heuristics | Catastrophic FPR due to variance overlap with signal range |
| Univariate anomaly detection | Cannot model cross-stream causal coupling (dealer to player) |
| Rule-based alerting | Stateless; cannot accumulate evidence across sessions |
| ML classification (supervised) | Requires labeled collusion data unavailable in regulated environments |
