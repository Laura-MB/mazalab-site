import type { Entity, ResolvedEntity } from "../../types/index.js";

import type { EntityResolutionContext } from "./types.js";

/**
 * Minimal service surface for entity resolution.
 */
export class EntityResolutionService {
  /**
   * Resolves input entities into canonical resolved entities.
   * Placeholder implementation: returns an empty list until
   * resolution logic is implemented.
   */
  async resolveEntities(
    entities: Entity[],
    _context?: EntityResolutionContext
  ): Promise<ResolvedEntity[]> {
    void entities;
    return [];
  }
}
