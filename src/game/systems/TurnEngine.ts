import type { Player } from '../entities/Player';
import type { Tile } from '../entities/Tile';
import type { Settlement } from '../entities/Settlement';
import { GoodType, UnitType, JobType, BuildingType } from '../entities/types';
import { eventBus } from '../state/EventBus';
import { SaveSystem } from './SaveSystem';
import type { GameState } from '../state/gameStore';
import { BUILDING_COSTS, COLONY_CONSTANTS, UNIT_BUILD_COSTS } from '../constants';
import { createUnit } from '../entities/Unit';
import { ProductionSystem } from './ProductionSystem';
import { NamingSystem } from './NamingSystem';

export class TurnEngine {
  static autoSave(state: GameState): void {
    SaveSystem.save(state, 'autosave');
    eventBus.emit('notification', 'Auto-saved');
  }

  static runProduction(players: Player[], map: Tile[][], namingStats: any): { players: Player[]; namingStats: any } {
    let currentNamingStats = { ...namingStats };
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

        // Increment turns in job and handle specialty promotion
        newSettlement.workforce.forEach((assignment, unitId) => {
          const unit = newSettlement.units.find((u) => u.id === unitId);
          if (!unit) return;

          unit.turnsInJob += 1;
          if (unit.turnsInJob >= COLONY_CONSTANTS.EXPERT_PROMOTION_TURNS && !unit.specialty) {
            if (Object.values(JobType).includes(assignment as JobType)) {
              unit.specialty = assignment as JobType;
              eventBus.emit('notification', `${unit.type} has become an expert ${unit.specialty}!`);
            }
          }
        });

        // 1 & 2. Process Production and Building bonuses
        const { netProduction, hammersProduced } = ProductionSystem.calculateSettlementProduction(
          newSettlement,
          map,
          true
        );

        netProduction.forEach((amount, good) => {
          newSettlement.inventory.set(good, Math.max(0, (newSettlement.inventory.get(good) || 0) + amount));
        });

        newSettlement.hammers += hammersProduced;

        if (newSettlement.buildings.includes(BuildingType.PRINTING_PRESS)) {
          const { name: unitName, updatedStats } = NamingSystem.getNextName(player.nation, 'unit', currentNamingStats);
          currentNamingStats = updatedStats;

          const newUnit = createUnit(
            `unit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            newSettlement.ownerId,
            unitName,
            UnitType.COLONIST,
            newSettlement.position.x,
            newSettlement.position.y,
            3
          );
          newPlayerUnits.push(newUnit);
          eventBus.emit('notification', `An intellectual has joined the cause in ${newSettlement.name}!`);
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
                  const { name: unitName, updatedStats } = NamingSystem.getNextName(player.nation, (currentItem as UnitType) === UnitType.SHIP ? 'ship' : 'unit', currentNamingStats);
                  currentNamingStats = updatedStats;

                  const newUnit = createUnit(
                    `unit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    newSettlement.ownerId,
                    unitName,
                    currentItem as UnitType,
                    newSettlement.position.x,
                    newSettlement.position.y,
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
          const currentFood = newSettlement.inventory.get(GoodType.FOOD) || 0;
          const netFood = currentFood;

          if (netFood >= COLONY_CONSTANTS.FOOD_GROWTH_THRESHOLD) {
              newSettlement.inventory.set(GoodType.FOOD, netFood - COLONY_CONSTANTS.FOOD_GROWTH_THRESHOLD);
              const { name: colonistName, updatedStats } = NamingSystem.getNextName(player.nation, 'unit', currentNamingStats);
              currentNamingStats = updatedStats;

              const newColonist = createUnit(
                `unit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                newSettlement.ownerId,
                colonistName,
                UnitType.COLONIST,
                newSettlement.position.x,
                newSettlement.position.y,
                3
              );
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
    return { players: updatedPlayers, namingStats: currentNamingStats };
  }
}
