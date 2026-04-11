import type { BuildingType, GoodType, UnitType, Culture, Organization, Attitude } from './types';
import type { Unit } from './Unit';
import type { Position } from './Position';

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
  workforce: Map<string, string>; // JobType or TileID (both are strings)
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
    workforce: new Map(),
    units: [],
    attitude: 'NEUTRAL',
    goods: new Map(),
    hammers: 0,
  };
}
