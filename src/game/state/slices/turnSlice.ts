import type { StateCreator } from 'zustand';
import type { GameState } from '../types';
import { TurnPhase } from '../../entities/types';
import { SaveManager } from '../SaveManager';
import { eventBus } from '../EventBus';
import { TurnEngine } from '../../systems/TurnEngine';
import { AISystem } from '../../systems/AISystem';
import { random, generateId } from '../utils';

export interface TurnSlice {
  turn: number;
  phase: TurnPhase;
  endTurn: () => void;
}

const emitTurnEffects = (effects: readonly { readonly type: 'notification'; readonly message: string }[]): void => {
  effects.forEach((effect) => {
    eventBus.emit('notification', effect.message);
  });
};

const emitAIEffects = (
  effects: readonly {
    readonly type: 'unitMoved';
    readonly id: string;
    readonly fromX: number;
    readonly fromY: number;
    readonly toX: number;
    readonly toY: number;
  }[],
): void => {
  effects.forEach((effect) => {
    eventBus.emit('unitMoved', effect);
  });
};

export const createTurnSlice: StateCreator<
  GameState,
  [['zustand/immer', never]],
  [],
  TurnSlice
> = (set, get) => ({
  turn: 1,
  phase: TurnPhase.MOVEMENT,

  endTurn: () => {
    set((state) => {
      const phases: TurnPhase[] = [
        TurnPhase.MOVEMENT,
        TurnPhase.PRODUCTION,
        TurnPhase.TRADE,
        TurnPhase.AI,
        TurnPhase.END_TURN,
      ];
      const currentPhaseIndex = phases.indexOf(state.phase);

      if (currentPhaseIndex < phases.length - 1) {
        state.phase = phases[currentPhaseIndex + 1];
        return;
      }

      if (state.players.length === 0) {
        state.phase = TurnPhase.MOVEMENT;
        return;
      }

      const currentPlayerIndex = state.players.findIndex((p) => p.id === state.currentPlayerId);
      const nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;
      const nextPlayer = state.players[nextPlayerIndex];

      const nextTurn = nextPlayerIndex === 0 ? state.turn + 1 : state.turn;

      if (nextTurn > state.turn && nextPlayerIndex === 0) {
        setTimeout(() => {
          const currentState = get();
          SaveManager.save(currentState, 'autosave');
          eventBus.emit('notification', 'Auto-saved');
        }, 0);
      }

      state.players.forEach((p) => {
        if (p.id === nextPlayer.id) {
          p.units.forEach((u) => {
            u.movesRemaining = u.maxMoves;
            u.isSkipping = false;
          });
        }
      });

      state.phase = TurnPhase.MOVEMENT;
      state.currentPlayerId = nextPlayer.id;
      state.turn = nextTurn;
      state.selectedUnitId = null;
    });

    const state = get();
    if (state.phase === TurnPhase.PRODUCTION) {
      const { players: updatedPlayers, namingStats: updatedNamingStats, effects } = TurnEngine.runProduction(
        state.players,
        state.map,
        state.namingStats,
        random,
        generateId,
      );
      set((s) => {
        s.players = updatedPlayers;
        s.namingStats = updatedNamingStats;
      });
      emitTurnEffects(effects);
      get().endTurn();
    } else if (state.phase === TurnPhase.TRADE) {
      get().endTurn();
    } else if (state.phase === TurnPhase.AI) {
      const { players: updatedPlayers, namingStats: updatedNamingStats, effects } = AISystem.runAITurn(
        state.players,
        state.map,
        state.namingStats,
        random,
        generateId,
      );
      set((s) => {
        s.players = updatedPlayers;
        s.namingStats = updatedNamingStats;
      });
      emitAIEffects(effects);
      get().endTurn();
    } else if (state.phase === TurnPhase.END_TURN) {
      get().endTurn();
    } else {  // MOVEMENT
      const currentPlayer = state.players.find((p) => p.id === state.currentPlayerId);
      if (currentPlayer && !currentPlayer.isHuman) {
        get().endTurn();
      }
    }
  },
});
