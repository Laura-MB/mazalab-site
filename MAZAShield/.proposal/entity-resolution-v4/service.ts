import type { Entity, ResolvedEntity } from "../../types/index.js";

import type { ResolutionOptions } from "./types.js";

/**
 * Minimal service surface for entity resolution.
 */
export class EntityResolutionService {
  /**
   * Resolves one entity into a canonical placeholder result.
   */
  async resolveEntity(
    entity: Entity,
    options?: ResolutionOptions
  ): Promise<ResolvedEntity> {
    return {
      canonicalEntity: entity,
      mergedEntityIds: [entity.id],
      resolutionVersion: "0.1.0-placeholder",
      matchStrategy: "deterministic",
      matchScore: this.getPlaceholderScore(options),
      explanation: "Placeholder resolution result based on direct input mapping.",
      conflicts: [],
      resolvedAt: new Date().toISOString()
    };
  }

  /**
   * Resolves multiple entities by delegating to resolveEntity.
   */
  async resolveEntities(
    entities: Entity[],
    options?: ResolutionOptions
  ): Promise<ResolvedEntity[]> {
    return Promise.all(entities.map((entity) => this.resolveEntity(entity, options)));
  }

  /**
   * Keeps placeholder scoring behavior explicit and centralized.
   */
  private getPlaceholderScore(options?: ResolutionOptions): number {
    return options?.threshold ?? 1;
  }
}
