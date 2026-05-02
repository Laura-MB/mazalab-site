import type {
  DomainDimensionConfig,
  RiskDomain,
  RiskDomainConfig
} from "../types.js";

/**
 * Single source of truth for risk-scoring domain configuration.
 *
 * Extension guideline:
 * 1) Add a new domain config object in this file.
 * 2) Define each dimension with full metadata (id, name, weight, explanationTemplate,
 *    confidenceFactor, supportsBiasFlag).
 * 3) Register the domain in DOMAIN_CONFIG_MAP so service/scorer routing can resolve it.
 */
/**
 * Utility constructor to keep domain dimension definitions concise and explicit.
 */
function defineDimension(config: DomainDimensionConfig): DomainDimensionConfig {
  return config;
}

/**
 * Default configuration for the general MAZALab risk domain.
 */
export const GENERAL_DOMAIN_CONFIG: RiskDomainConfig = {
  sanctions: defineDimension({
    id: "sanctions",
    name: "Sanctions",
    weight: 0.2,
    explanationTemplate: "Sanctions exposure signal assessed via indicators and conflicts.",
    confidenceFactor: 0.9,
    supportsBiasFlag: true
  }),
  fraud: defineDimension({
    id: "fraud",
    name: "Fraud",
    weight: 0.15,
    explanationTemplate: "Fraud signal derived from suspicious patterns and profile quality.",
    confidenceFactor: 0.88,
    supportsBiasFlag: true
  }),
  aml: defineDimension({
    id: "aml",
    name: "AML",
    weight: 0.15,
    explanationTemplate: "AML signal reflects KYC/beneficial ownership risk markers.",
    confidenceFactor: 0.9,
    supportsBiasFlag: true
  }),
  cyber: defineDimension({
    id: "cyber",
    name: "Cyber",
    weight: 0.12,
    explanationTemplate: "Cyber signal uses breach/malware-like evidence terms.",
    confidenceFactor: 0.82,
    supportsBiasFlag: false
  }),
  reputation: defineDimension({
    id: "reputation",
    name: "Reputation",
    weight: 0.12,
    explanationTemplate: "Reputation signal reflects adverse media and alias consistency.",
    confidenceFactor: 0.84,
    supportsBiasFlag: true
  }),
  compliance: defineDimension({
    id: "compliance",
    name: "Compliance",
    weight: 0.13,
    explanationTemplate: "Compliance signal assesses regulatory markers and profile controls.",
    confidenceFactor: 0.9,
    supportsBiasFlag: true
  }),
  geopolitical: defineDimension({
    id: "geopolitical",
    name: "Geopolitical",
    weight: 0.13,
    explanationTemplate: "Geopolitical signal reflects jurisdictional and country risk context.",
    confidenceFactor: 0.83,
    supportsBiasFlag: false
  })
};

/**
 * Gaming / G2E / casino-oriented configuration.
 *
 * Weight rationale (pre-normalization — totals to 1.00): the gaming-native
 * vectors that most directly drive operator action and regulated exposure
 * receive higher relative impact than infrastructure dimensions.
 *
 *   bonus_abuse        0.22  — primary promo/rollover attack surface
 *   player_behavior    0.20  — behavioral core; drives friction and RG triggers
 *   responsible_gaming 0.17  — regulator-critical; raised to reflect operator duty
 *   fraud              0.16  — payments / ATO / collusion
 *   aml_kyc            0.15  — KYC / SOF / PEP screening
 *   vendor_risk        0.10  — infra posture; supports other vectors
 *
 * All six dimensions are required for the gaming scorer to produce a
 * balanced breakdown. `explanationTemplate` is analyst-facing and phrased as
 * a concrete operator action so it reads as guidance in audit logs and UI.
 */
export const GAMING_DOMAIN_CONFIG: RiskDomainConfig = {
  fraud: defineDimension({
    id: "fraud",
    name: "Payments & account integrity",
    weight: 0.16,
    explanationTemplate:
      "Scrutinize payment reversals, account-takeover markers, stolen-instrument disputes, and collusion across linked accounts before approving large deposits, withdrawals, or account merges.",
    confidenceFactor: 0.92,
    supportsBiasFlag: true
  }),
  bonus_abuse: defineDimension({
    id: "bonus_abuse",
    name: "Bonus & promotional abuse",
    weight: 0.22,
    explanationTemplate:
      "Review bonus rollover progress, linked-account chains, and staking patterns for coordinated abuse (gnoming, chip-dumping, promo farming) before releasing sticky or restricted bonus funds.",
    confidenceFactor: 0.9,
    supportsBiasFlag: true
  }),
  player_behavior: defineDimension({
    id: "player_behavior",
    name: "Player behavior & velocity",
    weight: 0.2,
    explanationTemplate:
      "Compare stake velocity, session clustering, and loss-chasing proxies to cohort baselines; escalate friction or cooling-off when deviations persist across consecutive session windows.",
    confidenceFactor: 0.88,
    supportsBiasFlag: true
  }),
  aml_kyc: defineDimension({
    id: "aml_kyc",
    name: "AML / KYC",
    weight: 0.15,
    explanationTemplate:
      "Confirm KYC strength, PEP / sanctions alignment, and source-of-funds plausibility when payout tier or jurisdiction triggers CDD; escalate to EDD when regulatory signals stack.",
    confidenceFactor: 0.93,
    supportsBiasFlag: true
  }),
  responsible_gaming: defineDimension({
    id: "responsible_gaming",
    name: "Responsible gaming",
    weight: 0.17,
    explanationTemplate:
      "Validate limit breaches, self-exclusion status, cooling-off flags, and CRM intervention triggers before outbound promos, limit increases, or high-value payouts.",
    confidenceFactor: 0.89,
    supportsBiasFlag: true
  }),
  vendor_risk: defineDimension({
    id: "vendor_risk",
    name: "Vendor & integration risk",
    weight: 0.1,
    explanationTemplate:
      "Vet PSP / aggregator certification, integration incident history, and contractual controls before routing high-value rails or authorizing new KYC, data, or payment partners.",
    confidenceFactor: 0.85,
    supportsBiasFlag: true
  })
};

/**
 * Domain-to-configuration map consumed by the risk-scoring orchestration layer.
 */
export const DOMAIN_CONFIG_MAP: Record<RiskDomain, RiskDomainConfig> = {
  general: GENERAL_DOMAIN_CONFIG,
  gaming: GAMING_DOMAIN_CONFIG
};
