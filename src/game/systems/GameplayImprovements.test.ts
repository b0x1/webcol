import { describe, it, expect } from 'vitest';
import { TurnEngine } from './TurnEngine';
import { createPlayer } from './../entities/Player';
import { createSettlement } from './../entities/Settlement';
import { createUnit } from './../entities/Unit';
import { GoodType, UnitType, JobType, Nation, BuildingType } from './../entities/types';
import { COLONY_CONSTANTS } from './../constants';

describe('TurnEngine Production', () => {
  it('should promote a colonist to an expert after 20 turns in a job', () => {
    const player = createPlayer('p1', 'Player 1', true, 0, Nation.ENGLAND);
    const settlement = createSettlement('s1', 'p1', 'Settlement 1', 5, 5, 1, 'EUROPEAN', 'STATE');
    const unit = createUnit('u1', 'p1', 'Test Unit', UnitType.COLONIST, 5, 5, 1);
    unit.turnsInJob = COLONY_CONSTANTS.EXPERT_PROMOTION_TURNS - 1;
    unit.occupation = JobType.LUMBERJACK;

    settlement.units.push(unit);
    player.settlements.push(settlement);

    const { players: updatedPlayers, effects } = TurnEngine.runProduction([player], [], {}, () => 0.5, (p) => `${p}-test`);
    const updatedUnit = updatedPlayers[0]?.settlements[0]?.units[0];
    if (!updatedUnit) throw new Error('Unit not found');

    expect(updatedUnit.turnsInJob).toBe(COLONY_CONSTANTS.EXPERT_PROMOTION_TURNS);
    expect(updatedUnit.expertise).toBe(JobType.LUMBERJACK);
    expect(effects).toContainEqual({
      type: 'notification',
      message: `${unit.type} has become an expert ${JobType.LUMBERJACK}!`,
    });
  });

  it('should produce refined goods (Blacksmith: Ore -> Tools)', () => {
    const player = createPlayer('p1', 'Player 1', true, 0, Nation.ENGLAND);
    const settlement = createSettlement('s1', 'p1', 'Settlement 1', 5, 5, 1, 'EUROPEAN', 'STATE');
    const unit = createUnit('u1', 'p1', 'Test Unit', UnitType.COLONIST, 5, 5, 1);
    unit.occupation = JobType.BLACKSMITH;

    settlement.inventory.set(GoodType.ORE, 10);
    settlement.buildings.push(BuildingType.BLACKSMITHS_HOUSE);
    settlement.units.push(unit);
    player.settlements.push(settlement);

    const { players: updatedPlayers } = TurnEngine.runProduction([player], [], {}, () => 0.5, (p) => `${p}-test`);
    const updatedSettlement = updatedPlayers[0]?.settlements[0];
    if (!updatedSettlement) throw new Error('Settlement not found');

    // Production per worker is 3
    expect(updatedSettlement.inventory.get(GoodType.ORE)).toBe(7);
    expect(updatedSettlement.inventory.get(GoodType.TOOLS)).toBe(3);
  });

  it('should use hammers to build a building from the production queue', () => {
    const player = createPlayer('p1', 'Player 1', true, 0, Nation.ENGLAND);
    const settlement = createSettlement('s1', 'p1', 'Settlement 1', 5, 5, 1, 'EUROPEAN', 'STATE');
    const unit = createUnit('u1', 'p1', 'Test Unit', UnitType.COLONIST, 5, 5, 1);
    unit.occupation = JobType.CARPENTER;

    // Warehouse costs 40 hammers, 0 tools
    settlement.productionQueue.push(BuildingType.WAREHOUSE);
    settlement.hammers = 38;
    settlement.inventory.set(GoodType.LUMBER, 10);
    settlement.buildings.push(BuildingType.CARPENTERS_SHOP);

    settlement.units.push(unit);
    player.settlements.push(settlement);

    const { players: updatedPlayers } = TurnEngine.runProduction([player], [], {}, () => 0.5, (p) => `${p}-test`);
    const updatedSettlement = updatedPlayers[0]?.settlements[0];
    if (!updatedSettlement) throw new Error('Settlement not found');

    // 38 + 3 = 41 hammers. 41 - 40 = 1 hammer remaining.
    expect(updatedSettlement.hammers).toBe(1);
    expect(updatedSettlement.buildings).toContain(BuildingType.WAREHOUSE);
    expect(updatedSettlement.productionQueue).not.toContain(BuildingType.WAREHOUSE);
  });

  it('should grow population when food exceeds threshold', () => {
    const player = createPlayer('p1', 'Player 1', true, 0, Nation.ENGLAND);
    const settlement = createSettlement('s1', 'p1', 'Settlement 1', 5, 5, 1, 'EUROPEAN', 'STATE');

    settlement.inventory.set(GoodType.FOOD, 205);
    player.settlements.push(settlement);

    const { players: updatedPlayers } = TurnEngine.runProduction([player], [], {}, () => 0.5, (p) => `${p}-test`);
    const updatedPlayer0 = updatedPlayers[0];
    const updatedSettlement = updatedPlayer0?.settlements[0];
    if (!updatedSettlement) throw new Error('Settlement not found');

    expect(updatedSettlement.population).toBe(0);
    expect(updatedSettlement.inventory.get(GoodType.FOOD)).toBe(5); // 205 - 200 (threshold)
    expect(updatedSettlement.units.length).toBe(0);
    expect(updatedPlayer0.units.length).toBe(1); // Born unit is outside
  });
});
