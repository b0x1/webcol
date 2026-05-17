import { GameSystem } from '@shared/game/systems/GameSystem';
import { generateId, random } from './utils';
import type { AuthoritativeGameState } from '@shared/game/AuthoritativeGameState';
import type {
  GameCommand,
  GameEffect,
  GameStateMessage,
  NewGameParams,
  SaveGameState,
} from '@shared/game/protocol';
import { createInitialAuthoritativeGameState } from './createInitialAuthoritativeGameState';
import { UnitCommandHandler } from './handlers/UnitCommandHandler';
import { SettlementCommandHandler } from './handlers/SettlementCommandHandler';
import { EconomyCommandHandler } from './handlers/EconomyCommandHandler';
import { CombatCommandHandler } from './handlers/CombatCommandHandler';
import { TurnCommandHandler } from './handlers/TurnCommandHandler';

type Listener = (message: GameStateMessage) => void;

export class LocalGameServer {
  private state: AuthoritativeGameState = createInitialAuthoritativeGameState();
  private readonly listeners = new Set<Listener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener({ type: 'state', state: this.getState(), effects: [] });
    return () => {
      this.listeners.delete(listener);
    };
  }

  dispatch(command: GameCommand): GameStateMessage {
    const effects = this.applyCommand(command);
    const message: GameStateMessage = {
      type: 'state',
      state: this.getState(),
      effects,
    };

    for (const listener of this.listeners) {
      listener(message);
    }

    return message;
  }

  getState(): AuthoritativeGameState {
    return structuredClone(this.state);
  }

  replaceState(state: AuthoritativeGameState): void {
    this.state = structuredClone(state);
  }

  private applyCommand(command: GameCommand): readonly GameEffect[] {
    switch (command.type) {
      case 'initGame':
        return this.initGame(command.params);
      case 'loadGame':
        return this.loadGame(command.state);
      case 'resetGame':
        return this.resetGame();
      case 'moveUnit':
        return UnitCommandHandler.moveUnit(this.state, command.unitId, command.to);
      case 'activateUnit':
        return UnitCommandHandler.activateUnit(this.state, command.unitId);
      case 'stowUnit':
        return UnitCommandHandler.stowUnit(this.state, command.unitId);
      case 'skipUnit':
        return UnitCommandHandler.skipUnit(this.state, command.unitId);
      case 'endTurn':
        return TurnCommandHandler.endTurn(this.state, random, generateId);
      case 'foundSettlement':
        return SettlementCommandHandler.foundSettlement(this.state, command.unitId, random, generateId);
      case 'buyBuilding':
        return SettlementCommandHandler.buyBuilding(this.state, command.settlementId, command.building);
      case 'assignJob':
        return SettlementCommandHandler.assignJob(this.state, command.settlementId, command.unitId, command.job);
      case 'sellGood':
        return EconomyCommandHandler.sellGood(this.state, command.unitId, command.good, command.amount);
      case 'buyGood':
        return EconomyCommandHandler.buyGood(this.state, command.unitId, command.good, command.amount);
      case 'recruitUnit':
        return EconomyCommandHandler.recruitUnit(this.state, command.unitType, command.fromUnitId, generateId);
      case 'tradeWithSettlement':
        return EconomyCommandHandler.tradeWithSettlement(this.state, command.settlementId, command.unitId, command.goodOffered, random);
      case 'learnFromSettlement':
        return EconomyCommandHandler.learnFromSettlement(this.state, command.settlementId, command.unitId);
      case 'attackSettlement':
        return CombatCommandHandler.attackSettlement(this.state, command.settlementId, command.unitId, random);
      case 'resolveCombat':
        return CombatCommandHandler.resolveCombat(this.state, command.attackerId, command.target, random);
    }
  }

  private initGame(params: NewGameParams): readonly GameEffect[] {
    const { map, players, namingStats } = GameSystem.initGame({
      ...params,
      random,
      generateId,
    });

    this.state = {
      ...createInitialAuthoritativeGameState(),
      map,
      players,
      namingStats,
      currentPlayerId: 'player-1',
    };

    return [{ type: 'gameStarted' }];
  }

  private loadGame(savedState: SaveGameState): readonly GameEffect[] {
    this.state = {
      ...createInitialAuthoritativeGameState(),
      ...savedState,
      namingStats: this.state.namingStats,
    };

    return [{ type: 'gameStarted' }, { type: 'gameLoaded' }];
  }

  private resetGame(): readonly GameEffect[] {
    this.state = createInitialAuthoritativeGameState();
    return [{ type: 'returnToMainMenu' }];
  }
}
