import { describe, it, expect } from 'vitest';
import { MovementSystem } from '../MovementSystem';
import { Unit } from '../../entities/Unit';
import { Tile } from '../../entities/Tile';
import { TerrainType, UnitType } from '../../entities/types';

describe('MovementSystem', () => {
  const createMap = (width: number, height: number, terrainType: TerrainType = TerrainType.PLAINS) => {
    const map: Tile[][] = [];
    for (let y = 0; y < height; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < width; x++) {
        row.push(new Tile(`${x}-${y}`, x, y, terrainType, 1));
      }
      map.push(row);
    }
    return map;
  };

  it('should return reachable tiles within movesRemaining', () => {
    const map = createMap(10, 10);
    const unit = new Unit('u1', 'p1', UnitType.COLONIST, 5, 5, 1);
    const reachable = MovementSystem.getReachableTiles(unit, map);

    // 8 neighbors should be reachable
    expect(reachable.length).toBe(8);
  });

  it('should handle different movement costs', () => {
    const map = createMap(10, 10);
    map[5][6].terrainType = TerrainType.FOREST;
    map[5][6].movementCost = 2;

    const unit = new Unit('u1', 'p1', UnitType.COLONIST, 5, 5, 1);
    const reachable = MovementSystem.getReachableTiles(unit, map);

    // Forest at (6,5) cost 2, so it shouldn't be reachable with 1 move
    expect(reachable.some(t => t.x === 6 && t.y === 5)).toBe(false);
    expect(reachable.length).toBe(7);
  });

  it('should restrict SHIP to OCEAN/COAST/MOUNTAINS', () => {
    const map = createMap(10, 10, TerrainType.PLAINS);
    map[5][6].terrainType = TerrainType.OCEAN;

    const ship = new Unit('s1', 'p1', UnitType.SHIP, 5, 5, 1);
    const reachable = MovementSystem.getReachableTiles(ship, map);

    // Only (6,5) which is OCEAN should be reachable
    expect(reachable.length).toBe(1);
    expect(reachable[0].x).toBe(6);
    expect(reachable[0].y).toBe(5);
  });

  it('should restrict non-SHIP from OCEAN', () => {
    const map = createMap(10, 10, TerrainType.OCEAN);
    map[5][6].terrainType = TerrainType.PLAINS;

    const colonist = new Unit('u1', 'p1', UnitType.COLONIST, 5, 5, 1);
    const reachable = MovementSystem.getReachableTiles(colonist, map);

    // Only (6,5) which is PLAINS should be reachable
    expect(reachable.length).toBe(1);
    expect(reachable[0].x).toBe(6);
    expect(reachable[0].y).toBe(5);
  });
});
