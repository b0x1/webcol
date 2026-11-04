import { describe, expect, it } from 'vitest';
import { createInitialAuthoritativeGameState } from '@server/game/createInitialAuthoritativeGameState';
import { LocalGameServer } from '@server/game/LocalGameServer';
import { TurnCommandHandler } from '@server/game/handlers/TurnCommandHandler';
import { COLONY_CONSTANTS, VICTORY_CONSTANTS } from '@shared/game/constants';
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

  it('feeds a native seat during that seat\'s production phase', () => {
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

  it('founds for a non-human seat during its movement phase', () => {
    const human = createPlayer('p1', 'Human', true, 0, Nation.ENGLAND);
    const ai = createPlayer('ai', 'Portugal', false, 0, Nation.PORTUGAL);
    ai.units.push(createUnit('u-ai', 'ai', 'Settler', UnitType.COLONIST, 3, 3, 1));

    const state = createInitialAuthoritativeGameState();
    state.players = [human, ai];
    state.currentPlayerId = 'p1';
    state.phase = TurnPhase.MOVEMENT;
    state.map = grasslandMap();

    TurnCommandHandler.endTurn(state, () => 0.5, (prefix) => `${prefix}-1`);

    const seated = state.players.find((player) => player.id === 'ai');
    expect(seated?.settlements).toHaveLength(1);
    expect(seated?.units).toHaveLength(0);
    expect(state.currentPlayerId).toBe('p1');
  });

  it('raises unsold Europe prices once on the human trade phase', () => {
    const human = createPlayer('p1', 'Human', true, 0, Nation.ENGLAND);
    const ai = createPlayer('ai', 'Portugal', false, 0, Nation.PORTUGAL);
    const state = createInitialAuthoritativeGameState();
    state.players = [human, ai];
    state.currentPlayerId = 'p1';
    state.phase = TurnPhase.MOVEMENT;
    state.map = grasslandMap();
    state.soldOnTurn[GoodType.FOOD] = state.turn;
    const food = state.europePrices[GoodType.FOOD];
    const ore = state.europePrices[GoodType.ORE];

    TurnCommandHandler.endTurn(state, () => 0.5, (prefix) => `${prefix}-1`);

    expect(state.europePrices[GoodType.FOOD]).toBe(food);
    expect(state.europePrices[GoodType.ORE]).toBe(ore + 1);
  });

  it('ends the game when every human colony is empty and no colonist can work', () => {
    const human = createPlayer('p1', 'Human', true, 0, Nation.ENGLAND);
    human.settlements.push(createSettlement('c1', 'p1', 'Home', 2, 2, 1, 'EUROPEAN', 'STATE'));
    const state = createInitialAuthoritativeGameState();
    state.players = [human];
    state.currentPlayerId = 'p1';
    state.phase = TurnPhase.MOVEMENT;
    state.map = grasslandMap();

    const first = TurnCommandHandler.endTurn(state, () => 0.5, (prefix) => `${prefix}-1`);
    const second = TurnCommandHandler.endTurn(state, () => 0.5, (prefix) => `${prefix}-1`);

    expect(state.outcome).toBe('loss');
    expect(first.some((effect) => effect.type === 'gameEnded' && effect.result === 'loss')).toBe(true);
    expect(second.some((effect) => effect.type === 'gameEnded')).toBe(false);
  });

  it('does not move a unit after the game is lost', () => {
    const human = createPlayer('p1', 'Human', true, 0, Nation.ENGLAND);
    human.settlements.push(createSettlement('c1', 'p1', 'Home', 2, 2, 1, 'EUROPEAN', 'STATE'));
    const soldier = createUnit('u1', 'p1', 'Guard', UnitType.SOLDIER, 0, 0, 3);
    human.units.push(soldier);

    const state = createInitialAuthoritativeGameState();
    state.players = [human];
    state.currentPlayerId = 'p1';
    state.phase = TurnPhase.MOVEMENT;
    state.map = grasslandMap();

    const server = new LocalGameServer();
    server.replaceState(state);
    server.dispatch({ type: 'endTurn' });
    server.dispatch({ type: 'moveUnit', unitId: 'u1', to: { x: 1, y: 0 } });

    const unit = server.getState().players[0]?.units.find((candidate) => candidate.id === 'u1');
    expect(server.getState().outcome).toBe('loss');
    expect(unit?.position).toEqual({ x: 0, y: 0 });
    expect(unit?.movesRemaining).toBe(3);
  });

  it('ends the game when the human reaches the gold and colony goal', () => {
    const human = createPlayer('p1', 'Human', true, VICTORY_CONSTANTS.GOLD, Nation.ENGLAND);
    human.settlements.push(
      createSettlement('c1', 'p1', 'One', 0, 0, 1, 'EUROPEAN', 'STATE'),
      createSettlement('c2', 'p1', 'Two', 2, 2, 1, 'EUROPEAN', 'STATE'),
      createSettlement('c3', 'p1', 'Three', 4, 4, 1, 'EUROPEAN', 'STATE'),
    );
    const state = createInitialAuthoritativeGameState();
    state.players = [human];
    state.currentPlayerId = 'p1';
    state.phase = TurnPhase.MOVEMENT;
    state.map = grasslandMap();

    TurnCommandHandler.endTurn(state, () => 0.5, (prefix) => `${prefix}-1`);

    expect(state.outcome).toBe('goal');
  });
});
