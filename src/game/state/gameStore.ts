import { create } from 'zustand';
import { Player } from '../entities/Player';
import { Tile } from '../entities/Tile';
import { Unit } from '../entities/Unit';
import { Colony } from '../entities/Colony';
import { NativeSettlement } from '../entities/NativeSettlement';
import { BuildingType, GoodType, JobType, TurnPhase, UnitType } from '../entities/types';
import { TurnEngine } from '../systems/TurnEngine';
import { BUILDING_COSTS, RECRUITMENT_COSTS } from '../constants';
import { NativeInteractionSystem } from '../systems/NativeInteractionSystem';
import { CombatSystem } from '../systems/CombatSystem';

export interface GameState {
  players: Player[];
  currentPlayerId: string;
  turn: number;
  phase: TurnPhase;
  selectedUnitId: string | null;
  selectedColonyId: string | null;
  isColonyScreenOpen: boolean;
  isEuropeScreenOpen: boolean;
  isNativeTradeModalOpen: boolean;
  activeSettlementId: string | null;
  europePrices: Record<GoodType, number>;
  map: Tile[][];
  nativeSettlements: NativeSettlement[];

  selectUnit: (unitId: string | null) => void;
  selectColony: (colonyId: string | null) => void;
  setColonyScreenOpen: (isOpen: boolean) => void;
  setEuropeScreenOpen: (isOpen: boolean) => void;
  setNativeTradeModalOpen: (isOpen: boolean, settlementId?: string | null) => void;
  moveUnit: (unitId: string, toX: number, toY: number) => void;
  endTurn: () => void;
  foundColony: (unitId: string) => void;
  buyBuilding: (colonyId: string, building: BuildingType) => void;
  assignJob: (colonyId: string, unitId: string, job: JobType) => void;
  sellGood: (unitId: string, good: GoodType, amount: number) => void;
  buyGood: (unitId: string, good: GoodType, amount: number) => void;
  recruitUnit: (unitType: UnitType) => void;
  tradeWithNativeSettlement: (settlementId: string, unitId: string, goodOffered: GoodType) => void;
  learnFromNativeSettlement: (settlementId: string, unitId: string) => void;
  attackNativeSettlement: (settlementId: string, unitId: string) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  players: [],
  currentPlayerId: '',
  turn: 1,
  phase: TurnPhase.MOVEMENT,
  selectedUnitId: null,
  selectedColonyId: null,
  isColonyScreenOpen: false,
  isEuropeScreenOpen: false,
  isNativeTradeModalOpen: false,
  activeSettlementId: null,
  europePrices: {
    [GoodType.FOOD]: 1,
    [GoodType.LUMBER]: 2,
    [GoodType.ORE]: 3,
    [GoodType.TOBACCO]: 4,
    [GoodType.COTTON]: 3,
    [GoodType.FURS]: 5,
    [GoodType.TRADE_GOODS]: 6,
    [GoodType.MUSKETS]: 8,
  },
  map: [],
  nativeSettlements: [],

  selectUnit: (unitId) => set({ selectedUnitId: unitId, selectedColonyId: null }),
  selectColony: (colonyId) => set({ selectedColonyId: colonyId, selectedUnitId: null }),
  setColonyScreenOpen: (isOpen) => set({ isColonyScreenOpen: isOpen }),
  setEuropeScreenOpen: (isOpen) => set({ isEuropeScreenOpen: isOpen }),
  setNativeTradeModalOpen: (isOpen, settlementId = null) =>
    set({ isNativeTradeModalOpen: isOpen, activeSettlementId: settlementId }),

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

