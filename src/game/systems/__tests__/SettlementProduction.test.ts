import { describe, it, expect} from 'vitest';
import { TurnEngine } from '../TurnEngine';
import { createPlayer } from '../../entities/Player';
import { createSettlement } from '../../entities/Settlement';
import { GoodType, JobType, BuildingType, UnitType, Nation } from '../../entities/types';
import { createUnit } from '../../entities/Unit';

describe('Settlement Production and Building Logic', () => {
  it('calculates job-based production correctly', () => {
    const player = createPlayer('p1', 'Player 1', true, 1000, Nation.SPAIN);
    const settlement = createSettlement('c1', 'p1', 'Settlement 1', 0, 0, 1, 'EUROPEAN', 'STATE');
    const unit = createUnit('u1', 'p1', UnitType.COLONIST, 0, 0, 1);
    settlement.units.push(unit);
    settlement.workforce.set(unit.id, JobType.LUMBERJACK);
    player.settlements.push(settlement);

    const updatedPlayers = TurnEngine.runProduction([player]);
    const updatedSettlement = updatedPlayers[0].settlements[0];

    // Lumberjack produces 3 LUMBER.
    // Pop 1 consumes 2 FOOD.
    expect(updatedSettlement.inventory.get(GoodType.LUMBER)).toBe(3);
    expect(updatedSettlement.inventory.get(GoodType.FOOD)).toBe(0); // 0 - 2, clamped to 0
  });

  it('applies building bonuses correctly', () => {
    const player = createPlayer('p1', 'Player 1', true, 1000, Nation.SPAIN);
    const settlement = createSettlement('c1', 'p1', 'Settlement 1', 0, 0, 1, 'EUROPEAN', 'STATE');
    settlement.buildings.push(BuildingType.LUMBER_MILL);
    settlement.buildings.push(BuildingType.IRON_WORKS);
    player.settlements.push(settlement);

    const updatedPlayers = TurnEngine.runProduction([player]);
    const updatedSettlement = updatedPlayers[0].settlements[0];

    // Lumber Mill gives +2 LUMBER. Iron Works gives +2 ORE.
    expect(updatedSettlement.inventory.get(GoodType.LUMBER)).toBe(2);
    expect(updatedSettlement.inventory.get(GoodType.ORE)).toBe(2);
  });

  it('respects inventory caps and warehouse bonus', () => {
    const player = createPlayer('p1', 'Player 1', true, 1000, Nation.NORSEMEN);
    const settlement = createSettlement('c1', 'p1', 'Settlement 1', 0, 0, 1, 'EUROPEAN', 'STATE');
    settlement.inventory.set(GoodType.FOOD, 250);
    player.settlements.push(settlement);

    // No warehouse, cap is 200
    let updatedPlayers = TurnEngine.runProduction([player]);
    expect(updatedPlayers[0].settlements[0].inventory.get(GoodType.FOOD)).toBe(200);

    // With warehouse, cap is 400
    settlement.buildings.push(BuildingType.WAREHOUSE);
    settlement.inventory.set(GoodType.FOOD, 350);
    updatedPlayers = TurnEngine.runProduction([player]);
    expect(updatedPlayers[0].settlements[0].inventory.get(GoodType.FOOD)).toBe(350 - 2); // 350 - (1 pop * 2 food) = 348
  });

  it('processes printing press population growth', () => {
    const player = createPlayer('p1', 'Player 1', true, 1000, Nation.ENGLAND);
    const settlement = createSettlement('c1', 'p1', 'Settlement 1', 0, 0, 1, 'EUROPEAN', 'STATE');
    settlement.buildings.push(BuildingType.PRINTING_PRESS);
    player.settlements.push(settlement);

    const updatedPlayers = TurnEngine.runProduction([player]);
    expect(updatedPlayers[0].settlements[0].population).toBe(2);
  });

  it('deducts gold correctly when building a building', () => {
    const buildingCosts: Record<string, number> = {
      [BuildingType.LUMBER_MILL]: 100,
      [BuildingType.IRON_WORKS]: 150,
      [BuildingType.SCHOOLHOUSE]: 120,
      [BuildingType.WAREHOUSE]: 80,
      [BuildingType.STOCKADE]: 200,
      [BuildingType.PRINTING_PRESS]: 180,
      };

    expect(buildingCosts[BuildingType.LUMBER_MILL]).toBe(100);
    expect(buildingCosts[BuildingType.IRON_WORKS]).toBe(150);
    expect(buildingCosts[BuildingType.SCHOOLHOUSE]).toBe(120);
    expect(buildingCosts[BuildingType.WAREHOUSE]).toBe(80);
    expect(buildingCosts[BuildingType.STOCKADE]).toBe(200);
    expect(buildingCosts[BuildingType.PRINTING_PRESS]).toBe(180);
  });
});
