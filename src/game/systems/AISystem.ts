import type { Player } from '../entities/Player';
import type { Tile } from '../entities/Tile';
import type { Settlement } from '../entities/Settlement';
import type { Unit } from '../entities/Unit';
import { TerrainType, ResourceType, UnitType, Attitude } from '../entities/types';
import { eventBus } from '../state/EventBus';
import { NATION_BONUSES } from '../constants';

export class AISystem {
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

    for (const player of updatedPlayers) {
      if (player.isHuman) continue;

      let unitIndex = 0;
      while (unitIndex < player.units.length) {
        const unit = player.units[unitIndex];
        if (unit.movesRemaining <= 0) {
          unitIndex++;
          continue;
        }

        let unitRemoved = false;

        if (unit.type === UnitType.COLONIST || unit.type === UnitType.VILLAGER) {
          const currentTile = map[unit.y][unit.x];
          const nationData = NATION_BONUSES[player.nation];
          if (currentTile.terrainType === TerrainType.PLAINS || currentTile.terrainType === TerrainType.GRASSLAND || currentTile.terrainType === TerrainType.PRAIRIE) {
            const hasAdjacentSettlement = updatedPlayers.flatMap(p => p.settlements).some(
              (c) => Math.abs(c.x - unit.x) <= 1 && Math.abs(c.y - unit.y) <= 1,
            );
            if (!hasAdjacentSettlement) {
              const newSettlement: Settlement = {
                id: `settlement-ai-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                ownerId: player.id,
                name: `${player.name}'s Settlement`,
                x: unit.x,
                y: unit.y,
                population: 1,
                culture: nationData.culture,
                organization: nationData.organization,
                buildings: [],
                inventory: new Map(),
                productionQueue: [],
                workforce: new Map(),
                units: [],
                attitude: Attitude.NEUTRAL,
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
