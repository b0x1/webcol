import { GoodType, UnitType, TerrainType, Attitude, BuildingType } from '../entities/types';
import { COMBAT_CONSTANTS } from '../constants';
import type { Unit } from '../entities/Unit';
import type { Settlement } from '../entities/Settlement';
import type { Tile } from '../entities/Tile';

export interface CombatResult {
  winner: 'attacker' | 'defender';
  attackerLost: boolean;
  defenderLost: boolean;
  message: string;
}

/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
export class CombatSystem {
  private constructor() {
    // Static utility class
  }

  static resolveCombat(
    attacker: Unit,
    defender: Unit | Settlement,
    defenderTile: Tile,
    defenderSettlement: Settlement | undefined,
    random: () => number
  ): CombatResult {
    const attackerBaseStrength = COMBAT_CONSTANTS.UNIT_STRENGTHS[attacker.type];
    let attackerModifier = 1.0;

    if (attacker.type === UnitType.SOLDIER && (attacker.cargo.get(GoodType.MUSKETS) ?? 0) >= COMBAT_CONSTANTS.MUSKET_CARGO) {
      attackerModifier *= COMBAT_CONSTANTS.MUSKET_ATTACK_MODIFIER;
    }

    const finalAttackerStrength = attackerBaseStrength * attackerModifier;

    let defenderBaseStrength = 1.0;
    let defenderModifier = 1.0;

    const isUnit = 'maxMoves' in defender;
    const isSettlement = 'buildings' in defender;

    if (isUnit) {
      defenderBaseStrength = COMBAT_CONSTANTS.UNIT_STRENGTHS[defender.type];
    } else if (isSettlement) {
      if (defender.ownerId.startsWith('npc-')) {
        defenderBaseStrength = COMBAT_CONSTANTS.BASE_NATIVE_STRENGTH;
        if (defender.attitude === Attitude.HOSTILE) {
          defenderModifier *= COMBAT_CONSTANTS.HOSTILE_DEFENDER_MODIFIER;
        }
      } else {
        defenderBaseStrength = COMBAT_CONSTANTS.BASE_COLONY_STRENGTH;
      }
    }

    if (defenderTile.terrainType === TerrainType.HILLS) {
      defenderModifier *= COMBAT_CONSTANTS.HILLS_DEFENDER_MODIFIER;
    }
    if (defenderTile.terrainType === TerrainType.MOUNTAINS) {
      defenderModifier *= COMBAT_CONSTANTS.MOUNTAINS_DEFENDER_MODIFIER;
    }

    if (defenderSettlement?.buildings.includes(BuildingType.STOCKADE)) {
      defenderModifier *= COMBAT_CONSTANTS.STOCKADE_DEFENDER_MODIFIER;
    }

    const finalDefenderStrength = defenderBaseStrength * defenderModifier;

    const attackerRoll = random() * finalAttackerStrength;
    const defenderRoll = random() * finalDefenderStrength;

    const attackerWins = attackerRoll > defenderRoll;

    const result: CombatResult = {
      winner: attackerWins ? 'attacker' : 'defender',
      attackerLost: !attackerWins,
      defenderLost: attackerWins,
      message: '',
    };

    const attackerName = attacker.type;
    const defenderName = isUnit ? defender.type : 'Settlement';

    if (attackerWins) {
      result.message = `Your ${attackerName} defeated the enemy ${defenderName}!`;
    } else {
      result.message = `Your ${attackerName} was defeated by the enemy ${defenderName}.`;
    }

    return result;
  }
}
