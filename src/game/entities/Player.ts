import type { Unit } from './Unit';
import type { Settlement } from './Settlement';
import type { Nation } from './types';

export interface Player {
  id: string;
  name: string;
  isHuman: boolean;
  gold: number;
  nation: Nation;
  units: Unit[];
  settlements: Settlement[];
}

export function createPlayer(
  id: string,
  name: string,
  isHuman: boolean,
  gold: number,
  nation: Nation,
): Player {
  return {
    id,
    name,
    isHuman,
    gold,
    nation,
    units: [],
    settlements: [],
  };
}
