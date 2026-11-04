import type { Player } from '../entities/Player';
import type { Unit } from '../entities/Unit';
import { GoodType } from '../entities/types';
import { CARGO_CONSTANTS } from '../constants';

/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
export class EconomySystem {
  private constructor() {
    // Static utility class
  }

  static sellGood(
    _player: Player,
    unit: Unit,
    good: GoodType,
    amount: number,
    currentPrice: number
  ): {
    goldGained: number;
    newPrice: number;
    actualSellAmount: number;
  } {
    if (amount <= 0 || !Number.isInteger(amount)) {
      return { goldGained: 0, newPrice: currentPrice, actualSellAmount: 0 };
    }

    const cargoAmount = unit.cargo.get(good) ?? 0;
    const actualSellAmount = Math.min(amount, cargoAmount);

    if (actualSellAmount <= 0) {
      return { goldGained: 0, newPrice: currentPrice, actualSellAmount: 0 };
    }

    const goldGained = actualSellAmount * currentPrice;
    let newPrice = currentPrice;

    if (actualSellAmount > CARGO_CONSTANTS.PRICE_DROP_THRESHOLD) {
      newPrice = Math.max(CARGO_CONSTANTS.MIN_PRICE, currentPrice - 1);
    }

    return { goldGained, newPrice, actualSellAmount };
  }

  static buyGood(
    playerGold: number,
    _good: GoodType,
    amount: number,
    currentPrice: number
  ): {
    cost: number;
    canAfford: boolean;
  } {
    if (amount <= 0 || !Number.isInteger(amount)) {
      return { cost: 0, canAfford: false };
    }

    const cost = amount * currentPrice;
    return {
      cost,
      canAfford: playerGold >= cost
    };
  }

  static recoverUnsoldPrices(
    prices: Record<GoodType, number>,
    soldOnTurn: Partial<Record<GoodType, number>>,
    turn: number,
  ): Record<GoodType, number> {
    const next = { ...prices };
    for (const good of Object.values(GoodType)) {
      if (soldOnTurn[good] === turn) {
        continue;
      }
      next[good] = Math.min(CARGO_CONSTANTS.MAX_PRICE, next[good] + 1);
    }
    return next;
  }
}
