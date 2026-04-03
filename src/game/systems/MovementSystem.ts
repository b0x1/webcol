import { Unit } from '../entities/Unit';
import { Tile } from '../entities/Tile';
import { TerrainType, UnitType } from '../entities/types';

export class MovementSystem {
  static getReachableTiles(unit: Unit, map: Tile[][]): { x: number; y: number; cost: number }[] {
    const reachable: { x: number; y: number; cost: number }[] = [];
    const visited = new Map<string, number>();
    const queue: { x: number; y: number; cost: number }[] = [];

    queue.push({ x: unit.x, y: unit.y, cost: 0 });
    visited.set(`${unit.x}-${unit.y}`, 0);

    while (queue.length > 0) {
      const current = queue.shift()!;

      // Add to reachable if it's not the starting tile
      if (current.x !== unit.x || current.y !== unit.y) {
        reachable.push(current);
      }

      // Check neighbors (8-way movement)
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;

          const nx = current.x + dx;
          const ny = current.y + dy;

          if (ny >= 0 && ny < map.length && nx >= 0 && nx < map[ny].length) {
            const targetTile = map[ny][nx];
            const moveCost = this.getMovementCost(unit, targetTile);

            if (moveCost !== Infinity) {
              const totalCost = current.cost + moveCost;

              if (totalCost <= unit.movesRemaining) {
                const key = `${nx}-${ny}`;
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
        tile.terrainType === TerrainType.COAST ||
        tile.terrainType === TerrainType.MOUNTAINS
      ) {
        return 1;
      }
      return Infinity;
    }

    if (tile.terrainType === TerrainType.OCEAN) {
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
