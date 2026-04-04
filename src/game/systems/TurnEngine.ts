import { Player } from '../entities/Player';
import { Tile } from '../entities/Tile';
import { Colony } from '../entities/Colony';
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
      const newPlayer = new Player(player.id, player.name, player.isHuman, player.gold);
      // Deep clone units
      newPlayer.units = player.units.map((u) => {
        const nu = new Unit(u.id, u.ownerId, u.type, u.x, u.y, u.movesRemaining);
        nu.cargo = new Map(u.cargo);
        nu.maxMoves = u.maxMoves;
        return nu;
      });
      // Deep clone colonies and process production
      newPlayer.colonies = player.colonies.map((colony) => {
        const newColony = new Colony(
          colony.id,
          colony.ownerId,
          colony.name,
          colony.x,
          colony.y,
          colony.population,
        );
        newColony.buildings = [...colony.buildings];
        newColony.productionQueue = [...colony.productionQueue];
        newColony.inventory = new Map(colony.inventory);
        newColony.workforce = new Map(colony.workforce);
        newColony.units = [...colony.units];

        // 1. Process Workforce Production
        newColony.workforce.forEach((job) => {
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
            newColony.inventory.set(good, (newColony.inventory.get(good) || 0) + amount);
          }
        });

        // 2. Add Building Bonuses
        if (newColony.buildings.includes(BuildingType.LUMBER_MILL)) {
          newColony.inventory.set(
            GoodType.LUMBER,
            (newColony.inventory.get(GoodType.LUMBER) || 0) + 2,
          );
        }
        if (newColony.buildings.includes(BuildingType.IRON_WORKS)) {
          newColony.inventory.set(GoodType.ORE, (newColony.inventory.get(GoodType.ORE) || 0) + 2);
        }

        // 3. Population Growth & Food Consumption
        if (newColony.buildings.includes(BuildingType.PRINTING_PRESS)) {
          // The issue says +1 population growth/turn
          // For simplicity, we just add it to population
          newColony.population += 1;
        }

        const foodNeeded = newColony.population * 2;
        const currentFood = newColony.inventory.get(GoodType.FOOD) || 0;
        newColony.inventory.set(GoodType.FOOD, Math.max(0, currentFood - foodNeeded));

        // 4. Inventory Cap
        const cap = newColony.buildings.includes(BuildingType.WAREHOUSE) ? 400 : 200;
        newColony.inventory.forEach((amount, good) => {
          if (amount > cap) {
            newColony.inventory.set(good, cap);
          }
        });

        // (Keeping the original tile production logic if any - but wait, the instructions imply job-based now)
        // Original code had this:
        /*
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const tx = colony.x + dx;
            const ty = colony.y + dy;
            if (ty >= 0 && ty < map.length && tx >= 0 && tx < map[ty].length) {
              const tile = map[ty][tx];
              this.addTileProduction(newColony, tile);
            }
          }
        }
        */
        // Based on the prompt "WorkforcePanel: list of colonist units assigned to this colony. Each colonist has a dropdown to assign their job",
        // it seems I should replace the tile-based production with job-based production.

        return newColony;
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
      const np = new Player(p.id, p.name, p.isHuman, p.gold);
      np.units = p.units.map((u) => {
        const nu = new Unit(u.id, u.ownerId, u.type, u.x, u.y, u.movesRemaining);
        nu.cargo = new Map(u.cargo);
        nu.maxMoves = u.maxMoves;
        return nu;
      });
      np.colonies = p.colonies.map((c) => {
        const nc = new Colony(c.id, c.ownerId, c.name, c.x, c.y, c.population);
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

        // Check if colonist can found a colony
        if (unit.type === UnitType.COLONIST) {
          const currentTile = map[unit.y][unit.x];
          if (currentTile.terrainType === TerrainType.PLAINS) {
            const hasAdjacentFriendlyColony = player.colonies.some(
              (c) => Math.abs(c.x - unit.x) <= 1 && Math.abs(c.y - unit.y) <= 1,
            );
            if (!hasAdjacentFriendlyColony) {
              // Found colony
              const newColony = new Colony(
                `colony-ai-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                player.id,
                `${player.name}'s Colony`,
                unit.x,
                unit.y,
                1,
              );
              player.colonies.push(newColony);
              // Remove unit from player
              player.units.splice(unitIndex, 1);
              eventBus.emit('colonyFounded', newColony);
              unitRemoved = true;
            }
          }
        }

        if (!unitRemoved) {
          // Move toward nearest uncolonized PLAINS or FOREST
          const allColonies = updatedPlayers.flatMap((p) => p.colonies);
          const target = this.findNearestTarget(unit, map, allColonies);
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
    allColonies: Colony[],
  ): { x: number; y: number } | null {
    let nearest: { x: number; y: number } | null = null;
    let minDistance = Infinity;

    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        const tile = map[y][x];
        const isTargetType =
          tile.terrainType === TerrainType.PLAINS || tile.hasResource === ResourceType.FOREST;
        if (!isTargetType) continue;

        const isColonized = allColonies.some((c) => c.x === x && c.y === y);
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
