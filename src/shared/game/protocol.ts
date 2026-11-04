import type { Tile } from '@shared/game/entities/Tile';
import type { Position } from '@shared/game/entities/Position';
import type {
  BuildingType,
  GoodType,
  Nation,
  TurnPhase,
  UnitType,
} from '@shared/game/entities/types';
import type { CombatResult } from '@shared/game/systems/CombatSystem';
import type { AuthoritativeGameState, GameOutcome } from './AuthoritativeGameState';

export type MapSize = 'Small' | 'Medium' | 'Large';

export interface NewGameParams {
  playerName: string;
  nation: Nation;
  mapSize: MapSize;
  aiCount: number;
}

export interface SaveGameState {
  players: AuthoritativeGameState['players'];
  currentPlayerId: string;
  turn: number;
  phase: TurnPhase;
  europePrices: Record<GoodType, number>;
  map: Tile[][];
}

export type GameCommand =
  | { type: 'initGame'; params: NewGameParams }
  | { type: 'loadGame'; state: SaveGameState }
  | { type: 'resetGame' }
  | { type: 'moveUnit'; unitId: string; to: Position }
  | { type: 'activateUnit'; unitId: string }
  | { type: 'stowUnit'; unitId: string }
  | { type: 'skipUnit'; unitId: string }
  | { type: 'endTurn' }
  | { type: 'foundSettlement'; unitId: string }
  | { type: 'buyBuilding'; settlementId: string; building: BuildingType }
  | { type: 'assignJob'; settlementId: string; unitId: string; job: string | null }
  | { type: 'sellGood'; unitId: string; good: GoodType; amount: number }
  | { type: 'buyGood'; unitId: string; good: GoodType; amount: number }
  | { type: 'transferGood'; unitId: string; settlementId: string; good: GoodType; amount: number; direction: 'load' | 'unload' }
  | { type: 'sailToEurope'; unitId: string }
  | { type: 'returnFromEurope'; unitId: string }
  | { type: 'improveTile'; unitId: string }
  | { type: 'recruitUnit'; unitType: UnitType; fromUnitId: string | null }
  | { type: 'tradeWithSettlement'; settlementId: string; unitId: string; goodOffered: GoodType }
  | { type: 'learnFromSettlement'; settlementId: string; unitId: string }
  | { type: 'attackSettlement'; settlementId: string; unitId: string }
  | { type: 'resolveCombat'; attackerId: string; target: Position };

export type GameEffect =
  | { type: 'notification'; message: string }
  | { type: 'unitMoved'; id: string; fromX: number; fromY: number; toX: number; toY: number }
  | { type: 'combatResolved'; result: CombatResult }
  | { type: 'gameStarted' }
  | { type: 'gameLoaded' }
  | { type: 'returnToMainMenu' }
  | { type: 'autosaveRequested' }
  | { type: 'gameEnded'; result: Exclude<GameOutcome, 'playing'> };

export interface GameStateMessage {
  type: 'state';
  state: AuthoritativeGameState;
  effects: readonly GameEffect[];
}
