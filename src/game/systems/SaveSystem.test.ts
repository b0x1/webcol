import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SaveSystem } from './SaveSystem';
import { createPlayer } from '../entities/Player';
import { createUnit } from '../entities/Unit';
import { createSettlement } from '../entities/Settlement';
import { createTile } from '../entities/Tile';
import {
  Attitude,
  BuildingType,
  GoodType,
  JobType,
  Nation,
  TerrainType,
  TurnPhase,
  UnitType,
} from '../entities/types';
import type { SaveData } from './SaveSystem';

describe('SaveSystem serialization round-trip', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('deeply preserves state through serialize and deserialize', () => {
    const player1 = createPlayer('p1', 'Player 1', true, 1000, Nation.NORSEMEN);
    const unit1 = createUnit('u1', 'p1', 'Test Unit', UnitType.COLONIST, 10, 10, 3);
    unit1.cargo.set(GoodType.FOOD, 50);
    player1.units.push(unit1);

    const settlement1 = createSettlement('c1', 'p1', 'Settlement 1', 10, 10, 2, 'EUROPEAN', 'STATE');
    settlement1.buildings.push(BuildingType.WAREHOUSE);
    settlement1.inventory.set(GoodType.LUMBER, 100);
    settlement1.workforce.set('u1', JobType.FARMER);
    player1.settlements.push(settlement1);

    const tile = createTile('10-10', 10, 10, TerrainType.PLAINS, 1);

    const npcPlayer = createPlayer('ai-native-IROQUOIS', 'Iroquois', false, 0, Nation.IROQUOIS);
    const npcSettlement = createSettlement('s1', 'ai-native-IROQUOIS', 'Settlement 1', 15, 15, 5, 'NATIVE', 'TRIBE');
    npcSettlement.goods.set(GoodType.TRADE_GOODS, 20);
    npcSettlement.attitude = Attitude.NEUTRAL;
    npcPlayer.settlements.push(npcSettlement);

    const mockState = {
      players: [player1, npcPlayer],
      currentPlayerId: 'p1',
      turn: 5,
      phase: TurnPhase.MOVEMENT,
      europePrices: {
        [GoodType.FOOD]: 2,
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
      } satisfies Record<GoodType, number>,
      map: [[tile]],
    } satisfies SaveData;

    const serialized = SaveSystem.serialize(mockState);
    const loadedState = SaveSystem.deserialize(serialized);

    if (!loadedState) throw new Error('Failed to deserialize');
    expect(loadedState.turn).toBe(mockState.turn);
    expect(loadedState.currentPlayerId).toBe(mockState.currentPlayerId);
    expect(loadedState.phase).toBe(mockState.phase);
    expect(loadedState.players[0]?.name).toBe('Player 1');
    expect(loadedState.players[0]?.gold).toBe(1000);
    expect(loadedState.players[0]?.units[0]?.cargo).toBeInstanceOf(Map);
    expect(loadedState.players[0]?.units[0]?.cargo.get(GoodType.FOOD)).toBe(50);
    expect(loadedState.players[0]?.settlements[0]?.inventory.get(GoodType.LUMBER)).toBe(100);
    expect(loadedState.players[0]?.settlements[0]?.workforce.get('u1')).toBe(JobType.FARMER);
    expect(loadedState.map[0]?.[0]?.terrainType).toBe(TerrainType.PLAINS);
    expect(loadedState.players[1]?.settlements[0]?.goods.get(GoodType.TRADE_GOODS)).toBe(20);
  });
});
