import type { Entity, ResolvedEntity } from "../../types/index.js";

import type {
  EntityResolutionContext,
  ResolutionOptions
} from "./types.js";

/**
 * Minimal service surface for entity resolution.
 */
export class EntityResolutionService {
  /**
   * Resolves a single input entity into a canonical placeholder result.
   * This is a temporary implementation with no real matching logic.
   */
  async resolveEntity(
    entity: Entity,
    options?: ResolutionOptions
  ): Promise<ResolvedEntity> {
    // Placeholder usage to keep options explicit in the current surface.
    void options;

    return {
      canonicalEntity: entity,
      mergedEntityIds: [entity.id],
      resolutionVersion: "0.1.0-placeholder",
      matchStrategy: "deterministic",
      matchScore: 1,
      explanation: "Placeholder resolution result based on direct input mapping.",
      conflicts: [],
      resolvedAt: new Date().toISOString()
    };
  }

  /**
   * Resolves input entities into canonical placeholder results.
   * This is a temporary implementation delegating per-entity placeholders.
   */
  async resolveEntities(
    entities: Entity[],
    options?: ResolutionOptions,
    _context?: EntityResolutionContext
  ): Promise<ResolvedEntity[]> {
    return Promise.all(entities.map((entity) => this.resolveEntity(entity, options)));
  }
}
