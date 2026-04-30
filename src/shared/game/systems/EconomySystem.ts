import type { Player } from '../entities/Player';
import type { Unit } from '../entities/Unit';
import type { GoodType } from '../entities/types';

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

    if (actualSellAmount > 20) {
      newPrice = Math.max(1, currentPrice - 1);
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
}
