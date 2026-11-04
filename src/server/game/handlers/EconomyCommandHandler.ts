import type { Player } from '@shared/game/entities/Player';
import { GoodType } from '@shared/game/entities/types';
import { canTradeWithEurope, cargoHold, cargoUsed, isBeside } from '@shared/game/rules/TradeRules';
import { EconomySystem } from '@shared/game/systems/EconomySystem';
import { ProductionSystem } from '@shared/game/systems/ProductionSystem';
import { TraversalUtils } from '@shared/game/utils/TraversalUtils';
import type { AuthoritativeGameState } from '@shared/game/AuthoritativeGameState';
import type { GameEffect } from '@shared/game/protocol';

/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
export class EconomyCommandHandler {
  static sellGood(
    state: AuthoritativeGameState,
    unitId: string,
    good: GoodType,
    amount: number
  ): readonly GameEffect[] {
    // Input validation: Ensure valid good type and positive amount
    if (!Object.values(GoodType).includes(good) || amount <= 0 || !Number.isInteger(amount)) {
      return [];
    }

    const player = this.selectCurrentPlayer(state);
    const unit = player?.units.find((candidate) => candidate.id === unitId);
    if (!player || !unit || !canTradeWithEurope(unit, player, state.map)) {
      return [];
    }

    const price = state.europePrices[good];
    const { goldGained, newPrice, actualSellAmount } = EconomySystem.sellGood(
      player,
      unit,
      good,
      amount,
      price
    );

    if (actualSellAmount <= 0) {
      return [];
    }

    unit.cargo.set(good, (unit.cargo.get(good) ?? 0) - actualSellAmount);
    player.gold += goldGained;
    state.europePrices[good] = newPrice;
    state.soldOnTurn[good] = state.turn;
    return [];
  }

  static buyGood(
    state: AuthoritativeGameState,
    unitId: string,
    good: GoodType,
    amount: number
  ): readonly GameEffect[] {
    // Input validation: Ensure valid good type and positive amount
    if (!Object.values(GoodType).includes(good) || amount <= 0 || !Number.isInteger(amount)) {
      return [];
    }

    const player = this.selectCurrentPlayer(state);
    const unit = player?.units.find((candidate) => candidate.id === unitId);
    if (!player || !unit || !canTradeWithEurope(unit, player, state.map)) {
      return [];
    }

    if (cargoUsed(unit) + amount > cargoHold(unit)) {
      return [];
    }

    const { cost, canAfford } = EconomySystem.buyGood(
      player.gold,
      good,
      amount,
      state.europePrices[good]
    );

    if (!canAfford) {
      return [];
    }

    unit.cargo.set(good, (unit.cargo.get(good) ?? 0) + amount);
    player.gold -= cost;
    return [];
  }

  static transferGood(
    state: AuthoritativeGameState,
    unitId: string,
    settlementId: string,
    good: GoodType,
    amount: number,
    direction: 'load' | 'unload',
  ): readonly GameEffect[] {
    if (!Object.values(GoodType).includes(good) || amount <= 0 || !Number.isInteger(amount)) {
      return [];
    }

    const player = this.selectCurrentPlayer(state);
    const unit = player?.units.find((candidate) => candidate.id === unitId);
    const settlement = player?.settlements.find((candidate) => candidate.id === settlementId);
    if (!player || !unit || !settlement || unit.inEurope === true || !isBeside(unit.position, settlement.position)) {
      return [];
    }

    if (direction === 'load') {
      const stock = settlement.inventory.get(good) ?? 0;
      const room = cargoHold(unit) - cargoUsed(unit);
      const moved = Math.min(amount, stock, room);
      if (moved <= 0) {
        return [];
      }
      settlement.inventory.set(good, stock - moved);
      unit.cargo.set(good, (unit.cargo.get(good) ?? 0) + moved);
      return [];
    }

    const carried = unit.cargo.get(good) ?? 0;
    const stored = settlement.inventory.get(good) ?? 0;
    const room = ProductionSystem.getInventoryCapacity(settlement) - stored;
    const moved = Math.min(amount, carried, Math.max(0, room));
    if (moved <= 0) {
      return [];
    }

    const remaining = carried - moved;
    if (remaining === 0) {
      unit.cargo.delete(good);
    } else {
      unit.cargo.set(good, remaining);
    }
    settlement.inventory.set(good, stored + moved);
    return [];
  }

  private static selectCurrentPlayer(state: AuthoritativeGameState): Player | undefined {
    return TraversalUtils.findPlayerById(state.players, state.currentPlayerId);
  }
}
