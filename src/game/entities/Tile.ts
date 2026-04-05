import type { ResourceType, TerrainType } from './types';

export interface Tile {
  id: string;
  x: number;
  y: number;
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
    x,
    y,
    terrainType,
    movementCost,
    hasResource,
  };
}
