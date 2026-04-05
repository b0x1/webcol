import { describe, it, expect } from 'vitest';
import { NativeInteractionSystem } from '../NativeInteractionSystem';
import { createSettlement } from '../../entities/Settlement';
import { createUnit } from '../../entities/Unit';
import { Attitude, GoodType, UnitType } from '../../entities/types';

describe('NativeInteractionSystem', () => {
  const getMockSettlement = () => {
    const s = createSettlement(
        's1',
        'npc-AZTEC',
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
    const u = createUnit('u1', 'player-1', UnitType.COLONIST, 10, 10, 3);
    u.cargo.set(GoodType.TRADE_GOODS, 50);
    return u;
  };

  it('should process trade correctly and shift attitude', () => {
    const mockSettlement = getMockSettlement();
    const mockUnit = getMockUnit();

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
    const mockSettlement = getMockSettlement();
    const mockUnit = getMockUnit();

    const { updatedSettlement, updatedUnit } = NativeInteractionSystem.learn(
      mockSettlement,
      mockUnit
    );

    expect(updatedUnit.type).toBe(UnitType.PIONEER);
    expect(updatedSettlement.attitude).toBe(Attitude.NEUTRAL);
  });

  it('should throw error when non-colonist tries to learn', () => {
    const mockSettlement = getMockSettlement();
    const soldier = createUnit('u2', 'player-1', UnitType.SOLDIER, 10, 10, 3);
    expect(() => NativeInteractionSystem.learn(mockSettlement, soldier)).toThrow();
  });

  it('should throw error when learning from non-friendly settlement', () => {
    const mockUnit = getMockUnit();
    const neutralSettlement = createSettlement(
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
