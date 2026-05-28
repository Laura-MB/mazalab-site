import type { Entity, ResolvedEntity } from "../../types/index.js";

/**
 * Supported placeholder strategies for entity-resolution calls.
 */
export type ResolutionStrategy = "exact" | "fuzzy" | "hybrid";

/**
 * Optional controls for placeholder resolution behavior.
 */
export interface ResolutionOptions {
  threshold: number;
  strategy: ResolutionStrategy;
}

/**
 * Input shape for entity-resolution operations.
 */
export interface ResolveEntitiesInput {
  entities: Entity[];
}

/**
 * Optional context passed to the module without changing behavior.
 */
export interface EntityResolutionContext {
  correlationId?: string;
}

/**
 * Placeholder result contract for the entity-resolution module.
 */
export interface EntityResolutionResult {
  resolvedEntities: ResolvedEntity[];
}
