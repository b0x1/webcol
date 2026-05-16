import type { Position } from '@shared/game/entities/Position';
import { UnitSystem } from '@shared/game/systems/UnitSystem';
import { MovementSystem } from '@shared/game/systems/MovementSystem';
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
    if (!unit) {
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

  private static selectCurrentPlayer(state: AuthoritativeGameState): Player | undefined {
    return TraversalUtils.findPlayerById(state.players, state.currentPlayerId);
  }
}
