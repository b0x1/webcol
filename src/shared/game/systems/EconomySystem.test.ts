import { describe, expect, it } from 'vitest';
import { CARGO_CONSTANTS } from '../constants';
import { createPlayer } from '../entities/Player';
import { createUnit } from '../entities/Unit';
import { GoodType, Nation, UnitType } from '../entities/types';
import { EconomySystem } from './EconomySystem';

describe('EconomySystem', () => {
  const player = createPlayer('p1', 'Player', true, 100, Nation.ENGLAND);

  it('drops the price after a sale above the threshold', () => {
    const unit = createUnit('ship', 'p1', 'Ship', UnitType.SHIP, 0, 0, 1);
    unit.cargo.set(GoodType.LUMBER, CARGO_CONSTANTS.PRICE_DROP_THRESHOLD + 1);

    const result = EconomySystem.sellGood(
      player,
      unit,
      GoodType.LUMBER,
      CARGO_CONSTANTS.PRICE_DROP_THRESHOLD + 1,
      4,
    );

    expect(result.actualSellAmount).toBe(CARGO_CONSTANTS.PRICE_DROP_THRESHOLD + 1);
    expect(result.goldGained).toBe((CARGO_CONSTANTS.PRICE_DROP_THRESHOLD + 1) * 4);
    expect(result.newPrice).toBe(3);
  });

  it('keeps the price when the sale stays at the threshold', () => {
    const unit = createUnit('ship', 'p1', 'Ship', UnitType.SHIP, 0, 0, 1);
    unit.cargo.set(GoodType.LUMBER, CARGO_CONSTANTS.PRICE_DROP_THRESHOLD);

    const result = EconomySystem.sellGood(
      player,
      unit,
      GoodType.LUMBER,
      CARGO_CONSTANTS.PRICE_DROP_THRESHOLD,
      4,
    );

    expect(result.newPrice).toBe(4);
  });

  it('does not drop the price below the minimum', () => {
    const unit = createUnit('ship', 'p1', 'Ship', UnitType.SHIP, 0, 0, 1);
    unit.cargo.set(GoodType.LUMBER, 30);

    const result = EconomySystem.sellGood(player, unit, GoodType.LUMBER, 30, CARGO_CONSTANTS.MIN_PRICE);

    expect(result.newPrice).toBe(CARGO_CONSTANTS.MIN_PRICE);
  });
});
