export type {
  DomainDimensionConfig,
  RiskDomain,
  RiskDomainConfig,
  RiskDimension,
  RiskScore,
  RiskScoreComponent,
  RiskScoreCalculationOptions,
  RiskScoringOptions
} from "./types.js";

export {
  DOMAIN_CONFIG_MAP,
  GAMING_DOMAIN_CONFIG,
  GENERAL_DOMAIN_CONFIG
} from "./config/domain-config.js";

export { CompositeRiskScorer } from "./scorer.js";
export { RiskScoreExplanationBuilder } from "./explanation-builder.js";
export { RiskScoringService } from "./service.js";
