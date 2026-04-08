import type { ResourceType, TerrainType } from './types';
import type { Position } from './Position';

export interface Tile {
  id: string;
  position: Position;
  terrainType: TerrainType;
  movementCost: number;
  hasResource: ResourceType | null;
}

export function createTile(
  id: string,
  x: number,
  y: number,
  terrainType: TerrainType,
  movementCost: number,
  hasResource: ResourceType | null = null,
): Tile {
  return {
    id,
    position: { x, y },
    terrainType,
    movementCost,
    hasResource,
  };
}
