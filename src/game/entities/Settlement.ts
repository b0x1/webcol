import type { BuildingType, GoodType, UnitType, JobType, Culture, Organization, Attitude } from './types';
import type { Unit } from './Unit';

export interface Settlement {
  id: string;
  ownerId: string;
  name: string;
  x: number;
  y: number;
  population: number;
  culture: Culture;
  organization: Organization;
  buildings: BuildingType[];
  inventory: Map<GoodType, number>;
  productionQueue: (UnitType | BuildingType)[];
  workforce: Map<string, JobType | string>; // JobType or TileID
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
    x,
    y,
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
