import type { Player } from '@shared/game/entities/Player';
import type { Unit } from '@shared/game/entities/Unit';
import { GoodType, UnitType } from '@shared/game/entities/types';
import { VICTORY_CONSTANTS } from '@shared/game/constants';
import type { AuthoritativeGameState, GameOutcome } from '@shared/game/AuthoritativeGameState';

export function evaluateOutcome(state: AuthoritativeGameState): Exclude<GameOutcome, 'playing'> | null {
  const human = state.players.find((player) => player.isHuman);
  if (!human) {
    return null;
  }

  if (
    human.gold >= VICTORY_CONSTANTS.GOLD &&
    human.settlements.length >= VICTORY_CONSTANTS.COLONIES
  ) {
    return 'goal';
  }

  if (isColonyLost(human)) {
    return 'loss';
  }

  return null;
}

function isColonyLost(human: Player): boolean {
  if (human.settlements.length === 0) {
    return false;
  }

  const noFood = human.settlements.every(
    (settlement) => (settlement.inventory.get(GoodType.FOOD) ?? 0) === 0,
  );
  if (!noFood) {
    return false;
  }

  const workers = [
    ...human.units,
    ...human.settlements.flatMap((settlement) => settlement.units),
  ];
  return !workers.some((unit) => canWorkField(unit));
}

function canWorkField(unit: Unit): boolean {
  return unit.type === UnitType.COLONIST && unit.inEurope !== true;
}
