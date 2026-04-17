import type { Settlement } from '../entities/Settlement';
import type { Tile } from '../entities/Tile';
import { BuildingType, GoodType } from '../entities/types';
import { JOB_PRODUCTION_RULES, TERRAIN_PRODUCTION_RULES } from '../rules/ProductionRules';
import { COLONY_CONSTANTS } from '../constants';

const ALL_GOOD_TYPES = Object.values(GoodType);

/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
export class ProductionSystem {
  private constructor() {
    // Static utility class
  }

  static calculateSettlementProduction(
    settlement: Settlement,
    map: Tile[][],
    isActualProduction = false
  ): { netProduction: Map<GoodType, number>; hammersProduced: number } {
    const netProduction = new Map<GoodType, number>();
    let hammersProduced = 0;

    // Optimization: Pre-initialize with ALL_GOOD_TYPES to avoid repeated Object.values calls
    ALL_GOOD_TYPES.forEach((good) => netProduction.set(good, 0));

    // 1. Workforce production
    settlement.units.forEach((unit) => {
      let amount = COLONY_CONSTANTS.PRODUCTION_PER_WORKER;

      if (!unit.occupation) return;

      if (typeof unit.occupation === 'string') {
        const job = unit.occupation;
        if (unit.expertise === job) {
          amount *= 2;
        }

        const rule = JOB_PRODUCTION_RULES[job];
        const needsBuilding = rule.requiredBuildings.length > 0;
        const hasBuilding =
          !needsBuilding ||
          rule.requiredBuildings.some((b) => settlement.buildings.includes(b));

        if (hasBuilding) {
          if (rule.inputGood) {
            const inputGood = rule.inputGood;
            let possible = amount;

            if (isActualProduction) {
              const currentInventory = settlement.inventory.get(inputGood) ?? 0;
              possible = Math.min(amount, currentInventory);
            }

            netProduction.set(inputGood, (netProduction.get(inputGood) ?? 0) - possible);

            if (rule.producesHammers) {
              hammersProduced += possible;
            } else if (rule.outputGood) {
              netProduction.set(
                rule.outputGood,
                (netProduction.get(rule.outputGood) ?? 0) + possible
              );
            }
          } else if (rule.outputGood) {
            const outputGood = rule.outputGood;
            netProduction.set(
              outputGood,
              (netProduction.get(outputGood) ?? 0) + amount
            );
          }
        }
      } else if (unit.occupation.kind === 'FIELD_WORK') {
        const { tileX, tileY } = unit.occupation;
        const tile = map[tileY]?.[tileX];
        const good = tile ? TERRAIN_PRODUCTION_RULES[tile.terrainType] : null;
        if (good) {
          // If specialized in something that matches the terrain good (e.g. LUMBERJACK for FOREST)
          // Actually, JobType doesn't perfectly map to TerrainProduction but we can check.
          // For now keep it simple or check against expertise if it matches the produced good.
          // Note: JobType.FARMER is removed, but we might want to check for something else?
          // Actually, original code didn't have specialty bonus for tile production.
          netProduction.set(good, (netProduction.get(good) ?? 0) + amount);
        }
      }
    });

    // 2. Building bonuses
    if (settlement.buildings.includes(BuildingType.LUMBER_MILL)) {
      netProduction.set(GoodType.LUMBER, (netProduction.get(GoodType.LUMBER) ?? 0) + 2);
    }
    if (settlement.buildings.includes(BuildingType.IRON_WORKS)) {
      netProduction.set(GoodType.ORE, (netProduction.get(GoodType.ORE) ?? 0) + 2);
    }

    // 3. Food consumption
    // Population is defined as number of units in the settlement
    const foodConsumption = settlement.units.length * COLONY_CONSTANTS.FOOD_CONSUMPTION_PER_CITIZEN;
    netProduction.set(GoodType.FOOD, (netProduction.get(GoodType.FOOD) ?? 0) - foodConsumption);

    return { netProduction, hammersProduced };
  }

  static getInventoryCapacity(settlement: Settlement): number {
    return settlement.buildings.includes(BuildingType.WAREHOUSE)
      ? COLONY_CONSTANTS.WAREHOUSE_CAPACITY
      : COLONY_CONSTANTS.DEFAULT_CAPACITY;
  }
}
