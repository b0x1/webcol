import { describe, it, expect } from 'vitest';
import { createTile } from '../Tile';
import { TerrainType, ResourceType } from '../types';

describe('Tile', () => {
  it('should initialize with correct values', () => {
    const tile = createTile('tile-1', 10, 20, TerrainType.PLAINS, 1, ResourceType.ORE_DEPOSIT);
    expect(tile.id).toBe('tile-1');
    expect(tile.x).toBe(10);
    expect(tile.y).toBe(20);
    expect(tile.terrainType).toBe(TerrainType.PLAINS);
    expect(tile.movementCost).toBe(1);
    expect(tile.hasResource).toBe(ResourceType.ORE_DEPOSIT);
  });

  it('should initialize with null resource by default', () => {
    const tile = createTile('tile-2', 5, 5, TerrainType.OCEAN, 1);
    expect(tile.hasResource).toBeNull();
  });
});
