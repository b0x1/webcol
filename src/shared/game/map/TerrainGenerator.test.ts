import { describe, expect, it } from 'vitest';
import { TerrainType } from '../entities/types';
import { terrainFromSample } from './TerrainGenerator';

describe('terrainFromSample', () => {
  it('keeps ocean, coast, hills, and mountains on elevation', () => {
    expect(terrainFromSample(-0.5, 0, 0)).toBe(TerrainType.OCEAN);
    expect(terrainFromSample(-0.15, 0, 0)).toBe(TerrainType.COAST);
    expect(terrainFromSample(0.3, 0, 0)).toBe(TerrainType.HILLS);
    expect(terrainFromSample(0.5, 0, 0)).toBe(TerrainType.MOUNTAINS);
  });

  it('emits the land types used by field production', () => {
    expect(terrainFromSample(0.1, 0.4, 0)).toBe(TerrainType.FOREST);
    expect(terrainFromSample(0.1, 0.2, 0)).toBe(TerrainType.GRASSLAND);
    expect(terrainFromSample(0.12, -0.1, 0)).toBe(TerrainType.PRAIRIE);
    expect(terrainFromSample(-0.02, -0.3, 0)).toBe(TerrainType.SWAMP);
    expect(terrainFromSample(0.02, -0.1, 0)).toBe(TerrainType.MARSH);
    expect(terrainFromSample(0.1, -0.4, 0)).toBe(TerrainType.DESERT);
    expect(terrainFromSample(0.1, 0, 0.75)).toBe(TerrainType.TUNDRA);
    expect(terrainFromSample(0.1, 0, 0.9)).toBe(TerrainType.ARCTIC);
  });
});
