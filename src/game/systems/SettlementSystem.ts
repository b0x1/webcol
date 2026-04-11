import type { Player } from '../entities/Player';
import type { Unit } from '../entities/Unit';
import type { Settlement } from '../entities/Settlement';
import type { Tile } from '../entities/Tile';
import { BuildingType, UnitType, TerrainType } from '../entities/types';
import { NATION_BONUSES } from '../constants';
import { distance, getNeighbors, toKey } from '../entities/Position';

/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
export class SettlementSystem {
  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  private constructor() {}

  static createSettlement(
    player: Player,
    unit: Unit,
    name: string,
    buildings: BuildingType[],
    map: Tile[][]
  ): Settlement {
    const nationData = NATION_BONUSES[player.nation];
    const neighbors = getNeighbors(unit.position, map[0].length, map.length);
    const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];

    return {
      id: `settlement-${String(Date.now())}-${String(Math.floor(Math.random() * 1000))}`,
      ownerId: player.id,
      name,
      position: { ...unit.position },
      population: 1,
      culture: nationData.culture,
      organization: nationData.organization,
      buildings: [...buildings],
      inventory: new Map(),
      productionQueue: [],
      workforce: new Map([[unit.id, toKey(randomNeighbor)]]),
      units: [{ ...unit }],
      attitude: 'NEUTRAL',
      goods: new Map(),
      hammers: 0,
    };
  }

  static canFoundSettlement(
    player: Player,
    unit: Unit,
    map: Tile[][],
    allSettlements: Settlement[]
  ): boolean {
    const nationData = NATION_BONUSES[player.nation];
    if (nationData.culture === 'EUROPEAN' && unit.type !== UnitType.COLONIST) return false;
    if (nationData.culture === 'NATIVE' && unit.type !== UnitType.VILLAGER) return false;

    // Check terrain
    const tile = map[unit.position.y]?.[unit.position.x];
    if (!tile) return false;
    if (
      tile.terrainType === TerrainType.OCEAN ||
      tile.terrainType === TerrainType.COAST ||
      tile.terrainType === TerrainType.MOUNTAINS
    ) {
      return false;
    }

    // Check distance to other settlements (Chebyshev distance >= 2)
    const tooClose = allSettlements.some((s) => {
      return distance(s.position, unit.position) < 2;
    });

    if (tooClose) return false;

    return true;
  }
}
