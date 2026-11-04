import { describe, expect, it } from 'vitest';
import { createInitialAuthoritativeGameState } from '@server/game/createInitialAuthoritativeGameState';
import { CombatCommandHandler } from '@server/game/handlers/CombatCommandHandler';
import { createPlayer } from '@shared/game/entities/Player';
import { createSettlement } from '@shared/game/entities/Settlement';
import { createTile } from '@shared/game/entities/Tile';
import { createUnit } from '@shared/game/entities/Unit';
import { Nation, TerrainType, UnitType } from '@shared/game/entities/types';

describe('CombatCommandHandler', () => {
  it('rejects combat that is not on a neighboring tile', () => {
    const attackerOwner = createPlayer('p1', 'Human', true, 0, Nation.ENGLAND);
    const defenderOwner = createPlayer('p2', 'Other', false, 0, Nation.SPAIN);
    const attacker = createUnit('a', 'p1', 'Soldier', UnitType.SOLDIER, 0, 0, 3);
    const defender = createUnit('d', 'p2', 'Colonist', UnitType.COLONIST, 2, 0, 3);
    attackerOwner.units.push(attacker);
    defenderOwner.units.push(defender);

    const state = createInitialAuthoritativeGameState();
    state.players = [attackerOwner, defenderOwner];
    state.currentPlayerId = 'p1';
    state.map = [[
      createTile('0', 0, 0, TerrainType.PLAINS, 1),
      createTile('1', 1, 0, TerrainType.PLAINS, 1),
      createTile('2', 2, 0, TerrainType.PLAINS, 1),
    ]];

    const effects = CombatCommandHandler.resolveCombat(state, 'a', { x: 2, y: 0 }, () => 1);
    expect(effects).toEqual([]);
    expect(attacker.movesRemaining).toBe(3);
    expect(defenderOwner.units).toHaveLength(1);
  });

  it('fights a garrison before taking the colony', () => {
    const attackerOwner = createPlayer('p1', 'Human', true, 0, Nation.ENGLAND);
    const defenderOwner = createPlayer('p2', 'Other', true, 0, Nation.SPAIN);
    const attacker = createUnit('a', 'p1', 'Soldier', UnitType.SOLDIER, 0, 0, 3);
    const garrison = createUnit('g', 'p2', 'Guard', UnitType.COLONIST, 1, 0, 3);
    attackerOwner.units.push(attacker);
    const colony = createSettlement('c', 'p2', 'Town', 1, 0, 1, 'EUROPEAN', 'STATE');
    colony.units.push(garrison);
    defenderOwner.settlements.push(colony);

    const state = createInitialAuthoritativeGameState();
    state.players = [attackerOwner, defenderOwner];
    state.currentPlayerId = 'p1';
    state.map = [[
      createTile('0', 0, 0, TerrainType.PLAINS, 1),
      createTile('1', 1, 0, TerrainType.PLAINS, 1),
    ]];

    CombatCommandHandler.resolveCombat(state, 'a', { x: 1, y: 0 }, () => 1);

    expect(colony.ownerId).toBe('p2');
    expect(colony.units).toHaveLength(0);
    expect(attacker.position).toEqual({ x: 0, y: 0 });
    expect(attacker.movesRemaining).toBe(0);
  });
});
