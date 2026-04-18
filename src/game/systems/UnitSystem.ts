import type { Player } from '../entities/Player';
import type { Unit } from '../entities/Unit';
import type { Tile } from '../entities/Tile';
import { MovementSystem } from './MovementSystem';
import { distance, isSame } from '../entities/Position';
import type { Settlement } from '../entities/Settlement';
import { TraversalUtils } from '../utils/TraversalUtils';

/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
export class UnitSystem {
  private constructor() {
    // Static utility class
  }

  static findNextAvailableUnit(
    player: Player,
    currentUnitId: string | null
  ): Unit | undefined {
    const availableUnits = player.units.filter((u) => u.movesRemaining > 0 && !u.isSkipping);
    if (availableUnits.length === 0) return undefined;

    const currentUnit = player.units.find((u) => u.id === currentUnitId);
    const firstAvailable = availableUnits[0];
    if (!firstAvailable) return undefined;
    if (!currentUnit) return firstAvailable;

    return availableUnits.reduce((prev, curr) => {
      if (isSame(curr.position, currentUnit.position)) {
        const currentIdx = player.units.indexOf(currentUnit);
        const nextSameTile = player.units
          .slice(currentIdx + 1)
          .find((u) => isSame(u.position, currentUnit.position) && u.movesRemaining > 0 && !u.isSkipping);
        if (nextSameTile) return nextSameTile;
      }

      const distPrev = distance(prev.position, currentUnit.position);
      const distCurr = distance(curr.position, currentUnit.position);

      if (isSame(curr.position, currentUnit.position)) return curr;
      if (isSame(prev.position, currentUnit.position)) return prev;

      return distCurr < distPrev ? curr : prev;
    }, firstAvailable);
  }

  static canMoveTo(unit: Unit, toX: number, toY: number, map: Tile[][]): boolean {
    const row = map[toY];
    const targetTile = row?.[toX];
    if (!targetTile) return false;
    const cost = MovementSystem.getMovementCost(unit, targetTile);
    return unit.movesRemaining >= cost;
  }

  /**
   * Transitions a unit into a settlement if it's at the settlement's position.
   */
  static enterSettlement(unit: Unit, player: Player, settlement: Settlement): boolean {
    if (!isSame(unit.position, settlement.position)) return false;

    const unitIndex = player.units.findIndex(u => u.id === unit.id);
    if (unitIndex === -1) return false;

    if (!settlement.units.some(u => u.id === unit.id)) {
      settlement.units.push({ ...unit });
    }
    player.units.splice(unitIndex, 1);
    return true;
  }

  /**
   * Transitions an available unit out of a settlement into the player's active units.
   */
  static exitSettlement(unitId: string, player: Player): Unit | undefined {
    for (const s of player.settlements) {
      const uIdx = s.units.findIndex(u => u.id === unitId);
      if (uIdx !== -1) {
        const unit = s.units[uIdx];
        if (unit && TraversalUtils.isUnitAvailable(unit, s.position)) {
          if (!player.units.some(u => u.id === unitId)) {
            player.units.push({ ...unit });
          }
          s.units.splice(uIdx, 1);
          return unit;
        }
        break;
      }
    }
    return undefined;
  }
}
