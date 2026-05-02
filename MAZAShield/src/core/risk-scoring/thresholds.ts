import type { DomainScoreBreakdown, LevelDecision, RiskDomain, ScoreBreakdown } from "./types.js";

/**
 * Maps normalized score values into risk levels.
 *
 * Gaming and general policies share the same structure (adjusted aggregate →
 * tier gates) but use different numeric baselines: gaming is tuned for
 * casino-operator concentration on fraud/AML/RG stressors, while general
 * retains broader multi-domain defaults. Dynamic synergy from the gaming combo
 * engine is already folded into `breakdown.overall` before these decisions run.
 */
export class RiskLevelThresholds {
  private readonly mediumBaseline = 0.35;
  private readonly highBaseline = 0.6;
  private readonly criticalBaseline = 0.82;

  /** Gaming tier floors — slightly offset from general to align with gaming composite lifts. */
  private readonly gamingMediumBase = 0.34;
  private readonly gamingHighBase = 0.58;
  private readonly gamingCriticalBase = 0.8;

  /**
   * Decides the final level using domain-specific policy while preserving a common output contract.
   */
  decideLevel(breakdown: ScoreBreakdown, domain: RiskDomain = "general"): LevelDecision {
    if (domain === "gaming") {
      return this.decideLevelGaming(breakdown as DomainScoreBreakdown);
    }

    const adjustedOverall = this.adjustedOverall(breakdown);
    const mediumMin = this.mediumBaseline + 0.04 * (1 - breakdown.evidenceStrength);
    const highMin = this.highBaseline + 0.03 * (1 - breakdown.confidence);
    const criticalMin = this.criticalBaseline + 0.02 * (1 - breakdown.evidenceStrength);

    if (
      adjustedOverall >= criticalMin &&
      (breakdown.conflictIntensity >= 0.62 || breakdown.peakComponentScore >= 0.9)
    ) {
      return {
        level: "critical",
        rationale:
          "Critical due to elevated adjusted score plus strong conflict intensity or dominant high-risk component.",
        adjustedOverall
      };
    }

    if (adjustedOverall >= highMin) {
      return {
        level: "high",
        rationale:
          "High due to sustained multi-dimensional signal pressure after confidence/evidence adjustment.",
        adjustedOverall
      };
    }

    if (adjustedOverall >= mediumMin) {
      return {
        level: "medium",
        rationale: "Medium due to moderate risk pressure with non-trivial cross-dimensional indicators.",
        adjustedOverall
      };
    }

    return {
      level: "low",
      rationale: "Low due to constrained aggregate pressure and limited high-confidence risk indicators.",
      adjustedOverall
    };
  }

  private adjustedOverall(breakdown: ScoreBreakdown): number {
    const conflictLift = 0.08 * breakdown.conflictIntensity;
    const concentrationLift = 0.05 * Math.max(0, breakdown.peakComponentScore - 0.75);
    const lowEvidenceLift = 0.04 * (1 - breakdown.evidenceStrength);
    const lowConfidenceLift = 0.03 * (1 - breakdown.confidence);
    return Math.min(
      1,
      Math.max(
        0,
        breakdown.overall + conflictLift + concentrationLift + lowEvidenceLift + lowConfidenceLift
      )
    );
  }

  /**
   * Gaming-specific decision policy tuned for fraud/AML concentration and operational control pressure.
   */
  private decideLevelGaming(breakdown: DomainScoreBreakdown): LevelDecision {
    const adjustedOverall = this.adjustedOverallGaming(breakdown);
    const mediumMin = this.gamingMediumBase + 0.05 * (1 - breakdown.evidenceStrength);
    const highMin = this.gamingHighBase + 0.04 * (1 - breakdown.confidence);
    const criticalMin = this.gamingCriticalBase + 0.03 * (1 - breakdown.evidenceStrength);

    if (
      adjustedOverall >= criticalMin &&
      (breakdown.conflictIntensity >= 0.58 || breakdown.peakComponentScore >= 0.88)
    ) {
      return {
        level: "critical",
        rationale:
          "Critical gaming risk due to elevated fraud/AML pressure and high-impact component concentration.",
        adjustedOverall
      };
    }

    if (adjustedOverall >= highMin) {
      return {
        level: "high",
        rationale:
          "High gaming risk from sustained multi-factor stress and strong financial-integrity indicators.",
        adjustedOverall
      };
    }

    if (adjustedOverall >= mediumMin) {
      return {
        level: "medium",
        rationale:
          "Medium gaming risk with notable indicators requiring enhanced monitoring and review.",
        adjustedOverall
      };
    }

    return {
      level: "low",
      rationale:
        "Low gaming risk with controlled indicator pressure and no dominant critical signal.",
      adjustedOverall
    };
  }

  private adjustedOverallGaming(breakdown: DomainScoreBreakdown): number {
    const conflictLift = 0.1 * breakdown.conflictIntensity;
    const concentrationLift = 0.06 * Math.max(0, breakdown.peakComponentScore - 0.72);
    const lowEvidenceLift = 0.05 * (1 - breakdown.evidenceStrength);
    const lowConfidenceLift = 0.04 * (1 - breakdown.confidence);
    return Math.min(
      1,
      Math.max(
        0,
        breakdown.overall + conflictLift + concentrationLift + lowEvidenceLift + lowConfidenceLift
      )
    );
  }
}
