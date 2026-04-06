import type { Player } from '../entities/Player';
import type { Tile } from '../entities/Tile';
import type { Settlement } from '../entities/Settlement';
import { GoodType, UnitType, JobType, BuildingType } from '../entities/types';
import { eventBus } from '../state/EventBus';
import { SaveSystem } from './SaveSystem';
import type { GameState } from '../state/gameStore';
import { BUILDING_COSTS, COLONY_CONSTANTS, UNIT_BUILD_COSTS } from '../constants';
import { createUnit } from '../entities/Unit';
import { JOB_PRODUCTION_RULES, TERRAIN_PRODUCTION_RULES } from '../rules/ProductionRules';

export class TurnEngine {
  static autoSave(state: GameState): void {
    SaveSystem.save(state, 'autosave');
    eventBus.emit('notification', 'Auto-saved');
  }

  static runProduction(players: Player[], map: Tile[][]): Player[] {
    const updatedPlayers = players.map((player) => {
      const newPlayerUnits = player.units.map((u) => ({ ...u, cargo: new Map(u.cargo) }));

      const newSettlements = player.settlements.map((settlement) => {
        const newSettlement: Settlement = {
          ...settlement,
          buildings: [...settlement.buildings],
          productionQueue: [...settlement.productionQueue],
          inventory: new Map(settlement.inventory),
          workforce: new Map(settlement.workforce),
          units: settlement.units.map((u) => ({ ...u, cargo: new Map(u.cargo) })),
          goods: new Map(settlement.goods),
        };

        // 1. Process Workforce Production
          newSettlement.workforce.forEach((assignment, unitId) => {
            const unit = newSettlement.units.find(u => u.id === unitId);
            if (!unit) return;

            // Increment turns in job
            unit.turnsInJob += 1;
            if (unit.turnsInJob >= COLONY_CONSTANTS.EXPERT_PROMOTION_TURNS && !unit.specialty) {
              if (Object.values(JobType).includes(assignment as JobType)) {
                 unit.specialty = assignment as JobType;
                 eventBus.emit('notification', `${unit.type} has become an expert ${unit.specialty}!`);
              }
            }

            let good: GoodType | null = null;
            let amount = COLONY_CONSTANTS.PRODUCTION_PER_WORKER;

            // Specialty bonus
            if (unit.specialty === assignment) {
              amount *= 2;
            }

            if (Object.values(JobType).includes(assignment as JobType)) {
              const rule = JOB_PRODUCTION_RULES[assignment as JobType];
              if (rule) {
                const hasBuilding = rule.requiredBuildings.length === 0 ||
                  rule.requiredBuildings.some(b => newSettlement.buildings.includes(b));

                if (hasBuilding) {
                  if (rule.inputGood) {
                    const inputAmount = newSettlement.inventory.get(rule.inputGood) || 0;
                    const possible = Math.min(amount, inputAmount);
                    newSettlement.inventory.set(rule.inputGood, inputAmount - possible);

                    if (rule.producesHammers) {
                      newSettlement.hammers += possible;
                    } else if (rule.outputGood) {
                      newSettlement.inventory.set(rule.outputGood, (newSettlement.inventory.get(rule.outputGood) || 0) + possible);
                    }
                  } else if (rule.outputGood) {
                    good = rule.outputGood;
                  }
                }
              }
            } else {
              // Tile-based production
              const parts = (assignment as string).split('-');
              if (parts.length === 2) {
                const tx = parseInt(parts[0]);
                const ty = parseInt(parts[1]);
                const tile = map[ty]?.[tx];
                if (tile) {
                  good = TERRAIN_PRODUCTION_RULES[tile.terrainType] || null;
                  if (tile.hasResource) {
                     // specific resource bonus could be added here
                  }
                }
              }
            }

            if (good) {
              newSettlement.inventory.set(good, (newSettlement.inventory.get(good) || 0) + amount);
            }
          });

          // 2. Building bonuses (Restored)
          if (newSettlement.buildings.includes(BuildingType.LUMBER_MILL)) {
            newSettlement.inventory.set(GoodType.LUMBER, (newSettlement.inventory.get(GoodType.LUMBER) || 0) + 2);
          }
          if (newSettlement.buildings.includes(BuildingType.IRON_WORKS)) {
            newSettlement.inventory.set(GoodType.ORE, (newSettlement.inventory.get(GoodType.ORE) || 0) + 2);
          }
          if (newSettlement.buildings.includes(BuildingType.PRINTING_PRESS)) {
            newSettlement.population += 1;
          }

          // 3. Construction
          if (newSettlement.productionQueue.length > 0) {
            const currentItem = newSettlement.productionQueue[0];
            const isBuilding = Object.values(BuildingType).includes(currentItem as BuildingType);
            const isUnit = Object.values(UnitType).includes(currentItem as UnitType);

            const cost = isBuilding
              ? (BUILDING_COSTS[currentItem as string] || { hammers: 40, tools: 0 })
              : (UNIT_BUILD_COSTS[currentItem as string] || { hammers: 40, tools: 0, muskets: 0 });

            // Check tools availability
            const currentTools = newSettlement.inventory.get(GoodType.TOOLS) || 0;
            const currentMuskets = newSettlement.inventory.get(GoodType.MUSKETS) || 0;
            const toolsNeeded = cost.tools || 0;
            const musketsNeeded = (cost as any).muskets || 0;

            if (currentTools >= toolsNeeded && currentMuskets >= musketsNeeded) {
              if (newSettlement.hammers >= cost.hammers) {
                newSettlement.hammers -= cost.hammers;
                newSettlement.inventory.set(GoodType.TOOLS, currentTools - toolsNeeded);
                newSettlement.inventory.set(GoodType.MUSKETS, currentMuskets - musketsNeeded);
                newSettlement.productionQueue.shift();

                if (isBuilding) {
                  newSettlement.buildings.push(currentItem as BuildingType);
                  eventBus.emit('notification', `${newSettlement.name} completed ${currentItem}!`);
                } else if (isUnit) {
                  const newUnit = createUnit(
                    `unit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    newSettlement.ownerId,
                    currentItem as UnitType,
                    newSettlement.x,
                    newSettlement.y,
                    3
                  );
                  newSettlement.units.push(newUnit);
                  newPlayerUnits.push(newUnit);
                  eventBus.emit('notification', `${newSettlement.name} completed ${currentItem}!`);
                }
              }
            }
          }

          // 4. Population Growth & Food Consumption
          const foodNeeded = newSettlement.population * 2;
          const currentFood = newSettlement.inventory.get(GoodType.FOOD) || 0;
          const netFood = currentFood - foodNeeded;

          if (netFood >= COLONY_CONSTANTS.FOOD_GROWTH_THRESHOLD) {
              newSettlement.inventory.set(GoodType.FOOD, netFood - COLONY_CONSTANTS.FOOD_GROWTH_THRESHOLD);
              newSettlement.population += 1;
              const newColonist = createUnit(
                `unit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                newSettlement.ownerId,
                UnitType.COLONIST,
                newSettlement.x,
                newSettlement.y,
                3
              );
              newSettlement.units.push(newColonist);
              newPlayerUnits.push(newColonist);
              eventBus.emit('notification', `A new colonist has been born in ${newSettlement.name}!`);
          } else {
              newSettlement.inventory.set(GoodType.FOOD, Math.max(0, netFood));
          }

          // 5. Inventory Cap
          const cap = newSettlement.buildings.includes(BuildingType.WAREHOUSE) ?
            COLONY_CONSTANTS.WAREHOUSE_CAPACITY : COLONY_CONSTANTS.DEFAULT_CAPACITY;
          newSettlement.inventory.forEach((amount, good) => {
            if (amount > cap) {
              newSettlement.inventory.set(good, cap);
            }
          });

        return newSettlement;
      });

      return {
        ...player,
        units: newPlayerUnits,
        settlements: newSettlements,
      };
    });

    eventBus.emit('productionCompleted', updatedPlayers);
    return updatedPlayers;
  }
}
