import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPlayer } from '@shared/game/entities/Player';
import { createTile } from '@shared/game/entities/Tile';
import { Nation, TerrainType, TurnPhase } from '@shared/game/entities/types';
import { SaveManager } from './SaveManager';
import type { GameState } from './gameStore';

describe('SaveManager', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('stores and loads saves through localStorage', () => {
    const player = createPlayer('p1', 'Alice', true, 1000, Nation.NORSEMEN);
    const tile = createTile('0-0', 0, 0, TerrainType.PLAINS, 1);
    const state: Pick<
      GameState,
      | 'players'
      | 'currentPlayerId'
      | 'turn'
      | 'phase'
      | 'selectedUnitId'
      | 'selectedSettlementId'
      | 'europePrices'
      | 'map'
      | 'selectedTile'
      | 'combatResult'
      | 'namingStats'
    > = {
      players: [player],
      currentPlayerId: 'p1',
      turn: 3,
      phase: TurnPhase.MOVEMENT,
      selectedUnitId: null,
      selectedSettlementId: null,
      europePrices: {} as GameState['europePrices'],
      map: [[tile]],
      selectedTile: null,
      combatResult: null,
      namingStats: {},
    };

    SaveManager.save(state, 'slot1');

    const loadedState = SaveManager.load('slot1');
    const manifest = SaveManager.listSaves();

    expect(loadedState?.currentPlayerId).toBe('p1');
    expect(manifest).toHaveLength(1);
    expect(manifest[0]?.slotName).toBe('slot1');
    expect(manifest[0]?.playerName).toBe('Alice');
  });

  it('removes saves from storage and manifest', () => {
    const player = createPlayer('p1', 'Alice', true, 1000, Nation.NORSEMEN);
    const tile = createTile('0-0', 0, 0, TerrainType.PLAINS, 1);
    const state: Pick<
      GameState,
      | 'players'
      | 'currentPlayerId'
      | 'turn'
      | 'phase'
      | 'selectedUnitId'
      | 'selectedSettlementId'
      | 'europePrices'
      | 'map'
      | 'selectedTile'
      | 'combatResult'
      | 'namingStats'
    > = {
      players: [player],
      currentPlayerId: 'p1',
      turn: 3,
      phase: TurnPhase.MOVEMENT,
      selectedUnitId: null,
      selectedSettlementId: null,
      europePrices: {} as GameState['europePrices'],
      map: [[tile]],
      selectedTile: null,
      combatResult: null,
      namingStats: {},
    };

    SaveManager.save(state, 'slot1');
    SaveManager.deleteSave('slot1');

    expect(SaveManager.load('slot1')).toBeNull();
    expect(SaveManager.listSaves()).toHaveLength(0);
  });
});
