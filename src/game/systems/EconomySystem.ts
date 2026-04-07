import type { Player } from '../entities/Player';
import type { Unit } from '../entities/Unit';
import { GoodType } from '../entities/types';

export class EconomySystem {
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
    const cargoAmount = unit.cargo.get(good) || 0;
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
    const cost = amount * currentPrice;
    return {
      cost,
      canAfford: playerGold >= cost
    };
  }
}
