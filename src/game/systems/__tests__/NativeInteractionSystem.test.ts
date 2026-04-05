import { describe, it, expect } from 'vitest';
import { NativeInteractionSystem } from '../NativeInteractionSystem';
import { Settlement } from '../../entities/Settlement';
import { Unit } from '../../entities/Unit';
import { Nation, Attitude, GoodType, UnitType } from '../../entities/types';

describe('NativeInteractionSystem', () => {
  const mockSettlement = new Settlement(
    's1',
    'npc-AZTEC',
    'Aztec Village',
    10,
    10,
    5,
    'NATIVE',
    'STATE'
  );
  mockSettlement.attitude = Attitude.FRIENDLY;
  mockSettlement.goods = new Map([[GoodType.FOOD, 100], [GoodType.FURS, 50]]);

  const mockUnit = new Unit('u1', 'player-1', UnitType.COLONIST, 10, 10, 3);
  mockUnit.cargo.set(GoodType.TRADE_GOODS, 50);

  it('should process trade correctly and shift attitude', () => {
    const { updatedSettlement, updatedUnit, goodReceived } = NativeInteractionSystem.trade(
      mockSettlement,
      mockUnit,
      GoodType.TRADE_GOODS
    );

    expect(updatedUnit.cargo.has(GoodType.TRADE_GOODS)).toBe(false);
    expect(updatedUnit.cargo.get(goodReceived)).toBeGreaterThan(0);
    expect(updatedSettlement.goods.get(GoodType.TRADE_GOODS)).toBe(50);
    expect(updatedSettlement.attitude).toBe(Attitude.NEUTRAL);
  });

  it('should convert colonist to pioneer during learning', () => {
    const { updatedSettlement, updatedUnit } = NativeInteractionSystem.learn(
      mockSettlement,
      mockUnit
    );

    expect(updatedUnit.type).toBe(UnitType.PIONEER);
    expect(updatedSettlement.attitude).toBe(Attitude.NEUTRAL);
  });

  it('should throw error when non-colonist tries to learn', () => {
    const soldier = new Unit('u2', 'player-1', UnitType.SOLDIER, 10, 10, 3);
    expect(() => NativeInteractionSystem.learn(mockSettlement, soldier)).toThrow();
  });

  it('should throw error when learning from non-friendly settlement', () => {
    const neutralSettlement = new Settlement(
      's2',
      'npc-IROQUOIS',
      'Sioux Village',
      20,
      20,
      5,
      'NATIVE',
      'TRIBE'
    );
    neutralSettlement.attitude = Attitude.NEUTRAL;
    expect(() => NativeInteractionSystem.learn(neutralSettlement, mockUnit)).toThrow();
  });

  it('should shift attitude correctly', () => {
    expect(NativeInteractionSystem.shiftAttitude(Attitude.FRIENDLY)).toBe(Attitude.NEUTRAL);
    expect(NativeInteractionSystem.shiftAttitude(Attitude.NEUTRAL)).toBe(Attitude.HOSTILE);
    expect(NativeInteractionSystem.shiftAttitude(Attitude.HOSTILE)).toBe(Attitude.HOSTILE);
  });
});
