import { enableMapSet } from 'immer';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Player } from '../entities/Player';
import type { Tile } from '../entities/Tile';
import type { Unit } from '../entities/Unit';
import type { Settlement } from '../entities/Settlement';
import { BuildingType, GoodType, JobType, Nation, TurnPhase, UnitType, Attitude } from '../entities/types';
import { TurnEngine } from '../systems/TurnEngine';
import { BUILDING_COSTS, RECRUITMENT_COSTS, NATION_BONUSES } from '../constants';
import { NativeInteractionSystem } from '../systems/NativeInteractionSystem';
import { eventBus } from './EventBus';
import { CombatSystem } from '../systems/CombatSystem';
import type { CombatResult } from '../systems/CombatSystem';
import { GameSystem } from '../systems/GameSystem';

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
  npcSettlements: Settlement[];
  combatResult: CombatResult | null;

  selectUnit: (unitId: string | null) => void;
  selectNextUnit: () => void;
  skipUnit: (unitId: string) => void;
  selectSettlement: (settlementId: string | null) => void;
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
      [GoodType.TRADE_GOODS]: 6,
      [GoodType.MUSKETS]: 8,
    },
    map: [],
    npcSettlements: [],
    combatResult: null,

    selectUnit: (unitId) =>
      set((state) => {
        state.selectedUnitId = unitId;
        state.selectedSettlementId = null;
      }),

    selectNextUnit: () => {
      const state = get();
      const player = state.players.find((p) => p.id === state.currentPlayerId);
      if (!player) return;

      const currentUnit = player.units.find((u) => u.id === state.selectedUnitId);
      const availableUnits = player.units.filter((u) => u.movesRemaining > 0 && !u.isSkipping);

      if (availableUnits.length === 0) return;

      let nextUnit: Unit;
      if (currentUnit) {
        nextUnit = availableUnits.reduce((prev, curr) => {
          if (curr.x === currentUnit.x && curr.y === currentUnit.y) {
            const currentIdx = player.units.indexOf(currentUnit);
            const nextSameTile = player.units
              .slice(currentIdx + 1)
              .find((u) => u.x === currentUnit.x && u.y === currentUnit.y && u.movesRemaining > 0 && !u.isSkipping);
            if (nextSameTile) return nextSameTile;
          }

          const distPrev = Math.abs(prev.x - currentUnit.x) + Math.abs(prev.y - currentUnit.y);
          const distCurr = Math.abs(curr.x - currentUnit.x) + Math.abs(curr.y - currentUnit.y);

          if (curr.x === currentUnit.x && curr.y === currentUnit.y) return curr;
          if (prev.x === currentUnit.x && prev.y === currentUnit.y) return prev;

          return distCurr < distPrev ? curr : prev;
        }, availableUnits[0]);
      } else {
        nextUnit = availableUnits[0];
      }

      set((state) => {
        state.selectedUnitId = nextUnit.id;
        state.selectedSettlementId = null;
      });
      eventBus.emit('cameraJump', { x: nextUnit.x, y: nextUnit.y });
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
      }),

    moveUnit: (unitId, toX, toY) =>
      set((state) => {
        const player = state.players.find((p) => p.id === state.currentPlayerId);
        if (!player) return;

        const unit = player.units.find((u) => u.id === unitId);
        if (!unit) return;

        if (toY < 0 || toY >= state.map.length || !state.map[toY] || toX < 0 || toX >= state.map[toY].length) {
          return;
        }
        const targetTile = state.map[toY][toX];

        if (unit.movesRemaining >= targetTile.movementCost) {
          unit.x = toX;
          unit.y = toY;
          unit.movesRemaining -= targetTile.movementCost;
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
        const updatedPlayers = TurnEngine.runProduction(state.players);
        set((s) => {
          s.players = updatedPlayers;
        });
        get().endTurn();
      } else if (state.phase === TurnPhase.TRADE) {
        get().endTurn();
      } else if (state.phase === TurnPhase.AI) {
        const updatedPlayers = TurnEngine.runAITurn(state.players, state.map);
        set((s) => {
          s.players = updatedPlayers;
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

        const nationData = NATION_BONUSES[player.nation];
        if (nationData.culture === 'EUROPEAN' && unit.type !== UnitType.COLONIST) return;
        if (nationData.culture === 'NATIVE' && unit.type !== UnitType.VILLAGER) return;

        const newSettlement: Settlement = {
          id: `settlement-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          ownerId: player.id,
          name: `${player.name}'s Settlement`,
          x: unit.x,
          y: unit.y,
          population: 1,
          culture: nationData.culture,
          organization: nationData.organization,
          buildings: [],
          inventory: new Map(),
          productionQueue: [],
          workforce: new Map([[unit.id, JobType.FARMER]]),
          units: [unit],
          attitude: 'NEUTRAL',
          goods: new Map(),
        };

        player.units.splice(unitIndex, 1);
        player.settlements.push(newSettlement);

        if (state.selectedUnitId === unitId) {
          state.selectedUnitId = null;
        }
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
        if (!player || player.gold < cost) return;

        const settlement = player.settlements.find((s) => s.id === settlementId);
        if (settlement) {
          settlement.buildings.push(building);
          player.gold -= cost;
        }
      }),

    assignJob: (settlementId, unitId, job) =>
      set((state) => {
        for (const p of state.players) {
          const settlement = p.settlements.find((s) => s.id === settlementId);
          if (settlement) {
            settlement.workforce.set(unitId, job);
            return;
          }
        }
      }),

    sellGood: (unitId, good, amount) =>
      set((state) => {
        const player = state.players.find((p) => p.id === state.currentPlayerId);
        if (!player) return;

        const unit = player.units.find((u) => u.id === unitId);
        if (!unit) return;

        const cargoAmount = unit.cargo.get(good) || 0;
        const actualSellAmount = Math.min(amount, cargoAmount);
        if (actualSellAmount <= 0) return;

        const price = state.europePrices[good];
        const goldGained = actualSellAmount * price;

        unit.cargo.set(good, cargoAmount - actualSellAmount);
        player.gold += goldGained;

        if (actualSellAmount > 20) {
          state.europePrices[good] = Math.max(1, price - 1);
        }
      }),

    buyGood: (unitId, good, amount) =>
      set((state) => {
        const player = state.players.find((p) => p.id === state.currentPlayerId);
        if (!player) return;

        const unit = player.units.find((u) => u.id === unitId);
        if (!unit) return;

        const price = state.europePrices[good];
        const cost = amount * price;
        if (player.gold < cost) return;

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
        const npcIndex = state.npcSettlements.findIndex((s) => s.id === settlementId);
        const player = state.players.find((p) => p.id === state.currentPlayerId);
        const unit = player?.units.find((u) => u.id === unitId);

        if (npcIndex === -1 || !unit) return;

        const { updatedSettlement, updatedUnit } = NativeInteractionSystem.trade(
          state.npcSettlements[npcIndex],
          unit,
          goodOffered
        );

        state.npcSettlements[npcIndex] = updatedSettlement;
        const uIdx = player!.units.findIndex(u => u.id === unitId);
        player!.units[uIdx] = updatedUnit;
      }),

    learnFromSettlement: (settlementId, unitId) =>
      set((state) => {
        const npcIndex = state.npcSettlements.findIndex((s) => s.id === settlementId);
        const player = state.players.find((p) => p.id === state.currentPlayerId);
        const unit = player?.units.find((u) => u.id === unitId);

        if (npcIndex === -1 || !unit) return;

        const { updatedSettlement, updatedUnit } = NativeInteractionSystem.learn(
          state.npcSettlements[npcIndex],
          unit
        );

        state.npcSettlements[npcIndex] = updatedSettlement;
        const uIdx = player!.units.findIndex(u => u.id === unitId);
        player!.units[uIdx] = updatedUnit;
      }),

    attackSettlement: (settlementId, unitId) => {
      const state = get();
      const settlement = state.npcSettlements.find((s) => s.id === settlementId);
      if (settlement) {
        state.resolveCombat(unitId, settlement.x, settlement.y);
      }
    },

    clearCombatResult: () =>
      set((state) => {
        state.combatResult = null;
      }),

    resolveCombat: (attackerId, targetX, targetY) =>
      set((state) => {
        const player = state.players.find((p) => p.id === state.currentPlayerId);
        if (!player) return;

        const attacker = player.units.find((u) => u.id === attackerId);
        if (!attacker) return;

        let defender: Unit | Settlement | undefined;
        let defenderSettlement: Settlement | undefined;

        for (const p of state.players) {
          if (p.id !== state.currentPlayerId) {
            const unit = p.units.find((u) => u.x === targetX && u.y === targetY);
            if (unit) {
              defender = unit;
              break;
            }
          }
        }

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

        if (!defender) {
          defender = state.npcSettlements.find((s) => s.x === targetX && s.y === targetY);
        }

        if (!defender) return;

        const defenderTile = state.map[targetY][targetX];
        const result = CombatSystem.resolveCombat(attacker, defender, defenderTile, defenderSettlement);

        if (result.winner === 'attacker') {
           const defenderPlayer = state.players.find(p => p.units.some(u => u.id === (defender as any).id));
           if (defenderPlayer) {
              const uIdx = defenderPlayer.units.findIndex(u => u.id === (defender as any).id);
              if (uIdx !== -1) {
                defenderPlayer.units.splice(uIdx, 1);
              }
           }

           const npcIdx = state.npcSettlements.findIndex(s => s.id === defender!.id);
           if (npcIdx !== -1) {
              const s = state.npcSettlements[npcIdx];
              if (s.population > 1) {
                s.population -= 1;
              } else {
                state.npcSettlements.splice(npcIdx, 1);
              }
           }

           const capturedSettlementPlayer = state.players.find(p => p.settlements.some(s => s.id === defender!.id));
           if (capturedSettlementPlayer && capturedSettlementPlayer.id !== state.currentPlayerId) {
              const sIdx = capturedSettlementPlayer.settlements.findIndex(s => s.id === defender!.id);
              const s = capturedSettlementPlayer.settlements[sIdx];

              attacker.x = targetX;
              attacker.y = targetY;
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
        player.units.push({
          id: `unit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          ownerId: player.id,
          type: unitType,
          x: selectedUnit.x,
          y: selectedUnit.y,
          movesRemaining: 1,
          maxMoves: 1,
          isSkipping: false,
          cargo: new Map(),
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
        state.npcSettlements = [];
      });
      eventBus.emit('returnToMainMenu');
    },

    initGame: (params) => {
      const { map, npcSettlements, players } = GameSystem.initGame(params);
      set((state) => {
        state.map = map;
        state.npcSettlements = npcSettlements;
        state.players = players;
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
