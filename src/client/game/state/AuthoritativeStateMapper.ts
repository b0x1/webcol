import type { GameState } from '@client/game/state/types';
import type { AuthoritativeGameState } from '@shared/game/AuthoritativeGameState';

export const applyAuthoritativeState = (
  state: GameState,
  snapshot: AuthoritativeGameState,
): void => {
  state.players = snapshot.players;
  state.currentPlayerId = snapshot.currentPlayerId;
  state.turn = snapshot.turn;
  state.phase = snapshot.phase;
  state.europePrices = snapshot.europePrices;
  state.map = snapshot.map;
  state.namingStats = snapshot.namingStats;
};

export const extractAuthoritativeState = (state: GameState): AuthoritativeGameState => ({
  players: state.players,
  currentPlayerId: state.currentPlayerId,
  turn: state.turn,
  phase: state.phase,
  europePrices: state.europePrices,
  map: state.map,
  namingStats: state.namingStats,
});
