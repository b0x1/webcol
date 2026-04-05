import type { Player } from '../entities/Player';
import type { Tile } from '../entities/Tile';
import type { Settlement } from '../entities/Settlement';
import type { Unit } from '../entities/Unit';
import { TerrainType, GoodType, ResourceType, UnitType, JobType, BuildingType } from '../entities/types';
import { eventBus } from '../state/EventBus';
import { SaveSystem } from './SaveSystem';
import type { GameState } from '../state/gameStore';

export class TurnEngine {
  static autoSave(state: GameState): void {
    SaveSystem.save(state, 'autosave');
    eventBus.emit('notification', 'Auto-saved');
  }

  static runProduction(players: Player[], map: Tile[][]): Player[] {
    const updatedPlayers = players.map((player) => {
      const newPlayer: Player = {
        ...player,
        units: player.units.map(u => ({ ...u, cargo: new Map(u.cargo) })),
        settlements: player.settlements.map((settlement) => {
          const newSettlement: Settlement = {
            ...settlement,
            buildings: [...settlement.buildings],
            productionQueue: [...settlement.productionQueue],
            inventory: new Map(settlement.inventory),
            workforce: new Map(settlement.workforce),
            units: settlement.units.map(u => ({ ...u, cargo: new Map(u.cargo) })),
            goods: new Map(settlement.goods),
          };

          // 1. Process Workforce Production
          newSettlement.workforce.forEach((assignment) => {
            let good: GoodType | null = null;
            let amount = 3;

            if (Object.values(JobType).includes(assignment as JobType)) {
              // Building-based production
              switch (assignment) {
                case JobType.TOBACCONIST:
                  good = GoodType.TOBACCO;
                  break;
                case JobType.WEAVER:
                  good = GoodType.TRADE_GOODS;
                  break;
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
                    case TerrainType.PLAINS:
                    case TerrainType.PRAIRIE:
                      good = GoodType.FOOD;
                      break;
                    case TerrainType.FOREST:
                      good = GoodType.LUMBER;
                      break;
                    case TerrainType.HILLS:
                    case TerrainType.MOUNTAINS:
                      good = GoodType.ORE;
                      break;
                    case TerrainType.SWAMP:
                    case TerrainType.MARSH:
                      good = GoodType.TOBACCO;
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

          // 2. Add Building Bonuses
          if (newSettlement.buildings.includes(BuildingType.LUMBER_MILL)) {
            newSettlement.inventory.set(
              GoodType.LUMBER,
              (newSettlement.inventory.get(GoodType.LUMBER) || 0) + 2,
            );
          }
          if (newSettlement.buildings.includes(BuildingType.IRON_WORKS)) {
            newSettlement.inventory.set(GoodType.ORE, (newSettlement.inventory.get(GoodType.ORE) || 0) + 2);
          }

          // 3. Population Growth & Food Consumption
          if (newSettlement.buildings.includes(BuildingType.PRINTING_PRESS)) {
            newSettlement.population += 1;
          }

          const foodNeeded = newSettlement.population * 2;
          const currentFood = newSettlement.inventory.get(GoodType.FOOD) || 0;
          newSettlement.inventory.set(GoodType.FOOD, Math.max(0, currentFood - foodNeeded));

          // 4. Inventory Cap
          const cap = newSettlement.buildings.includes(BuildingType.WAREHOUSE) ? 400 : 200;
          newSettlement.inventory.forEach((amount, good) => {
            if (amount > cap) {
              newSettlement.inventory.set(good, cap);
            }
          });

          return newSettlement;
        })
      };
      return newPlayer;
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
