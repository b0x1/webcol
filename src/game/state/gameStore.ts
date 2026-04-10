import { enableMapSet } from 'immer';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Player } from '../entities/Player';
import type { Tile } from '../entities/Tile';
import type { Unit } from '../entities/Unit';
import type { Settlement } from '../entities/Settlement';
import type { Position } from '../entities/Position';
import { BuildingType, GoodType, JobType, Nation, TurnPhase, UnitType } from '../entities/types';
import { TurnEngine } from '../systems/TurnEngine';
import { AISystem } from '../systems/AISystem';
import { RECRUITMENT_COSTS } from '../constants';
import { ForeignInteractionSystem } from '../systems/ForeignInteractionSystem';
import { eventBus } from './EventBus';
import { CombatSystem } from '../systems/CombatSystem';
import type { CombatResult } from '../systems/CombatSystem';
import { GameSystem } from '../systems/GameSystem';
import { SettlementSystem } from '../systems/SettlementSystem';
import { UnitSystem } from '../systems/UnitSystem';
import { EconomySystem } from '../systems/EconomySystem';
import { MovementSystem } from '../systems/MovementSystem';
import { NamingSystem, type NamingStats } from '../systems/NamingSystem';
import { useUIStore } from './uiStore';
import { isSame } from '../entities/Position';

enableMapSet();

export interface GameState {
  players: Player[];
  currentPlayerId: string;
  turn: number;
  phase: TurnPhase;
  selectedUnitId: string | null;
  selectedSettlementId: string | null;
  europePrices: Record<GoodType, number>;
  map: Tile[][];
  selectedTile: Tile | null;
  combatResult: CombatResult | null;
  namingStats: NamingStats;

