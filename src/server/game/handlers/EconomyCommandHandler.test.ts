import { describe, expect, it } from 'vitest';
import { createInitialAuthoritativeGameState } from '@server/game/createInitialAuthoritativeGameState';
import { EconomyCommandHandler } from '@server/game/handlers/EconomyCommandHandler';
import { VoyageCommandHandler } from '@server/game/handlers/VoyageCommandHandler';
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

  it('lands a returning ship on water beside the nearest colony', () => {
    const player = createPlayer('p1', 'Human', true, 0, Nation.ENGLAND);
    const first = createSettlement('s1', 'p1', 'First', 0, 0, 1, 'EUROPEAN', 'STATE');
    const second = createSettlement('s2', 'p1', 'Second', 4, 0, 1, 'EUROPEAN', 'STATE');
    const ship = createUnit('ship', 'p1', 'Ship', UnitType.SHIP, 3, 0, 0);
    const colonist = createUnit('colonist', 'p1', 'Colonist', UnitType.COLONIST, 1, 1, 1);
    const otherShip = createUnit('other', 'p1', 'Other', UnitType.SHIP, 0, 1, 0);
    ship.inEurope = true;
    colonist.inEurope = true;
    otherShip.inEurope = true;
    player.settlements.push(first, second);
    player.units.push(ship, colonist, otherShip);

    const row = (y: number, terrains: TerrainType[]) =>
      terrains.map((terrain, x) => createTile(`${x}-${y}`, x, y, terrain, 1));
    const state = createInitialAuthoritativeGameState();
    state.players = [player];
    state.currentPlayerId = 'p1';
    state.map = [
      row(0, [TerrainType.PLAINS, TerrainType.PLAINS, TerrainType.PLAINS, TerrainType.PLAINS, TerrainType.PLAINS]),
      row(1, [TerrainType.PLAINS, TerrainType.PLAINS, TerrainType.PLAINS, TerrainType.PLAINS, TerrainType.COAST]),
    ];

    VoyageCommandHandler.returnFromEurope(state, 'ship');

    expect(ship.position).toEqual({ x: 4, y: 1 });
    expect(ship.inEurope).toBe(false);
    expect(ship.movesRemaining).toBe(0);
    expect(colonist.position).toEqual({ x: 4, y: 0 });
    expect(colonist.inEurope).toBe(false);
    expect(otherShip.inEurope).toBe(true);
    expect(otherShip.position).toEqual({ x: 0, y: 1 });
  });
});
