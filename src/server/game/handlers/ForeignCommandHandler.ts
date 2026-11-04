import type { Player } from '@shared/game/entities/Player';
import { Attitude, GoodType, UnitType } from '@shared/game/entities/types';
import { isBeside } from '@shared/game/rules/TradeRules';
import { ForeignInteractionSystem } from '@shared/game/systems/ForeignInteractionSystem';
import { TraversalUtils } from '@shared/game/utils/TraversalUtils';
import type { AuthoritativeGameState } from '@shared/game/AuthoritativeGameState';
import type { GameEffect } from '@shared/game/protocol';

/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
export class ForeignCommandHandler {
  static tradeWithSettlement(
    state: AuthoritativeGameState,
    settlementId: string,
    unitId: string,
    goodOffered: GoodType,
    random: () => number
  ): readonly GameEffect[] {
    // Input validation: Ensure valid good type
    if (!Object.values(GoodType).includes(goodOffered)) {
      return [];
    }

    const player = this.selectCurrentPlayer(state);
    const unit = player?.units.find((candidate) => candidate.id === unitId);
    if (!player || !unit) {
      return [];
    }

    const foreignPlayer = this.selectSettlementOwner(state, settlementId);
    if (!foreignPlayer) {
      return [];
    }

    const settlementIndex = foreignPlayer.settlements.findIndex((candidate) => candidate.id === settlementId);
    const settlement = foreignPlayer.settlements[settlementIndex];
    if (!settlement || settlement.ownerId === player.id || !isBeside(unit.position, settlement.position)) {
      return [];
    }

    if ((unit.cargo.get(goodOffered) ?? 0) <= 0) {
      return [];
    }

    const { updatedSettlement, updatedUnit } = ForeignInteractionSystem.trade(
      settlement,
      unit,
      goodOffered,
      random
    );

    foreignPlayer.settlements[settlementIndex] = updatedSettlement;
    const unitIndex = player.units.findIndex((candidate) => candidate.id === unitId);
    if (player.units[unitIndex]) {
      player.units[unitIndex] = updatedUnit;
    }

    return [];
  }

  static learnFromSettlement(
    state: AuthoritativeGameState,
    settlementId: string,
    unitId: string
  ): readonly GameEffect[] {
    const player = this.selectCurrentPlayer(state);
    const unit = player?.units.find((candidate) => candidate.id === unitId);
    if (!player || !unit) {
      return [];
    }

    const foreignPlayer = this.selectSettlementOwner(state, settlementId);
    if (!foreignPlayer) {
      return [];
    }

    const settlementIndex = foreignPlayer.settlements.findIndex((candidate) => candidate.id === settlementId);
    const settlement = foreignPlayer.settlements[settlementIndex];
    if (!settlement || settlement.ownerId === player.id || !isBeside(unit.position, settlement.position)) {
      return [];
    }

    if (settlement.attitude !== Attitude.FRIENDLY || unit.type !== UnitType.COLONIST) {
      return [];
    }

    const { updatedSettlement, updatedUnit } = ForeignInteractionSystem.learn(settlement, unit);
    foreignPlayer.settlements[settlementIndex] = updatedSettlement;

    const unitIndex = player.units.findIndex((candidate) => candidate.id === unitId);
    if (player.units[unitIndex]) {
      player.units[unitIndex] = updatedUnit;
    }

    return [];
  }

  private static selectCurrentPlayer(state: AuthoritativeGameState): Player | undefined {
    return TraversalUtils.findPlayerById(state.players, state.currentPlayerId);
  }

  private static selectSettlementOwner(state: AuthoritativeGameState, settlementId: string): Player | undefined {
    return TraversalUtils.findSettlementOwner(state.players, settlementId);
  }
}
