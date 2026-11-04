import { RECRUITMENT_COSTS, RECRUITMENT_CONSTANTS, UNIT_CONSTANTS } from '@shared/game/constants';
import { createUnit } from '@shared/game/entities/Unit';
import type { Player } from '@shared/game/entities/Player';
import { GoodType, Nation, UnitType } from '@shared/game/entities/types';
import { canTradeWithEurope, settlementBeside } from '@shared/game/rules/TradeRules';
import { NamingSystem } from '@shared/game/systems/NamingSystem';
import { TraversalUtils } from '@shared/game/utils/TraversalUtils';
import type { AuthoritativeGameState } from '@shared/game/AuthoritativeGameState';
import type { GameEffect } from '@shared/game/protocol';

/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
export class RecruitCommandHandler {
  static recruitUnit(
    state: AuthoritativeGameState,
    unitType: UnitType,
    fromUnitId: string | null,
    generateId: (prefix: string) => string
  ): readonly GameEffect[] {
    const player = this.selectCurrentPlayer(state);
    if (!player) {
      return [];
    }

    // Input validation: Ensure valid recruitable unit type
    const costs: Record<string, number> = {
      ...RECRUITMENT_COSTS,
      [UnitType.SHIP]: 0,
    };
    if (!Object.keys(costs).includes(unitType)) {
      return [];
    }

    const selectedShip = player.units.find(
      (unit) => unit.id === fromUnitId && unit.type === UnitType.SHIP
    );

    if (!selectedShip) {
      return [];
    }

    if (!canTradeWithEurope(selectedShip, player, state.map)) {
      return [];
    }

    let goldCost = costs[unitType] ?? 0;
    if (unitType === UnitType.SOLDIER && player.nation === Nation.SPAIN) {
      goldCost = RECRUITMENT_CONSTANTS.SPAIN_SOLDIER_COST;
    }

    if (player.gold < goldCost) {
      return [];
    }

    let musketsToConsume = 0;
    if (unitType === UnitType.SOLDIER) {
      musketsToConsume = RECRUITMENT_CONSTANTS.SOLDIER_MUSKETS;
      const currentMuskets = selectedShip.cargo.get(GoodType.MUSKETS) ?? 0;
      if (currentMuskets < musketsToConsume) {
        return [];
      }
    }

    const recruitedMoves = this.movesForRecruit(unitType);
    const recruited = createUnit(
      generateId('unit'),
      player.id,
      'Recruit',
      unitType,
      selectedShip.position.x,
      selectedShip.position.y,
      recruitedMoves,
    );

    if (unitType !== UnitType.SHIP && selectedShip.inEurope !== true) {
      const harbor = settlementBeside(selectedShip, player.settlements);
      if (!harbor) {
        return [];
      }
      recruited.position = { ...harbor.position };
      recruited.inEurope = false;
    } else if (unitType !== UnitType.SHIP) {
      recruited.inEurope = true;
    }

    if (musketsToConsume > 0) {
      selectedShip.cargo.set(
        GoodType.MUSKETS,
        (selectedShip.cargo.get(GoodType.MUSKETS) ?? 0) - musketsToConsume
      );
    }

    player.gold -= goldCost;
    const namingResult = NamingSystem.getNextName(
      player.nation,
      unitType === UnitType.SHIP ? 'ship' : 'unit',
      state.namingStats
    );
    state.namingStats = namingResult.updatedStats;
    recruited.name = namingResult.name;

    player.units.push(recruited);

    return [];
  }

  private static movesForRecruit(unitType: UnitType): number {
    if (unitType === UnitType.SHIP) {
      return UNIT_CONSTANTS.SHIP_MOVES;
    }
    if (unitType === UnitType.PIONEER) {
      return UNIT_CONSTANTS.PIONEER_MOVES;
    }
    return UNIT_CONSTANTS.DEFAULT_MOVES;
  }

  private static selectCurrentPlayer(state: AuthoritativeGameState): Player | undefined {
    return TraversalUtils.findPlayerById(state.players, state.currentPlayerId);
  }
}
