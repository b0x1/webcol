import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CombatSystem } from '../CombatSystem';
import { createUnit } from '../../entities/Unit';
import { createSettlement } from '../../entities/Settlement';
import { createTile } from '../../entities/Tile';
import { UnitType, TerrainType, BuildingType, Attitude, GoodType } from '../../entities/types';

describe('CombatSystem', () => {
  let attacker: any;
  let defenderUnit: any;
  let npcSettlement: any;
  let playerSettlement: any;
  let flatTile: any;
  let hillTile: any;
  let mountainTile: any;

  beforeEach(() => {
    attacker = createUnit('u1', 'p1', UnitType.SOLDIER, 0, 0, 3);
    defenderUnit = createUnit('u2', 'p2', UnitType.COLONIST, 1, 1, 3);
    npcSettlement = createSettlement('s1', 'npc-IROQUOIS', 'Village', 1, 1, 5, 'NATIVE', 'TRIBE');
    playerSettlement = createSettlement('c1', 'p2', 'New Town', 1, 1, 1, 'EUROPEAN', 'STATE');

    flatTile = createTile('t1', 1, 1, TerrainType.PLAINS, 1);
    hillTile = createTile('t2', 1, 1, TerrainType.HILLS, 2);
    mountainTile = createTile('t3', 1, 1, TerrainType.MOUNTAINS, 3);
  });

  it('calculates soldier with muskets bonus correctly', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(1.0);

    attacker.cargo.set(GoodType.MUSKETS, 10);
    const result = CombatSystem.resolveCombat(attacker, defenderUnit, flatTile);

    expect(result.winner).toBe('attacker');

    randomSpy.mockRestore();
  });

  it('applies hills modifier to defender', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const defenderSoldier = createUnit('u3', 'p2', UnitType.SOLDIER, 1, 1, 3);
    const result = CombatSystem.resolveCombat(attacker, defenderSoldier, hillTile);

    expect(result.winner).toBe('defender');

    randomSpy.mockRestore();
  });

  it('applies mountains modifier to defender', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const result = CombatSystem.resolveCombat(attacker, defenderUnit, mountainTile);

    expect(result.winner).toBe('attacker');

    randomSpy.mockRestore();
  });

  it('applies stockade modifier in settlement', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

    playerSettlement.buildings.push(BuildingType.STOCKADE);

    const result = CombatSystem.resolveCombat(attacker, defenderUnit, flatTile, playerSettlement);
    expect(result.winner).toBe('attacker');

    const attackerColonist = createUnit('u4', 'p1', UnitType.COLONIST, 0, 0, 3);
    const result2 = CombatSystem.resolveCombat(attackerColonist, defenderUnit, flatTile, playerSettlement);
    expect(result2.winner).toBe('defender');

    randomSpy.mockRestore();
  });

  it('applies hostile native modifier', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

    npcSettlement.attitude = Attitude.HOSTILE;
    const result = CombatSystem.resolveCombat(attacker, npcSettlement, flatTile);
    expect(result.winner).toBe('attacker');

    const attackerColonist = createUnit('u4', 'p1', UnitType.COLONIST, 0, 0, 3);
    const result2 = CombatSystem.resolveCombat(attackerColonist, npcSettlement, flatTile);
    expect(result2.winner).toBe('defender');

    randomSpy.mockRestore();
  });

  it('handles ship combat', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(1.0);

    const attackerShip = createUnit('s1', 'p1', UnitType.SHIP, 0, 0, 6);
    const defenderShip = createUnit('s2', 'p2', UnitType.SHIP, 1, 1, 6);

    randomSpy.mockReturnValueOnce(1.0).mockReturnValueOnce(0.9);
    const result = CombatSystem.resolveCombat(attackerShip, defenderShip, flatTile);
    expect(result.winner).toBe('attacker');

    randomSpy.mockRestore();
  });
});
