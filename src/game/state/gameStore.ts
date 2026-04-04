import { create } from 'zustand';
import { Player } from '../entities/Player';
import { Tile } from '../entities/Tile';
import { Unit } from '../entities/Unit';
import { Colony } from '../entities/Colony';
import { NativeSettlement } from '../entities/NativeSettlement';
import { BuildingType, GoodType, JobType, Nation, TurnPhase, UnitType, TerrainType, Attitude, ResourceType } from '../entities/types';
import { TurnEngine } from '../systems/TurnEngine';
import { BUILDING_COSTS, RECRUITMENT_COSTS } from '../constants';
import { NativeInteractionSystem } from '../systems/NativeInteractionSystem';
import { TerrainGenerator } from '../map/TerrainGenerator';
import { eventBus } from './EventBus';
import { CombatSystem } from '../systems/CombatSystem';
import type { CombatResult } from '../systems/CombatSystem';

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
  combatResult: CombatResult | null;
  isSaveModalOpen: boolean;
  isMainMenuOpen: boolean;
  isGameSetupModalOpen: boolean;
  isHowToPlayModalOpen: boolean;

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
  resolveCombat: (attackerId: string, targetX: number, targetY: number) => void;
  clearCombatResult: () => void;
  setSaveModalOpen: (isOpen: boolean) => void;
  loadGameState: (state: Partial<GameState>) => void;
  setMainMenuOpen: (isOpen: boolean) => void;
  setGameSetupModalOpen: (isOpen: boolean) => void;
  setHowToPlayModalOpen: (isOpen: boolean) => void;
  initGame: (params: { playerName: string; nation: Nation; mapSize: 'Small' | 'Medium' | 'Large'; aiCount: number }) => void;
  resetGame: () => void;
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
  combatResult: null,
  isSaveModalOpen: false,
  isMainMenuOpen: true,
  isGameSetupModalOpen: false,
  isHowToPlayModalOpen: false,

  selectUnit: (unitId) => set({ selectedUnitId: unitId, selectedColonyId: null }),
  selectColony: (colonyId) => set({ selectedColonyId: colonyId, selectedUnitId: null }),
  setColonyScreenOpen: (isOpen) => set({ isColonyScreenOpen: isOpen }),
  setEuropeScreenOpen: (isOpen) => set({ isEuropeScreenOpen: isOpen }),
  setNativeTradeModalOpen: (isOpen, settlementId = null) =>
    set({ isNativeTradeModalOpen: isOpen, activeSettlementId: settlementId }),
  setSaveModalOpen: (isOpen) => set({ isSaveModalOpen: isOpen }),
  setMainMenuOpen: (isOpen) => set({ isMainMenuOpen: isOpen }),
  setGameSetupModalOpen: (isOpen) => set({ isGameSetupModalOpen: isOpen }),
  setHowToPlayModalOpen: (isOpen) => set({ isHowToPlayModalOpen: isOpen }),

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
          const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold, p.nation);
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

      // Auto-save at the start of a new turn
      if (nextTurn > state.turn && nextPlayerIndex === 0) {
        // We use setTimeout to ensure the store is updated before we save
        setTimeout(() => {
          const currentState = get();
          TurnEngine.autoSave(currentState);
        }, 0);
      }

      // Reset moves for the NEW current player
      const updatedPlayers = state.players.map((p) => {
        if (p.id === nextPlayer.id) {
          const updatedUnits = p.units.map((u) => {
            const newUnit = new Unit(u.id, u.ownerId, u.type, u.x, u.y, u.maxMoves);
            newUnit.cargo = new Map(u.cargo);
            newUnit.maxMoves = u.maxMoves;
            return newUnit;
          });
          const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold, p.nation);
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
          const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold, p.nation);
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
          const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold - cost, p.nation);
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
        const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold, p.nation);
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
          const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold + goldGained, p.nation);
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
          const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold - cost, p.nation);
          newPlayer.units = updatedUnits;
          newPlayer.colonies = [...p.colonies];
          return newPlayer;
        }
        return p;
      });

      return { players: updatedPlayers };
    }),

  loadGameState: (state) => {
    set({ ...state, isSaveModalOpen: false, isMainMenuOpen: false });
    eventBus.emit('gameStarted');
  },

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
          const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold, p.nation);
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
          const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold, p.nation);
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

  attackNativeSettlement: (settlementId, unitId) => {
    const state = get();
    const settlement = state.nativeSettlements.find((s) => s.id === settlementId);
    if (settlement) {
      state.resolveCombat(unitId, settlement.x, settlement.y);
    }
  },

  clearCombatResult: () => set({ combatResult: null }),

  resolveCombat: (attackerId, targetX, targetY) =>
    set((state) => {
      const player = state.players.find((p) => p.id === state.currentPlayerId);
      if (!player) return state;

      const attacker = player.units.find((u) => u.id === attackerId);
      if (!attacker) return state;

      // Find defender (Unit, NativeSettlement, or Colony)
      let defender: Unit | NativeSettlement | Colony | undefined;
      let defenderColony: Colony | undefined;

      // Check for units (highest priority)
      for (const p of state.players) {
        if (p.id !== state.currentPlayerId) {
          const unit = p.units.find((u) => u.x === targetX && u.y === targetY);
          if (unit) {
            defender = unit;
            break;
          }
        }
      }

      // Check for colonies (always check even if unit is defender to apply Stockade bonus)
      for (const p of state.players) {
        const colony = p.colonies.find((c) => c.x === targetX && c.y === targetY);
        if (colony) {
          defenderColony = colony;
          if (!defender && p.id !== state.currentPlayerId) {
            defender = colony;
          }
          break;
        }
      }

      // Check for native settlements
      if (!defender) {
        defender = state.nativeSettlements.find((s) => s.x === targetX && s.y === targetY);
      }

      if (!defender) return state;

      const defenderTile = state.map[targetY][targetX];
      const result = CombatSystem.resolveCombat(attacker, defender, defenderTile, defenderColony);

      let updatedPlayers = [...state.players];
      let updatedNativeSettlements = [...state.nativeSettlements];

      if (result.winner === 'attacker') {
        if (defender instanceof Unit) {
          // Remove defender unit
          updatedPlayers = updatedPlayers.map((p) => {
            const updatedUnits = p.units.filter((u) => u !== defender);
            const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold, p.nation);
            newPlayer.units = updatedUnits;
            newPlayer.colonies = [...p.colonies];
            return newPlayer;
          });
        } else if (defender instanceof NativeSettlement) {
          // Reduce population or remove settlement
          if (defender.population > 1) {
            updatedNativeSettlements = updatedNativeSettlements.map((s) => {
              if (s.id === defender!.id) {
                const ns = new NativeSettlement(
                  s.id,
                  s.name,
                  s.tribe,
                  s.x,
                  s.y,
                  s.population - 1,
                  s.attitude,
                  new Map(s.goods),
                );
                return ns;
              }
              return s;
            });
          } else {
            updatedNativeSettlements = updatedNativeSettlements.filter((s) => s.id !== defender!.id);
          }
        } else if (defender instanceof Colony) {
          // Change colony owner and move attacker unit
          updatedPlayers = updatedPlayers.map((p) => {
            if (p.id === defender.ownerId) {
              // Remove colony from previous owner
              const updatedColonies = p.colonies.filter((c) => c.id !== defender.id);
              const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold, p.nation);
              newPlayer.units = [...p.units];
              newPlayer.colonies = updatedColonies;
              return newPlayer;
            } else if (p.id === state.currentPlayerId) {
              // Move attacker and add colony to new owner
              const updatedUnits = p.units.map((u) => {
                if (u.id === attackerId) {
                  const nu = new Unit(u.id, u.ownerId, u.type, targetX, targetY, 0);
                  nu.cargo = new Map(u.cargo);
                  nu.maxMoves = u.maxMoves;
                  return nu;
                }
                return u;
              });
              const capturedColony = new Colony(
                defender.id,
                p.id, // New owner
                defender.name,
                defender.x,
                defender.y,
                defender.population
              );
              capturedColony.buildings = [...defender.buildings];
              capturedColony.inventory = new Map(defender.inventory);
              capturedColony.productionQueue = [...defender.productionQueue];
              capturedColony.workforce = new Map(defender.workforce);
              capturedColony.units = defender.units.map(u => {
                const nu = new Unit(u.id, p.id, u.type, u.x, u.y, 0);
                nu.cargo = new Map(u.cargo);
                nu.maxMoves = u.maxMoves;
                return nu;
              });

              const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold, p.nation);
              newPlayer.units = updatedUnits;
              newPlayer.colonies = [...p.colonies, capturedColony];
              return newPlayer;
            }
            return p;
          });
        }
      } else {
        // Attacker lost, remove attacker unit
        updatedPlayers = updatedPlayers.map((p) => {
          if (p.id === state.currentPlayerId) {
            const updatedUnits = p.units.filter((u) => u.id !== attackerId);
            const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold, p.nation);
            newPlayer.units = updatedUnits;
            newPlayer.colonies = [...p.colonies];
            return newPlayer;
          }
          return p;
        });
      }

      return {
        players: updatedPlayers,
        nativeSettlements: updatedNativeSettlements,
        combatResult: result,
        selectedUnitId: result.winner === 'attacker' ? state.selectedUnitId : null,
      };
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

      let goldCost = costs[unitType] || 0;
      if (unitType === UnitType.SOLDIER && player.nation === Nation.SPAIN) {
        goldCost = 600;
      }
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

          const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold - goldCost, p.nation);
          newPlayer.units = [...updatedUnits, newUnit];
          newPlayer.colonies = [...p.colonies];
          return newPlayer;
        }
        return p;
      });

      return { players: updatedPlayers };
    }),

  resetGame: () => {
    set({
      players: [],
      currentPlayerId: '',
      turn: 1,
      phase: TurnPhase.MOVEMENT,
      selectedUnitId: null,
      selectedColonyId: null,
      map: [],
      nativeSettlements: [],
      isMainMenuOpen: true,
    });
    eventBus.emit('returnToMainMenu');
  },

  initGame: ({ playerName, nation, mapSize, aiCount }) => {
    const dimensions = {
      Small: { width: 40, height: 30 },
      Medium: { width: 80, height: 60 },
      Large: { width: 120, height: 90 },
    }[mapSize];

    const generator = new TerrainGenerator(dimensions.width, dimensions.height);
    const terrainData = generator.generate();
    const nativeSettlements = generator.generateNativeSettlements(terrainData);

    if (nation === Nation.FRANCE) {
      nativeSettlements.forEach(s => s.attitude = Attitude.FRIENDLY);
    }

    const tiles: Tile[][] = terrainData.map((row, y) =>
      row.map((type, x) => {
        let cost = 1;
        if (type === TerrainType.FOREST || type === TerrainType.HILLS) {
          cost = 2;
        }
        const tile = new Tile(`${x}-${y}`, x, y, type, cost);
        if (type === TerrainType.OCEAN && Math.random() < 0.05) {
          tile.hasResource = ResourceType.FISH;
        } else if (type === TerrainType.FOREST && Math.random() < 0.1) {
          tile.hasResource = ResourceType.FOREST;
        } else if (type === TerrainType.PLAINS && Math.random() < 0.05) {
          tile.hasResource = ResourceType.ORE_DEPOSIT;
        } else if (type === TerrainType.PLAINS && Math.random() < 0.05) {
          tile.hasResource = ResourceType.FERTILE_LAND;
        }
        return tile;
      })
    );

    const startingGold = nation === Nation.NETHERLANDS ? 200 : 100;
    const humanPlayer = new Player('player-1', playerName, true, startingGold, nation);

    // Starting position search
    let startX = Math.floor(dimensions.width / 2);
    let startY = Math.floor(dimensions.height / 2);
    let found = false;

    for (let y = 10; y < dimensions.height - 10; y++) {
      for (let x = 10; x < dimensions.width - 10; x++) {
        if (tiles[y][x].terrainType !== TerrainType.OCEAN && tiles[y][x].terrainType !== TerrainType.COAST) {
          startX = x;
          startY = y;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    const units = [
      new Unit('u1', 'player-1', UnitType.COLONIST, startX, startY, 3),
      new Unit('u2', 'player-1', UnitType.COLONIST, startX, startY, 3),
      new Unit('u3', 'player-1', UnitType.SOLDIER, startX + 1, startY, 3),
      new Unit('u4', 'player-1', UnitType.PIONEER, startX, startY + 1, 3),
    ];

    if (nation === Nation.ENGLAND) {
      units.push(new Unit('u-extra', 'player-1', UnitType.COLONIST, startX, startY, 3));
    }

    let shipX = startX;
    let shipY = startY;
    found = false;
    for (let d = 1; d < 10; d++) {
      for (let dy = -d; dy <= d; dy++) {
        for (let dx = -d; dx <= d; dx++) {
          const nx = startX + dx;
          const ny = startY + dy;
          if (ny >= 0 && ny < dimensions.height && nx >= 0 && nx < dimensions.width) {
            if (tiles[ny][nx].terrainType === TerrainType.OCEAN) {
              shipX = nx;
              shipY = ny;
              found = true;
              break;
            }
          }
        }
        if (found) break;
      }
      if (found) break;
    }
    units.push(new Unit('u5', 'player-1', UnitType.SHIP, shipX, shipY, 6));

    humanPlayer.units = units;

    const players = [humanPlayer];
    for (let i = 0; i < aiCount; i++) {
      players.push(new Player(`ai-${i}`, `AI Opponent ${i + 1}`, false, 100, Nation.PORTUGAL));
    }

    set({
      map: tiles,
      nativeSettlements,
      players,
      currentPlayerId: 'player-1',
      turn: 1,
      phase: TurnPhase.MOVEMENT,
      isMainMenuOpen: false,
      isGameSetupModalOpen: false,
    });

    eventBus.emit('gameStarted');
  },
}));

if (typeof window !== 'undefined') {
  (window as any).useGameStore = useGameStore;
}
