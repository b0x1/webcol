import { describe, it, expect } from 'vitest';
import { Player } from '../Player';
import { Unit } from '../Unit';
import { Settlement } from '../Settlement';
import { UnitType, Nation } from '../types';

describe('Player', () => {
  it('should initialize with correct values', () => {
    const player = new Player('player-1', 'Human Player', true, 500, Nation.ENGLAND);
    expect(player.id).toBe('player-1');
    expect(player.name).toBe('Human Player');
    expect(player.isHuman).toBe(true);
    expect(player.gold).toBe(500);
    expect(player.nation).toBe(Nation.ENGLAND);
  });

  it('should have empty units and settlements arrays by default', () => {
    const player = new Player('p1', 'AI', false, 0, Nation.SPAIN);
    expect(player.units).toEqual([]);
    expect(player.settlements).toEqual([]);
  });

  it('should be able to hold units and settlements', () => {
    const player = new Player('p1', 'Human', true, 100, Nation.FRANCE);
    const unit = new Unit('u1', 'p1', UnitType.PIONEER, 1, 1, 3);
    const settlement = new Settlement('c1', 'p1', 'Port Royal', 10, 10, 1, 'EUROPEAN', 'STATE');
    player.units.push(unit);
    player.settlements.push(settlement);
    expect(player.units[0]).toBe(unit);
    expect(player.settlements[0]).toBe(settlement);
  });
});
