import { describe, expect, it } from 'vitest';
import type { AuthoritativeGameState } from '../AuthoritativeGameState';
import { createPlayer } from '../entities/Player';
import { createSettlement } from '../entities/Settlement';
import { createTile } from '../entities/Tile';
import { createUnit } from '../entities/Unit';
import { GoodType, Nation, TerrainType, TurnPhase, UnitType } from '../entities/types';
import { AISystem } from './AISystem';

function grassland(width: number, height: number): ReturnType<typeof createTile>[][] {
  const map = [];
  for (let y = 0; y < height; y += 1) {
    const row = [];
    for (let x = 0; x < width; x += 1) {
      row.push(createTile(`${x}-${y}`, x, y, TerrainType.GRASSLAND, 1));
    }
    map.push(row);
  }
  return map;
}

function stateFor(player: ReturnType<typeof createPlayer>, map: ReturnType<typeof grassland>): AuthoritativeGameState {
  return {
    players: [player],
    currentPlayerId: player.id,
    turn: 1,
    phase: TurnPhase.MOVEMENT,
    europePrices: {
      [GoodType.FOOD]: 1,
      [GoodType.LUMBER]: 1,
      [GoodType.ORE]: 1,
      [GoodType.TOBACCO]: 1,
      [GoodType.COTTON]: 1,
      [GoodType.FURS]: 1,
      [GoodType.SUGAR]: 1,
      [GoodType.RUM]: 1,
      [GoodType.CLOTH]: 1,
      [GoodType.COATS]: 1,
      [GoodType.CIGARS]: 1,
      [GoodType.TOOLS]: 1,
      [GoodType.TRADE_GOODS]: 1,
      [GoodType.MUSKETS]: 1,
    },
    soldOnTurn: {},
    outcome: 'playing',
    map,
    namingStats: {},
  };
}

describe('AISystem', () => {
  it('founds when the colonist already stands on legal land', () => {
    const ai = createPlayer('ai', 'Portugal', false, 0, Nation.PORTUGAL);
    const colonist = createUnit('u1', 'ai', 'Settler', UnitType.COLONIST, 2, 2, 1);
    ai.units.push(colonist);

    const commands = AISystem.chooseCommands(stateFor(ai, grassland(6, 6)));

    expect(commands).toEqual([{ type: 'foundSettlement', unitId: 'u1' }]);
  });

  it('steps toward legal land and then skips when founding is blocked', () => {
    const ai = createPlayer('ai', 'Portugal', false, 0, Nation.PORTUGAL);
    const colony = createSettlement('c1', 'ai', 'Home', 0, 0, 1, 'EUROPEAN', 'STATE');
    ai.settlements.push(colony);
    const colonist = createUnit('u1', 'ai', 'Settler', UnitType.COLONIST, 1, 0, 1);
    ai.units.push(colonist);

    const commands = AISystem.chooseCommands(stateFor(ai, grassland(6, 6)));

    expect(commands[0]).toEqual({ type: 'moveUnit', unitId: 'u1', to: { x: 2, y: 0 } });
    expect(commands[1]).toEqual({ type: 'skipUnit', unitId: 'u1' });
  });

  it('assigns one idle colonist to a food field', () => {
    const ai = createPlayer('ai', 'Portugal', false, 0, Nation.PORTUGAL);
    const colony = createSettlement('c1', 'ai', 'Home', 2, 2, 1, 'EUROPEAN', 'STATE');
    const worker = createUnit('u1', 'ai', 'Farmer', UnitType.COLONIST, 2, 2, 1);
    colony.units.push(worker);
    ai.settlements.push(colony);

    const commands = AISystem.chooseCommands(stateFor(ai, grassland(6, 6)));
    const job = commands.find((command) => command.type === 'assignJob');

    expect(job).toEqual({
      type: 'assignJob',
      settlementId: 'c1',
      unitId: 'u1',
      job: '1,1',
    });
  });
});
