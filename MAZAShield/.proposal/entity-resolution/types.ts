import type { Entity, ResolvedEntity } from "../../types/index.js";

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
