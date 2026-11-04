import type { Player } from '@shared/game/entities/Player';
import {
  BuildingType,
  TurnPhase,
  UnitType,
} from '@shared/game/entities/types';
import { COLONY_CONSTANTS, NATION_BONUSES } from '@shared/game/constants';
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

      this.processPhase(state, effects, random, generateId);

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
      TurnEngine.produceNativeGoods(state.players);
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
    let nextIndex = currentPlayerIndex < 0 ? players.length - 1 : currentPlayerIndex;
    let wrapped = false;
    let stepsRemaining = players.length;

    while (stepsRemaining > 0) {
      stepsRemaining -= 1;
      nextIndex = (nextIndex + 1) % players.length;
      if (nextIndex === 0) {
        wrapped = true;
      }

      const candidate = players[nextIndex];
      if (candidate && !this.isNativeSeat(candidate)) {
        return { player: candidate, wrapped };
      }
    }

    return undefined;
  }

  private static isNativeSeat(player: Player): boolean {
    return !player.isHuman && NATION_BONUSES[player.nation]?.culture === 'NATIVE';
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
        generateId,
        state.currentPlayerId,
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
