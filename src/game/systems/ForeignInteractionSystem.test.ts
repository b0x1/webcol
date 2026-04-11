import { describe, it, expect } from 'vitest';
import { ForeignInteractionSystem } from './ForeignInteractionSystem';
import { createSettlement } from './../entities/Settlement';
import { createUnit } from './../entities/Unit';
import { Attitude, GoodType, UnitType } from './../entities/types';

describe('ForeignInteractionSystem', () => {
  const getMockSettlement = () => {
    const s = createSettlement(
        's1',
        'ai-native-AZTEC',
        'Aztec Village',
        10,
        10,
        5,
        'NATIVE',
        'STATE'
      );
      s.attitude = Attitude.FRIENDLY;
      s.goods = new Map([[GoodType.FOOD, 100], [GoodType.FURS, 50]]);
      return s;
  };

  const getMockUnit = () => {
    const u = createUnit('u1', 'player-1', 'Test Unit', UnitType.COLONIST, 10, 10, 3);
    u.cargo.set(GoodType.TRADE_GOODS, 50);
    return u;
  };

  it('should process trade correctly and shift attitude', () => {
    const mockSettlement = getMockSettlement();
    const mockUnit = getMockUnit();

    const { updatedSettlement, updatedUnit, goodReceived } = ForeignInteractionSystem.trade(
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
    const mockSettlement = getMockSettlement();
    const mockUnit = getMockUnit();

    const { updatedSettlement, updatedUnit } = ForeignInteractionSystem.learn(
      mockSettlement,
      mockUnit
    );

    expect(updatedUnit.type).toBe(UnitType.PIONEER);
    expect(updatedSettlement.attitude).toBe(Attitude.NEUTRAL);
  });

  it('should throw error when non-colonist tries to learn', () => {
    const mockSettlement = getMockSettlement();
    const soldier = createUnit('u2', 'player-1', 'Test Unit', UnitType.SOLDIER, 10, 10, 3);
    expect(() => ForeignInteractionSystem.learn(mockSettlement, soldier)).toThrow();
  });

  it('should throw error when learning from non-friendly settlement', () => {
    const mockUnit = getMockUnit();
    const neutralSettlement = createSettlement(
      's2',
      'ai-native-IROQUOIS',
      'Sioux Village',
      20,
      20,
      5,
      'NATIVE',
      'TRIBE'
    );
    neutralSettlement.attitude = Attitude.NEUTRAL;
    expect(() => ForeignInteractionSystem.learn(neutralSettlement, mockUnit)).toThrow();
  });

  it('should shift attitude correctly', () => {
    expect(ForeignInteractionSystem.shiftAttitude(Attitude.FRIENDLY)).toBe(Attitude.NEUTRAL);
    expect(ForeignInteractionSystem.shiftAttitude(Attitude.NEUTRAL)).toBe(Attitude.HOSTILE);
    expect(ForeignInteractionSystem.shiftAttitude(Attitude.HOSTILE)).toBe(Attitude.HOSTILE);
  });
});
