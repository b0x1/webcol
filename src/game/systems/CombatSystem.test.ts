import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CombatSystem } from './CombatSystem';
import { createUnit } from './../entities/Unit';
import { createSettlement } from './../entities/Settlement';
import { createTile } from './../entities/Tile';
import { UnitType, TerrainType, BuildingType, Attitude, GoodType } from './../entities/types';

describe('CombatSystem', () => {
  let attacker: ReturnType<typeof createUnit>;
  let defenderUnit: ReturnType<typeof createUnit>;
  let npcSettlement: ReturnType<typeof createSettlement>;
  let playerSettlement: ReturnType<typeof createSettlement>;
  let flatTile: ReturnType<typeof createTile>;
  let hillTile: ReturnType<typeof createTile>;
  let mountainTile: ReturnType<typeof createTile>;

  beforeEach(() => {
    attacker = createUnit('u1', 'p1', 'Test Unit', UnitType.SOLDIER, 0, 0, 3);
    defenderUnit = createUnit('u2', 'p2', 'Test Unit', UnitType.COLONIST, 1, 1, 3);
    npcSettlement = createSettlement('s1', 'npc-IROQUOIS', 'Village', 1, 1, 5, 'NATIVE', 'TRIBE');
    playerSettlement = createSettlement('c1', 'p2', 'New Town', 1, 1, 1, 'EUROPEAN', 'STATE');

    flatTile = createTile('t1', 1, 1, TerrainType.PLAINS, 1);
    hillTile = createTile('t2', 1, 1, TerrainType.HILLS, 2);
    mountainTile = createTile('t3', 1, 1, TerrainType.MOUNTAINS, 3);
  });

  it('calculates soldier with muskets bonus correctly', () => {
    const random = vi.fn().mockReturnValue(1.0);

    attacker.cargo.set(GoodType.MUSKETS, 10);
    const result = CombatSystem.resolveCombat(attacker, defenderUnit, flatTile, undefined, random);

    expect(result.winner).toBe('attacker');
  });

  it('applies hills modifier to defender', () => {
    const random = vi.fn().mockReturnValue(0.5);

    const defenderSoldier = createUnit('u3', 'p2', 'Test Unit', UnitType.SOLDIER, 1, 1, 3);
    const result = CombatSystem.resolveCombat(attacker, defenderSoldier, hillTile, undefined, random);

    expect(result.winner).toBe('defender');
  });

  it('applies mountains modifier to defender', () => {
    const random = vi.fn().mockReturnValue(0.5);

    const result = CombatSystem.resolveCombat(attacker, defenderUnit, mountainTile, undefined, random);

    expect(result.winner).toBe('attacker');
  });

  it('applies stockade modifier in settlement', () => {
    const random = vi.fn().mockReturnValue(0.5);

    playerSettlement.buildings.push(BuildingType.STOCKADE);

    const result = CombatSystem.resolveCombat(attacker, defenderUnit, flatTile, playerSettlement, random);
    expect(result.winner).toBe('attacker');

    const attackerColonist = createUnit('u4', 'p1', 'Test Unit', UnitType.COLONIST, 0, 0, 3);
    const result2 = CombatSystem.resolveCombat(attackerColonist, defenderUnit, flatTile, playerSettlement, random);
    expect(result2.winner).toBe('defender');
  });

  it('applies hostile native modifier', () => {
    const random = vi.fn().mockReturnValue(0.5);

    npcSettlement.attitude = Attitude.HOSTILE;
    const result = CombatSystem.resolveCombat(attacker, npcSettlement, flatTile, undefined, random);
    expect(result.winner).toBe('attacker');

    const attackerColonist = createUnit('u4', 'p1', 'Test Unit', UnitType.COLONIST, 0, 0, 3);
    const result2 = CombatSystem.resolveCombat(attackerColonist, npcSettlement, flatTile, undefined, random);
    expect(result2.winner).toBe('defender');
  });

  it('handles ship combat', () => {
    const random = vi.fn();

    const attackerShip = createUnit('s1', 'p1', 'Test Unit', UnitType.SHIP, 0, 0, 6);
    const defenderShip = createUnit('s2', 'p2', 'Test Unit', UnitType.SHIP, 1, 1, 6);

    random.mockReturnValueOnce(1.0).mockReturnValueOnce(0.9);
    const result = CombatSystem.resolveCombat(attackerShip, defenderShip, flatTile, undefined, random);
    expect(result.winner).toBe('attacker');
  });
});
