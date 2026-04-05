import { describe, it, expect } from 'vitest';
import { Settlement } from '../Settlement';
import { BuildingType, GoodType, UnitType, Culture, Organization } from '../types';

describe('Settlement', () => {
  it('should initialize with correct values', () => {
    const settlement = new Settlement('settlement-1', 'player-1', 'Jamestown', 15, 20, 3, Culture.EUROPEAN, Organization.STATE);
    expect(settlement.id).toBe('settlement-1');
    expect(settlement.ownerId).toBe('player-1');
    expect(settlement.name).toBe('Jamestown');
    expect(settlement.x).toBe(15);
    expect(settlement.y).toBe(20);
    expect(settlement.population).toBe(3);
  });

  it('should have empty buildings, inventory, and production queue by default', () => {
    const settlement = new Settlement('col-1', 'p-1', 'A', 0, 0, 1, Culture.EUROPEAN, Organization.STATE);
    expect(settlement.buildings).toEqual([]);
    expect(settlement.inventory.size).toBe(0);
    expect(settlement.productionQueue).toEqual([]);
  });

  it('should be able to add buildings', () => {
    const settlement = new Settlement('col-1', 'p-1', 'A', 0, 0, 1, Culture.EUROPEAN, Organization.STATE);
    settlement.buildings.push(BuildingType.TOWN_HALL);
    expect(settlement.buildings).toContain(BuildingType.TOWN_HALL);
  });

  it('should be able to add goods to inventory', () => {
    const settlement = new Settlement('col-1', 'p-1', 'A', 0, 0, 1, Culture.EUROPEAN, Organization.STATE);
    settlement.inventory.set(GoodType.LUMBER, 50);
    expect(settlement.inventory.get(GoodType.LUMBER)).toBe(50);
  });

  it('should be able to add items to the production queue', () => {
    const settlement = new Settlement('col-1', 'p-1', 'A', 0, 0, 1, Culture.EUROPEAN, Organization.STATE);
    settlement.productionQueue.push(UnitType.SOLDIER);
    settlement.productionQueue.push(BuildingType.WAREHOUSE);
    expect(settlement.productionQueue).toEqual([UnitType.SOLDIER, BuildingType.WAREHOUSE]);
  });
});
