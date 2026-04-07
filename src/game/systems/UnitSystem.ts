import type { Player } from '../entities/Player';
import type { Unit } from '../entities/Unit';
import type { Tile } from '../entities/Tile';
import { MovementSystem } from './MovementSystem';

export class UnitSystem {
  static findNextAvailableUnit(
    player: Player,
    currentUnitId: string | null
  ): Unit | undefined {
    const availableUnits = player.units.filter((u) => u.movesRemaining > 0 && !u.isSkipping);
    if (availableUnits.length === 0) return undefined;

    const currentUnit = player.units.find((u) => u.id === currentUnitId);
    if (!currentUnit) return availableUnits[0];

    return availableUnits.reduce((prev, curr) => {
      if (curr.x === currentUnit.x && curr.y === currentUnit.y) {
        const currentIdx = player.units.indexOf(currentUnit);
        const nextSameTile = player.units
          .slice(currentIdx + 1)
          .find((u) => u.x === currentUnit.x && u.y === currentUnit.y && u.movesRemaining > 0 && !u.isSkipping);
        if (nextSameTile) return nextSameTile;
      }

      const distPrev = Math.abs(prev.x - currentUnit.x) + Math.abs(prev.y - currentUnit.y);
      const distCurr = Math.abs(curr.x - currentUnit.x) + Math.abs(curr.y - currentUnit.y);

      if (curr.x === currentUnit.x && curr.y === currentUnit.y) return curr;
      if (prev.x === currentUnit.x && prev.y === currentUnit.y) return prev;

      return distCurr < distPrev ? curr : prev;
    }, availableUnits[0]);
  }

  static canMoveTo(unit: Unit, toX: number, toY: number, map: Tile[][]): boolean {
    if (toY < 0 || toY >= map.length || !map[toY] || toX < 0 || toX >= map[toY].length) {
      return false;
    }
    const targetTile = map[toY][toX];
    const cost = MovementSystem.getMovementCost(unit, targetTile);
    return unit.movesRemaining >= cost;
  }
}
