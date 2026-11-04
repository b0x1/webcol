import { CARGO_CONSTANTS } from '../constants';
import type { Player } from '../entities/Player';
import { isNeighbor, isSame, type Position } from '../entities/Position';
import type { Settlement } from '../entities/Settlement';
import type { Tile } from '../entities/Tile';
import type { Unit } from '../entities/Unit';
import { TerrainType, UnitType } from '../entities/types';

export function cargoUsed(unit: Unit): number {
  let total = 0;
  unit.cargo.forEach((amount) => {
    total += amount;
  });
  return total;
}

export function cargoHold(unit: Unit): number {
  return unit.type === UnitType.SHIP ? CARGO_CONSTANTS.SHIP_HOLD : CARGO_CONSTANTS.LAND_HOLD;
}

export function isBeside(origin: Position, target: Position): boolean {
  return isSame(origin, target) || isNeighbor(origin, target);
}

export function settlementBeside(unit: Unit, settlements: readonly Settlement[]): Settlement | undefined {
  return settlements.find((settlement) => isBeside(unit.position, settlement.position));
}

export function isAtHarbor(unit: Unit, player: Player, map: readonly (readonly Tile[])[]): boolean {
  if (unit.type !== UnitType.SHIP || unit.inEurope === true) {
    return false;
  }

  const tile = map[unit.position.y]?.[unit.position.x];
  if (!tile) {
    return false;
  }

  if (tile.terrainType !== TerrainType.OCEAN && tile.terrainType !== TerrainType.COAST) {
    return false;
  }

  return settlementBeside(unit, player.settlements) !== undefined;
}

export function canTradeWithEurope(unit: Unit, player: Player, map: readonly (readonly Tile[])[]): boolean {
  if (unit.type !== UnitType.SHIP || unit.ownerId !== player.id) {
    return false;
  }

  return unit.inEurope === true || isAtHarbor(unit, player, map);
}
