import { enableMapSet } from 'immer';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Settlement } from '@shared/game/entities/Settlement';
import type { Unit } from '@shared/game/entities/Unit';
import type { GoodType } from '@shared/game/entities/types';
import { MovementSystem } from '@shared/game/systems/MovementSystem';
import { ProductionSystem } from '@shared/game/systems/ProductionSystem';
import { UnitSystem } from '@shared/game/systems/UnitSystem';
import { eventBus } from '@client/game/state/EventBus';
import type { GameState } from '@client/game/state/types';
import {
  selectCurrentPlayer,
  selectSettlementAtPosition,
  selectUnitsAtPosition,
} from '@client/game/state/selectors';
import type { GameCommand } from '@shared/game/protocol';
import { LocalGameTransport } from './LocalGameTransport';
import { emitEffects } from './state/EffectEmitter';
import { applyAuthoritativeState } from './state/AuthoritativeStateMapper';

enableMapSet();

const transport = new LocalGameTransport();
const initialSnapshot = transport.getSnapshot();

const dispatchCommand = (command: GameCommand): void => {
  transport.send(command);
};

export const useGameStore = create<GameState>()(
  immer((set, get) => ({
    ...initialSnapshot,
    selectedUnitId: null,
    selectedSettlementId: null,
    selectedTile: null,
    combatResult: null,

    selectUnit: (unitId) => {
      const state = get();
      const player = selectCurrentPlayer(state);
      if (player) {
        const previousUnitId = state.selectedUnitId;
        if (previousUnitId && previousUnitId !== unitId) {
          dispatchCommand({ type: 'stowUnit', unitId: previousUnitId });
        }
        if (unitId && unitId !== previousUnitId) {
          dispatchCommand({ type: 'activateUnit', unitId });
        }
      }

      set((draft) => {
        draft.selectedUnitId = unitId;
        draft.selectedSettlementId = null;
      });
    },

    selectTile: (tile, options) => {
      set((state) => {
        state.selectedTile = tile;
        if (!tile || options?.skipAutoSelection) {
          return;
        }

        const player = selectCurrentPlayer(state);
        if (!player) {
          return;
        }

        const unitsAtTile = selectUnitsAtPosition(state, tile.position);
        const settlementAtTile = selectSettlementAtPosition(state, tile.position);
        const hasOwnedSettlement = settlementAtTile?.ownerId === player.id;
        const selectableOptionsCount = unitsAtTile.length + (hasOwnedSettlement ? 1 : 0);

        if (selectableOptionsCount === 1) {
          const firstUnit = unitsAtTile[0];
          if (firstUnit?.id && unitsAtTile.length === 1) {
            state.selectedUnitId = firstUnit.id;
            state.selectedSettlementId = null;
          } else if (hasOwnedSettlement) {
            state.selectedSettlementId = settlementAtTile.id;
            state.selectedUnitId = null;
          }
        }
      });
    },

    selectNextUnit: () => {
      const state = get();
      const player = selectCurrentPlayer(state);
      if (!player) {
        return;
      }

      const nextUnit = UnitSystem.findNextAvailableUnit(player, state.selectedUnitId);
      if (!nextUnit) {
        return;
      }

      get().selectUnit(nextUnit.id);
      eventBus.emit('cameraJump', {
        x: nextUnit.position.x,
        y: nextUnit.position.y,
      });
    },

    skipUnit: (unitId) => {
      dispatchCommand({ type: 'skipUnit', unitId });
      set((state) => {
        if (state.selectedUnitId === unitId) {
          state.selectedUnitId = null;
        }
      });
    },

    selectSettlement: (settlementId) => {
      set((state) => {
        state.selectedSettlementId = settlementId;
        state.selectedUnitId = null;
      });
    },

    moveUnit: (unitId, to) => {
      dispatchCommand({ type: 'moveUnit', unitId, to });
      set((state) => {
        state.selectedUnitId = null;
      });
    },

    endTurn: () => {
      dispatchCommand({ type: 'endTurn' });
      set((state) => {
        state.selectedUnitId = null;
        state.selectedSettlementId = null;
      });
    },

    foundSettlement: (unitId) => {
      dispatchCommand({ type: 'foundSettlement', unitId });
      set((state) => {
        if (state.selectedUnitId === unitId) {
          state.selectedUnitId = null;
        }
      });
    },

    buyBuilding: (settlementId, building) => {
      dispatchCommand({ type: 'buyBuilding', settlementId, building });
    },

    assignJob: (settlementId, unitId, job) => {
      dispatchCommand({ type: 'assignJob', settlementId, unitId, job });
      if (job !== null) {
        set((state) => {
          if (state.selectedUnitId === unitId) {
            state.selectedUnitId = null;
          }
        });
      }
    },

    sellGood: (unitId, good, amount) => {
      dispatchCommand({ type: 'sellGood', unitId, good, amount });
    },

    buyGood: (unitId, good, amount) => {
      dispatchCommand({ type: 'buyGood', unitId, good, amount });
    },

    transferGood: (unitId, settlementId, good, amount, direction) => {
      dispatchCommand({ type: 'transferGood', unitId, settlementId, good, amount, direction });
    },

    sailToEurope: (unitId) => {
      dispatchCommand({ type: 'sailToEurope', unitId });
    },

    returnFromEurope: (unitId) => {
      dispatchCommand({ type: 'returnFromEurope', unitId });
    },

    improveTile: (unitId) => {
      dispatchCommand({ type: 'improveTile', unitId });
    },

    recruitUnit: (unitType) => {
      dispatchCommand({ type: 'recruitUnit', unitType, fromUnitId: get().selectedUnitId });
    },

    tradeWithSettlement: (settlementId, unitId, goodOffered) => {
      dispatchCommand({ type: 'tradeWithSettlement', settlementId, unitId, goodOffered });
    },

    learnFromSettlement: (settlementId, unitId) => {
      dispatchCommand({ type: 'learnFromSettlement', settlementId, unitId });
    },

    attackSettlement: (settlementId, unitId) => {
      dispatchCommand({ type: 'attackSettlement', settlementId, unitId });
    },

    resolveCombat: (attackerId, target) => {
      dispatchCommand({ type: 'resolveCombat', attackerId, target });
      set((state) => {
        state.selectedUnitId = null;
      });
    },

    clearCombatResult: () => {
      set((state) => {
        state.combatResult = null;
      });
    },

    loadGameState: (state) => {
      dispatchCommand({ type: 'loadGame', state });
      set((draft) => {
        draft.selectedUnitId = null;
        draft.selectedSettlementId = null;
        draft.selectedTile = null;
        draft.combatResult = null;
      });
    },

    initGame: (params) => {
      dispatchCommand({ type: 'initGame', params });
      set((state) => {
        state.selectedUnitId = null;
        state.selectedSettlementId = null;
        state.selectedTile = null;
        state.combatResult = null;
      });
    },

    resetGame: () => {
      dispatchCommand({ type: 'resetGame' });
    },
  })),
);

transport.subscribe((message) => {
  useGameStore.setState((state) => {
    applyAuthoritativeState(state, message.state);
  });
  emitEffects(message.effects, message.state, useGameStore);
});

export * from '@client/game/state/selectors';

export const getReachableTilesForUnit = (
  unit: Unit,
  map: GameState['map'],
): ({ x: number; y: number; cost: number })[] => MovementSystem.getReachableTiles(unit, map);

export const getSettlementProduction = (
  settlement: Settlement,
  map: GameState['map'],
): { netProduction: Map<GoodType, number>; hammersProduced: number } =>
  ProductionSystem.calculateSettlementProduction(settlement, map);
