import { Player } from '../entities/Player';
import { Tile } from '../entities/Tile';
import { Settlement } from '../entities/Settlement';
import { Unit } from '../entities/Unit';
import { TerrainType, GoodType, ResourceType, UnitType, JobType, BuildingType } from '../entities/types';
import { eventBus } from '../state/EventBus';
import { SaveSystem } from './SaveSystem';
import type { GameState } from '../state/gameStore';

export class TurnEngine {
  static autoSave(state: GameState): void {
    SaveSystem.save(state, 'autosave');
    eventBus.emit('notification', 'Auto-saved');
  }

  static runProduction(players: Player[]): Player[] {
    const updatedPlayers = players.map((player) => {
      const newPlayer = new Player(player.id, player.name, player.isHuman, player.gold, player.nation);
      // Deep clone units
      newPlayer.units = player.units.map((u) => {
        const nu = new Unit(u.id, u.ownerId, u.type, u.x, u.y, u.movesRemaining);
        nu.cargo = new Map(u.cargo);
        nu.maxMoves = u.maxMoves;
        return nu;
      });
      // Deep clone settlements and process production
      newPlayer.settlements = player.settlements.map((settlement) => {
        const newSettlement = new Settlement(
          settlement.id,
          settlement.ownerId,
          settlement.name,
          settlement.x,
          settlement.y,
          settlement.population,
          settlement.culture,
          settlement.organization
        );
        newSettlement.buildings = [...settlement.buildings];
        newSettlement.productionQueue = [...settlement.productionQueue];
        newSettlement.inventory = new Map(settlement.inventory);
        newSettlement.workforce = new Map(settlement.workforce);
        newSettlement.units = [...settlement.units];

        // 1. Process Workforce Production
        newSettlement.workforce.forEach((job) => {
          let good: GoodType | null = null;
          let amount = 3;

          switch (job) {
            case JobType.FARMER:
              good = GoodType.FOOD;
              break;
            case JobType.LUMBERJACK:
              good = GoodType.LUMBER;
              break;
            case JobType.MINER:
              good = GoodType.ORE;
              break;
            case JobType.TOBACCONIST:
              good = GoodType.TOBACCO;
              break;
            case JobType.WEAVER:
              good = GoodType.TRADE_GOODS;
              break;
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
          // The issue says +1 population growth/turn
          // For simplicity, we just add it to population
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
      });
      return newPlayer;
    });

    eventBus.emit('productionCompleted', updatedPlayers);
    return updatedPlayers;
  }

  static runAITurn(players: Player[], map: Tile[][]): Player[] {
    eventBus.emit('aiTurnStarted');

    // Deep clone players to work on
    const updatedPlayers = players.map((p) => {
      const np = new Player(p.id, p.name, p.isHuman, p.gold, p.nation);
      np.units = p.units.map((u) => {
        const nu = new Unit(u.id, u.ownerId, u.type, u.x, u.y, u.movesRemaining);
        nu.cargo = new Map(u.cargo);
        nu.maxMoves = u.maxMoves;
        return nu;
      });
      np.settlements = p.settlements.map((c) => {
        const nc = new Settlement(c.id, c.ownerId, c.name, c.x, c.y, c.population, c.culture, c.organization);
        nc.buildings = [...c.buildings];
        nc.productionQueue = [...c.productionQueue];
        nc.inventory = new Map(c.inventory);
        return nc;
      });
      return np;
    });

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

        // Check if colonist can found a settlement
        if (unit.type === UnitType.COLONIST) {
          const currentTile = map[unit.y][unit.x];
          if (currentTile.terrainType === TerrainType.PLAINS) {
            const hasAdjacentFriendlySettlement = player.settlements.some(
              (c) => Math.abs(c.x - unit.x) <= 1 && Math.abs(c.y - unit.y) <= 1,
            );
            if (!hasAdjacentFriendlySettlement) {
              // Found settlement
              const newSettlement = new Settlement(
                `settlement-ai-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                player.id,
                `${player.name}'s Settlement`,
                unit.x,
                unit.y,
                1,
                'EUROPEAN',
                'STATE'
              );
              player.settlements.push(newSettlement);
              // Remove unit from player
              player.units.splice(unitIndex, 1);
              eventBus.emit('settlementFounded', newSettlement);
              unitRemoved = true;
            }
          }
        }

        if (!unitRemoved) {
          // Move toward nearest uncolonized PLAINS or FOREST
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

        // Chebyshev distance for grid movement including diagonals
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
