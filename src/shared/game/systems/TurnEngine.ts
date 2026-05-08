import type { Player } from '../entities/Player';
import type { Tile } from '../entities/Tile';
import type { Settlement } from '../entities/Settlement';
import type { Unit } from '../entities/Unit';
import { GoodType, UnitType, BuildingType } from '../entities/types';
import { BUILDING_COSTS, COLONY_CONSTANTS, UNIT_BUILD_COSTS } from '../constants';
import { createUnit } from '../entities/Unit';
import { calculatePopulation } from '../entities/Settlement';
import { ProductionSystem } from './ProductionSystem';
import { NamingSystem, type NamingStats } from './NamingSystem';
import type { GameEffect } from '../protocol';

export interface TurnEngineResult {
  readonly players: Player[];
  readonly namingStats: NamingStats;
  readonly effects: readonly GameEffect[];
}

/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
export class TurnEngine {
  private constructor() {
    // Static utility class
  }

  static runProduction(
    players: Player[],
    map: Tile[][],
    namingStats: NamingStats,
    generateId: (prefix: string) => string
  ): TurnEngineResult {
    let currentNamingStats = { ...namingStats };
    const effects: GameEffect[] = [];

    const updatedPlayers = players.map((player) => {
      const newPlayerUnits = [...player.units];
      const newSettlements = player.settlements.map((settlement) => {
        const newSettlement: Settlement = {
          ...settlement,
          buildings: [...settlement.buildings],
          productionQueue: [...settlement.productionQueue],
          inventory: new Map(settlement.inventory),
          units: settlement.units.map((u) => ({ ...u, cargo: new Map(u.cargo) })),
          goods: new Map(settlement.goods),
        };

        currentNamingStats = this.processSettlementTurn(
          newSettlement,
          player,
          newPlayerUnits,
          map,
          currentNamingStats,
          generateId,
          effects
        );

        return newSettlement;
      });

      return {
        ...player,
        units: newPlayerUnits,
        settlements: newSettlements,
      };
    });

    return { players: updatedPlayers, namingStats: currentNamingStats, effects };
  }

  private static processSettlementTurn(
    settlement: Settlement,
    player: Player,
    playerUnits: Unit[],
    map: Tile[][],
    namingStats: NamingStats,
    generateId: (prefix: string) => string,
    effects: GameEffect[]
  ): NamingStats {
    let currentNamingStats = namingStats;

    settlement.population = calculatePopulation(settlement);

    this.promoteExperts(settlement, effects);

    // 1 & 2. Process Production and Building bonuses
    const { netProduction, hammersProduced } = ProductionSystem.calculateSettlementProduction(
      settlement,
      map,
      true
    );

    netProduction.forEach((amount, good) => {
      settlement.inventory.set(good, Math.max(0, (settlement.inventory.get(good) ?? 0) + amount));
    });

    settlement.hammers += hammersProduced;

    // Printing press bonus
    if (settlement.buildings.includes(BuildingType.PRINTING_PRESS)) {
      const namingResult = NamingSystem.getNextName(player.nation, 'unit', currentNamingStats);
      currentNamingStats = namingResult.updatedStats;

      const newUnit = createUnit(
        generateId('unit'),
        settlement.ownerId,
        namingResult.name,
        UnitType.COLONIST,
        settlement.position.x,
        settlement.position.y,
        3
      );
      playerUnits.push(newUnit);
      effects.push({ type: 'notification', message: `An intellectual has joined the cause in ${settlement.name}!` });
    }

    // 3. Construction
    currentNamingStats = this.processConstruction(settlement, player, playerUnits, currentNamingStats, generateId, effects);

    // 4. Population Growth
    currentNamingStats = this.processPopulationGrowth(settlement, player, playerUnits, currentNamingStats, generateId, effects);

    // 5. Inventory Cap
    this.applyInventoryCap(settlement);

    return currentNamingStats;
  }

  private static promoteExperts(settlement: Settlement, effects: GameEffect[]): void {
    settlement.units.forEach((unit) => {
      unit.turnsInJob += 1;
      if (unit.turnsInJob >= COLONY_CONSTANTS.EXPERT_PROMOTION_TURNS && !unit.expertise) {
        if (typeof unit.occupation === 'string') {
          unit.expertise = unit.occupation;
          effects.push({ type: 'notification', message: `${unit.type} has become an expert ${unit.expertise}!` });
        }
      }
    });
  }

