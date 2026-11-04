import { describe, expect, it } from 'vitest';
import { createPlayer } from '../entities/Player';
import { createSettlement } from '../entities/Settlement';
import { createTile } from '../entities/Tile';
import { createUnit } from '../entities/Unit';
import { Nation, TerrainType, UnitType } from '../entities/types';
import { canTradeWithEurope, cargoHold, isAtHarbor } from './TradeRules';

describe('TradeRules', () => {
  it('gives ships a larger hold than land units', () => {
    const ship = createUnit('ship', 'p1', 'Ship', UnitType.SHIP, 0, 0, 1);
    const colonist = createUnit('colonist', 'p1', 'Colonist', UnitType.COLONIST, 0, 0, 1);

    expect(cargoHold(ship)).toBeGreaterThan(cargoHold(colonist));
  });

  it('allows Europe trade from abroad or from a harbor', () => {
    const player = createPlayer('p1', 'Player', true, 0, Nation.ENGLAND);
    const settlement = createSettlement('s1', 'p1', 'Port', 1, 0, 1, 'EUROPEAN', 'STATE');
    player.settlements.push(settlement);

    const ship = createUnit('ship', 'p1', 'Ship', UnitType.SHIP, 0, 0, 1);
    player.units.push(ship);

    const map = [[createTile('coast', 0, 0, TerrainType.COAST, 1)]];
    expect(isAtHarbor(ship, player, map)).toBe(true);
    expect(canTradeWithEurope(ship, player, map)).toBe(true);

    ship.position = { x: 4, y: 4 };
    expect(canTradeWithEurope(ship, player, map)).toBe(false);

    ship.inEurope = true;
    expect(canTradeWithEurope(ship, player, map)).toBe(true);
  });
});
