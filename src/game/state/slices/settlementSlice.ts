import type { StateCreator } from 'zustand';
import type { GameState } from '../types';
import { BuildingType, type JobType } from '../../entities/types';
import { SettlementSystem } from '../../systems/SettlementSystem';
import { NamingSystem } from '../../systems/NamingSystem';
import { TraversalUtils } from '../../utils/TraversalUtils';
import { random, generateId } from '../utils';
import { selectCurrentPlayer, selectSettlementById, selectSettlementOwner } from '../selectors';

export interface SettlementSlice {
  foundSettlement: (unitId: string) => void;
  buyBuilding: (settlementId: string, building: BuildingType) => void;
  assignJob: (settlementId: string, unitId: string, job: string | null) => void;
}

export const createSettlementSlice: StateCreator<
  GameState,
  [['zustand/immer', never]],
  [],
  SettlementSlice
> = (set) => ({
  foundSettlement: (unitId) => {
    set((state) => {
      const player = selectCurrentPlayer(state);
      if (!player) return;

      const unitIndex = player.units.findIndex((u) => u.id === unitId);
      const unit = player.units[unitIndex];
      if (!unit) return;

      const allSettlements = TraversalUtils.getAllSettlements(state.players);

      if (!SettlementSystem.canFoundSettlement(player, unit, state.map, allSettlements)) return;

      const { name: settlementName, updatedStats } = NamingSystem.getNextName(player.nation, 'settlement', state.namingStats);
      state.namingStats = updatedStats;

      const newSettlement = SettlementSystem.createSettlement(
        player,
        unit,
        settlementName,
        [BuildingType.TOWN_HALL, BuildingType.CARPENTERS_SHOP, BuildingType.BLACKSMITHS_HOUSE],
        state.map,
        random,
        generateId,
      );

      player.units.splice(unitIndex, 1);
      player.settlements.push(newSettlement);

      if (state.selectedUnitId === unitId) {
        state.selectedUnitId = null;
      }
    });
  },

  buyBuilding: (settlementId, building) => {
    set((state) => {
      const player = selectCurrentPlayer(state);
      if (!player) return;

      const settlement = player.settlements.find((s) => s.id === settlementId);
      if (settlement) {
        // Instead of instant buy, add to productionQueue if not already there or built
        if (!settlement.buildings.includes(building) && !settlement.productionQueue.includes(building)) {
           settlement.productionQueue.push(building);
        }
      }
    });
  },

  assignJob: (settlementId, unitId, job) => {
    set((state) => {
      const settlement = selectSettlementById(state, settlementId);
      if (settlement) {
        const owner = selectSettlementOwner(state, settlementId);
        if (job === null) {
          // Setting job to null means move to RURE (outside workforce)
          const uIdx = settlement.units.findIndex(u => u.id === unitId);
          const unit = settlement.units[uIdx];
          if (unit) {
            unit.occupation = { kind: 'RURE', state: 'MOVING' };
            if (owner && !owner.units.some(u => u.id === unitId)) {
              owner.units.push({ ...unit });
            }
            settlement.units.splice(uIdx, 1);
          }
        } else {
          // Job can be a JobType string or a tile key "x,y"
          let unit = settlement.units.find((u) => u.id === unitId);
          if (!unit) {
            const pUnitIdx = owner?.units.findIndex(u => u.id === unitId) ?? -1;
            const pUnit = owner?.units[pUnitIdx];
            if (pUnit) {
              // Move to settlement units if assigned
              unit = { ...pUnit };
              settlement.units.push(unit);
              owner.units.splice(pUnitIdx, 1);
              if (state.selectedUnitId === unitId) state.selectedUnitId = null;
            }
          }

          if (unit) {
            if (job.includes(',')) {
              const [x, y] = job.split(',').map(Number);
              if (x !== undefined && y !== undefined) {
                unit.occupation = { kind: 'FIELD_WORK', tileX: x, tileY: y };
              }
            } else {
              unit.occupation = job as JobType;
            }
          }
        }
        settlement.population = settlement.units.length;
      }
    });
  },
});
