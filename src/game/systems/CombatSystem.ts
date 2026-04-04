import { Unit } from '../entities/Unit';
import { NativeSettlement } from '../entities/NativeSettlement';

export class CombatSystem {
  static resolveCombat(attacker: Unit, defender: NativeSettlement | Unit): boolean {
    // Basic combat resolution: 50/50 chance
    return Math.random() > 0.5;
  }
}
