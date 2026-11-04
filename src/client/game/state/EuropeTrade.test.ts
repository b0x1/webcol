import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './gameStore';
import { createPlayer } from '@shared/game/entities/Player';
import { createUnit } from '@shared/game/entities/Unit';
import { GoodType, UnitType, Nation, TurnPhase } from '@shared/game/entities/types';

const europePrices = {
  [GoodType.FOOD]: 1,
  [GoodType.LUMBER]: 2,
  [GoodType.ORE]: 3,
  [GoodType.TOBACCO]: 4,
  [GoodType.COTTON]: 3,
  [GoodType.FURS]: 5,
  [GoodType.SUGAR]: 3,
  [GoodType.RUM]: 8,
  [GoodType.CLOTH]: 8,
  [GoodType.COATS]: 10,
  [GoodType.CIGARS]: 10,
  [GoodType.TOOLS]: 5,
  [GoodType.TRADE_GOODS]: 6,
  [GoodType.MUSKETS]: 8,
} as const;

function seedShip(muskets = 0): void {
  const player = createPlayer('p1', 'Player 1', true, 1000, Nation.ENGLAND);
  const ship = createUnit('ship1', 'p1', 'Test Unit', UnitType.SHIP, 0, 0, 1);
  ship.inEurope = true;
  ship.cargo.set(GoodType.LUMBER, 50);
  if (muskets > 0) {
    ship.cargo.set(GoodType.MUSKETS, muskets);
  }
  player.units.push(ship);
  useGameStore.getState().loadGameState({
    players: [player],
    currentPlayerId: 'p1',
    turn: 1,
    phase: TurnPhase.MOVEMENT,
    europePrices: { ...europePrices },
    map: [],
  });
  useGameStore.setState({ selectedUnitId: 'ship1' });
}

describe('Europe Trade', () => {
  beforeEach(() => {
    seedShip();
  });

  it('should sell goods and increase player gold', () => {
    const { sellGood } = useGameStore.getState();
    sellGood('ship1', GoodType.LUMBER, 10);

    const { players, europePrices } = useGameStore.getState();
    const player = players[0];
    if (!player) throw new Error('Player not found');
    const ship = player.units[0];
    if (!ship) throw new Error('Ship not found');

    // Initial gold 1000, sold 10 LUMBER at 2g each = +20g
    expect(player.gold).toBe(1020);
    expect(ship.cargo.get(GoodType.LUMBER)).toBe(40);
    // Sold <= 20, price should remain the same
    expect(europePrices[GoodType.LUMBER]).toBe(2);
  });

  it('should reduce price when selling more than 20 units', () => {
    const { sellGood } = useGameStore.getState();
    sellGood('ship1', GoodType.LUMBER, 21);

    const { players, europePrices } = useGameStore.getState();
    const player = players[0];
    if (!player) throw new Error('Player not found');

    // Initial gold 1000, sold 21 LUMBER at 2g each = +42g
    expect(player.gold).toBe(1042);
    // Sold > 20, price should drop by 1
    expect(europePrices[GoodType.LUMBER]).toBe(1);
  });

  it('should buy goods and decrease player gold', () => {
    const { buyGood } = useGameStore.getState();
    buyGood('ship1', GoodType.MUSKETS, 10);

    const { players } = useGameStore.getState();
    const player = players[0];
    if (!player) throw new Error('Player not found');
    const ship = player.units[0];
    if (!ship) throw new Error('Ship not found');

    // Initial gold 1000, bought 10 MUSKETS at 8g each = -80g
    expect(player.gold).toBe(920);
    expect(ship.cargo.get(GoodType.MUSKETS)).toBe(10);
  });

  it('should recruit a SOLDIER if ship has 50 MUSKETS', () => {
    seedShip(50);
    const { recruitUnit } = useGameStore.getState();
    recruitUnit(UnitType.SOLDIER);

    const { players } = useGameStore.getState();
    const player = players[0];
    if (!player) throw new Error('Player not found');
    const ship = player.units.find((unit) => unit.type === UnitType.SHIP);

    expect(ship).toBeDefined();
    if (!ship) {
      return;
    }

    // Initial gold 1000, SOLDIER costs 800g = 200g left
    expect(player.gold).toBe(200);
    // 50 MUSKETS consumed
    expect(ship.cargo.get(GoodType.MUSKETS)).toBe(0);
    // New SOLDIER unit added
    expect(player.units.length).toBe(2);
    expect(player.units.some(u => u.type === UnitType.SOLDIER)).toBe(true);
  });

  it('should NOT recruit a SOLDIER if ship lacks MUSKETS', () => {
    const { recruitUnit } = useGameStore.getState();

    recruitUnit(UnitType.SOLDIER);

    const { players } = useGameStore.getState();
    const player = players[0];
    if (!player) throw new Error('Player not found');

    // Gold should not change
    expect(player.gold).toBe(1000);
    // No new unit
    expect(player.units.length).toBe(1);
  });
});