  endTurn: () => {
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
        const nextPhase = phases[currentPhaseIndex + 1];
        return { phase: nextPhase };
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
    });

    // Check if we need to auto-advance phases
    const state = get();
    if (state.phase === TurnPhase.PRODUCTION) {
      const updatedPlayers = TurnEngine.runProduction(state.players);
      set({ players: updatedPlayers });
      state.endTurn();
    } else if (state.phase === TurnPhase.TRADE) {
      state.endTurn();
    } else if (state.phase === TurnPhase.AI) {
      const updatedPlayers = TurnEngine.runAITurn(state.players, state.map);
      set({ players: updatedPlayers });
      state.endTurn();
    } else if (state.phase === TurnPhase.END_TURN) {
      state.endTurn();
    }
  },

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
      newColony.units.push(unit);
      newColony.workforce.set(unit.id, JobType.FARMER);

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

  buyBuilding: (colonyId, building) =>
    set((state) => {
      const buildingCosts: Record<string, number> = {
        ...BUILDING_COSTS,
        [BuildingType.TOWN_HALL]: 0,
        [BuildingType.CARPENTERS_SHOP]: 0,
        [BuildingType.BLACKSMITHS_HOUSE]: 0,
        [BuildingType.BLACKSMITHS_SHOP]: 0,
        [BuildingType.STABLES]: 0,
      };

      const cost = buildingCosts[building] || 0;
      const player = state.players.find((p) => p.id === state.currentPlayerId);
      if (!player || player.gold < cost) return state;

      const updatedPlayers = state.players.map((p) => {
        if (p.id === state.currentPlayerId) {
          const updatedColonies = p.colonies.map((c) => {
            if (c.id === colonyId) {
              const newColony = new Colony(c.id, c.ownerId, c.name, c.x, c.y, c.population);
              newColony.buildings = [...c.buildings, building];
              newColony.inventory = new Map(c.inventory);
              newColony.workforce = new Map(c.workforce);
              newColony.units = [...c.units];
              newColony.productionQueue = [...c.productionQueue];
              return newColony;
            }
            return c;
          });
          const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold - cost);
          newPlayer.units = [...p.units];
          newPlayer.colonies = updatedColonies;
          return newPlayer;
        }
        return p;
      });

      return { players: updatedPlayers };
    }),

  assignJob: (colonyId, unitId, job) =>
    set((state) => {
      const updatedPlayers = state.players.map((p) => {
        const updatedColonies = p.colonies.map((c) => {
          if (c.id === colonyId) {
            const newColony = new Colony(c.id, c.ownerId, c.name, c.x, c.y, c.population);
            newColony.buildings = [...c.buildings];
            newColony.inventory = new Map(c.inventory);
            const newWorkforce = new Map(c.workforce);
            newWorkforce.set(unitId, job);
            newColony.workforce = newWorkforce;
            newColony.units = [...c.units];
            newColony.productionQueue = [...c.productionQueue];
            return newColony;
          }
          return c;
        });
        const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold);
        newPlayer.units = [...p.units];
        newPlayer.colonies = updatedColonies;
        return newPlayer;
      });

      return { players: updatedPlayers };
    }),

  sellGood: (unitId, good, amount) =>
    set((state) => {
      const player = state.players.find((p) => p.id === state.currentPlayerId);
      if (!player) return state;

      const unit = player.units.find((u) => u.id === unitId);
      if (!unit) return state;

      const cargoAmount = unit.cargo.get(good) || 0;
      const actualSellAmount = Math.min(amount, cargoAmount);
      if (actualSellAmount <= 0) return state;

      const price = state.europePrices[good];
      const goldGained = actualSellAmount * price;

      const updatedPlayers = state.players.map((p) => {
        if (p.id === state.currentPlayerId) {
          const updatedUnits = p.units.map((u) => {
            if (u.id === unitId) {
              const newUnit = new Unit(u.id, u.ownerId, u.type, u.x, u.y, u.movesRemaining);
              newUnit.maxMoves = u.maxMoves;
              newUnit.cargo = new Map(u.cargo);
              newUnit.cargo.set(good, cargoAmount - actualSellAmount);
              return newUnit;
            }
            return u;
          });
          const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold + goldGained);
          newPlayer.units = updatedUnits;
          newPlayer.colonies = [...p.colonies];
          return newPlayer;
        }
        return p;
      });

      const newPrices = { ...state.europePrices };
      if (actualSellAmount > 20) {
        newPrices[good] = Math.max(1, price - 1);
      }

      return { players: updatedPlayers, europePrices: newPrices };
    }),

  buyGood: (unitId, good, amount) =>
    set((state) => {
      const player = state.players.find((p) => p.id === state.currentPlayerId);
      if (!player) return state;

      const unit = player.units.find((u) => u.id === unitId);
      if (!unit) return state;

      const price = state.europePrices[good];
      const cost = amount * price;
      if (player.gold < cost) return state;

      const updatedPlayers = state.players.map((p) => {
        if (p.id === state.currentPlayerId) {
          const updatedUnits = p.units.map((u) => {
            if (u.id === unitId) {
              const newUnit = new Unit(u.id, u.ownerId, u.type, u.x, u.y, u.movesRemaining);
              newUnit.maxMoves = u.maxMoves;
              newUnit.cargo = new Map(u.cargo);
              newUnit.cargo.set(good, (u.cargo.get(good) || 0) + amount);
              return newUnit;
            }
            return u;
          });
          const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold - cost);
          newPlayer.units = updatedUnits;
          newPlayer.colonies = [...p.colonies];
          return newPlayer;
        }
        return p;
      });

      return { players: updatedPlayers };
    }),

  tradeWithNativeSettlement: (settlementId, unitId, goodOffered) =>
    set((state) => {
      const settlement = state.nativeSettlements.find((s) => s.id === settlementId);
      const player = state.players.find((p) => p.id === state.currentPlayerId);
      const unit = player?.units.find((u) => u.id === unitId);

      if (!settlement || !unit) return state;

      const { updatedSettlement, updatedUnit } = NativeInteractionSystem.trade(
        settlement,
        unit,
        goodOffered
      );

      const updatedSettlements = state.nativeSettlements.map((s) =>
        s.id === settlementId ? updatedSettlement : s
      );

      const updatedPlayers = state.players.map((p) => {
        if (p.id === state.currentPlayerId) {
          const updatedUnits = p.units.map((u) => (u.id === unitId ? updatedUnit : u));
          const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold);
          newPlayer.units = updatedUnits;
          newPlayer.colonies = [...p.colonies];
          return newPlayer;
        }
        return p;
      });

      return {
        nativeSettlements: updatedSettlements,
        players: updatedPlayers,
        isNativeTradeModalOpen: false,
        activeSettlementId: null,
      };
    }),

  learnFromNativeSettlement: (settlementId, unitId) =>
    set((state) => {
      const settlement = state.nativeSettlements.find((s) => s.id === settlementId);
      const player = state.players.find((p) => p.id === state.currentPlayerId);
      const unit = player?.units.find((u) => u.id === unitId);

      if (!settlement || !unit) return state;

      const { updatedSettlement, updatedUnit } = NativeInteractionSystem.learn(settlement, unit);

      const updatedSettlements = state.nativeSettlements.map((s) =>
        s.id === settlementId ? updatedSettlement : s
      );

      const updatedPlayers = state.players.map((p) => {
        if (p.id === state.currentPlayerId) {
          const updatedUnits = p.units.map((u) => (u.id === unitId ? updatedUnit : u));
          const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold);
          newPlayer.units = updatedUnits;
          newPlayer.colonies = [...p.colonies];
          return newPlayer;
        }
        return p;
      });

      return {
        nativeSettlements: updatedSettlements,
        players: updatedPlayers,
        isNativeTradeModalOpen: false,
        activeSettlementId: null,
      };
    }),

  attackNativeSettlement: (settlementId, unitId) =>
    set((state) => {
      const settlement = state.nativeSettlements.find((s) => s.id === settlementId);
      const player = state.players.find((p) => p.id === state.currentPlayerId);
      const unit = player?.units.find((u) => u.id === unitId);

      if (!settlement || !unit) return state;

      const win = CombatSystem.resolveCombat(unit, settlement);

      if (win) {
        // Remove settlement if defeated
        const updatedSettlements = state.nativeSettlements.filter((s) => s.id !== settlementId);
        return { nativeSettlements: updatedSettlements };
      } else {
        // Remove unit if defeated
        const updatedPlayers = state.players.map((p) => {
          if (p.id === state.currentPlayerId) {
            const updatedUnits = p.units.filter((u) => u.id !== unitId);
            const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold);
            newPlayer.units = updatedUnits;
            newPlayer.colonies = [...p.colonies];
            return newPlayer;
          }
          return p;
        });
        return { players: updatedPlayers, selectedUnitId: null };
      }
    }),

  recruitUnit: (unitType) =>
    set((state) => {
      const player = state.players.find((p) => p.id === state.currentPlayerId);
      if (!player) return state;

      const selectedUnit = player.units.find((u) => u.id === state.selectedUnitId);
      if (!selectedUnit || selectedUnit.type !== UnitType.SHIP) return state;

      const costs: Record<string, number> = {
        ...RECRUITMENT_COSTS,
        [UnitType.SHIP]: 0,
      };

      const goldCost = costs[unitType] || 0;
      if (player.gold < goldCost) return state;

      let musketsToConsume = 0;
      if (unitType === UnitType.SOLDIER) {
        musketsToConsume = 50;
        const currentMuskets = selectedUnit.cargo.get(GoodType.MUSKETS) || 0;
        if (currentMuskets < musketsToConsume) return state;
      }

      const updatedPlayers = state.players.map((p) => {
        if (p.id === state.currentPlayerId) {
          const newUnit = new Unit(
            `unit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            p.id,
            unitType,
            selectedUnit.x,
            selectedUnit.y,
            1, // Initial moves
          );

          const updatedUnits = p.units.map((u) => {
            if (u.id === selectedUnit.id && musketsToConsume > 0) {
              const updatedShip = new Unit(u.id, u.ownerId, u.type, u.x, u.y, u.movesRemaining);
              updatedShip.maxMoves = u.maxMoves;
              updatedShip.cargo = new Map(u.cargo);
              updatedShip.cargo.set(
                GoodType.MUSKETS,
                (u.cargo.get(GoodType.MUSKETS) || 0) - musketsToConsume,
              );
              return updatedShip;
            }
            return u;
          });

          const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold - goldCost);
          newPlayer.units = [...updatedUnits, newUnit];
          newPlayer.colonies = [...p.colonies];
          return newPlayer;
        }
        return p;
      });

      return { players: updatedPlayers };
    }),
}));

if (typeof window !== 'undefined') {
  (window as any).useGameStore = useGameStore;
}
