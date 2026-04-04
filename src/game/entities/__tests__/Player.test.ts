import { describe, it, expect } from 'vitest';
import { Player } from '../Player';
import { Unit } from '../Unit';
import { Colony } from '../Colony';
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

  it('should have empty units and colonies arrays by default', () => {
    const player = new Player('p1', 'AI', false, 0, Nation.SPAIN);
    expect(player.units).toEqual([]);
    expect(player.colonies).toEqual([]);
  });

  it('should be able to hold units and colonies', () => {
    const player = new Player('p1', 'Human', true, 100, Nation.FRANCE);
    const unit = new Unit('u1', 'p1', UnitType.PIONEER, 1, 1, 3);
    const colony = new Colony('c1', 'p1', 'Port Royal', 10, 10, 1);
    player.units.push(unit);
    player.colonies.push(colony);
    expect(player.units[0]).toBe(unit);
    expect(player.colonies[0]).toBe(colony);
  });
});