  selectUnit: (unitId: string | null) => void;
  selectTile: (tile: Tile | null) => void;
  selectNextUnit: () => void;
  skipUnit: (unitId: string) => void;
  selectSettlement: (settlementId: string | null) => void;
  moveUnit: (unitId: string, to: Position) => void;
  endTurn: () => void;
  foundSettlement: (unitId: string) => void;
  buyBuilding: (settlementId: string, building: BuildingType) => void;
  assignJob: (settlementId: string, unitId: string, job: JobType | string | null) => void;
  sellGood: (unitId: string, good: GoodType, amount: number) => void;
  buyGood: (unitId: string, good: GoodType, amount: number) => void;
  recruitUnit: (unitType: UnitType) => void;
  tradeWithSettlement: (settlementId: string, unitId: string, goodOffered: GoodType) => void;
  learnFromSettlement: (settlementId: string, unitId: string) => void;
  attackSettlement: (settlementId: string, unitId: string) => void;
  resolveCombat: (attackerId: string, target: Position) => void;
  clearCombatResult: () => void;
  loadGameState: (state: Partial<GameState>) => void;
  initGame: (params: { playerName: string; nation: Nation; mapSize: 'Small' | 'Medium' | 'Large'; aiCount: number }) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>()(
  immer((set, get) => ({
    players: [],
    currentPlayerId: '',
    turn: 1,
    phase: TurnPhase.MOVEMENT,
    selectedUnitId: null,
    selectedSettlementId: null,
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
    map: [],
    selectedTile: null,
    combatResult: null,
    namingStats: {},

    selectUnit: (unitId) =>
      set((state) => {
        const player = state.players.find((p) => p.id === state.currentPlayerId);
        if (player) {
          // 1. Tuck away previously selected unit if it's on a settlement tile
          if (state.selectedUnitId) {
            const prevUnitIdx = player.units.findIndex(u => u.id === state.selectedUnitId);
            if (prevUnitIdx !== -1) {
              const prevUnit = player.units[prevUnitIdx];
              const settlement = player.settlements.find(s => isSame(s.position, prevUnit.position));
              if (settlement) {
                if (!settlement.units.some(u => u.id === prevUnit.id)) {
                  settlement.units.push({ ...prevUnit });
                }
                player.units.splice(prevUnitIdx, 1);
              }
            }
          }

          // 2. If the new unit is in a settlement, move it to player.units
          if (unitId) {
            for (const s of player.settlements) {
              const uIdx = s.units.findIndex(u => u.id === unitId);
              if (uIdx !== -1) {
                // Only move out if it's NOT in the workforce (available)
                if (!s.workforce.has(unitId)) {
                  const unit = s.units[uIdx];
                  if (!player.units.some(u => u.id === unitId)) {
                    player.units.push({ ...unit });
                  }
                  s.units.splice(uIdx, 1);
                }
                break;
              }
            }
          }
        }
        state.selectedUnitId = unitId;
        state.selectedSettlementId = null;
      }),

    selectTile: (tile) =>
      set((state) => {
        state.selectedTile = tile;
      }),

    selectNextUnit: () => {
      const state = get();
      const player = state.players.find((p) => p.id === state.currentPlayerId);
      if (!player) return;

      const nextUnit = UnitSystem.findNextAvailableUnit(player, state.selectedUnitId);
      if (!nextUnit) return;

      set((state) => {
        state.selectedUnitId = nextUnit.id;
        state.selectedSettlementId = null;
      });
      eventBus.emit('cameraJump', { x: nextUnit.position.x, y: nextUnit.position.y });
    },

    skipUnit: (unitId) =>
      set((state) => {
        const player = state.players.find((p) => p.id === state.currentPlayerId);
        if (!player) return;
        const unit = player.units.find((u) => u.id === unitId);
        if (unit) {
          unit.isSkipping = true;
          if (state.selectedUnitId === unitId) {
            state.selectedUnitId = null;
          }
        }
      }),

    selectSettlement: (settlementId) =>
      set((state) => {
        state.selectedSettlementId = settlementId;
        state.selectedUnitId = null;
        if (settlementId) {
          // Only open the full SettlementScreen for owned settlements
          const isOwned = state.players.find(p => p.id === state.currentPlayerId)?.settlements.some(s => s.id === settlementId);
          if (isOwned || useUIStore.getState().isDebugMode) {
            useUIStore.getState().setSettlementScreenOpen(true);
          }
        }
      }),

    moveUnit: (unitId, to) =>
      set((state) => {
        const player = state.players.find((p) => p.id === state.currentPlayerId);
        if (!player) return;

        const unitIndex = player.units.findIndex((u) => u.id === unitId);
        if (unitIndex === -1) return;
        const unit = player.units[unitIndex];

        if (UnitSystem.canMoveTo(unit, to.x, to.y, state.map)) {
          const targetTile = state.map[to.y][to.x];
          unit.position = { ...to };
          unit.movesRemaining -= MovementSystem.getMovementCost(unit, targetTile);

          // Check if entering own settlement
          const settlement = player.settlements.find(s => isSame(s.position, to));
          if (settlement) {
            if (!settlement.units.some(u => u.id === unit.id)) {
              settlement.units.push({ ...unit });
            }
            player.units.splice(unitIndex, 1);
            state.selectedUnitId = null;
          }
        }
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
          state.phase = phases[currentPhaseIndex + 1];
          return;
        }

        if (state.players.length === 0) {
          state.phase = TurnPhase.MOVEMENT;
          return;
        }

        const currentPlayerIndex = state.players.findIndex((p) => p.id === state.currentPlayerId);
        const nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;
        const nextPlayer = state.players[nextPlayerIndex];

        const nextTurn = nextPlayerIndex === 0 ? state.turn + 1 : state.turn;

        if (nextTurn > state.turn && nextPlayerIndex === 0) {
          setTimeout(() => {
            const currentState = get();
            TurnEngine.autoSave(currentState as any);
          }, 0);
        }

        state.players.forEach((p) => {
          if (p.id === nextPlayer.id) {
            p.units.forEach((u) => {
              u.movesRemaining = u.maxMoves;
              u.isSkipping = false;
            });
          }
        });

        state.phase = TurnPhase.MOVEMENT;
        state.currentPlayerId = nextPlayer.id;
        state.turn = nextTurn;
        state.selectedUnitId = null;
      });

      const state = get();
      if (state.phase === TurnPhase.PRODUCTION) {
        const { players: updatedPlayers, namingStats: updatedNamingStats } = TurnEngine.runProduction(state.players, state.map, state.namingStats);
        set((s) => {
          s.players = updatedPlayers;
          s.namingStats = updatedNamingStats;
        });
        get().endTurn();
      } else if (state.phase === TurnPhase.TRADE) {
        get().endTurn();
      } else if (state.phase === TurnPhase.AI) {
        const { players: updatedPlayers, namingStats: updatedNamingStats } = AISystem.runAITurn(state.players, state.map, state.namingStats);
        set((s) => {
          s.players = updatedPlayers;
          s.namingStats = updatedNamingStats;
        });
        get().endTurn();
      } else if (state.phase === TurnPhase.END_TURN) {
        get().endTurn();
      } else if (state.phase === TurnPhase.MOVEMENT) {
        const currentPlayer = state.players.find((p) => p.id === state.currentPlayerId);
        if (currentPlayer && !currentPlayer.isHuman) {
          get().endTurn();
        }
      }
    },

    foundSettlement: (unitId) =>
      set((state) => {
        const player = state.players.find((p) => p.id === state.currentPlayerId);
        if (!player) return;

        const unitIndex = player.units.findIndex((u) => u.id === unitId);
        if (unitIndex === -1) return;
        const unit = player.units[unitIndex];

        const allSettlements = state.players.flatMap((p) => p.settlements);

        if (!SettlementSystem.canFoundSettlement(player, unit, state.map, allSettlements)) return;

        const { name: settlementName, updatedStats } = NamingSystem.getNextName(player.nation, 'settlement', state.namingStats);
        state.namingStats = updatedStats;

        const newSettlement = SettlementSystem.createSettlement(
          player,
          unit,
          settlementName,
          [BuildingType.TOWN_HALL, BuildingType.CARPENTERS_SHOP, BuildingType.BLACKSMITHS_HOUSE],
          state.map
        );

        player.units.splice(unitIndex, 1);
        player.settlements.push(newSettlement);

        if (state.selectedUnitId === unitId) {
          state.selectedUnitId = null;
        }
      }),

    buyBuilding: (settlementId, building) =>
      set((state) => {
        const player = state.players.find((p) => p.id === state.currentPlayerId);
        if (!player) return;

        const settlement = player.settlements.find((s) => s.id === settlementId);
        if (settlement) {
          // Instead of instant buy, add to productionQueue if not already there or built
          if (!settlement.buildings.includes(building) && !settlement.productionQueue.includes(building)) {
             settlement.productionQueue.push(building);
          }
        }
      }),

    assignJob: (settlementId, unitId, job) =>
      set((state) => {
        for (const p of state.players) {
          const settlement = p.settlements.find((s) => s.id === settlementId);
          if (settlement) {
            if (job === null) {
              settlement.workforce.delete(unitId);
              // Move unit back to player units if it was in the settlement
              const uIdx = settlement.units.findIndex(u => u.id === unitId);
              if (uIdx !== -1) {
                const unit = settlement.units[uIdx];
                const player = state.players.find(pl => pl.id === settlement.ownerId);
                if (player && !player.units.some(u => u.id === unitId)) {
                  player.units.push({ ...unit });
                }
                settlement.units.splice(uIdx, 1);
              }
            } else {
              // Check in settlement units or player units
              let unit = settlement.units.find((u) => u.id === unitId);
              if (!unit) {
                const player = state.players.find(pl => pl.id === settlement.ownerId);
                const pUnitIdx = player?.units.findIndex(u => u.id === unitId) ?? -1;
                if (pUnitIdx !== -1) {
                  unit = player!.units[pUnitIdx];
                  // Move to settlement units if assigned
                  settlement.units.push({ ...unit });
                  player!.units.splice(pUnitIdx, 1);
                  if (state.selectedUnitId === unitId) state.selectedUnitId = null;
                }
              }

              if (unit) {
                settlement.workforce.set(unitId, (job as any));
              }
            }
            settlement.population = settlement.workforce.size;
            return;
          }
        }
      }),

    sellGood: (unitId, good, amount) =>
      set((state) => {
        const player = state.players.find((p) => p.id === state.currentPlayerId);
        const unit = player?.units.find((u) => u.id === unitId);
        if (!player || !unit) return;

        const { goldGained, newPrice, actualSellAmount } = EconomySystem.sellGood(
          player,
          unit,
          good,
          amount,
          state.europePrices[good]
        );

        if (actualSellAmount <= 0) return;

        unit.cargo.set(good, (unit.cargo.get(good) || 0) - actualSellAmount);
        player.gold += goldGained;
        state.europePrices[good] = newPrice;
      }),

    buyGood: (unitId, good, amount) =>
      set((state) => {
        const player = state.players.find((p) => p.id === state.currentPlayerId);
        const unit = player?.units.find((u) => u.id === unitId);
        if (!player || !unit) return;

        const { cost, canAfford } = EconomySystem.buyGood(
          player.gold,
          good,
          amount,
          state.europePrices[good]
        );

        if (!canAfford) return;

        unit.cargo.set(good, (unit.cargo.get(good) || 0) + amount);
        player.gold -= cost;
      }),

    loadGameState: (loadedState) => {
      set((state) => {
        Object.assign(state, loadedState);
      });
      eventBus.emit('gameStarted');
    },

    tradeWithSettlement: (settlementId, unitId, goodOffered) =>
      set((state) => {
        const player = state.players.find((p) => p.id === state.currentPlayerId);
        const unit = player?.units.find((u) => u.id === unitId);
        if (!unit) return;

        const foreignPlayer = state.players.find(p => p.settlements.some(s => s.id === settlementId));
        if (!foreignPlayer) return;

        const sIdx = foreignPlayer.settlements.findIndex(s => s.id === settlementId);

        const { updatedSettlement, updatedUnit } = ForeignInteractionSystem.trade(
          foreignPlayer.settlements[sIdx],
          unit,
          goodOffered
        );

        foreignPlayer.settlements[sIdx] = updatedSettlement;
        const uIdx = player!.units.findIndex(u => u.id === unitId);
        player!.units[uIdx] = updatedUnit;
      }),

    learnFromSettlement: (settlementId, unitId) =>
      set((state) => {
        const player = state.players.find((p) => p.id === state.currentPlayerId);
        const unit = player?.units.find((u) => u.id === unitId);
        if (!unit) return;

        const foreignPlayer = state.players.find(p => p.settlements.some(s => s.id === settlementId));
        if (!foreignPlayer) return;

        const sIdx = foreignPlayer.settlements.findIndex(s => s.id === settlementId);

        const { updatedSettlement, updatedUnit } = ForeignInteractionSystem.learn(
          foreignPlayer.settlements[sIdx],
          unit
        );

        foreignPlayer.settlements[sIdx] = updatedSettlement;
        const uIdx = player!.units.findIndex(u => u.id === unitId);
        player!.units[uIdx] = updatedUnit;
      }),

    attackSettlement: (settlementId, unitId) => {
      const state = get();
      let settlement: Settlement | undefined;
      for (const p of state.players) {
        settlement = p.settlements.find(s => s.id === settlementId);
        if (settlement) break;
      }

      if (settlement) {
        state.resolveCombat(unitId, settlement.position);
      }
    },

    clearCombatResult: () =>
      set((state) => {
        state.combatResult = null;
      }),

    resolveCombat: (attackerId, target) =>
      set((state) => {
        const player = state.players.find((p) => p.id === state.currentPlayerId);
        if (!player) return;

        const attacker = player.units.find((u) => u.id === attackerId);
        if (!attacker) return;

        let defender: Unit | Settlement | undefined;
        let defenderSettlement: Settlement | undefined;

        for (const p of state.players) {
          if (p.id !== state.currentPlayerId) {
            const unit = p.units.find((u) => isSame(u.position, target));
            if (unit) {
              defender = unit;
              break;
            }
          }
        }

        for (const p of state.players) {
          const settlement = p.settlements.find((c) => isSame(c.position, target));
          if (settlement) {
            defenderSettlement = settlement;
            if (!defender && p.id !== state.currentPlayerId) {
              defender = settlement;
            }
            break;
          }
        }

        if (!defender) return;

        const defenderTile = state.map[target.y][target.x];
        const result = CombatSystem.resolveCombat(attacker, defender, defenderTile, defenderSettlement);

        if (result.winner === 'attacker') {
           const defenderPlayer = state.players.find(p => p.units.some(u => u.id === (defender as any).id));
           if (defenderPlayer) {
              const uIdx = defenderPlayer.units.findIndex(u => u.id === (defender as any).id);
              if (uIdx !== -1) {
                defenderPlayer.units.splice(uIdx, 1);
              }
           }

           const capturedSettlementPlayer = state.players.find(p => p.settlements.some(s => s.id === defender!.id));
           if (capturedSettlementPlayer && capturedSettlementPlayer.id !== state.currentPlayerId) {
             const sIdx = capturedSettlementPlayer.settlements.findIndex(s => s.id === defender!.id);
             const s = capturedSettlementPlayer.settlements[sIdx];
             if (s.population > 1) {
                s.population -= 1;
             } else {
               // capture logic below
             }
           }

           if (capturedSettlementPlayer && capturedSettlementPlayer.id !== state.currentPlayerId) {
              const sIdx = capturedSettlementPlayer.settlements.findIndex(s => s.id === defender!.id);
              const s = capturedSettlementPlayer.settlements[sIdx];

              attacker.position = { ...target };
              attacker.movesRemaining = 0;

              s.ownerId = player.id;
              s.units.forEach(u => u.ownerId = player.id);
              player.settlements.push(s);
              capturedSettlementPlayer.settlements.splice(sIdx, 1);
           }
        } else {
          const aIdx = player.units.findIndex(u => u.id === attackerId);
          if (aIdx !== -1) {
            player.units.splice(aIdx, 1);
          }
          state.selectedUnitId = null;
        }

        state.combatResult = result;
      }),

    recruitUnit: (unitType) =>
      set((state) => {
        const player = state.players.find((p) => p.id === state.currentPlayerId);
        if (!player) return;

        const selectedUnit = player.units.find((u) => u.id === state.selectedUnitId);
        if (!selectedUnit || selectedUnit.type !== UnitType.SHIP) return;

        const costs: Record<string, number> = {
          ...RECRUITMENT_COSTS,
          [UnitType.SHIP]: 0,
        };

        let goldCost = costs[unitType] || 0;
        if (unitType === UnitType.SOLDIER && player.nation === Nation.SPAIN) {
          goldCost = 600;
        }
        if (player.gold < goldCost) return;

        let musketsToConsume = 0;
        if (unitType === UnitType.SOLDIER) {
          musketsToConsume = 50;
          const currentMuskets = selectedUnit.cargo.get(GoodType.MUSKETS) || 0;
          if (currentMuskets < musketsToConsume) return;
        }

        if (musketsToConsume > 0) {
          selectedUnit.cargo.set(GoodType.MUSKETS, (selectedUnit.cargo.get(GoodType.MUSKETS) || 0) - musketsToConsume);
        }

        player.gold -= goldCost;
        const { name: newUnitName, updatedStats } = NamingSystem.getNextName(player.nation, unitType === UnitType.SHIP ? 'ship' : 'unit', state.namingStats);
        state.namingStats = updatedStats;

        player.units.push({
          id: `unit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          ownerId: player.id,
          name: newUnitName,
          type: unitType,
          position: { ...selectedUnit.position },
          movesRemaining: 1,
          maxMoves: 1,
          isSkipping: false,
          cargo: new Map(),
          turnsInJob: 0,
        });
      }),

    resetGame: () => {
      set((state) => {
        state.players = [];
        state.currentPlayerId = '';
        state.turn = 1;
        state.phase = TurnPhase.MOVEMENT;
        state.selectedUnitId = null;
        state.selectedSettlementId = null;
        state.map = [];
      });
      eventBus.emit('returnToMainMenu');
    },

    initGame: (params) => {
      const { map, players, namingStats } = GameSystem.initGame(params);
      set((state) => {
        state.map = map;
        state.players = players;
        state.namingStats = namingStats;
        state.currentPlayerId = 'player-1';
        state.turn = 1;
        state.phase = TurnPhase.MOVEMENT;
      });
      eventBus.emit('gameStarted');
    },
  })),
);

if (typeof window !== 'undefined') {
  (window as unknown as { useGameStore: typeof useGameStore }).useGameStore = useGameStore;
}
