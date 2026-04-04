import { GoodType, Tribe, Attitude } from './types';

export class NativeSettlement {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly tribe: Tribe,
    public readonly x: number,
    public readonly y: number,
    public population: number,
    public attitude: Attitude,
    public goods: Map<GoodType, number> = new Map()
  ) {}
}
