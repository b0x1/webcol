import type { StateCreator } from 'zustand';
import type { GameState } from '../types';
import type { Player } from '../../entities/Player';
import type { Tile } from '../../entities/Tile';
import type { NamingStats } from '../../systems/NamingSystem';
import type { Nation } from '../../entities/types';
import { TurnPhase } from '../../entities/types';
import { GameSystem } from '../../systems/GameSystem';
import { eventBus } from '../EventBus';

export interface GameSlice {
  players: Player[];
  currentPlayerId: string;
  map: Tile[][];
  namingStats: NamingStats;
  loadGameState: (state: Partial<GameState>) => void;
  initGame: (params: { playerName: string; nation: Nation; mapSize: 'Small' | 'Medium' | 'Large'; aiCount: number }) => void;
  resetGame: () => void;
}

export const createGameSlice: StateCreator<
  GameState,
  [['zustand/immer', never]],
  [],
  GameSlice
> = (set) => ({
  players: [],
  currentPlayerId: '',
  map: [],
  namingStats: {},

  loadGameState: (loadedState) => {
    set((state) => {
      Object.assign(state, loadedState);
    });
    eventBus.emit('gameStarted');
  },

  initGame: (params) => {
    const { map, players, namingStats } = GameSystem.initGame(params);
    set((state) => {
      state.map = map;
      state.players = players;
      state.namingStats = namingStats;
      state.currentPlayerId = 'player-1';
      state.turn = 1;
      state.phase = TurnPhase.MOVEMENT;
    });
    eventBus.emit('gameStarted');
  },

  resetGame: () => {
    set((state) => {
      state.players = [];
      state.currentPlayerId = '';
      state.turn = 1;
      state.phase = TurnPhase.MOVEMENT;
      state.selectedUnitId = null;
      state.selectedSettlementId = null;
      state.map = [];
    });
    eventBus.emit('returnToMainMenu');
  },
});
