import { Unit } from '../entities/Unit';
import { NativeSettlement } from '../entities/NativeSettlement';
import { Tile } from '../entities/Tile';
import { Colony } from '../entities/Colony';
import { UnitType, TerrainType, BuildingType, Attitude, GoodType } from '../entities/types';
import { COMBAT_CONSTANTS } from '../constants';

export interface CombatResult {
  winner: 'attacker' | 'defender';
  attackerLost: boolean;
  defenderLost: boolean;
  message: string;
}

export class CombatSystem {
  static resolveCombat(
    attacker: Unit,
    defender: Unit | NativeSettlement | Colony,
    defenderTile: Tile,
    defenderColony?: Colony
  ): CombatResult {
    const attackerBaseStrength = COMBAT_CONSTANTS.UNIT_STRENGTHS[attacker.type as keyof typeof COMBAT_CONSTANTS.UNIT_STRENGTHS] || 1;
    let attackerModifier = 1.0;

    // Attacker is SOLDIER with muskets in cargo (≥10): ×1.3
    if (attacker.type === UnitType.SOLDIER && (attacker.cargo.get(GoodType.MUSKETS) || 0) >= 10) {
      attackerModifier *= 1.3;
    }

    const finalAttackerStrength = attackerBaseStrength * attackerModifier;

    let defenderBaseStrength = 1.0;
    let defenderModifier = 1.0;

    if (defender instanceof Unit) {
      defenderBaseStrength = COMBAT_CONSTANTS.UNIT_STRENGTHS[defender.type as keyof typeof COMBAT_CONSTANTS.UNIT_STRENGTHS] || 1;
    } else if (defender instanceof NativeSettlement) {
      defenderBaseStrength = COMBAT_CONSTANTS.BASE_NATIVE_STRENGTH;
      if (defender.attitude === Attitude.HOSTILE) {
        defenderModifier *= 1.2;
      }
    } else if (defender instanceof Colony) {
      defenderBaseStrength = COMBAT_CONSTANTS.BASE_COLONY_STRENGTH;
    }

    // Defender on HILLS: ×1.5
    if (defenderTile.terrainType === TerrainType.HILLS) {
      defenderModifier *= 1.5;
    }
    // Defender on MOUNTAINS: ×2.0
    if (defenderTile.terrainType === TerrainType.MOUNTAINS) {
      defenderModifier *= 2.0;
    }

    // Defender in Colony with Stockade: ×1.5
    if (defenderColony && defenderColony.buildings.includes(BuildingType.STOCKADE)) {
      defenderModifier *= 1.5;
    }

    const finalDefenderStrength = defenderBaseStrength * defenderModifier;

    const attackerRoll = Math.random() * finalAttackerStrength;
    const defenderRoll = Math.random() * finalDefenderStrength;

    const attackerWins = attackerRoll > defenderRoll;

    const result: CombatResult = {
      winner: attackerWins ? 'attacker' : 'defender',
      attackerLost: !attackerWins,
      defenderLost: attackerWins,
      message: '',
    };

    const attackerName = attacker.type;
    const defenderName = (defender instanceof Unit) ? defender.type : (defender instanceof NativeSettlement ? 'Settlement' : 'Colony');

    if (attackerWins) {
      result.message = `Your ${attackerName} defeated the enemy ${defenderName}!`;
    } else {
      result.message = `Your ${attackerName} was defeated by the enemy ${defenderName}.`;
    }

    return result;
  }
}
