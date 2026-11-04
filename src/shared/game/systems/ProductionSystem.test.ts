import { describe, expect, it } from 'vitest';
import { COLONY_CONSTANTS } from '../constants';
import { createSettlement } from '../entities/Settlement';
import { createTile } from '../entities/Tile';
import { createUnit } from '../entities/Unit';
import { GoodType, ResourceType, TerrainType, UnitType } from '../entities/types';
import { ProductionSystem } from './ProductionSystem';

describe('ProductionSystem', () => {
  it('adds the resource bonus to field output', () => {
    const settlement = createSettlement('s1', 'p1', 'Home', 1, 1, 1, 'EUROPEAN', 'STATE');
    const worker = createUnit('u1', 'p1', 'Farmer', UnitType.COLONIST, 1, 1, 1);
    worker.occupation = { kind: 'FIELD_WORK', tileX: 0, tileY: 0 };
    settlement.units.push(worker);

    const plain = createTile('plain', 0, 0, TerrainType.GRASSLAND, 1);
    const bonus = createTile('bonus', 0, 0, TerrainType.GRASSLAND, 1, ResourceType.FERTILE_LAND);

    const base = ProductionSystem.calculateSettlementProduction(settlement, [[plain]], false);
    const boosted = ProductionSystem.calculateSettlementProduction(settlement, [[bonus]], false);

    const baseFood = base.netProduction.get(GoodType.FOOD) ?? 0;
    const boostedFood = boosted.netProduction.get(GoodType.FOOD) ?? 0;
    expect(boostedFood - baseFood).toBe(COLONY_CONSTANTS.RESOURCE_BONUS);
  });
});
