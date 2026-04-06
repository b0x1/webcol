import type { Player } from '../entities/Player';
import type { Unit } from '../entities/Unit';
import type { Settlement } from '../entities/Settlement';
import { BuildingType, GoodType, JobType, Nation, UnitType, TurnPhase } from '../entities/types';
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

  static canFoundSettlement(player: Player, unit: Unit): boolean {
    const nationData = NATION_BONUSES[player.nation];
    if (nationData.culture === 'EUROPEAN' && unit.type !== UnitType.COLONIST) return false;
    if (nationData.culture === 'NATIVE' && unit.type !== UnitType.VILLAGER) return false;
    return true;
  }
}
