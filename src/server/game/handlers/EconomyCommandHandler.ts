import { RECRUITMENT_COSTS, RECRUITMENT_CONSTANTS, UNIT_CONSTANTS } from '@shared/game/constants';
import { createUnit } from '@shared/game/entities/Unit';
import type { Player } from '@shared/game/entities/Player';
import {
  Attitude,
  GoodType,
  Nation,
  UnitType,
} from '@shared/game/entities/types';
import { canTradeWithEurope, cargoHold, cargoUsed, isBeside, settlementBeside } from '@shared/game/rules/TradeRules';
import { NamingSystem } from '@shared/game/systems/NamingSystem';
import { EconomySystem } from '@shared/game/systems/EconomySystem';
import { ForeignInteractionSystem } from '@shared/game/systems/ForeignInteractionSystem';
import { ProductionSystem } from '@shared/game/systems/ProductionSystem';
import { TraversalUtils } from '@shared/game/utils/TraversalUtils';
import type { AuthoritativeGameState } from '@shared/game/AuthoritativeGameState';
import type { GameEffect } from '@shared/game/protocol';

/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
export class EconomyCommandHandler {
  static sellGood(
    state: AuthoritativeGameState,
    unitId: string,
    good: GoodType,
    amount: number
  ): readonly GameEffect[] {
    // Input validation: Ensure valid good type and positive amount
    if (!Object.values(GoodType).includes(good) || amount <= 0 || !Number.isInteger(amount)) {
      return [];
    }

    const player = this.selectCurrentPlayer(state);
    const unit = player?.units.find((candidate) => candidate.id === unitId);
    if (!player || !unit || !canTradeWithEurope(unit, player, state.map)) {
      return [];
    }

    const price = state.europePrices[good];
    const { goldGained, newPrice, actualSellAmount } = EconomySystem.sellGood(
      player,
      unit,
      good,
      amount,
      price
    );

    if (actualSellAmount <= 0) {
      return [];
    }

    unit.cargo.set(good, (unit.cargo.get(good) ?? 0) - actualSellAmount);
    player.gold += goldGained;
    state.europePrices[good] = newPrice;
    state.soldOnTurn[good] = state.turn;
    return [];
  }

  static buyGood(
    state: AuthoritativeGameState,
    unitId: string,
    good: GoodType,
    amount: number
  ): readonly GameEffect[] {
    // Input validation: Ensure valid good type and positive amount
    if (!Object.values(GoodType).includes(good) || amount <= 0 || !Number.isInteger(amount)) {
      return [];
    }

    const player = this.selectCurrentPlayer(state);
    const unit = player?.units.find((candidate) => candidate.id === unitId);
    if (!player || !unit || !canTradeWithEurope(unit, player, state.map)) {
      return [];
    }

    if (cargoUsed(unit) + amount > cargoHold(unit)) {
      return [];
    }

    const { cost, canAfford } = EconomySystem.buyGood(
      player.gold,
      good,
      amount,
      state.europePrices[good]
    );

    if (!canAfford) {
      return [];
    }

    unit.cargo.set(good, (unit.cargo.get(good) ?? 0) + amount);
    player.gold -= cost;
    return [];
  }

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

  static tradeWithSettlement(
    state: AuthoritativeGameState,
    settlementId: string,
    unitId: string,
    goodOffered: GoodType,
    random: () => number
  ): readonly GameEffect[] {
    // Input validation: Ensure valid good type
    if (!Object.values(GoodType).includes(goodOffered)) {
      return [];
    }

    const player = this.selectCurrentPlayer(state);
    const unit = player?.units.find((candidate) => candidate.id === unitId);
    if (!player || !unit) {
      return [];
    }

    const foreignPlayer = this.selectSettlementOwner(state, settlementId);
    if (!foreignPlayer) {
      return [];
    }

    const settlementIndex = foreignPlayer.settlements.findIndex((candidate) => candidate.id === settlementId);
    const settlement = foreignPlayer.settlements[settlementIndex];
    if (!settlement || settlement.ownerId === player.id || !isBeside(unit.position, settlement.position)) {
      return [];
    }

    if ((unit.cargo.get(goodOffered) ?? 0) <= 0) {
      return [];
    }

    const { updatedSettlement, updatedUnit } = ForeignInteractionSystem.trade(
      settlement,
      unit,
      goodOffered,
      random
    );

    foreignPlayer.settlements[settlementIndex] = updatedSettlement;
    const unitIndex = player.units.findIndex((candidate) => candidate.id === unitId);
    if (player.units[unitIndex]) {
      player.units[unitIndex] = updatedUnit;
    }

    return [];
  }

  static learnFromSettlement(
    state: AuthoritativeGameState,
    settlementId: string,
    unitId: string
  ): readonly GameEffect[] {
    const player = this.selectCurrentPlayer(state);
    const unit = player?.units.find((candidate) => candidate.id === unitId);
    if (!player || !unit) {
      return [];
    }

    const foreignPlayer = this.selectSettlementOwner(state, settlementId);
    if (!foreignPlayer) {
      return [];
    }

    const settlementIndex = foreignPlayer.settlements.findIndex((candidate) => candidate.id === settlementId);
    const settlement = foreignPlayer.settlements[settlementIndex];
    if (!settlement || settlement.ownerId === player.id || !isBeside(unit.position, settlement.position)) {
      return [];
    }

    if (settlement.attitude !== Attitude.FRIENDLY || unit.type !== UnitType.COLONIST) {
      return [];
    }

    const { updatedSettlement, updatedUnit } = ForeignInteractionSystem.learn(settlement, unit);
    foreignPlayer.settlements[settlementIndex] = updatedSettlement;

    const unitIndex = player.units.findIndex((candidate) => candidate.id === unitId);
    if (player.units[unitIndex]) {
      player.units[unitIndex] = updatedUnit;
    }

    return [];
  }

  static transferGood(
    state: AuthoritativeGameState,
    unitId: string,
    settlementId: string,
    good: GoodType,
    amount: number,
    direction: 'load' | 'unload',
  ): readonly GameEffect[] {
    if (!Object.values(GoodType).includes(good) || amount <= 0 || !Number.isInteger(amount)) {
      return [];
    }

    const player = this.selectCurrentPlayer(state);
    const unit = player?.units.find((candidate) => candidate.id === unitId);
    const settlement = player?.settlements.find((candidate) => candidate.id === settlementId);
    if (!player || !unit || !settlement || unit.inEurope === true || !isBeside(unit.position, settlement.position)) {
      return [];
    }

    if (direction === 'load') {
      const stock = settlement.inventory.get(good) ?? 0;
      const room = cargoHold(unit) - cargoUsed(unit);
      const moved = Math.min(amount, stock, room);
      if (moved <= 0) {
        return [];
      }
      settlement.inventory.set(good, stock - moved);
      unit.cargo.set(good, (unit.cargo.get(good) ?? 0) + moved);
      return [];
    }

    const carried = unit.cargo.get(good) ?? 0;
    const stored = settlement.inventory.get(good) ?? 0;
    const room = ProductionSystem.getInventoryCapacity(settlement) - stored;
    const moved = Math.min(amount, carried, Math.max(0, room));
    if (moved <= 0) {
      return [];
    }

    const remaining = carried - moved;
    if (remaining === 0) {
      unit.cargo.delete(good);
    } else {
      unit.cargo.set(good, remaining);
    }
    settlement.inventory.set(good, stored + moved);
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

  private static selectSettlementOwner(state: AuthoritativeGameState, settlementId: string): Player | undefined {
    return TraversalUtils.findSettlementOwner(state.players, settlementId);
  }
}
