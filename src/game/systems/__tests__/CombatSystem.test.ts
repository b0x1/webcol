import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CombatSystem } from '../CombatSystem';
import { Unit } from '../../entities/Unit';
import { NativeSettlement } from '../../entities/NativeSettlement';
import { Tile } from '../../entities/Tile';
import { Colony } from '../../entities/Colony';
import { UnitType, TerrainType, BuildingType, Attitude, GoodType, Tribe } from '../../entities/types';

describe('CombatSystem', () => {
  let attacker: Unit;
  let defenderUnit: Unit;
  let settlement: NativeSettlement;
  let colony: Colony;
  let flatTile: Tile;
  let hillTile: Tile;
  let mountainTile: Tile;

  beforeEach(() => {
    attacker = new Unit('u1', 'p1', UnitType.SOLDIER, 0, 0, 3);
    defenderUnit = new Unit('u2', 'p2', UnitType.COLONIST, 1, 1, 3);
    settlement = new NativeSettlement('s1', 'Village', Tribe.IROQUOIS, 1, 1, 5, Attitude.NEUTRAL);
    colony = new Colony('c1', 'p2', 'New Town', 1, 1, 1);

    flatTile = new Tile('t1', 1, 1, TerrainType.PLAINS, 1);
    hillTile = new Tile('t2', 1, 1, TerrainType.HILLS, 2);
    mountainTile = new Tile('t3', 1, 1, TerrainType.MOUNTAINS, 3);

    // Reset random to predictable value for tests where we want to test modifiers not the roll itself
    // However, since it's Math.random() * strength, we can't easily mock it to be "fixed" without mocking Math.random
  });

  it('calculates soldier with muskets bonus correctly', () => {
    // We mock Math.random to return 1.0 to get deterministic results for strength comparison
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(1.0);

    attacker.cargo.set(GoodType.MUSKETS, 10);
    // Soldier base 3 * 1.3 = 3.9
    // Defender colonist base 1
    const result = CombatSystem.resolveCombat(attacker, defenderUnit, flatTile);

    // In our implementation, attackerRoll = 1.0 * 3.9, defenderRoll = 1.0 * 1.0
    expect(result.winner).toBe('attacker');

    randomSpy.mockRestore();
  });

  it('applies hills modifier to defender', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

    // Attacker soldier: 3 * 0.5 = 1.5
    // Defender soldier on hills: (3 * 1.5) * 0.5 = 2.25
    const defenderSoldier = new Unit('u3', 'p2', UnitType.SOLDIER, 1, 1, 3);
    const result = CombatSystem.resolveCombat(attacker, defenderSoldier, hillTile);

    expect(result.winner).toBe('defender');

    randomSpy.mockRestore();
  });

  it('applies mountains modifier to defender', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

    // Attacker soldier: 3 * 0.5 = 1.5
    // Defender colonist on mountains: (1 * 2.0) * 0.5 = 1.0
    const result = CombatSystem.resolveCombat(attacker, defenderUnit, mountainTile);

    expect(result.winner).toBe('attacker');

    randomSpy.mockRestore();
  });

  it('applies stockade modifier in colony', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

    colony.buildings.push(BuildingType.STOCKADE);
    // Attacker soldier: 3 * 0.5 = 1.5
    // Defender colonist in colony with stockade: (1 * 1.5) * 0.5 = 0.75
    // Wait, the rule is "Defender in Colony with Stockade: ×1.5"
    // Our implementation:
    // if (defenderColony && defenderColony.buildings.includes(BuildingType.STOCKADE)) { defenderModifier *= 1.5; }

    const result = CombatSystem.resolveCombat(attacker, defenderUnit, flatTile, colony);
    expect(result.winner).toBe('attacker');

    // Let's test a case where defender wins due to stockade
    // Attacker colonist: 1 * 0.5 = 0.5
    // Defender colonist with stockade: (1 * 1.5) * 0.5 = 0.75
    const attackerColonist = new Unit('u4', 'p1', UnitType.COLONIST, 0, 0, 3);
    const result2 = CombatSystem.resolveCombat(attackerColonist, defenderUnit, flatTile, colony);
    expect(result2.winner).toBe('defender');

    randomSpy.mockRestore();
  });

  it('applies stockade modifier to unit defending a colony', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

    colony.buildings.push(BuildingType.STOCKADE);
    // Attacker soldier: 3 * 0.5 = 1.5
    // Defender colonist in colony with stockade: (1 * 1.5) * 0.5 = 0.75
    // Attacker wins
    const result = CombatSystem.resolveCombat(attacker, defenderUnit, flatTile, colony);
    expect(result.winner).toBe('attacker');

    // Attacker colonist: 1 * 0.5 = 0.5
    // Defender colonist with stockade: 0.75
    // Defender wins
    const attackerColonist = new Unit('u4', 'p1', UnitType.COLONIST, 0, 0, 3);
    const result2 = CombatSystem.resolveCombat(attackerColonist, defenderUnit, flatTile, colony);
    expect(result2.winner).toBe('defender');

    randomSpy.mockRestore();
  });

  it('applies hostile native modifier', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

    settlement.attitude = Attitude.HOSTILE;
    // Attacker soldier: 3 * 0.5 = 1.5
    // Native settlement base 2 * 1.2 (hostile) * 0.5 = 1.2
    const result = CombatSystem.resolveCombat(attacker, settlement, flatTile);
    expect(result.winner).toBe('attacker');

    // Attacker colonist: 1 * 0.5 = 0.5
    // Native settlement base 2 * 1.2 * 0.5 = 1.2
    const attackerColonist = new Unit('u4', 'p1', UnitType.COLONIST, 0, 0, 3);
    const result2 = CombatSystem.resolveCombat(attackerColonist, settlement, flatTile);
    expect(result2.winner).toBe('defender');

    randomSpy.mockRestore();
  });

  it('handles ship combat', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(1.0);

    const attackerShip = new Unit('s1', 'p1', UnitType.SHIP, 0, 0, 6);
    const defenderShip = new Unit('s2', 'p2', UnitType.SHIP, 1, 1, 6);

    // Both base 2. Attacker wins if rolls are equal (attackerRoll > defenderRoll is false if equal, but wait)
    // Actually attackerRoll > defenderRoll is what I wrote.

    randomSpy.mockReturnValueOnce(1.0).mockReturnValueOnce(0.9);
    const result = CombatSystem.resolveCombat(attackerShip, defenderShip, flatTile);
    expect(result.winner).toBe('attacker');

    randomSpy.mockRestore();
  });
});
