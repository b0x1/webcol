import type { Unit } from '../entities/Unit';
import type { Tile } from '../entities/Tile';
import { TerrainType, UnitType } from '../entities/types';
import { isSame, toKey, type Position, getNeighbors } from '../entities/Position';

export class MovementSystem {
  static getReachableTiles(unit: Unit, map: Tile[][]): (Position & { cost: number })[] {
    const reachable: (Position & { cost: number })[] = [];
    const visited = new Map<string, number>();
    const queue: (Position & { cost: number })[] = [];

    queue.push({ ...unit.position, cost: 0 });
    visited.set(toKey(unit.position), 0);

    const height = map.length;
    const width = map[0]?.length || 0;

    while (queue.length > 0) {
      const current = queue.shift()!;

      // Add to reachable if it's not the starting tile
      if (!isSame(current, unit.position)) {
        reachable.push(current);
      }

      const neighbors = getNeighbors(current, width, height);
      for (const neighbor of neighbors) {
        const targetTile = map[neighbor.y][neighbor.x];
        const moveCost = this.getMovementCost(unit, targetTile);

        if (moveCost !== Infinity) {
          const totalCost = current.cost + moveCost;

          if (totalCost <= unit.movesRemaining) {
            const key = toKey(neighbor);
            if (!visited.has(key) || visited.get(key)! > totalCost) {
              visited.set(key, totalCost);
              queue.push({ ...neighbor, cost: totalCost });
            }
          }
        }
      }
    }

    return reachable;
  }

  static getMovementCost(unit: Unit, tile: Tile): number {
    const isShip = unit.type === UnitType.SHIP;

    if (isShip) {
      if (
        tile.terrainType === TerrainType.OCEAN ||
        tile.terrainType === TerrainType.COAST
      ) {
        return 1;
      }
      return Infinity;
    }

    if (tile.terrainType === TerrainType.OCEAN || tile.terrainType === TerrainType.COAST) {
      return Infinity;
    }

    if (tile.terrainType === TerrainType.MOUNTAINS) {
      return Infinity;
    }

    if (tile.terrainType === TerrainType.FOREST || tile.terrainType === TerrainType.HILLS) {
      return 2;
    }

    return 1;
  }
}
