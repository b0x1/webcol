import type { Player } from '@shared/game/entities/Player';
import type { Unit } from '@shared/game/entities/Unit';
import {
  BuildingType,
  GoodType,
  TurnPhase,
  UnitType,
} from '@shared/game/entities/types';
import { COLONY_CONSTANTS, NATION_BONUSES, VICTORY_CONSTANTS } from '@shared/game/constants';
import { TurnEngine } from '@shared/game/systems/TurnEngine';
import { AISystem } from '@shared/game/systems/AISystem';
import { EconomySystem } from '@shared/game/systems/EconomySystem';
import { TraversalUtils } from '@shared/game/utils/TraversalUtils';
import type { AuthoritativeGameState, GameOutcome } from '@shared/game/AuthoritativeGameState';
import type { GameCommand, GameEffect } from '@shared/game/protocol';
import { SettlementCommandHandler } from '@server/game/handlers/SettlementCommandHandler';
import { UnitCommandHandler } from '@server/game/handlers/UnitCommandHandler';

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
        effects.push(...this.playSeat(state, random, generateId));
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
      const result = this.evaluateOutcome(state);
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

  private static playSeat(
    state: AuthoritativeGameState,
    random: () => number,
    generateId: (prefix: string) => string,
  ): readonly GameEffect[] {
    const effects: GameEffect[] = [];
    for (const command of AISystem.chooseCommands(state)) {
      effects.push(...this.applySeatCommand(state, command, random, generateId));
    }
    return effects;
  }

  private static applySeatCommand(
    state: AuthoritativeGameState,
    command: GameCommand,
    random: () => number,
    generateId: (prefix: string) => string,
  ): readonly GameEffect[] {
    switch (command.type) {
      case 'moveUnit':
        return UnitCommandHandler.moveUnit(state, command.unitId, command.to);
      case 'foundSettlement':
        return SettlementCommandHandler.foundSettlement(state, command.unitId, random, generateId);
      case 'assignJob':
        return SettlementCommandHandler.assignJob(state, command.settlementId, command.unitId, command.job);
      case 'skipUnit':
        return UnitCommandHandler.skipUnit(state, command.unitId);
      default:
        return [];
    }
  }

  private static evaluateOutcome(state: AuthoritativeGameState): Exclude<GameOutcome, 'playing'> | null {
    const human = state.players.find((player) => player.isHuman);
    if (!human) {
      return null;
    }

    if (
      human.gold >= VICTORY_CONSTANTS.GOLD &&
      human.settlements.length >= VICTORY_CONSTANTS.COLONIES
    ) {
      return 'goal';
    }

    if (this.isColonyLost(human)) {
      return 'loss';
    }

    return null;
  }

  private static isColonyLost(human: Player): boolean {
    if (human.settlements.length === 0) {
      return false;
    }

    const noFood = human.settlements.every(
      (settlement) => (settlement.inventory.get(GoodType.FOOD) ?? 0) === 0,
    );
    if (!noFood) {
      return false;
    }

    const workers = [
      ...human.units,
      ...human.settlements.flatMap((settlement) => settlement.units),
    ];
    return !workers.some((unit) => this.canWorkField(unit));
  }

  private static canWorkField(unit: Unit): boolean {
    return unit.type === UnitType.COLONIST && unit.inEurope !== true;
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
