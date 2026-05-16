import { RECRUITMENT_COSTS } from '@shared/game/constants';
import { createUnit } from '@shared/game/entities/Unit';
import type { Player } from '@shared/game/entities/Player';
import {
  Attitude,
  GoodType,
  Nation,
  UnitType,
} from '@shared/game/entities/types';
import { NamingSystem } from '@shared/game/systems/NamingSystem';
import { EconomySystem } from '@shared/game/systems/EconomySystem';
import { ForeignInteractionSystem } from '@shared/game/systems/ForeignInteractionSystem';
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
    if (!player || !unit) {
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
    if (!player || !unit) {
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

    let goldCost = costs[unitType] ?? 0;
    if (unitType === UnitType.SOLDIER && player.nation === Nation.SPAIN) {
      goldCost = 600;
    }

    if (player.gold < goldCost) {
      return [];
    }

    let musketsToConsume = 0;
    if (unitType === UnitType.SOLDIER) {
      musketsToConsume = 50;
      const currentMuskets = selectedShip.cargo.get(GoodType.MUSKETS) ?? 0;
      if (currentMuskets < musketsToConsume) {
        return [];
      }
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

    player.units.push(createUnit(
      generateId('unit'),
      player.id,
      namingResult.name,
      unitType,
      selectedShip.position.x,
      selectedShip.position.y,
      1
    ));

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
    if (!settlement) {
      return [];
    }

    // Defensive guard: Ensure unit has the good before trading to avoid unhandled exception
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
    if (!settlement) {
      return [];
    }

    // Defensive guards: Ensure preconditions are met before learning to avoid unhandled exceptions
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

  private static selectCurrentPlayer(state: AuthoritativeGameState): Player | undefined {
    return TraversalUtils.findPlayerById(state.players, state.currentPlayerId);
  }

  private static selectSettlementOwner(state: AuthoritativeGameState, settlementId: string): Player | undefined {
    return TraversalUtils.findSettlementOwner(state.players, settlementId);
  }
}
