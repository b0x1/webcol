import type { GoodType, UnitType } from './types';

export interface Unit {
  id: string;
  ownerId: string;
  type: UnitType;
  x: number;
  y: number;
  movesRemaining: number;
  maxMoves: number;
  isSkipping: boolean;
  cargo: Map<GoodType, number>;
}

export function createUnit(
  id: string,
  ownerId: string,
  type: UnitType,
  x: number,
  y: number,
  movesRemaining: number,
): Unit {
  return {
    id,
    ownerId,
    type,
    x,
    y,
    movesRemaining,
    maxMoves: movesRemaining,
    isSkipping: false,
    cargo: new Map(),
  };
}
