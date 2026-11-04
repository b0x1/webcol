import { describe, expect, it } from 'vitest';
import { createInitialAuthoritativeGameState } from '@server/game/createInitialAuthoritativeGameState';
import { EconomyCommandHandler } from '@server/game/handlers/EconomyCommandHandler';
import { createPlayer } from '@shared/game/entities/Player';
import { createSettlement } from '@shared/game/entities/Settlement';
import { createTile } from '@shared/game/entities/Tile';
import { createUnit } from '@shared/game/entities/Unit';
import { GoodType, Nation, TerrainType, UnitType } from '@shared/game/entities/types';

describe('EconomyCommandHandler', () => {
  it('moves warehouse goods onto a ship beside the colony', () => {
    const player = createPlayer('p1', 'Human', true, 0, Nation.ENGLAND);
    const settlement = createSettlement('s1', 'p1', 'Port', 1, 0, 1, 'EUROPEAN', 'STATE');
    settlement.inventory.set(GoodType.LUMBER, 12);
    const ship = createUnit('ship', 'p1', 'Ship', UnitType.SHIP, 0, 0, 3);
    player.settlements.push(settlement);
    player.units.push(ship);

    const state = createInitialAuthoritativeGameState();
    state.players = [player];
    state.currentPlayerId = 'p1';
    state.map = [[createTile('coast', 0, 0, TerrainType.COAST, 1), createTile('land', 1, 0, TerrainType.PLAINS, 1)]];

    EconomyCommandHandler.transferGood(state, 'ship', 's1', GoodType.LUMBER, 5, 'load');

    expect(ship.cargo.get(GoodType.LUMBER)).toBe(5);
    expect(settlement.inventory.get(GoodType.LUMBER)).toBe(7);
  });

  it('refuses a Europe sale until the ship is abroad or in harbor', () => {
    const player = createPlayer('p1', 'Human', true, 100, Nation.ENGLAND);
    const ship = createUnit('ship', 'p1', 'Ship', UnitType.SHIP, 0, 0, 3);
    ship.cargo.set(GoodType.LUMBER, 10);
    player.units.push(ship);

    const state = createInitialAuthoritativeGameState();
    state.players = [player];
    state.currentPlayerId = 'p1';
    state.map = [[createTile('plains', 0, 0, TerrainType.PLAINS, 1)]];
    state.europePrices[GoodType.LUMBER] = 2;

    EconomyCommandHandler.sellGood(state, 'ship', GoodType.LUMBER, 10);
    expect(player.gold).toBe(100);

    ship.inEurope = true;
    EconomyCommandHandler.sellGood(state, 'ship', GoodType.LUMBER, 10);
    expect(player.gold).toBe(120);
  });
});
