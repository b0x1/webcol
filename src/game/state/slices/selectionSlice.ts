import type { StateCreator } from 'zustand';
import type { GameState } from '../types';
import { UnitSystem } from '../../systems/UnitSystem';
import { eventBus } from '../EventBus';
import { selectCurrentPlayer } from '../selectors';
import { TraversalUtils } from '../../utils/TraversalUtils';

export interface SelectionSlice {
  selectedUnitId: string | null;
  selectedSettlementId: string | null;
  selectedTile: import('../../entities/Tile').Tile | null;
  selectUnit: (unitId: string | null) => void;
  selectTile: (tile: import('../../entities/Tile').Tile | null) => void;
  selectNextUnit: () => void;
  skipUnit: (unitId: string) => void;
  selectSettlement: (settlementId: string | null) => void;
}

export const createSelectionSlice: StateCreator<
  GameState,
  [['zustand/immer', never]],
  [],
  SelectionSlice
> = (set, get) => ({
  selectedUnitId: null,
  selectedSettlementId: null,
  selectedTile: null,

  selectUnit: (unitId) => {
    set((state) => {
      const player = selectCurrentPlayer(state);
      if (player) {
        // 1. Tuck away previously selected unit if it's on a settlement tile
        if (state.selectedUnitId) {
          const prevUnitIdx = player.units.findIndex(u => u.id === state.selectedUnitId);
          if (prevUnitIdx !== -1) {
            const prevUnit = player.units[prevUnitIdx];
            if (prevUnit) {
              const settlement = TraversalUtils.findSettlementAt([player], prevUnit.position);
              if (settlement) {
                UnitSystem.enterSettlement(prevUnit, player, settlement);
              }
            }
          }
        }

        // 2. If the new unit is in a settlement, move it to player.units
        if (unitId) {
          UnitSystem.exitSettlement(unitId, player);
        }
      }
      state.selectedUnitId = unitId;
      state.selectedSettlementId = null;
    });
  },

  selectTile: (tile) => {
    set((state) => {
      state.selectedTile = tile;
    });
  },

  selectNextUnit: () => {
    const state = get();
    const player = selectCurrentPlayer(state);
    if (!player) return;

    const nextUnit = UnitSystem.findNextAvailableUnit(player, state.selectedUnitId);
    if (!nextUnit) return;

    set((state) => {
      state.selectedUnitId = nextUnit.id;
      state.selectedSettlementId = null;
    });
    eventBus.emit('cameraJump', { x: nextUnit.position.x, y: nextUnit.position.y });
  },

  skipUnit: (unitId) => {
    set((state) => {
      const player = selectCurrentPlayer(state);
      if (!player) return;
      const unit = player.units.find((u) => u.id === unitId);
      if (unit) {
        unit.isSkipping = true;
        if (state.selectedUnitId === unitId) {
          state.selectedUnitId = null;
        }
      }
    });
  },

  selectSettlement: (settlementId) => {
    set((state) => {
      state.selectedSettlementId = settlementId;
      state.selectedUnitId = null;
    });
  },
});
