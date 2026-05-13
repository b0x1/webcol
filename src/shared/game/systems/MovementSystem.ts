import type { Unit } from '../entities/Unit';
import type { Tile } from '../entities/Tile';
import { TerrainType, UnitType } from '../entities/types';
import { isSame, type Position } from '../entities/Position';

/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
export class MovementSystem {
  private constructor() {
    // Static utility class
  }

  static getReachableTiles(unit: Unit, map: Tile[][]): (Position & { cost: number })[] {
    const reachable: (Position & { cost: number })[] = [];
    const height = map.length;
    const width = map[0]?.length ?? 0;

    if (width === 0 || height === 0) return [];

    // ⚡ Turbo: Use Map with numeric keys (y * width + x) to avoid string concatenation
    // We use a Map instead of a full-map TypedArray to stay memory-efficient for large maps
    // where units only explore a small local area.
    const visited = new Map<number, number>();
    const queue: (Position & { cost: number })[] = [];
    let head = 0;

    const startIdx = unit.position.y * width + unit.position.x;
    queue.push({ ...unit.position, cost: 0 });
    visited.set(startIdx, 0);

    // Use index-based queue to avoid O(N) shift() operations
    while (head < queue.length) {
      const current = queue[head++];
      if (!current) continue;

      // Add to reachable if it's not the starting tile
      if (!isSame(current, unit.position)) {
        reachable.push(current);
      }

      const { x, y, cost } = current;

      // ⚡ Turbo: Inline neighbor search to avoid array and object allocations from getNeighbors
      // Note: This 8-way traversal matches the getNeighbors implementation in Position.ts
      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;

        const row = map[ny];
        if (!row) continue;

        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;

          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;

          const targetTile = row[nx];
          if (!targetTile) continue;

          const moveCost = this.getMovementCost(unit, targetTile);

          if (moveCost !== Infinity) {
            const totalCost = cost + moveCost;

            if (totalCost <= unit.movesRemaining) {
              const idx = ny * width + nx;
              const prevCost = visited.get(idx);
              if (prevCost === undefined || prevCost > totalCost) {
                visited.set(idx, totalCost);
                queue.push({ x: nx, y: ny, cost: totalCost });
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
