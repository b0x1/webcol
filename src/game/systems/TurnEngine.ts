import type { Player } from '../entities/Player';
import type { Tile } from '../entities/Tile';
import type { Settlement } from '../entities/Settlement';
import type { Unit } from '../entities/Unit';
import { TerrainType, GoodType, ResourceType, UnitType, JobType, BuildingType } from '../entities/types';
import { eventBus } from '../state/EventBus';
import { SaveSystem } from './SaveSystem';
import type { GameState } from '../state/gameStore';
import { BUILDING_COSTS, COLONY_CONSTANTS, UNIT_BUILD_COSTS } from '../constants';
import { createUnit } from '../entities/Unit';

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
              // Building-based production & Refinement
              switch (assignment) {
                case JobType.CARPENTER: {
                  if (newSettlement.buildings.includes(BuildingType.CARPENTERS_SHOP) ||
                      newSettlement.buildings.includes(BuildingType.LUMBER_MILL)) {
                    const lumber = newSettlement.inventory.get(GoodType.LUMBER) || 0;
                    const possible = Math.min(amount, lumber);
                    newSettlement.inventory.set(GoodType.LUMBER, lumber - possible);
                    newSettlement.hammers += possible;
                  }
                  break;
                }
                case JobType.BLACKSMITH: {
                  if (newSettlement.buildings.includes(BuildingType.BLACKSMITHS_HOUSE) ||
                      newSettlement.buildings.includes(BuildingType.BLACKSMITHS_SHOP) ||
                      newSettlement.buildings.includes(BuildingType.IRON_WORKS)) {
                    const ore = newSettlement.inventory.get(GoodType.ORE) || 0;
                    const possible = Math.min(amount, ore);
                    newSettlement.inventory.set(GoodType.ORE, ore - possible);
                    newSettlement.inventory.set(GoodType.TOOLS, (newSettlement.inventory.get(GoodType.TOOLS) || 0) + possible);
                  }
                  break;
                }
                case JobType.DISTILLER: {
                  if (newSettlement.buildings.includes(BuildingType.DISTILLERY)) {
                    const sugar = newSettlement.inventory.get(GoodType.SUGAR) || 0;
                    const possible = Math.min(amount, sugar);
                    newSettlement.inventory.set(GoodType.SUGAR, sugar - possible);
                    newSettlement.inventory.set(GoodType.RUM, (newSettlement.inventory.get(GoodType.RUM) || 0) + possible);
                  }
                  break;
                }
                case JobType.TAILOR: {
                  if (newSettlement.buildings.includes(BuildingType.TAILORS_SHOP)) {
                    const furs = newSettlement.inventory.get(GoodType.FURS) || 0;
                    const possible = Math.min(amount, furs);
                    newSettlement.inventory.set(GoodType.FURS, furs - possible);
                    newSettlement.inventory.set(GoodType.COATS, (newSettlement.inventory.get(GoodType.COATS) || 0) + possible);
                  }
                  break;
                }
                case JobType.TOBACCONIST: {
                  if (newSettlement.buildings.includes(BuildingType.TOBACCONISTS_SHOP)) {
                    const tobacco = newSettlement.inventory.get(GoodType.TOBACCO) || 0;
                    const possible = Math.min(amount, tobacco);
                    newSettlement.inventory.set(GoodType.TOBACCO, tobacco - possible);
                    newSettlement.inventory.set(GoodType.CIGARS, (newSettlement.inventory.get(GoodType.CIGARS) || 0) + possible);
                  }
                  break;
                }
                case JobType.ARMORER: {
                  if (newSettlement.buildings.includes(BuildingType.ARMORY)) {
                    const tools = newSettlement.inventory.get(GoodType.TOOLS) || 0;
                    const possible = Math.min(amount, tools);
                    newSettlement.inventory.set(GoodType.TOOLS, tools - possible);
                    newSettlement.inventory.set(GoodType.MUSKETS, (newSettlement.inventory.get(GoodType.MUSKETS) || 0) + possible);
                  }
                  break;
                }
                case JobType.WEAVER: {
                  if (newSettlement.buildings.includes(BuildingType.WEAVERS_SHOP)) {
                    const cotton = newSettlement.inventory.get(GoodType.COTTON) || 0;
                    const possible = Math.min(amount, cotton);
                    newSettlement.inventory.set(GoodType.COTTON, cotton - possible);
                    newSettlement.inventory.set(GoodType.CLOTH, (newSettlement.inventory.get(GoodType.CLOTH) || 0) + possible);
                  }
                  break;
                }
                case JobType.FARMER:
                  good = GoodType.FOOD;
                  break;
                case JobType.LUMBERJACK:
                  good = GoodType.LUMBER;
                  break;
                case JobType.MINER:
                  good = GoodType.ORE;
                  break;
              }
            } else {
              // Tile-based production
              const parts = (assignment as string).split('-');
              if (parts.length === 2) {
                const tx = parseInt(parts[0]);
                const ty = parseInt(parts[1]);
                const tile = map[ty]?.[tx];
                if (tile) {
                  switch (tile.terrainType) {
                    case TerrainType.GRASSLAND:
                    case TerrainType.PRAIRIE:
                      good = GoodType.FOOD;
                      break;
                    case TerrainType.PLAINS:
                      good = GoodType.COTTON;
                      break;
                    case TerrainType.FOREST:
                      good = GoodType.LUMBER;
                      break;
                    case TerrainType.HILLS:
                    case TerrainType.MOUNTAINS:
                      good = GoodType.ORE;
                      break;
                    case TerrainType.SWAMP:
                      good = GoodType.SUGAR;
                      break;
                    case TerrainType.MARSH:
                      good = GoodType.TOBACCO;
                      break;
                    case TerrainType.TUNDRA:
                      good = GoodType.FURS;
                      break;
                  }
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

          // 2. Construction
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

          // 3. Population Growth & Food Consumption
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

          // 4. Inventory Cap
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

  static runAITurn(players: Player[], map: Tile[][]): Player[] {
    eventBus.emit('aiTurnStarted');

    const updatedPlayers = players.map((p) => ({
      ...p,
      units: p.units.map(u => ({ ...u, cargo: new Map(u.cargo) })),
      settlements: p.settlements.map(c => ({
        ...c,
        buildings: [...c.buildings],
        productionQueue: [...c.productionQueue],
        inventory: new Map(c.inventory),
        workforce: new Map(c.workforce),
        units: c.units.map(u => ({ ...u, cargo: new Map(u.cargo) })),
        goods: new Map(c.goods),
      }))
    }));

    for (let i = 0; i < updatedPlayers.length; i++) {
      const player = updatedPlayers[i];
      if (player.isHuman) continue;

      let unitIndex = 0;
      while (unitIndex < player.units.length) {
        const unit = player.units[unitIndex];
        if (unit.movesRemaining <= 0) {
          unitIndex++;
          continue;
        }

        let unitRemoved = false;

        if (unit.type === UnitType.COLONIST) {
          const currentTile = map[unit.y][unit.x];
          if (currentTile.terrainType === TerrainType.PLAINS) {
            const hasAdjacentFriendlySettlement = player.settlements.some(
              (c) => Math.abs(c.x - unit.x) <= 1 && Math.abs(c.y - unit.y) <= 1,
            );
            if (!hasAdjacentFriendlySettlement) {
              const newSettlement: Settlement = {
                id: `settlement-ai-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                ownerId: player.id,
                name: `${player.name}'s Settlement`,
                x: unit.x,
                y: unit.y,
                population: 1,
                culture: 'EUROPEAN',
                organization: 'STATE',
                buildings: [],
                inventory: new Map(),
                productionQueue: [],
                workforce: new Map(),
                units: [],
                attitude: 'NEUTRAL',
                goods: new Map(),
                hammers: 0,
              };
              player.settlements.push(newSettlement);
              player.units.splice(unitIndex, 1);
              eventBus.emit('settlementFounded', newSettlement);
              unitRemoved = true;
            }
          }
        }

        if (!unitRemoved) {
          const allSettlements = updatedPlayers.flatMap((p) => p.settlements);
          const target = this.findNearestTarget(unit, map, allSettlements);
          if (target) {
            const dx = Math.sign(target.x - unit.x);
            const dy = Math.sign(target.y - unit.y);

            const nx = unit.x + dx;
            const ny = unit.y + dy;

            if (ny >= 0 && ny < map.length && nx >= 0 && nx < map[ny].length) {
              const targetTile = map[ny][nx];
              if (unit.movesRemaining >= targetTile.movementCost) {
                unit.x = nx;
                unit.y = ny;
                unit.movesRemaining -= targetTile.movementCost;
                eventBus.emit('unitMoved', unit);
              }
            }
          }
          unitIndex++;
        }
      }
    }

    eventBus.emit('aiTurnCompleted', updatedPlayers);
    return updatedPlayers;
  }

  private static findNearestTarget(
    unit: Unit,
    map: Tile[][],
    allSettlements: Settlement[],
  ): { x: number; y: number } | null {
    let nearest: { x: number; y: number } | null = null;
    let minDistance = Infinity;

    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        const tile = map[y][x];
        const isTargetType =
          tile.terrainType === TerrainType.PLAINS || tile.hasResource === ResourceType.FOREST;
        if (!isTargetType) continue;

        const isColonized = allSettlements.some((c) => c.x === x && c.y === y);
        if (isColonized) continue;

        const dist = Math.max(Math.abs(x - unit.x), Math.abs(y - unit.y));
        if (dist > 0 && dist < minDistance) {
          minDistance = dist;
          nearest = { x, y };
        }
      }
    }
    return nearest;
  }
}
