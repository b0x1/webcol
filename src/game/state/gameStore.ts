import { create } from 'zustand';
import { Player } from '../entities/Player';
import { Tile } from '../entities/Tile';
import { Unit } from '../entities/Unit';
import { Colony } from '../entities/Colony';
import { TurnPhase, UnitType } from '../entities/types';

export interface GameState {
  players: Player[];
  currentPlayerId: string;
  turn: number;
  phase: TurnPhase;
  selectedUnitId: string | null;
  map: Tile[][];

  selectUnit: (unitId: string | null) => void;
  moveUnit: (unitId: string, toX: number, toY: number) => void;
  endTurn: () => void;
  foundColony: (unitId: string) => void;
}

export const useGameStore = create<GameState>((set) => ({
  players: [],
  currentPlayerId: '',
  turn: 1,
  phase: TurnPhase.MOVEMENT,
  selectedUnitId: null,
  map: [],

  selectUnit: (unitId) => set({ selectedUnitId: unitId }),

  moveUnit: (unitId, toX, toY) =>
    set((state) => {
      const player = state.players.find((p) => p.id === state.currentPlayerId);
      if (!player) return state;

      const unit = player.units.find((u) => u.id === unitId);
      if (!unit) return state;

      if (
        toY < 0 ||
        toY >= state.map.length ||
        !state.map[toY] ||
        toX < 0 ||
        toX >= state.map[toY].length
      ) {
        return state;
      }
      const targetTile = state.map[toY][toX];

      if (unit.movesRemaining >= targetTile.movementCost) {
        const updatedPlayers = state.players.map((p) => {
          if (p.id === state.currentPlayerId) {
            const updatedUnits = p.units.map((u) => {
              if (u.id === unitId) {
                const newUnit = new Unit(
                  u.id,
                  u.ownerId,
                  u.type,
                  toX,
                  toY,
                  u.movesRemaining - targetTile.movementCost,
                );
                newUnit.cargo = new Map(u.cargo);
                newUnit.maxMoves = u.maxMoves;
                return newUnit;
              }
              return u;
            });
            const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold);
            newPlayer.units = updatedUnits;
            newPlayer.colonies = [...p.colonies];
            return newPlayer;
          }
          return p;
        });

        return { players: updatedPlayers };
      }

      return state;
    }),

  endTurn: () =>
    set((state) => {
      const phases: TurnPhase[] = [
        TurnPhase.MOVEMENT,
        TurnPhase.PRODUCTION,
        TurnPhase.TRADE,
        TurnPhase.AI,
        TurnPhase.END_TURN,
      ];
      const currentPhaseIndex = phases.indexOf(state.phase);

      if (currentPhaseIndex < phases.length - 1) {
        return { phase: phases[currentPhaseIndex + 1] };
      }

      // End of turn phase reached, cycle to next player
      if (state.players.length === 0) return { phase: TurnPhase.MOVEMENT };

      const currentPlayerIndex = state.players.findIndex((p) => p.id === state.currentPlayerId);
      const nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;
      const nextPlayer = state.players[nextPlayerIndex];

      const nextTurn = nextPlayerIndex === 0 ? state.turn + 1 : state.turn;

      // Reset moves for the NEW current player
      const updatedPlayers = state.players.map((p) => {
        if (p.id === nextPlayer.id) {
          const updatedUnits = p.units.map((u) => {
            const newUnit = new Unit(u.id, u.ownerId, u.type, u.x, u.y, u.maxMoves);
            newUnit.cargo = new Map(u.cargo);
            newUnit.maxMoves = u.maxMoves;
            return newUnit;
          });
          const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold);
          newPlayer.units = updatedUnits;
          newPlayer.colonies = [...p.colonies];
          return newPlayer;
        }
        return p;
      });

      return {
        phase: TurnPhase.MOVEMENT,
        currentPlayerId: nextPlayer.id,
        turn: nextTurn,
        players: updatedPlayers,
        selectedUnitId: null,
      };
    }),

  foundColony: (unitId) =>
    set((state) => {
      const player = state.players.find((p) => p.id === state.currentPlayerId);
      if (!player) return state;

      const unit = player.units.find((u) => u.id === unitId);
      if (!unit || unit.type !== UnitType.COLONIST) return state;

      const newColony = new Colony(
        `colony-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        player.id,
        `${player.name}'s Colony`,
        unit.x,
        unit.y,
        1,
      );

      const updatedPlayers = state.players.map((p) => {
        if (p.id === state.currentPlayerId) {
          const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold);
          newPlayer.units = p.units.filter((u) => u.id !== unitId);
          newPlayer.colonies = [...p.colonies, newColony];
          return newPlayer;
        }
        return p;
      });

      return {
        players: updatedPlayers,
        selectedUnitId: state.selectedUnitId === unitId ? null : state.selectedUnitId,
      };
    }),
}));
