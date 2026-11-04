import type { Player } from '@shared/game/entities/Player';
import type { Tile } from '@shared/game/entities/Tile';
import type { GoodType, TurnPhase } from '@shared/game/entities/types';
import type { NamingStats } from '@shared/game/systems/NamingSystem';

export type GameOutcome = 'playing' | 'loss' | 'goal';

export interface AuthoritativeGameState {
  players: Player[];
  currentPlayerId: string;
  turn: number;
  phase: TurnPhase;
  europePrices: Record<GoodType, number>;
  soldOnTurn: Partial<Record<GoodType, number>>;
  outcome: GameOutcome;
  map: Tile[][];
  namingStats: NamingStats;
}
