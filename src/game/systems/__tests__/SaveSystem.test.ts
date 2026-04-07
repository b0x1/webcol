import { describe, it, expect, beforeEach } from 'vitest';
import { SaveSystem } from '../SaveSystem';
import { createPlayer } from '../../entities/Player';
import { createUnit } from '../../entities/Unit';
import { createSettlement } from '../../entities/Settlement';
import { createTile } from '../../entities/Tile';
import { GoodType, UnitType, TerrainType, Nation, Attitude, JobType, TurnPhase } from '../../entities/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('SaveSystem Serialization Round-trip', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should deeply preserve state after save and load', () => {
    // 1. Create a complex mock GameState
    const player1 = createPlayer('p1', 'Player 1', true, 1000, Nation.NORSEMEN);
    const unit1 = createUnit('u1', 'p1', UnitType.COLONIST, 10, 10, 3);
    unit1.cargo.set(GoodType.FOOD, 50);
    player1.units.push(unit1);

    const settlement1 = createSettlement('c1', 'p1', 'Settlement 1', 10, 10, 2, 'EUROPEAN', 'STATE');
    settlement1.buildings.push('WAREHOUSE' as any);
    settlement1.inventory.set(GoodType.LUMBER, 100);
    settlement1.workforce.set('u1', JobType.FARMER);
    player1.settlements.push(settlement1);

    const tile = createTile('10-10', 10, 10, TerrainType.PLAINS, 1);

    const npcPlayer = createPlayer('ai-native-IROQUOIS', 'Iroquois', false, 0, Nation.IROQUOIS);
    const npcSettlement = createSettlement('s1', 'ai-native-IROQUOIS', 'Settlement 1', 15, 15, 5, 'NATIVE', 'TRIBE');
    npcSettlement.goods.set(GoodType.TRADE_GOODS, 20);
    npcSettlement.attitude = Attitude.NEUTRAL;
    npcPlayer.settlements.push(npcSettlement);

    const mockState: any = {
      players: [player1, npcPlayer],
      currentPlayerId: 'p1',
      turn: 5,
      phase: TurnPhase.MOVEMENT,
      europePrices: { [GoodType.FOOD]: 2 },
      map: [[tile]],
    };

    // 2. Save
    SaveSystem.save(mockState, 'test_slot');

    // 3. Load
    const loadedState = SaveSystem.load('test_slot');

    // 4. Assertions
    expect(loadedState).not.toBeNull();
    if (!loadedState) return;

    // Check basic types
    expect(loadedState.turn).toBe(mockState.turn);
    expect(loadedState.currentPlayerId).toBe(mockState.currentPlayerId);
    expect(loadedState.phase).toBe(mockState.phase);

    // Check Player properties
    expect(loadedState.players![0].name).toBe('Player 1');
    expect(loadedState.players![0].gold).toBe(1000);

    // Check Unit and Map (cargo)
    const loadedUnit = loadedState.players![0].units[0];
    expect(loadedUnit.cargo).toBeInstanceOf(Map);
    expect(loadedUnit.cargo.get(GoodType.FOOD)).toBe(50);

    // Check Settlement and its properties
    const loadedSettlement = loadedState.players![0].settlements[0];
    expect(loadedSettlement.inventory.get(GoodType.LUMBER)).toBe(100);
    expect(loadedSettlement.workforce.get('u1')).toBe(JobType.FARMER);

    // Check Tile properties
    expect(loadedState.map![0][0].terrainType).toBe(TerrainType.PLAINS);

    // Check NPC Settlement and Map
    expect(loadedState.players![1].settlements[0].goods.get(GoodType.TRADE_GOODS)).toBe(20);
  });

  it('should manage manifest correctly', () => {
    const mockState: any = {
      players: [{ isHuman: true, name: 'Alice' }],
      turn: 10,
    };

    SaveSystem.save(mockState, 'slot1');
    let manifest = SaveSystem.listSaves();
    expect(manifest.length).toBe(1);
    expect(manifest[0].slotName).toBe('slot1');
    expect(manifest[0].playerName).toBe('Alice');
    expect(manifest[0].turn).toBe(10);

    SaveSystem.deleteSave('slot1');
    manifest = SaveSystem.listSaves();
    expect(manifest.length).toBe(0);
  });
});
