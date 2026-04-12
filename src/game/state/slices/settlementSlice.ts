/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-non-null-assertion */
import type { StateCreator } from 'zustand';
import type { GameState } from '../types';
import { BuildingType } from '../../entities/types';
import { SettlementSystem } from '../../systems/SettlementSystem';
import { NamingSystem } from '../../systems/NamingSystem';
import { random, generateId } from '../utils';

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
      const player = state.players.find((p) => p.id === state.currentPlayerId);
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
              settlement.workforce.set(unitId, job as any);
            }
          }
          settlement.population = settlement.workforce.size;
          return;
        }
      }
    });
  },
});
