import type { GoodType, UnitType } from './types';

export class Unit {
  public cargo: Map<GoodType, number> = new Map();
  public maxMoves: number;

  public isSkipping: boolean = false;

  constructor(
    public readonly id: string,
    public readonly ownerId: string,
    public readonly type: UnitType,
    public x: number,
    public y: number,
    public movesRemaining: number,
  ) {
    this.maxMoves = movesRemaining;
  }
}
