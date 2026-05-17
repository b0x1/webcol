import type { Player } from '@shared/game/entities/Player';
import {
  TurnPhase,
} from '@shared/game/entities/types';
import { TurnEngine } from '@shared/game/systems/TurnEngine';
import { AISystem } from '@shared/game/systems/AISystem';
import { TraversalUtils } from '@shared/game/utils/TraversalUtils';
import type { AuthoritativeGameState } from '@shared/game/AuthoritativeGameState';
import type { GameEffect } from '@shared/game/protocol';

/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
export class TurnCommandHandler {
  static endTurn(
    state: AuthoritativeGameState,
    random: () => number,
    generateId: (prefix: string) => string
  ): readonly GameEffect[] {
    const effects: GameEffect[] = [];
    const phases: TurnPhase[] = [
      TurnPhase.MOVEMENT,
      TurnPhase.PRODUCTION,
      TurnPhase.TRADE,
      TurnPhase.AI,
      TurnPhase.END_TURN,
    ];

    for (;;) {
      const currentPhaseIndex = phases.indexOf(state.phase);
      if (currentPhaseIndex < phases.length - 1) {
        state.phase = phases[currentPhaseIndex + 1] ?? TurnPhase.MOVEMENT;
      } else {
        if (state.players.length === 0) {
          state.phase = TurnPhase.MOVEMENT;
          return effects;
        }
        this.advanceToNextPlayer(state, effects);
        state.phase = TurnPhase.MOVEMENT;
      }

      this.processPhase(state, effects, random, generateId);

      if (this.isHumanControllablePhase(state)) {
        return effects;
      }
    }
  }

  private static advanceToNextPlayer(state: AuthoritativeGameState, effects: GameEffect[]): void {
    const currentPlayerIndex = state.players.findIndex(
      (player) => player.id === state.currentPlayerId
    );
    const nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;
    const nextPlayer = state.players[nextPlayerIndex];
    if (!nextPlayer) {
      return;
    }

    const nextTurn = nextPlayerIndex === 0 ? state.turn + 1 : state.turn;
    if (nextTurn > state.turn && nextPlayerIndex === 0) {
      effects.push({ type: 'autosaveRequested' });
    }

    state.players.forEach((player) => {
      if (player.id === nextPlayer.id) {
        player.units.forEach((unit) => {
          unit.movesRemaining = unit.maxMoves;
          unit.isSkipping = false;
        });
      }
    });

    state.currentPlayerId = nextPlayer.id;
    state.turn = nextTurn;
  }

  private static processPhase(
    state: AuthoritativeGameState,
    effects: GameEffect[],
    random: () => number,
    generateId: (prefix: string) => string
  ): void {
    if (state.phase === TurnPhase.PRODUCTION) {
      const result = TurnEngine.runProduction(
        state.players,
        state.map,
        state.namingStats,
        generateId
      );
      state.players = result.players;
      state.namingStats = result.namingStats;
      effects.push(...result.effects);
    } else if (state.phase === TurnPhase.AI) {
      const aiResult = AISystem.runAITurn(
        state.players,
        state.map,
        state.namingStats,
        random,
        generateId,
      );

      state.players = aiResult.players;
      state.namingStats = aiResult.namingStats;
      effects.push(...aiResult.effects);
    }
  }

  private static isHumanControllablePhase(state: AuthoritativeGameState): boolean {
    if (state.phase !== TurnPhase.MOVEMENT) {
      return false;
    }

    const currentPlayer = this.selectCurrentPlayer(state);
    return !!currentPlayer?.isHuman;
  }

  private static selectCurrentPlayer(state: AuthoritativeGameState): Player | undefined {
    return TraversalUtils.findPlayerById(state.players, state.currentPlayerId);
  }
}
