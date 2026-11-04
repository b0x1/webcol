import type { Player } from '@shared/game/entities/Player';
import {
  BuildingType,
  TurnPhase,
  UnitType,
} from '@shared/game/entities/types';
import { COLONY_CONSTANTS, NATION_BONUSES } from '@shared/game/constants';
import { TurnEngine } from '@shared/game/systems/TurnEngine';
import { EconomySystem } from '@shared/game/systems/EconomySystem';
import { TraversalUtils } from '@shared/game/utils/TraversalUtils';
import type { AuthoritativeGameState } from '@shared/game/AuthoritativeGameState';
import type { GameEffect } from '@shared/game/protocol';
import { evaluateOutcome } from '@server/game/handlers/OutcomeEvaluator';
import { playSeat } from '@server/game/handlers/SeatPlayer';

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

    if (!state.players.some((player) => player.isHuman)) {
      return effects;
    }

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

      this.processPhase(state, effects, generateId);
      if (state.phase === TurnPhase.MOVEMENT && !this.isHumanControllablePhase(state)) {
        effects.push(...playSeat(state, random, generateId));
      }

      if (this.isHumanControllablePhase(state)) {
        return effects;
      }
    }
  }

  private static advanceToNextPlayer(state: AuthoritativeGameState, effects: GameEffect[]): void {
    if (state.players.length === 0) {
      return;
    }

    const currentPlayerIndex = state.players.findIndex(
      (player) => player.id === state.currentPlayerId
    );
    const nextSeat = this.findNextParticipatingSeat(state.players, currentPlayerIndex);
    if (!nextSeat) {
      return;
    }

    if (nextSeat.wrapped) {
      state.turn += 1;
      effects.push({ type: 'autosaveRequested' });
      const result = evaluateOutcome(state);
      if (state.outcome === 'playing' && result) {
        state.outcome = result;
        effects.push({ type: 'gameEnded', result });
      }
    }

    const pioneerBonus = nextSeat.player.settlements.some((settlement) =>
      settlement.buildings.includes(BuildingType.STABLES),
    )
      ? COLONY_CONSTANTS.STABLES_MOVE_BONUS
      : 0;

    nextSeat.player.units.forEach((unit) => {
      const bonus = unit.type === UnitType.PIONEER ? pioneerBonus : 0;
      unit.movesRemaining = unit.maxMoves + bonus;
      unit.isSkipping = false;
    });

    state.currentPlayerId = nextSeat.player.id;
  }

  private static findNextParticipatingSeat(
    players: readonly Player[],
    currentPlayerIndex: number,
  ): { player: Player; wrapped: boolean } | undefined {
    if (players.length === 0) {
      return undefined;
    }

    const nextIndex = currentPlayerIndex < 0 ? 0 : (currentPlayerIndex + 1) % players.length;
    const player = players[nextIndex];
    if (!player) {
      return undefined;
    }

    return { player, wrapped: nextIndex === 0 };
  }

  private static processPhase(
    state: AuthoritativeGameState,
    effects: GameEffect[],
    generateId: (prefix: string) => string
  ): void {
    const current = this.selectCurrentPlayer(state);
    if (state.phase === TurnPhase.PRODUCTION) {
      if (current && NATION_BONUSES[current.nation]?.culture === 'NATIVE') {
        TurnEngine.produceNativeGoods(state.players, current.id);
        return;
      }

      const result = TurnEngine.runProduction(
        state.players,
        state.map,
        state.namingStats,
        generateId,
        state.currentPlayerId,
      );
      state.players = result.players;
      state.namingStats = result.namingStats;
      effects.push(...result.effects);
    } else if (state.phase === TurnPhase.TRADE && current?.isHuman) {
      state.europePrices = EconomySystem.recoverUnsoldPrices(
        state.europePrices,
        state.soldOnTurn,
        state.turn,
      );
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
