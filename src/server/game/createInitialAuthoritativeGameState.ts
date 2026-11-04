import { GoodType, TurnPhase } from '@shared/game/entities/types';
import type { AuthoritativeGameState } from '@shared/game/AuthoritativeGameState';

export function createInitialAuthoritativeGameState(): AuthoritativeGameState {
  return {
    players: [],
    currentPlayerId: '',
    turn: 1,
    phase: TurnPhase.MOVEMENT,
    europePrices: {
      [GoodType.FOOD]: 1,
      [GoodType.LUMBER]: 2,
      [GoodType.ORE]: 3,
      [GoodType.TOBACCO]: 4,
      [GoodType.COTTON]: 3,
      [GoodType.FURS]: 5,
      [GoodType.SUGAR]: 3,
      [GoodType.RUM]: 8,
      [GoodType.CLOTH]: 8,
      [GoodType.COATS]: 10,
      [GoodType.CIGARS]: 10,
      [GoodType.TOOLS]: 5,
      [GoodType.TRADE_GOODS]: 6,
      [GoodType.MUSKETS]: 12,
    },
    soldOnTurn: {},
    outcome: 'playing',
    map: [],
    namingStats: {},
  };
}
