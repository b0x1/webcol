import type { StateCreator } from 'zustand';
import type { GameState } from '../types';
import { UnitSystem } from '../../systems/UnitSystem';
import { eventBus } from '../EventBus';
import { isSame } from '../../entities/Position';
import { selectCurrentPlayer, selectUnitsAtPosition, selectSettlementAtPosition } from '../selectors';

export interface SelectionSlice {
  selectedUnitId: string | null;
  selectedSettlementId: string | null;
  selectedTile: import('../../entities/Tile').Tile | null;
  selectUnit: (unitId: string | null) => void;
  selectTile: (tile: import('../../entities/Tile').Tile | null, options?: { skipAutoSelection?: boolean }) => void;
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
              const settlement = player.settlements.find(s => isSame(s.position, prevUnit.position));
              if (settlement) {
                if (!settlement.units.some(u => u.id === prevUnit.id)) {
                  settlement.units.push({ ...prevUnit });
                }
                player.units.splice(prevUnitIdx, 1);
              }
            }
          }
        }

        // 2. If the new unit is in a settlement, move it to player.units
        if (unitId) {
          for (const s of player.settlements) {
            const uIdx = s.units.findIndex(u => u.id === unitId);
            if (uIdx !== -1) {
              const unit = s.units[uIdx];
              if (unit) {
                // Only move out if it's NOT in the workforce (available)
                // available is FIELD_WORK at the settlement tile or RURE
                const occ = unit.occupation;
                const isAvailable = occ && typeof occ === 'object' && // eslint-disable-line @typescript-eslint/no-unnecessary-condition
                  (occ.kind === 'RURE' || (occ.tileX === s.position.x && occ.tileY === s.position.y));

                if (isAvailable) {
                  if (!player.units.some(u => u.id === unitId)) {
                    player.units.push({ ...unit });
                  }
                  s.units.splice(uIdx, 1);
                }
              }
              break;
            }
          }
        }
      }
      state.selectedUnitId = unitId;
      state.selectedSettlementId = null;
    });
  },

  selectTile: (tile, options) => {
    set((state) => {
      state.selectedTile = tile;
      if (!tile || options?.skipAutoSelection) return;

      const player = selectCurrentPlayer(state);
      if (!player) return;

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
