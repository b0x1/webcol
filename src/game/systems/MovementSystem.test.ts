import { describe, it, expect } from 'vitest';
import { MovementSystem } from './MovementSystem';
import { createUnit } from './../entities/Unit';
import { createTile } from './../entities/Tile';
import { TerrainType, UnitType } from './../entities/types';

describe('MovementSystem', () => {
  const createMap = (width: number, height: number, terrainType: TerrainType = TerrainType.PLAINS) => {
    const map: any[][] = [];
    for (let y = 0; y < height; y++) {
      const row: any[] = [];
      for (let x = 0; x < width; x++) {
        row.push(createTile(`${x}-${y}`, x, y, terrainType, 1));
      }
      map.push(row);
    }
    return map;
  };

  it('should return reachable tiles within movesRemaining', () => {
    const map = createMap(10, 10);
    const unit = createUnit('u1', 'p1', 'Test Unit', UnitType.COLONIST, 5, 5, 1);
    const reachable = MovementSystem.getReachableTiles(unit, map);

    // 8 neighbors should be reachable
    expect(reachable.length).toBe(8);
  });

  it('should handle different movement costs', () => {
    const map = createMap(10, 10);
    map[5][6].terrainType = TerrainType.FOREST;
    map[5][6].movementCost = 2;

    const unit = createUnit('u1', 'p1', 'Test Unit', UnitType.COLONIST, 5, 5, 1);
    const reachable = MovementSystem.getReachableTiles(unit, map);

    // Forest at (6,5) cost 2, so it shouldn't be reachable with 1 move
    expect(reachable.some(t => t.x === 6 && t.y === 5)).toBe(false);
    expect(reachable.length).toBe(7);
  });

  it('should restrict SHIP to OCEAN/COAST/MOUNTAINS', () => {
    const map = createMap(10, 10, TerrainType.PLAINS);
    map[5][6].terrainType = TerrainType.OCEAN;

    const ship = createUnit('s1', 'p1', 'Test Unit', UnitType.SHIP, 5, 5, 1);
    const reachable = MovementSystem.getReachableTiles(ship, map);

    // Only (6,5) which is OCEAN should be reachable
    expect(reachable.length).toBe(1);
    expect(reachable[0].x).toBe(6);
    expect(reachable[0].y).toBe(5);
  });

  it('should restrict non-SHIP from OCEAN', () => {
    const map = createMap(10, 10, TerrainType.OCEAN);
    map[5][6].terrainType = TerrainType.PLAINS;

    const colonist = createUnit('u1', 'p1', 'Test Unit', UnitType.COLONIST, 5, 5, 1);
    const reachable = MovementSystem.getReachableTiles(colonist, map);

    // Only (6,5) which is PLAINS should be reachable
    expect(reachable.length).toBe(1);
    expect(reachable[0].x).toBe(6);
    expect(reachable[0].y).toBe(5);
  });

  it('should restrict land units from COAST', () => {
    const map = createMap(10, 10, TerrainType.COAST);
    map[5][6].terrainType = TerrainType.PLAINS;

    const colonist = createUnit('u1', 'p1', 'Test Unit', UnitType.COLONIST, 5, 5, 1);
    const reachable = MovementSystem.getReachableTiles(colonist, map);

    // Only (6,5) which is PLAINS should be reachable, COAST is now blocked
    expect(reachable.length).toBe(1);
    expect(reachable[0].x).toBe(6);
    expect(reachable[0].y).toBe(5);
  });
});
