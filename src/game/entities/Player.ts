import type { Unit } from './Unit';
import type { Colony } from './Colony';
import type { Nation } from './types';

export class Player {
  public units: Unit[] = [];
  public colonies: Colony[] = [];

  constructor(
    public readonly id: string,
    public name: string,
    public readonly isHuman: boolean,
    public gold: number,
    public nation: Nation,
  ) {}
}
