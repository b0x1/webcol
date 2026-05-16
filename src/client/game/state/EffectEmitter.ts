import { eventBus } from '@client/game/state/EventBus';
import { SaveManager } from '@client/game/state/SaveManager';
import type { GameEffect, SaveGameState } from '@shared/game/protocol';
import type { GameState } from '@client/game/state/types';
import type { UseBoundStore, StoreApi } from 'zustand';

export const emitEffects = (
  effects: readonly GameEffect[],
  snapshot: SaveGameState,
  useGameStore: UseBoundStore<StoreApi<GameState>>
): void => {
  effects.forEach((effect) => {
    switch (effect.type) {
      case 'notification':
        eventBus.emit('notification', effect.message);
        break;
      case 'unitMoved':
        eventBus.emit('unitMoved', effect);
        break;
      case 'combatResolved':
        useGameStore.setState((state) => {
          state.combatResult = effect.result;
          return state;
        });
        break;
      case 'gameStarted':
        eventBus.emit('gameStarted');
        break;
      case 'gameLoaded':
        eventBus.emit('gameLoaded');
        break;
      case 'returnToMainMenu':
        eventBus.emit('returnToMainMenu');
        useGameStore.setState((state) => {
          state.selectedUnitId = null;
          state.selectedSettlementId = null;
          state.selectedTile = null;
          state.combatResult = null;
          return state;
        });
        break;
      case 'autosaveRequested':
        SaveManager.save(snapshot, 'autosave');
        eventBus.emit('notification', 'Auto-saved');
        break;
    }
  });
};
