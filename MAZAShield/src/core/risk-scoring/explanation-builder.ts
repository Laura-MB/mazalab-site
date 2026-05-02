import type {
  DomainScoreBreakdown,
  ExplanationParts,
  GamingCombo,
  LevelDecision
} from "./types.js";
import type { ResolvedEntity } from "../../types/index.js";
import {
  GAMING_ARTIFACT_CATALOG,
  GAMING_SYNERGY_GLOBAL_CAP,
  GAMING_V02_ADVANCED_PATTERN_ARTEFACTS,
  type GamingArtifactGroup
} from "./combos.js";

/**
 * Builds a human-readable and auditable explanation of risk scoring.
 *
 * The output is a structured, analyst-facing narrative organised in numbered
 * sections (Summary, Key Drivers, Adaptive Combos, Dimension Breakdown,
 * Operator Recommendations, Artifact Checklist). The structure is identical
 * across tiers so reviewers, regulators, and QA can read every assessment
 * the same way — regardless of domain or severity.
 */
export class RiskScoreExplanationBuilder {
  private static readonly SECTION_RULE = "─────────────────────────────────────────────────────";

  /**
   * Builds domain-aware, analyst-facing explanation text for risk decisions.
   */
  build(parts: ExplanationParts): string {
    if (parts.domain === "gaming") {
      return this.buildGamingExplanation(parts);
    }
    return this.buildGeneralExplanation(parts);
  }

  // ===========================================================================
  // General domain narrative
  // ===========================================================================

  private buildGeneralExplanation(parts: ExplanationParts): string {
    const { resolvedEntity, modelVersion, breakdown, levelDecision } = parts;
    const topComponents = [...breakdown.components]
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 4);

    const lines: string[] = [];
    lines.push("=== Risk Assessment · general domain ===", "", this.buildHeadline(resolvedEntity, breakdown, levelDecision), "");

    lines.push(...this.summarySection(resolvedEntity, modelVersion, breakdown, levelDecision));

    lines.push(this.sectionHeader("Key Drivers (weighted contribution)"));
    for (let i = 0; i < topComponents.length; i++) {
      const c = topComponents[i]!;
      const n = String(i + 1).padStart(2, "0");
      lines.push(
        `${n}. ${c.dimension} — score ${c.score.toFixed(4)}, weight ${c.weight.toFixed(4)}, contribution ${c.contribution.toFixed(4)}`
      );
    }
    lines.push("");

    lines.push(this.sectionHeader("Dimension Narratives"));
    for (const c of topComponents) {
      lines.push(`• ${c.dimension}`, `  ${c.justification.replace(/\n/g, "\n  ")}`);
    }
    lines.push("");

    lines.push(this.sectionHeader("Operator Recommendations"));
    for (const a of this.recommendedActions(levelDecision.level)) {
      lines.push(`• ${a}`);
    }

