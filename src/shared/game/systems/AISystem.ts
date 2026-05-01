import type { Player } from '../entities/Player';
import type { Tile } from '../entities/Tile';
import type { NamingStats } from './NamingSystem';
import type { GameEffect } from '../protocol';

export interface AISystemResult {
  readonly players: Player[];
  readonly namingStats: NamingStats;
  readonly effects: readonly GameEffect[];
}


export class AISystem {  // eslint-disable-line @typescript-eslint/no-extraneous-class
  private constructor() {
    // Static utility class
  }

  static runAITurn(
    players: Player[],
    _map: Tile[][],
    namingStats: NamingStats,
    _random: () => number,
    _generateId: (prefix: string) => string
  ): AISystemResult {
    // Simplified dummy AISystem
    return { players, namingStats, effects: [] };
  }
}
