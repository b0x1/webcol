import type { BuildingType, GoodType, UnitType, JobType, Culture, Organization, Attitude } from './types';
import type { Unit } from './Unit';

export class Settlement {
  public buildings: BuildingType[] = [];
  public inventory: Map<GoodType, number> = new Map();
  public productionQueue: (UnitType | BuildingType)[] = [];
  public workforce: Map<string, JobType> = new Map();
  public units: Unit[] = [];

  // For non-player settlements (initially)
  public attitude: Attitude = 'NEUTRAL';
  public goods: Map<GoodType, number> = new Map();

  constructor(
    public readonly id: string,
    public readonly ownerId: string,
    public name: string,
    public readonly x: number,
    public readonly y: number,
    public population: number,
    public readonly culture: Culture,
    public readonly organization: Organization,
  ) {}
}
