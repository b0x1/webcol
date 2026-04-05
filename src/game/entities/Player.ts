import type { Unit } from './Unit';
import type { Settlement } from './Settlement';
import type { Nation } from './types';

export class Player {
  public units: Unit[] = [];
  public settlements: Settlement[] = [];

  constructor(
    public readonly id: string,
    public name: string,
    public readonly isHuman: boolean,
    public gold: number,
    public nation: Nation,
  ) {}
}
