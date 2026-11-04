import { isNeighbor, type Position } from '@shared/game/entities/Position';
import { UnitType } from '@shared/game/entities/types';
import { UnitSystem } from '@shared/game/systems/UnitSystem';
import { MovementSystem } from '@shared/game/systems/MovementSystem';
import { PIONEER_CLEARING } from '@shared/game/rules/PioneerRules';
import { TraversalUtils } from '@shared/game/utils/TraversalUtils';
import type { AuthoritativeGameState } from '@shared/game/AuthoritativeGameState';
import type { GameEffect } from '@shared/game/protocol';
import type { Player } from '@shared/game/entities/Player';

/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
export class UnitCommandHandler {
  static moveUnit(state: AuthoritativeGameState, unitId: string, to: Position): readonly GameEffect[] {
    const player = this.selectCurrentPlayer(state);
    if (!player) {
      return [];
    }

    const unitIndex = player.units.findIndex((candidate) => candidate.id === unitId);
    const unit = player.units[unitIndex];
    if (unit?.ownerId !== state.currentPlayerId || unit.inEurope === true) {
      return [];
    }

    // Security: Prevent teleportation by ensuring movement is to a neighbor tile
    if (!isNeighbor(unit.position, to)) {
      return [];
    }

    if (!UnitSystem.canMoveTo(unit, to.x, to.y, state.map)) {
      return [];
    }

    const targetTile = state.map[to.y]?.[to.x];
    if (!targetTile) {
      return [];
    }

    const from = { ...unit.position };
    unit.position = { ...to };
    unit.movesRemaining -= MovementSystem.getMovementCost(unit, targetTile);

    const settlement = TraversalUtils.findSettlementAt([player], to);
    if (settlement) {
      UnitSystem.enterSettlement(unit, player, settlement);
    }

    return [{
      type: 'unitMoved',
      id: unitId,
      fromX: from.x,
      fromY: from.y,
      toX: to.x,
      toY: to.y,
    }];
  }

  static activateUnit(state: AuthoritativeGameState, unitId: string): readonly GameEffect[] {
    const player = this.selectCurrentPlayer(state);
    if (!player) {
      return [];
    }

    UnitSystem.exitSettlement(unitId, player);
    return [];
  }

  static stowUnit(state: AuthoritativeGameState, unitId: string): readonly GameEffect[] {
    const player = this.selectCurrentPlayer(state);
    if (!player) {
      return [];
    }

    const unit = player.units.find((candidate) => candidate.id === unitId);
    if (!unit) {
      return [];
    }

    const settlement = TraversalUtils.findSettlementAt([player], unit.position);
    if (!settlement) {
      return [];
    }

    UnitSystem.enterSettlement(unit, player, settlement);
    return [];
  }

  static skipUnit(state: AuthoritativeGameState, unitId: string): readonly GameEffect[] {
    const player = this.selectCurrentPlayer(state);
    if (!player) {
      return [];
    }

    const unit = player.units.find((candidate) => candidate.id === unitId);
    if (!unit) {
      return [];
    }

    unit.isSkipping = true;
    return [];
  }

  static improveTile(state: AuthoritativeGameState, unitId: string): readonly GameEffect[] {
    const player = this.selectCurrentPlayer(state);
    if (!player) {
      return [];
    }

    const unit = player.units.find((candidate) => candidate.id === unitId);
    if (unit?.ownerId !== player.id) {
      return [];
    }

    if (unit.type !== UnitType.PIONEER || unit.inEurope === true || unit.movesRemaining <= 0) {
      return [];
    }

    const tile = state.map[unit.position.y]?.[unit.position.x];
    const cleared = tile ? PIONEER_CLEARING[tile.terrainType] : undefined;
    if (!tile || !cleared) {
      return [];
    }

    tile.terrainType = cleared;
    unit.movesRemaining = 0;
    return [{ type: 'notification', message: `${unit.name} cleared the ground.` }];
  }

  private static selectCurrentPlayer(state: AuthoritativeGameState): Player | undefined {
    return TraversalUtils.findPlayerById(state.players, state.currentPlayerId);
  }
}
