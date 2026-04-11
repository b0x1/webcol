import { describe, it, expect} from 'vitest';
import { TurnEngine } from './TurnEngine';
import { createPlayer } from './../entities/Player';
import { createSettlement } from './../entities/Settlement';
import { GoodType, JobType, BuildingType, UnitType, Nation, TerrainType } from './../entities/types';
import { createUnit } from './../entities/Unit';
import type { Tile } from './../entities/Tile';

describe('Settlement Production and Building Logic', () => {
  it('calculates job-based production correctly', () => {
    const player = createPlayer('p1', 'Player 1', true, 1000, Nation.SPAIN);
    const settlement = createSettlement('c1', 'p1', 'Settlement 1', 0, 0, 1, 'EUROPEAN', 'STATE');
    const unit = createUnit('u1', 'p1', 'Test Unit', UnitType.COLONIST, 0, 0, 1);
    settlement.units.push(unit);
    settlement.workforce.set(unit.id, JobType.LUMBERJACK);
    player.settlements.push(settlement);

    const { players: updatedPlayers } = TurnEngine.runProduction([player], [], {});
    const updatedSettlement = updatedPlayers[0].settlements[0];

    // Lumberjack produces 3 LUMBER.
    // Pop 1 consumes 2 FOOD.
    expect(updatedSettlement.inventory.get(GoodType.LUMBER)).toBe(3);
    expect(updatedSettlement.inventory.get(GoodType.FOOD)).toBe(0); // 0 - 2, clamped to 0
  });

  it('calculates tile-based production correctly', () => {
    const player = createPlayer('p1', 'Player 1', true, 1000, Nation.SPAIN);
    const settlement = createSettlement('c1', 'p1', 'Settlement 1', 5, 5, 1, 'EUROPEAN', 'STATE');
    const unit = createUnit('u1', 'p1', 'Test Unit', UnitType.COLONIST, 5, 5, 1);
    settlement.units.push(unit);

    // Assign to tile 6,5 (Grassland -> Food)
    settlement.workforce.set(unit.id, '6,5');
    player.settlements.push(settlement);

    const map: Tile[][] = [];
    for (let y = 0; y < 10; y++) {
      map[y] = [];
      for (let x = 0; x < 10; x++) {
        map[y][x] = { id: `${x}-${y}`, position: { x, y }, terrainType: TerrainType.GRASSLAND, movementCost: 1, hasResource: null };
      }
    }

    const { players: updatedPlayers } = TurnEngine.runProduction([player], map, {});
    const updatedSettlement = updatedPlayers[0].settlements[0];

    // 1 worker on Grassland produces 3 FOOD.
    // Consumption: 1 pop * 2 = 2 FOOD.
    // Net: 3 - 2 = 1 FOOD.
    expect(updatedSettlement.inventory.get(GoodType.FOOD)).toBe(1);
  });

  it('applies building bonuses correctly', () => {
    const player = createPlayer('p1', 'Player 1', true, 1000, Nation.SPAIN);
    const settlement = createSettlement('c1', 'p1', 'Settlement 1', 0, 0, 1, 'EUROPEAN', 'STATE');
    settlement.buildings.push(BuildingType.LUMBER_MILL);
    settlement.buildings.push(BuildingType.IRON_WORKS);
    player.settlements.push(settlement);

    const { players: updatedPlayers } = TurnEngine.runProduction([player], [], {});
    const updatedSettlement = updatedPlayers[0].settlements[0];

    // Lumber Mill gives +2 LUMBER. Iron Works gives +2 ORE.
    expect(updatedSettlement.inventory.get(GoodType.LUMBER)).toBe(2);
    expect(updatedSettlement.inventory.get(GoodType.ORE)).toBe(2);
  });

  it('respects inventory caps and warehouse bonus', () => {
    const player = createPlayer('p1', 'Player 1', true, 1000, Nation.NORSEMEN);
    const settlement = createSettlement('c1', 'p1', 'Settlement 1', 0, 0, 1, 'EUROPEAN', 'STATE');
    settlement.inventory.set(GoodType.LUMBER, 250);
    player.settlements.push(settlement);

    // No warehouse, cap is 200
    let { players: updatedPlayers } = TurnEngine.runProduction([player], [], {});
    expect(updatedPlayers[0].settlements[0].inventory.get(GoodType.LUMBER)).toBe(200);

    // With warehouse, cap is 400
    settlement.buildings.push(BuildingType.WAREHOUSE);
    settlement.inventory.set(GoodType.LUMBER, 350);
    ({ players: updatedPlayers } = TurnEngine.runProduction([player], [], {}));
    expect(updatedPlayers[0].settlements[0].inventory.get(GoodType.LUMBER)).toBe(350);
  });

  it('processes printing press population growth', () => {
    const player = createPlayer('p1', 'Player 1', true, 1000, Nation.ENGLAND);
    const settlement = createSettlement('c1', 'p1', 'Settlement 1', 0, 0, 1, 'EUROPEAN', 'STATE');
    settlement.buildings.push(BuildingType.PRINTING_PRESS);
    player.settlements.push(settlement);

    const { players: updatedPlayers } = TurnEngine.runProduction([player], [], {});
    expect(updatedPlayers[0].settlements[0].population).toBe(2);
  });
});
