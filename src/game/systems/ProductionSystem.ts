import type { Settlement } from '../entities/Settlement';
import type { Tile } from '../entities/Tile';
import { BuildingType, GoodType, JobType } from '../entities/types';
import { JOB_PRODUCTION_RULES, TERRAIN_PRODUCTION_RULES } from '../rules/ProductionRules';
import { COLONY_CONSTANTS } from '../constants';

export class ProductionSystem {
  static calculateSettlementProduction(
    settlement: Settlement,
    map: Tile[][]
  ): Map<GoodType, number> {
    const netProduction = new Map<GoodType, number>();

    // Initialize with 0
    Object.values(GoodType).forEach(good => netProduction.set(good, 0));

    // 1. Workforce production
    settlement.workforce.forEach((assignment, unitId) => {
      const unit = settlement.units.find(u => u.id === unitId);
      let amount = COLONY_CONSTANTS.PRODUCTION_PER_WORKER;

      if (unit?.specialty === assignment) {
        amount *= 2;
      }

      if (Object.values(JobType).includes(assignment as JobType)) {
        const rule = JOB_PRODUCTION_RULES[assignment as JobType];
        if (rule) {
          const hasBuilding = rule.requiredBuildings.length === 0 ||
            rule.requiredBuildings.some(b => settlement.buildings.includes(b));

          if (hasBuilding) {
            if (rule.inputGood) {
              const inputGood = rule.inputGood;
              // Note: We don't check current inventory here for "net" calculation,
              // but for actual production we would.
              // For the UI, we want to show what COULD be produced if resources are available.
              netProduction.set(inputGood, (netProduction.get(inputGood) || 0) - amount);

              if (rule.outputGood) {
                netProduction.set(rule.outputGood, (netProduction.get(rule.outputGood) || 0) + amount);
              }
              // Hammers are handled separately in Settlement entity, not as a GoodType usually,
              // but some systems might treat them as such.
            } else if (rule.outputGood) {
              const outputGood = rule.outputGood;
              netProduction.set(outputGood, (netProduction.get(outputGood) || 0) + amount);
            }
          }
        }
      } else {
        // Tile-based
        const parts = (assignment as string).split('-');
        if (parts.length === 2) {
          const tx = parseInt(parts[0]);
          const ty = parseInt(parts[1]);
          const tile = map[ty]?.[tx];
          if (tile) {
            const good = TERRAIN_PRODUCTION_RULES[tile.terrainType];
            if (good) {
              netProduction.set(good, (netProduction.get(good) || 0) + amount);
            }
          }
        }
      }
    });

    // 2. Building bonuses
    if (settlement.buildings.includes(BuildingType.LUMBER_MILL)) {
      netProduction.set(GoodType.LUMBER, (netProduction.get(GoodType.LUMBER) || 0) + 2);
    }
    if (settlement.buildings.includes(BuildingType.IRON_WORKS)) {
      netProduction.set(GoodType.ORE, (netProduction.get(GoodType.ORE) || 0) + 2);
    }

    // 3. Food consumption
    const foodConsumption = settlement.population * 2;
    netProduction.set(GoodType.FOOD, (netProduction.get(GoodType.FOOD) || 0) - foodConsumption);

    return netProduction;
  }

  static getInventoryCapacity(settlement: Settlement): number {
    return settlement.buildings.includes(BuildingType.WAREHOUSE)
      ? COLONY_CONSTANTS.WAREHOUSE_CAPACITY
      : COLONY_CONSTANTS.DEFAULT_CAPACITY;
  }
}
