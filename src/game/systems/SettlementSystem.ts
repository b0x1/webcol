import type { Player } from '../entities/Player';
import type { Unit } from '../entities/Unit';
import type { Settlement } from '../entities/Settlement';
import type { Tile } from '../entities/Tile';
import { BuildingType, GoodType, JobType, Nation, UnitType, TerrainType } from '../entities/types';
import { NATION_BONUSES } from '../constants';

export class SettlementSystem {
  static createSettlement(
    player: Player,
    unit: Unit,
    name: string,
    buildings: BuildingType[]
  ): Settlement {
    const nationData = NATION_BONUSES[player.nation];

    return {
      id: `settlement-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ownerId: player.id,
      name,
      x: unit.x,
      y: unit.y,
      population: 1,
      culture: nationData.culture,
      organization: nationData.organization,
      buildings: [...buildings],
      inventory: new Map(),
      productionQueue: [],
      workforce: new Map([[unit.id, JobType.FARMER]]),
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
    const tile = map[unit.y]?.[unit.x];
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
      const dx = Math.abs(s.x - unit.x);
      const dy = Math.abs(s.y - unit.y);
      return Math.max(dx, dy) < 2;
    });

    if (tooClose) return false;

    return true;
  }
}
