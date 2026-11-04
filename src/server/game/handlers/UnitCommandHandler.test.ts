import { describe, expect, it } from 'vitest';
import { createInitialAuthoritativeGameState } from '@server/game/createInitialAuthoritativeGameState';
import { UnitCommandHandler } from '@server/game/handlers/UnitCommandHandler';
import { createPlayer } from '@shared/game/entities/Player';
import { createSettlement } from '@shared/game/entities/Settlement';
import { createTile } from '@shared/game/entities/Tile';
import { createUnit } from '@shared/game/entities/Unit';
import { Nation, TerrainType, UnitType } from '@shared/game/entities/types';

function plainsRow(length: number): ReturnType<typeof createTile>[][] {
  const row = [];
  for (let x = 0; x < length; x += 1) {
    row.push(createTile(`${x}`, x, 0, TerrainType.PLAINS, 1));
  }
  return [row];
}

describe('UnitCommandHandler', () => {
  it('moves to a highlighted tile and spends the path cost', () => {
    const player = createPlayer('p1', 'Human', true, 0, Nation.ENGLAND);
    const unit = createUnit('u1', 'p1', 'Walker', UnitType.COLONIST, 0, 0, 3);
    player.units.push(unit);
    const settlement = createSettlement('c1', 'p1', 'Home', 1, 0, 1, 'EUROPEAN', 'STATE');
    player.settlements.push(settlement);

    const state = createInitialAuthoritativeGameState();
    state.players = [player];
    state.currentPlayerId = 'p1';
    state.map = plainsRow(4);

    const effects = UnitCommandHandler.moveUnit(state, 'u1', { x: 2, y: 0 });

    expect(effects[0]).toMatchObject({ type: 'unitMoved', fromX: 0, fromY: 0, toX: 2, toY: 0 });
    expect(unit.position).toEqual({ x: 2, y: 0 });
    expect(unit.movesRemaining).toBe(1);
    expect(player.units).toContain(unit);
    expect(settlement.units).toHaveLength(0);
  });

  it('rejects a destination outside the remaining move budget', () => {
    const player = createPlayer('p1', 'Human', true, 0, Nation.ENGLAND);
    const unit = createUnit('u1', 'p1', 'Walker', UnitType.COLONIST, 0, 0, 2);
    player.units.push(unit);

    const state = createInitialAuthoritativeGameState();
    state.players = [player];
    state.currentPlayerId = 'p1';
    state.map = plainsRow(5);

    const effects = UnitCommandHandler.moveUnit(state, 'u1', { x: 3, y: 0 });

    expect(effects).toEqual([]);
    expect(unit.position).toEqual({ x: 0, y: 0 });
    expect(unit.movesRemaining).toBe(2);
  });

  it('enters a settlement only when the destination is that settlement', () => {
    const player = createPlayer('p1', 'Human', true, 0, Nation.ENGLAND);
    const unit = createUnit('u1', 'p1', 'Walker', UnitType.COLONIST, 0, 0, 1);
    player.units.push(unit);
    const settlement = createSettlement('c1', 'p1', 'Home', 1, 0, 1, 'EUROPEAN', 'STATE');
    player.settlements.push(settlement);

    const state = createInitialAuthoritativeGameState();
    state.players = [player];
    state.currentPlayerId = 'p1';
    state.map = plainsRow(3);

    UnitCommandHandler.moveUnit(state, 'u1', { x: 1, y: 0 });

    expect(player.units).toHaveLength(0);
    expect(settlement.units.map((candidate) => candidate.id)).toEqual(['u1']);
  });
});
