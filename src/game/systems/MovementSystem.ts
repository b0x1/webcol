import type { Unit } from '../entities/Unit';
import type { Tile } from '../entities/Tile';
import { TerrainType, UnitType } from '../entities/types';
import { isSame, toKey } from '../entities/Position';

export class MovementSystem {
  static getReachableTiles(unit: Unit, map: Tile[][]): { x: number; y: number; cost: number }[] {
    const reachable: { x: number; y: number; cost: number }[] = [];
    const visited = new Map<string, number>();
    const queue: { x: number; y: number; cost: number }[] = [];

    queue.push({ x: unit.position.x, y: unit.position.y, cost: 0 });
    visited.set(toKey(unit.position), 0);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentPos = { x: current.x, y: current.y };

      // Add to reachable if it's not the starting tile
      if (!isSame(currentPos, unit.position)) {
        reachable.push(current);
      }

      // Check neighbors (8-way movement)
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;

          const nx = current.x + dx;
          const ny = current.y + dy;
          const nextPos = { x: nx, y: ny };

          if (ny >= 0 && ny < map.length && nx >= 0 && nx < map[ny].length) {
            const targetTile = map[ny][nx];
            const moveCost = this.getMovementCost(unit, targetTile);

            if (moveCost !== Infinity) {
              const totalCost = current.cost + moveCost;

              if (totalCost <= unit.movesRemaining) {
                const key = toKey(nextPos);
                if (!visited.has(key) || visited.get(key)! > totalCost) {
                  visited.set(key, totalCost);
                  queue.push({ x: nx, y: ny, cost: totalCost });
                }
              }
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