  private static processConstruction(
    settlement: Settlement,
    player: Player,
    playerUnits: Unit[],
    namingStats: NamingStats,
    generateId: (prefix: string) => string,
    effects: GameEffect[]
  ): NamingStats {
    let currentNamingStats = namingStats;

    if (settlement.productionQueue.length === 0) {
      return currentNamingStats;
    }

    const currentItem = settlement.productionQueue[0];
    if (!currentItem) {
      return currentNamingStats;
    }

    const isBuilding = Object.values(BuildingType).includes(currentItem as BuildingType);
    const isUnit = Object.values(UnitType).includes(currentItem as UnitType);
    const cost = this.getProductionCost(currentItem, isBuilding);

    if (!this.canAffordConstruction(settlement, cost)) {
      return currentNamingStats;
    }

    this.deductConstructionResources(settlement, cost);
    settlement.productionQueue.shift();

    if (isBuilding) {
      settlement.buildings.push(currentItem as BuildingType);
      effects.push({
        type: 'notification',
        message: `${settlement.name} completed ${currentItem as BuildingType}!`,
      });
    } else if (isUnit) {
      const namingResult = NamingSystem.getNextName(
        player.nation,
        (currentItem as UnitType) === UnitType.SHIP ? 'ship' : 'unit',
        currentNamingStats
      );
      currentNamingStats = namingResult.updatedStats;

      const newUnit = createUnit(
        generateId('unit'),
        settlement.ownerId,
        namingResult.name,
        currentItem as UnitType,
        settlement.position.x,
        settlement.position.y,
        3
      );
      settlement.units.push(newUnit);
      playerUnits.push(newUnit);
      effects.push({
        type: 'notification',
        message: `${settlement.name} completed ${currentItem as UnitType}!`,
      });
    }

    return currentNamingStats;
  }

  private static getProductionCost(
    item: BuildingType | UnitType,
    isBuilding: boolean
  ): { hammers: number; tools: number; muskets: number } {
    if (isBuilding) {
      const cost = (BUILDING_COSTS as Record<string, { hammers: number; tools?: number }>)[item as string] ?? { hammers: 40, tools: 0 };
      return { hammers: cost.hammers, tools: cost.tools ?? 0, muskets: 0 };
    }
    const cost = (UNIT_BUILD_COSTS as Record<string, { hammers: number; tools?: number; muskets?: number }>)[item as string] ?? { hammers: 40, tools: 0, muskets: 0 };
    return { hammers: cost.hammers, tools: cost.tools ?? 0, muskets: cost.muskets ?? 0 };
  }

  private static canAffordConstruction(
    settlement: Settlement,
    cost: { hammers: number; tools: number; muskets: number }
  ): boolean {
    const currentTools = settlement.inventory.get(GoodType.TOOLS) ?? 0;
    const currentMuskets = settlement.inventory.get(GoodType.MUSKETS) ?? 0;

    return (
      settlement.hammers >= cost.hammers &&
      currentTools >= cost.tools &&
      currentMuskets >= cost.muskets
    );
  }

  private static deductConstructionResources(
    settlement: Settlement,
    cost: { hammers: number; tools: number; muskets: number }
  ): void {
    settlement.hammers -= cost.hammers;

    if (cost.tools > 0) {
      const currentTools = settlement.inventory.get(GoodType.TOOLS) ?? 0;
      settlement.inventory.set(GoodType.TOOLS, currentTools - cost.tools);
    }

    if (cost.muskets > 0) {
      const currentMuskets = settlement.inventory.get(GoodType.MUSKETS) ?? 0;
      settlement.inventory.set(GoodType.MUSKETS, currentMuskets - cost.muskets);
    }
  }

  private static processPopulationGrowth(
    settlement: Settlement,
    player: Player,
    playerUnits: Unit[],
    namingStats: NamingStats,
    generateId: (prefix: string) => string,
    effects: GameEffect[]
  ): NamingStats {
    let currentNamingStats = namingStats;
    const currentFood = settlement.inventory.get(GoodType.FOOD) ?? 0;

    if (currentFood >= COLONY_CONSTANTS.FOOD_GROWTH_THRESHOLD) {
      settlement.inventory.set(GoodType.FOOD, currentFood - COLONY_CONSTANTS.FOOD_GROWTH_THRESHOLD);
      const namingResult = NamingSystem.getNextName(player.nation, 'unit', currentNamingStats);
      currentNamingStats = namingResult.updatedStats;

      const newColonist = createUnit(
        generateId('unit'),
        settlement.ownerId,
        namingResult.name,
        UnitType.COLONIST,
        settlement.position.x,
        settlement.position.y,
        3
      );
      playerUnits.push(newColonist);
      effects.push({ type: 'notification', message: `A new colonist has been born in ${settlement.name}!` });
    }

    return currentNamingStats;
  }

  private static applyInventoryCap(settlement: Settlement): void {
    const cap = ProductionSystem.getInventoryCapacity(settlement);
    settlement.inventory.forEach((amount, good) => {
      if (amount > cap) {
        settlement.inventory.set(good, cap);
      }
    });
  }
}
