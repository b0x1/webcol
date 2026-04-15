import type { GoodType, UnitType, JobType, Occupation } from './types';
import type { Position } from './Position';

export interface Unit {
  id: string;
  ownerId: string;
  name: string;
  type: UnitType;
  position: Position;
  movesRemaining: number;
  maxMoves: number;
  isSkipping: boolean;
  cargo: Map<GoodType, number>;
  occupation: Occupation;
  expertise?: JobType;
  turnsInJob: number;
}

export function createUnit(
  id: string,
  ownerId: string,
  name: string,
  type: UnitType,
  x: number,
  y: number,
  movesRemaining: number,
): Unit {
  return {
    id,
    ownerId,
    name,
    type,
    position: { x, y },
    movesRemaining,
    maxMoves: movesRemaining,
    isSkipping: false,
    cargo: new Map(),
    occupation: { kind: 'RURE', state: 'MOVING' },
    turnsInJob: 0,
  };
}