    return lines.join("\n");
  }

  // ===========================================================================
  // Gaming domain narrative
  // ===========================================================================

  /**
   * Builds a structured, operator-ready explanation for gaming domain
   * assessments. The narrative is organised so a casino risk analyst can
   * scan top-down and get: executive headline → tier rationale →
   * who-to-escalate (Key Drivers) → why (Adaptive Combos + Dimension
   * Breakdown) → what-to-do (Operator Recommendations) → what-to-open
   * (Artifact Checklist).
   */
  private buildGamingExplanation(parts: ExplanationParts): string {
    const { resolvedEntity, modelVersion, breakdown, levelDecision } = parts;
    const topComponents = [...breakdown.components]
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 6);
    const topDimensionIds = topComponents.map((c) => c.dimension);
    const combos = breakdown.detectedCombos ?? [];

    const lines: string[] = [];
    lines.push(
      "=== Risk Assessment · gaming domain ===",
      "",
      this.buildHeadline(resolvedEntity, breakdown, levelDecision),
      ""
    );

    // Section 1 — Summary
    lines.push(...this.summarySection(resolvedEntity, modelVersion, breakdown, levelDecision));

    // Section 2 — Key Drivers (always labelled with the canonical string that
    // downstream tools and tests key off: "Casino / G2E analyst focus").
    if (breakdown.keyRiskDrivers && breakdown.keyRiskDrivers.length > 0) {
      lines.push(this.sectionHeader("Key Drivers (Casino / G2E analyst focus)"));
      for (let i = 0; i < breakdown.keyRiskDrivers.length; i++) {
        const d = breakdown.keyRiskDrivers[i]!;
        const n = String(i + 1).padStart(2, "0");
        const combo = d.comboTag ? ` [combo: ${d.comboTag}]` : "";
        lines.push(
          `${n}. ${d.label} (${d.dimension}) — score ${d.score.toFixed(4)}, contribution ${d.contribution.toFixed(4)}${combo}`,
          `    → ${d.analystNote}`
        );
      }
      lines.push("");
    }

    // Section 3 — Adaptive Combos (only when ≥1 multi-signal pattern fires).
    if (combos.length > 0) {
      lines.push(this.sectionHeader("Adaptive combos detected (multi-signal casino patterns)"));
      lines.push(
        "Synergy uplifts stack only up to the global cap below — tiering still uses the full composite (weighted dimensions + capped synergy), then calibration in thresholds.",
        "Patterns here are **core-engine** adaptive combos. Advanced gaming shapes (`promo_rail_stack`, `aml_sleeper_lift`) are emitted by the gaming enrichment layer on top of this score — same assessment, additional operator templates.",
        ""
      );
      for (let i = 0; i < combos.length; i++) {
        const c = combos[i]!;
        const n = String(i + 1).padStart(2, "0");
        lines.push(
          `${n}. [${c.id}] ${c.label} (+${c.synergy.toFixed(2)} synergy) — dimensions: ${c.dimensions.join(", ")}`,
          `    → ${c.analystNote}`
        );
      }
      if (typeof breakdown.synergyBoost === "number" && breakdown.synergyBoost > 0) {
        const v02Promo = GAMING_V02_ADVANCED_PATTERN_ARTEFACTS.promo_rail_stack.join(", ");
        const v02Aml = GAMING_V02_ADVANCED_PATTERN_ARTEFACTS.aml_sleeper_lift.join(", ");
        lines.push(
          `Total synergy boost applied to composite: +${breakdown.synergyBoost.toFixed(4)} (global cap ${GAMING_SYNERGY_GLOBAL_CAP.toFixed(2)} on stacked per-combo uplift).`,
          `Artefact keys in this report use snake_case and line up with checklist exports (e.g. rollover_progress, chargeback_history_90d, stake_vs_cohort_zscore).`,
          `When gaming enrichment flags promo_rail_stack / aml_sleeper_lift, analysts also open: [${v02Promo}] · [${v02Aml}].`
        );
      }
      lines.push("");
    }

    // Section 4 — Dimension Breakdown (transparent weighted table).
    lines.push(this.sectionHeader("Dimension Breakdown (by weighted contribution)"));
    for (let i = 0; i < topComponents.length; i++) {
      const c = topComponents[i]!;
      const n = String(i + 1).padStart(2, "0");
      lines.push(
        `${n}. ${c.dimension} — score ${c.score.toFixed(4)}, weight ${c.weight.toFixed(4)}, contribution ${c.contribution.toFixed(4)}`
      );
    }
    lines.push("");

    // Section 5 — Dimension Narratives (top 4 for readability).
    lines.push(this.sectionHeader("Dimension Narratives (top 4)"));
    for (const c of topComponents.slice(0, 4)) {
      lines.push(`• ${c.dimension}`, `  ${c.justification.replace(/\n/g, "\n  ")}`);
    }
    lines.push("");

    // Section 6 — Operator Recommendations (casino playbook, artefact-rich).
    lines.push(this.sectionHeader("Operator Recommendations (Gaming playbook)"));
    for (const a of this.recommendedActionsGaming(levelDecision.level, topDimensionIds, combos)) {
      lines.push(`• ${a}`);
    }
    lines.push("");

    // Section 7 — Artifact Checklist (copy-ready list for the ops console).
    const checklist = this.buildArtifactChecklist(topDimensionIds);
    if (checklist.length > 0) {
      lines.push(this.sectionHeader("Artifact Checklist (open in ops console)"));
      for (const entry of checklist) {
        lines.push(`• ${entry.label}: ${entry.artifacts.join(" · ")}`);
      }
    }

    return lines.join("\n");
  }

  // ===========================================================================
  // Shared helpers (section scaffolding)
  // ===========================================================================

  private buildHeadline(
    resolvedEntity: ResolvedEntity,
    breakdown: DomainScoreBreakdown,
    levelDecision: LevelDecision
  ): string {
    const tier = `[${levelDecision.level.toUpperCase()}]`;
    return `${tier} ${resolvedEntity.canonicalEntity.displayName} · composite ${breakdown.overall.toFixed(
      4
    )} · engine confidence ${breakdown.confidence.toFixed(4)}`;
  }

  private summarySection(
    resolvedEntity: ResolvedEntity,
    modelVersion: string,
    breakdown: DomainScoreBreakdown,
    levelDecision: LevelDecision
  ): string[] {
    return [
      this.sectionHeader("Summary"),
      `• Subject: ${resolvedEntity.canonicalEntity.displayName} (${resolvedEntity.canonicalEntity.id})`,
      `• Tier: ${levelDecision.level.toUpperCase()} (after calibration; adjusted ${levelDecision.adjustedOverall.toFixed(4)})`,
      `• Composite: ${breakdown.overall.toFixed(4)}  ·  Confidence: ${breakdown.confidence.toFixed(4)}  ·  Evidence strength: ${breakdown.evidenceStrength.toFixed(4)}`,
      `• Why this tier: ${levelDecision.rationale}`,
      `• Model: ${modelVersion}`,
      ""
    ];
  }

  private sectionHeader(title: string): string {
    return `${RiskScoreExplanationBuilder.SECTION_RULE}\n${title}\n${RiskScoreExplanationBuilder.SECTION_RULE}`;
  }

  // ===========================================================================
  // General domain — suggested next steps
  // ===========================================================================

  private recommendedActions(level: "low" | "medium" | "high" | "critical"): string[] {
    if (level === "critical") {
      return [
        "[P1] Escalate immediately to senior analyst and compliance leadership; freeze downstream automation until review closes.",
        "[P1] Initiate enhanced due diligence with at least two corroborating sources and record the evidence chain in the case file."
      ];
    }
    if (level === "high") {
      return [
        "[P2] Complete an expedited analyst review within your SLA; attach correlation_id to the case.",
        "[P2] Gather additional intelligence on the top contributing dimensions and request missing identity or relationship attributes."
      ];
    }
    if (level === "medium") {
      return [
        "[P3] Queue standard validation against internal policies and prior cases.",
        "[P3] Plan a follow-up assessment when material data changes and log analyst assumptions for audit replay."
      ];
    }
    return [
      "[P4] Retain baseline monitoring aligned with your review cadence.",
      "[P4] Re-run scoring when new indicators, relationships, or jurisdiction context appear."
    ];
  }

  // ===========================================================================
  // Gaming domain — artefact-rich, priority-tagged operator recommendations
  // ===========================================================================

  /**
   * Produces operator-ready, priority-tagged recommendations for the gaming
   * explanation narrative. Priorities ([Gaming-P1] = most urgent →
   * [Gaming-P4] = routine) align with the assessment pipeline so downstream
   * sorting keeps a coherent SLA order across narrative and batch outputs.
   *
   * Every action references concrete casino artefacts
   * (`rollover_progress`, `session_length`, `device_fingerprint`,
   * `chargeback_history_90d`, `linked_account_ids`, …) so an analyst can
   * move from the narrative straight to the right CRM / BI / fraud-ops
   * panel without translation.
   *
   * Combo-tagged actions (`[Combo/…]`) are inserted at the very top when
   * converging multi-signal patterns are detected, because they override
   * the isolated playbook with a higher-priority, case-specific playbook.
   */
  private recommendedActionsGaming(
    level: "low" | "medium" | "high" | "critical",
    topDimensions: string[],
    combos: GamingCombo[] = []
  ): string[] {
    const actions: string[] = [];

    if (level === "critical") {
      actions.push(
        "[Gaming-P1] Escalate immediately to fraud-ops + AML leadership; suspend wallet funding, bonus issuance, and withdrawals until manual clearance by a named analyst.",
        "[Gaming-P1] Preserve full case evidence for 30 days (session_id, device_fingerprint, ip_asn, payment_rail, chargeback_id, rg_intervention_history) for investigation and regulator requests.",
        "[Gaming-P1] Block automated payouts above policy threshold and require dual-approval on any manual override; attach correlation_id to the case file."
      );
    } else if (level === "high") {
      actions.push(
        "[Gaming-P2] Open an expedited fraud + AML review with a named case owner and SLA; attach correlation_id and link to the originating /assess request.",
        "[Gaming-P2] Enable 72h enhanced monitoring on deposits, withdrawals, and bonus redemptions; require step-up KYC (doc + liveness) when payout_tier mismatches observed stake or deposit_to_wagering_ratio_7d > 0.8.",
        "[Gaming-P2] Tighten session, stake, and transaction monitoring for a defined window; log every deviation (session_length, stake_ramp, bet_velocity_7d, loss_chase_index) in the CRM."
      );
    } else if (level === "medium") {
      actions.push(
        "[Gaming-P3] Apply targeted checks against internal gaming controls, watchlists, and prior cases (case_history, linked_account_ids, shared_ip_cluster) for this player.",
        "[Gaming-P3] Monitor behavioural shifts versus cohort baselines (stake_vs_cohort_zscore, session_length_vs_cohort, bet_velocity_7d); queue follow-up review if deviation persists for 7+ days.",
        "[Gaming-P3] Watch vendor / PSP exposure: if shared_psp_with_chargeback_history > 0 or incident_history_12m surfaces a new event, escalate the rail to Gaming-P2 review automatically."
      );
    } else {
      actions.push(
        "[Gaming-P4] Keep routine watchlist monitoring and periodic reassessment aligned with operator cadence; no gaming-only escalation on current evidence.",
        "[Gaming-P4] Refresh evidence when products, stake limits, or jurisdiction context change (new_jurisdiction, product_enabled, stake_limit_changed)."
      );
    }

    if (topDimensions.includes("fraud")) {
      actions.push(
        "[Fraud] Pull chargeback_history_90d, disputed_deposits_90d, payment_rail_mix, and linked_account_ids; run device_fingerprint overlap and shared-IP / shared-bank clustering before releasing any high-value payout."
      );
    }
    if (topDimensions.includes("bonus_abuse")) {
      actions.push(
        "[Bonus] Inspect rollover_progress, active_bonus_ids, promo_redemptions_30d, sticky_balance vs cashable_balance, and linked_account_ids; validate device_fingerprint and behavioural overlap against gnoming / chip_dump_pattern before releasing sticky funds."
      );
    }
    if (topDimensions.includes("player_behavior")) {
      actions.push(
        "[Velocity] Compare session_length, bet_velocity_7d, stake_ramp, loss_chase_index, tilt_proxy, and stake_vs_cohort_zscore against the player's cohort baseline; apply cooling_off or deposit_cap when stake_vs_cohort_zscore sustains > 2.5σ for 48h."
      );
    }
    if (topDimensions.includes("aml_kyc")) {
      actions.push(
        "[AML/KYC] Verify kyc_strength, pep_match, sanctions_match, source_of_funds_docs, large_deposit_90d_usd, and cumulative_deposits_30d; escalate to EDD when payout_tier, jurisdiction, or cumulative_deposits_30d trigger CDD thresholds."
      );
    }
    if (topDimensions.includes("responsible_gaming")) {
      actions.push(
        "[RG] Sync rg_limits (deposit / loss / session), cooling_off_status, self_exclusion_flag, loss_chasing_flag, and rg_intervention_history before outbound promos, limit increases, or high-value payouts."
      );
    }
    if (topDimensions.includes("vendor_risk")) {
      actions.push(
        "[Vendor] Validate psp_certification, aggregator_contract_status, kyc_vendor_sla, incident_history_12m, and shared_psp_with_chargeback_history before routing high-value rails or authorising new KYC / data partners; freeze automated settlement to the affected partner if anomaly is confirmed."
      );
    }

    // Combo actions are surfaced at the top so converging multi-signal
    // patterns override isolated-dimension playbooks in the analyst's queue.
    for (const combo of combos) {
      actions.unshift(`[Combo/${combo.id}] ${combo.analystNote}`);
    }

    return [...new Set(actions)];
  }

  // ===========================================================================
  // Gaming domain — artefact checklist grouped by dimension
  // ===========================================================================

  /**
   * Emits a compact, operator-facing checklist of the exact artefacts the
   * analyst should open in their ops console for each active gaming
   * dimension. Artefact definitions live in the shared
   * {@link GAMING_ARTIFACT_CATALOG} (see `combos.ts`) so casino artefacts
   * are authored in one place and consumed by narrative, drivers, and
   * future dashboards without drift.
   *
   * The list is copy-ready so a reviewer can paste it into a case ticket
   * without editing.
   */
  private buildArtifactChecklist(topDimensions: string[]): GamingArtifactGroup[] {
    const seen = new Set<string>();
    const entries: GamingArtifactGroup[] = [];
    for (const dimension of topDimensions) {
      if (seen.has(dimension)) continue;
      const entry = GAMING_ARTIFACT_CATALOG[dimension];
      if (!entry) continue;
      seen.add(dimension);
      entries.push(entry);
    }
    return entries;
  }
}
