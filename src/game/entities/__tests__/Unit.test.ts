import { describe, it, expect } from 'vitest';
import { createUnit } from '../Unit';
import { UnitType, GoodType } from '../types';

describe('Unit', () => {
  it('should initialize with correct values', () => {
    const unit = createUnit('unit-1', 'player-1', UnitType.COLONIST, 10, 10, 3);
    expect(unit.id).toBe('unit-1');
    expect(unit.ownerId).toBe('player-1');
    expect(unit.type).toBe(UnitType.COLONIST);
    expect(unit.x).toBe(10);
    expect(unit.y).toBe(10);
    expect(unit.movesRemaining).toBe(3);
  });

  it('should have an empty cargo map upon initialization', () => {
    const unit = createUnit('unit-1', 'player-1', UnitType.SHIP, 0, 0, 5);
    expect(unit.cargo instanceof Map).toBe(true);
    expect(unit.cargo.size).toBe(0);
  });

  it('should be able to store and retrieve cargo', () => {
    const unit = createUnit('ship-1', 'player-1', UnitType.SHIP, 0, 0, 5);
    unit.cargo.set(GoodType.FOOD, 100);
    expect(unit.cargo.get(GoodType.FOOD)).toBe(100);
  });
});
