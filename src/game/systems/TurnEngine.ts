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
import { NamingSystem, type NamingStats } from './NamingSystem';

/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
export class TurnEngine {
  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  private constructor() {}

  static autoSave(state: GameState): void {
    SaveSystem.save(state, 'autosave');
    eventBus.emit('notification', 'Auto-saved');
  }

  static runProduction(players: Player[], map: Tile[][], namingStats: NamingStats): { players: Player[]; namingStats: NamingStats } {
    let currentNamingStats = { ...namingStats };
    const updatedPlayers = players.map((player) => {
      const newPlayerUnits = player.units.map((u) => ({ ...u, cargo: new Map<GoodType, number>(u.cargo) }));

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
          newSettlement.inventory.set(good, Math.max(0, (newSettlement.inventory.get(good) ?? 0) + amount));
        });

        newSettlement.hammers += hammersProduced;

        if (newSettlement.buildings.includes(BuildingType.PRINTING_PRESS)) {
          const namingResult = NamingSystem.getNextName(player.nation, 'unit', currentNamingStats);
          currentNamingStats = namingResult.updatedStats;

          const newUnit = createUnit(
            `unit-${String(Date.now())}-${String(Math.floor(Math.random() * 1000))}`,
            newSettlement.ownerId,
            namingResult.name,
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

            const cost: { hammers: number; tools?: number; muskets?: number } = isBuilding
              ? (BUILDING_COSTS[currentItem as BuildingType] ?? { hammers: 40, tools: 0 })
              : (UNIT_BUILD_COSTS[currentItem as UnitType] ?? { hammers: 40, tools: 0, muskets: 0 });

            // Check tools availability
            const currentTools = newSettlement.inventory.get(GoodType.TOOLS) ?? 0;
            const currentMuskets = newSettlement.inventory.get(GoodType.MUSKETS) ?? 0;
            const toolsNeeded = cost.tools ?? 0;
            const musketsNeeded = cost.muskets ?? 0;

            if (currentTools >= toolsNeeded && currentMuskets >= musketsNeeded) {
              if (newSettlement.hammers >= cost.hammers) {
                newSettlement.hammers -= cost.hammers;
                newSettlement.inventory.set(GoodType.TOOLS, currentTools - toolsNeeded);
                newSettlement.inventory.set(GoodType.MUSKETS, currentMuskets - musketsNeeded);
                newSettlement.productionQueue.shift();

                if (isBuilding) {
                  newSettlement.buildings.push(currentItem as BuildingType);
                  eventBus.emit('notification', `${newSettlement.name} completed ${(currentItem as BuildingType)}!`);
                } else if (isUnit) {
                  const namingResult = NamingSystem.getNextName(player.nation, (currentItem as UnitType) === UnitType.SHIP ? 'ship' : 'unit', currentNamingStats);
                  currentNamingStats = namingResult.updatedStats;

                  const newUnit = createUnit(
                    `unit-${String(Date.now())}-${String(Math.floor(Math.random() * 1000))}`,
                    newSettlement.ownerId,
                    namingResult.name,
                    currentItem as UnitType,
                    newSettlement.position.x,
                    newSettlement.position.y,
                    3
                  );
                  newSettlement.units.push(newUnit);
                  newPlayerUnits.push(newUnit);
                  eventBus.emit('notification', `${newSettlement.name} completed ${(currentItem as UnitType)}!`);
                }
              }
            }
          }

          // 4. Population Growth & Food Consumption
          const currentFood = newSettlement.inventory.get(GoodType.FOOD) ?? 0;
          const netFood = currentFood;

          if (netFood >= COLONY_CONSTANTS.FOOD_GROWTH_THRESHOLD) {
              newSettlement.inventory.set(GoodType.FOOD, netFood - COLONY_CONSTANTS.FOOD_GROWTH_THRESHOLD);
              const namingResult = NamingSystem.getNextName(player.nation, 'unit', currentNamingStats);
              currentNamingStats = namingResult.updatedStats;

              const newColonist = createUnit(
                `unit-${String(Date.now())}-${String(Math.floor(Math.random() * 1000))}`,
                newSettlement.ownerId,
                namingResult.name,
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
