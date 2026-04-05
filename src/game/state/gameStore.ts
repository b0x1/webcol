import { create } from 'zustand';
import { Player } from '../entities/Player';
import { Tile } from '../entities/Tile';
import { Unit } from '../entities/Unit';
import { Settlement } from '../entities/Settlement';
import { BuildingType, GoodType, JobType, Nation, TurnPhase, UnitType, TerrainType, Attitude, ResourceType, Culture, Organization } from '../entities/types';
import { TurnEngine } from '../systems/TurnEngine';
import { BUILDING_COSTS, RECRUITMENT_COSTS, NATION_BONUSES } from '../constants';
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
  selectedSettlementId: string | null;
  isSettlementScreenOpen: boolean;
  isEuropeScreenOpen: boolean;
  isNativeTradeModalOpen: boolean;
  activeSettlementId: string | null;
  europePrices: Record<GoodType, number>;
  map: Tile[][];
  npcSettlements: Settlement[];
  combatResult: CombatResult | null;
  isSaveModalOpen: boolean;
  isMainMenuOpen: boolean;
  isGameSetupModalOpen: boolean;
  isHowToPlayModalOpen: boolean;
  isReportsModalOpen: boolean;

  selectUnit: (unitId: string | null) => void;
  selectNextUnit: () => void;
  skipUnit: (unitId: string) => void;
  selectSettlement: (settlementId: string | null) => void;
  setSettlementScreenOpen: (isOpen: boolean) => void;
  setEuropeScreenOpen: (isOpen: boolean) => void;
  setNativeTradeModalOpen: (isOpen: boolean, settlementId?: string | null) => void;
  moveUnit: (unitId: string, toX: number, toY: number) => void;
  endTurn: () => void;
  foundSettlement: (unitId: string) => void;
  buyBuilding: (settlementId: string, building: BuildingType) => void;
  assignJob: (settlementId: string, unitId: string, job: JobType) => void;
  sellGood: (unitId: string, good: GoodType, amount: number) => void;
  buyGood: (unitId: string, good: GoodType, amount: number) => void;
  recruitUnit: (unitType: UnitType) => void;
  tradeWithSettlement: (settlementId: string, unitId: string, goodOffered: GoodType) => void;
  learnFromSettlement: (settlementId: string, unitId: string) => void;
  attackSettlement: (settlementId: string, unitId: string) => void;
  resolveCombat: (attackerId: string, targetX: number, targetY: number) => void;
  clearCombatResult: () => void;
  setSaveModalOpen: (isOpen: boolean) => void;
  setReportsModalOpen: (isOpen: boolean) => void;
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
  selectedSettlementId: null,
  isSettlementScreenOpen: false,
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
  npcSettlements: [],
  combatResult: null,
  isSaveModalOpen: false,
  isMainMenuOpen: true,
  isGameSetupModalOpen: false,
  isHowToPlayModalOpen: false,
  isReportsModalOpen: false,

  selectUnit: (unitId) => set({ selectedUnitId: unitId, selectedSettlementId: null }),

  selectNextUnit: () => {
    const state = get();
    const player = state.players.find((p) => p.id === state.currentPlayerId);
    if (!player) return;

    const currentUnit = player.units.find((u) => u.id === state.selectedUnitId);
    const availableUnits = player.units.filter((u) => u.movesRemaining > 0 && !u.isSkipping);

    if (availableUnits.length === 0) return;

    let nextUnit: Unit;
    if (currentUnit) {
      // Find the closest unit among available units
      nextUnit = availableUnits.reduce((prev, curr) => {
        // If current unit is on the same tile, cycle through them
        if (curr.x === currentUnit.x && curr.y === currentUnit.y) {
           // We need a way to ensure we don't just pick the first one on the same tile every time
           // Find the index of the current unit in the full list and look for the next one on the same tile
           const currentIdx = player.units.indexOf(currentUnit);
           const nextSameTile = player.units.slice(currentIdx + 1).find(u => u.x === currentUnit.x && u.y === currentUnit.y && u.movesRemaining > 0 && !u.isSkipping);
           if (nextSameTile) return nextSameTile;
        }

        const distPrev = Math.abs(prev.x - currentUnit.x) + Math.abs(prev.y - currentUnit.y);
        const distCurr = Math.abs(curr.x - currentUnit.x) + Math.abs(curr.y - currentUnit.y);

        // Prefer same tile first
        if (curr.x === currentUnit.x && curr.y === currentUnit.y) return curr;
        if (prev.x === currentUnit.x && prev.y === currentUnit.y) return prev;

        return distCurr < distPrev ? curr : prev;
      }, availableUnits[0]);
    } else {
      nextUnit = availableUnits[0];
    }

    set({ selectedUnitId: nextUnit.id, selectedSettlementId: null });
    eventBus.emit('cameraJump', { x: nextUnit.x, y: nextUnit.y });
  },

  skipUnit: (unitId) =>
    set((state) => {
      const updatedPlayers = state.players.map((p) => {
        if (p.id === state.currentPlayerId) {
          const updatedUnits = p.units.map((u) => {
            if (u.id === unitId) {
              const nu = new Unit(u.id, u.ownerId, u.type, u.x, u.y, u.movesRemaining);
              nu.cargo = new Map(u.cargo);
              nu.maxMoves = u.maxMoves;
              nu.isSkipping = true;
              return nu;
            }
            return u;
          });
          const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold, p.nation);
          newPlayer.units = updatedUnits;
          newPlayer.settlements = [...p.settlements];
          return newPlayer;
        }
        return p;
      });
      return { players: updatedPlayers, selectedUnitId: state.selectedUnitId === unitId ? null : state.selectedUnitId };
    }),

  selectSettlement: (settlementId) => set({ selectedSettlementId: settlementId, selectedUnitId: null }),
  setSettlementScreenOpen: (isOpen) => set({ isSettlementScreenOpen: isOpen }),
  setEuropeScreenOpen: (isOpen) => set({ isEuropeScreenOpen: isOpen }),
  setNativeTradeModalOpen: (isOpen, settlementId = null) =>
    set({ isNativeTradeModalOpen: isOpen, activeSettlementId: settlementId }),
  setSaveModalOpen: (isOpen) => set({ isSaveModalOpen: isOpen }),
  setReportsModalOpen: (isOpen) => set({ isReportsModalOpen: isOpen }),
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
            newPlayer.settlements = [...p.settlements];
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
            newUnit.isSkipping = false; // Reset skipping
            return newUnit;
          });
          const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold, p.nation);
          newPlayer.units = updatedUnits;
          newPlayer.settlements = [...p.settlements];
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
    } else if (state.phase === TurnPhase.MOVEMENT) {
      const currentPlayer = state.players.find((p) => p.id === state.currentPlayerId);
      if (currentPlayer && !currentPlayer.isHuman) {
        state.endTurn();
      }
    }
  },

  foundSettlement: (unitId) =>
    set((state) => {
      const player = state.players.find((p) => p.id === state.currentPlayerId);
      if (!player) return state;

      const unit = player.units.find((u) => u.id === unitId);
      if (!unit) return state;

      const nationData = NATION_BONUSES[player.nation];
      if (nationData.culture === 'EUROPEAN' && unit.type !== UnitType.COLONIST) return state;
      if (nationData.culture === 'NATIVE' && unit.type !== UnitType.INDIAN_BRAVE) return state;

      const newSettlement = new Settlement(
        `settlement-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        player.id,
        `${player.name}'s Settlement`,
        unit.x,
        unit.y,
        1,
        nationData.culture,
        nationData.organization
      );
      newSettlement.units.push(unit);
      newSettlement.workforce.set(unit.id, JobType.FARMER);

      const updatedPlayers = state.players.map((p) => {
        if (p.id === state.currentPlayerId) {
          const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold, p.nation);
          newPlayer.units = p.units.filter((u) => u.id !== unitId);
          newPlayer.settlements = [...p.settlements, newSettlement];
          return newPlayer;
        }
        return p;
      });

      return {
        players: updatedPlayers,
        selectedUnitId: state.selectedUnitId === unitId ? null : state.selectedUnitId,
      };
    }),

  buyBuilding: (settlementId, building) =>
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
          const updatedSettlements = p.settlements.map((c) => {
            if (c.id === settlementId) {
              const newSettlement = new Settlement(c.id, c.ownerId, c.name, c.x, c.y, c.population, c.culture, c.organization);
              newSettlement.buildings = [...c.buildings, building];
              newSettlement.inventory = new Map(c.inventory);
              newSettlement.workforce = new Map(c.workforce);
              newSettlement.units = [...c.units];
              newSettlement.productionQueue = [...c.productionQueue];
              return newSettlement;
            }
            return c;
          });
          const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold - cost, p.nation);
          newPlayer.units = [...p.units];
          newPlayer.settlements = updatedSettlements;
          return newPlayer;
        }
        return p;
      });

      return { players: updatedPlayers };
    }),

  assignJob: (settlementId, unitId, job) =>
    set((state) => {
      const updatedPlayers = state.players.map((p) => {
        const updatedSettlements = p.settlements.map((c) => {
          if (c.id === settlementId) {
            const newSettlement = new Settlement(c.id, c.ownerId, c.name, c.x, c.y, c.population, c.culture, c.organization);
            newSettlement.buildings = [...c.buildings];
            newSettlement.inventory = new Map(c.inventory);
            const newWorkforce = new Map(c.workforce);
            newWorkforce.set(unitId, job);
            newSettlement.workforce = newWorkforce;
            newSettlement.units = [...c.units];
            newSettlement.productionQueue = [...c.productionQueue];
            return newSettlement;
          }
          return c;
        });
        const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold, p.nation);
        newPlayer.units = [...p.units];
        newPlayer.settlements = updatedSettlements;
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
          newPlayer.settlements = [...p.settlements];
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
          newPlayer.settlements = [...p.settlements];
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

  tradeWithSettlement: (settlementId, unitId, goodOffered) =>
    set((state) => {
      const settlement = state.npcSettlements.find((s) => s.id === settlementId);
      const player = state.players.find((p) => p.id === state.currentPlayerId);
      const unit = player?.units.find((u) => u.id === unitId);

      if (!settlement || !unit) return state;

      const { updatedSettlement, updatedUnit } = NativeInteractionSystem.trade(
        settlement,
        unit,
        goodOffered
      );

      const updatedSettlements = state.npcSettlements.map((s) =>
        s.id === settlementId ? updatedSettlement : s
      );

      const updatedPlayers = state.players.map((p) => {
        if (p.id === state.currentPlayerId) {
          const updatedUnits = p.units.map((u) => (u.id === unitId ? updatedUnit : u));
          const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold, p.nation);
          newPlayer.units = updatedUnits;
          newPlayer.settlements = [...p.settlements];
          return newPlayer;
        }
        return p;
      });

      return {
        npcSettlements: updatedSettlements,
        players: updatedPlayers,
        isNativeTradeModalOpen: false,
        activeSettlementId: null,
      };
    }),

  learnFromSettlement: (settlementId, unitId) =>
    set((state) => {
      const settlement = state.npcSettlements.find((s) => s.id === settlementId);
      const player = state.players.find((p) => p.id === state.currentPlayerId);
      const unit = player?.units.find((u) => u.id === unitId);

      if (!settlement || !unit) return state;

      const { updatedSettlement, updatedUnit } = NativeInteractionSystem.learn(settlement, unit);

      const updatedSettlements = state.npcSettlements.map((s) =>
        s.id === settlementId ? updatedSettlement : s
      );

      const updatedPlayers = state.players.map((p) => {
        if (p.id === state.currentPlayerId) {
          const updatedUnits = p.units.map((u) => (u.id === unitId ? updatedUnit : u));
          const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold, p.nation);
          newPlayer.units = updatedUnits;
          newPlayer.settlements = [...p.settlements];
          return newPlayer;
        }
        return p;
      });

      return {
        npcSettlements: updatedSettlements,
        players: updatedPlayers,
        isNativeTradeModalOpen: false,
        activeSettlementId: null,
      };
    }),

  attackSettlement: (settlementId, unitId) => {
    const state = get();
    const settlement = state.npcSettlements.find((s) => s.id === settlementId);
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

      // Find defender (Unit, Settlement)
      let defender: Unit | Settlement | undefined;
      let defenderSettlement: Settlement | undefined;

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

      // Check for player settlements (always check even if unit is defender to apply Stockade bonus)
      for (const p of state.players) {
        const settlement = p.settlements.find((c) => c.x === targetX && c.y === targetY);
        if (settlement) {
          defenderSettlement = settlement;
          if (!defender && p.id !== state.currentPlayerId) {
            defender = settlement;
          }
          break;
        }
      }

      // Check for NPC settlements
      if (!defender) {
        defender = state.npcSettlements.find((s) => s.x === targetX && s.y === targetY);
      }

      if (!defender) return state;

      const defenderTile = state.map[targetY][targetX];
      const result = CombatSystem.resolveCombat(attacker, defender, defenderTile, defenderSettlement);

      let updatedPlayers = [...state.players];
      let updatedNPCSettlements = [...state.npcSettlements];

      if (result.winner === 'attacker') {
        if (defender instanceof Unit) {
          // Remove defender unit
          updatedPlayers = updatedPlayers.map((p) => {
            const updatedUnits = p.units.filter((u) => u !== defender);
            const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold, p.nation);
            newPlayer.units = updatedUnits;
            newPlayer.settlements = [...p.settlements];
            return newPlayer;
          });
        } else if (defender instanceof Settlement && defender.ownerId.startsWith('npc-')) {
          // NPC Settlement
          // Reduce population or remove settlement
          if (defender.population > 1) {
            updatedNPCSettlements = updatedNPCSettlements.map((s) => {
              if (s.id === defender!.id) {
                const ns = new Settlement(
                  s.id,
                  s.ownerId,
                  s.name,
                  s.x,
                  s.y,
                  s.population - 1,
                  s.culture,
                  s.organization
                );
                ns.attitude = s.attitude;
                ns.goods = new Map(s.goods);
                return ns;
              }
              return s;
            });
          } else {
            updatedNPCSettlements = updatedNPCSettlements.filter((s) => s.id !== defender!.id);
          }
        } else if (defender instanceof Settlement) {
          // Player Settlement
          // Change settlement owner and move attacker unit
          updatedPlayers = updatedPlayers.map((p) => {
            if (p.id === defender.ownerId) {
              // Remove settlement from previous owner
              const updatedSettlements = p.settlements.filter((c) => c.id !== defender.id);
              const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold, p.nation);
              newPlayer.units = [...p.units];
              newPlayer.settlements = updatedSettlements;
              return newPlayer;
            } else if (p.id === state.currentPlayerId) {
              // Move attacker and add settlement to new owner
              const updatedUnits = p.units.map((u) => {
                if (u.id === attackerId) {
                  const nu = new Unit(u.id, u.ownerId, u.type, targetX, targetY, 0);
                  nu.cargo = new Map(u.cargo);
                  nu.maxMoves = u.maxMoves;
                  return nu;
                }
                return u;
              });
              const capturedSettlement = new Settlement(
                defender.id,
                p.id, // New owner
                defender.name,
                defender.x,
                defender.y,
                defender.population,
                defender.culture,
                defender.organization
              );
              capturedSettlement.buildings = [...defender.buildings];
              capturedSettlement.inventory = new Map(defender.inventory);
              capturedSettlement.productionQueue = [...defender.productionQueue];
              capturedSettlement.workforce = new Map(defender.workforce);
              capturedSettlement.units = defender.units.map(u => {
                const nu = new Unit(u.id, p.id, u.type, u.x, u.y, 0);
                nu.cargo = new Map(u.cargo);
                nu.maxMoves = u.maxMoves;
                return nu;
              });

              const newPlayer = new Player(p.id, p.name, p.isHuman, p.gold, p.nation);
              newPlayer.units = updatedUnits;
              newPlayer.settlements = [...p.settlements, capturedSettlement];
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
            newPlayer.settlements = [...p.settlements];
            return newPlayer;
          }
          return p;
        });
      }

      return {
        players: updatedPlayers,
        npcSettlements: updatedNPCSettlements,
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
          newPlayer.settlements = [...p.settlements];
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
      selectedSettlementId: null,
      map: [],
      npcSettlements: [],
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
    const npcSettlements = generator.generateSettlements(terrainData);

    if (nation === Nation.FRANCE) {
      npcSettlements.forEach(s => s.attitude = Attitude.FRIENDLY);
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
        } else if (type === TerrainType.PLAINS && Math.random() < 0.1) {
          tile.hasResource = ResourceType.FERTILE_LAND;
        }
        return tile;
      })
    );

    const startingGold = nation === Nation.NETHERLANDS ? 200 : 100;
    const nationData = NATION_BONUSES[nation];
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

    let units: Unit[] = [];
    if (nationData.culture === 'EUROPEAN') {
      units = [
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
    } else {
      // Native nation
      units = [
        new Unit('u1', 'player-1', UnitType.INDIAN_BRAVE, startX, startY, 3),
        new Unit('u2', 'player-1', UnitType.INDIAN_BRAVE, startX, startY, 3),
        new Unit('u3', 'player-1', UnitType.INDIAN_BRAVE, startX, startY, 3),
      ];
      // Native settlement (starts empty but exists)
      const startSettlement = new Settlement(
        `settlement-start-${Date.now()}`,
        'player-1',
        `${playerName}'s Settlement`,
        startX,
        startY,
        0,
        nationData.culture,
        nationData.organization
      );
      humanPlayer.settlements.push(startSettlement);
    }

    humanPlayer.units = units;

    const players = [humanPlayer];
    const availableNations = (Object.keys(Nation) as Nation[]).filter(n => n !== nation);

    for (let i = 0; i < aiCount; i++) {
      const aiNation = availableNations.splice(Math.floor(Math.random() * availableNations.length), 1)[0] || Nation.PORTUGAL;
      const aiPlayer = new Player(`ai-${i}`, `AI Opponent ${i + 1}`, false, 100, aiNation);

      // Basic AI initialization (could be expanded)
      const aiNationData = NATION_BONUSES[aiNation];
      if (aiNationData.culture === 'NATIVE') {
         aiPlayer.units = [new Unit(`ai-${i}-u1`, aiPlayer.id, UnitType.INDIAN_BRAVE, 0, 0, 3)];
      } else {
         aiPlayer.units = [new Unit(`ai-${i}-u1`, aiPlayer.id, UnitType.COLONIST, 0, 0, 3)];
      }

      players.push(aiPlayer);
    }

    set({
      map: tiles,
      npcSettlements,
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
  (window as unknown as { useGameStore: typeof useGameStore }).useGameStore =
    useGameStore;
}
