import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../gameStore';
import { createPlayer } from '../../entities/Player';
import { createUnit } from '../../entities/Unit';
import { GoodType, UnitType, Nation } from '../../entities/types';

describe('Europe Trade', () => {
  beforeEach(() => {
    // Reset store state before each test
    const p1 = createPlayer('p1', 'Player 1', true, 1000, Nation.ENGLAND);
    const ship = createUnit('ship1', 'p1', 'Test Unit', UnitType.SHIP, 0, 0, 1);
    ship.cargo.set(GoodType.LUMBER, 50);
    p1.units.push(ship);

    useGameStore.setState({
      players: [p1],
      currentPlayerId: 'p1',
      selectedUnitId: 'ship1',
      europePrices: {
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
      },
    });
  });

  it('should sell goods and increase player gold', () => {
    const { sellGood } = useGameStore.getState();
    sellGood('ship1', GoodType.LUMBER, 10);

    const { players, europePrices } = useGameStore.getState();
    const player = players[0];
    const ship = player.units[0];

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
    const ship = player.units[0];

    // Initial gold 1000, bought 10 MUSKETS at 8g each = -80g
    expect(player.gold).toBe(920);
    expect(ship.cargo.get(GoodType.MUSKETS)).toBe(10);
  });

  it('should recruit a SOLDIER if ship has 50 MUSKETS', () => {
    const { recruitUnit } = useGameStore.getState();

    // Give ship 50 muskets
    useGameStore.setState((state) => {
        state.players[0].units[0].cargo.set(GoodType.MUSKETS, 50);
    });

    recruitUnit(UnitType.SOLDIER);

    const { players } = useGameStore.getState();
    const player = players[0];
    const ship = player.units.find(u => u.type === UnitType.SHIP)!;

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

    // Gold should not change
    expect(player.gold).toBe(1000);
    // No new unit
    expect(player.units.length).toBe(1);
  });
});
