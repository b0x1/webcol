import type { BuildingType, GoodType, UnitType, Culture, Organization, Attitude } from './types';
import type { Unit } from './Unit';
import type { Position } from './Position';

/**
 * Represents a settlement in the game.
 *
 * Logic for units and population:
 * - When a unit is working in a building (JobType) or on a field (FIELD_WORK),
 *   it is considered "inside" the settlement and counts toward the settlement population.
 * - When a unit is in the "available units" section (RURE occupation),
 *   it is considered "outside" the settlement (in the field) and does not count
 *   toward the settlement population.
 * - Units inside the settlement are not visible in the tile selection panel;
 *   only "available units" on the settlement tile should be shown there.
 */
export interface Settlement {
  id: string;
  ownerId: string;
  name: string;
  position: Position;
  population: number;
  culture: Culture;
  organization: Organization;
  buildings: BuildingType[];
  inventory: Map<GoodType, number>;
  productionQueue: (UnitType | BuildingType)[];
  units: Unit[];
  attitude: Attitude;
  goods: Map<GoodType, number>;
  hammers: number;
}

export function createSettlement(
  id: string,
  ownerId: string,
  name: string,
  x: number,
  y: number,
  population: number,
  culture: Culture,
  organization: Organization,
): Settlement {
  return {
    id,
    ownerId,
    name,
    position: { x, y },
    population,
    culture,
    organization,
    buildings: [],
    inventory: new Map(),
    productionQueue: [],
    units: [],
    attitude: 'NEUTRAL',
    goods: new Map(),
    hammers: 0,
  };
}

/**
 * Calculates the current population of a settlement based on its workforce.
 * - Units working in buildings (JobType) or fields (FIELD_WORK) count toward population.
 * - Available units (RURE occupation) do not count.
 */
export function calculatePopulation(settlement: Settlement): number {
  return settlement.units.filter((u) => {
    const occ = u.occupation;
    if (!occ || typeof occ !== 'object') return false; // Not expected for settlement units
    return occ.kind !== 'RURE';
  }).length;
}
