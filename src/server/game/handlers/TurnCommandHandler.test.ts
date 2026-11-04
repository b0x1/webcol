import { describe, expect, it } from 'vitest';
import { createInitialAuthoritativeGameState } from '@server/game/createInitialAuthoritativeGameState';
import { TurnCommandHandler } from '@server/game/handlers/TurnCommandHandler';
import { COLONY_CONSTANTS } from '@shared/game/constants';
import { createPlayer } from '@shared/game/entities/Player';
import { createSettlement } from '@shared/game/entities/Settlement';
import { createTile } from '@shared/game/entities/Tile';
import { createUnit } from '@shared/game/entities/Unit';
import { GoodType, Nation, TerrainType, TurnPhase, UnitType } from '@shared/game/entities/types';

function grasslandMap(): ReturnType<typeof createTile>[][] {
  const map = [];
  for (let y = 0; y < 6; y += 1) {
    const row = [];
    for (let x = 0; x < 6; x += 1) {
      row.push(createTile(`${x}-${y}`, x, y, TerrainType.GRASSLAND, 1));
    }
    map.push(row);
  }
  return map;
}

describe('TurnCommandHandler', () => {
  it('produces a human colony once when extra seats also take a turn', () => {
    const human = createPlayer('p1', 'Human', true, 0, Nation.ENGLAND);
    const settlement = createSettlement('c1', 'p1', 'Home', 2, 2, 1, 'EUROPEAN', 'STATE');
    const worker = createUnit('u1', 'p1', 'Farmer', UnitType.COLONIST, 2, 2, 1);
    worker.occupation = { kind: 'FIELD_WORK', tileX: 2, tileY: 1 };
    settlement.units.push(worker);
    human.settlements.push(settlement);

    const state = createInitialAuthoritativeGameState();
    state.players = [
      human,
      createPlayer('ai-1', 'Portugal', false, 0, Nation.PORTUGAL),
      createPlayer('ai-2', 'Spain', false, 0, Nation.SPAIN),
    ];
    state.currentPlayerId = 'p1';
    state.phase = TurnPhase.MOVEMENT;
    state.map = grasslandMap();

    TurnCommandHandler.endTurn(state, () => 0.5, (prefix) => `${prefix}-1`);

    expect(state.players[0]?.settlements[0]?.inventory.get(GoodType.FOOD)).toBe(1);
    expect(state.currentPlayerId).toBe('p1');
    expect(state.turn).toBe(2);
  });

  it('skips native seats and still feeds their villages once per round', () => {
    const human = createPlayer('p1', 'Human', true, 0, Nation.ENGLAND);
    const villageOwner = createPlayer('ai-native-AZTEC', 'Aztec', false, 0, Nation.AZTEC);
    const village = createSettlement('v1', villageOwner.id, 'Village', 1, 1, 4, 'NATIVE', 'STATE');
    villageOwner.settlements.push(village);

    const state = createInitialAuthoritativeGameState();
    state.players = [human, villageOwner];
    state.currentPlayerId = 'p1';
    state.phase = TurnPhase.MOVEMENT;
    state.map = grasslandMap();

    TurnCommandHandler.endTurn(state, () => 0.5, (prefix) => `${prefix}-1`);

    expect(state.currentPlayerId).toBe('p1');
    expect(state.turn).toBe(2);
    expect(village.population).toBe(4);
    expect(village.goods.get(GoodType.FOOD)).toBe(4 * COLONY_CONSTANTS.VILLAGE_FOOD_PER_POP);
  });
});
