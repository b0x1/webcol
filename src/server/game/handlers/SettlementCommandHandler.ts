import { calculatePopulation } from '@shared/game/entities/Settlement';
import type { Player } from '@shared/game/entities/Player';
import type { Settlement } from '@shared/game/entities/Settlement';
import type { Unit } from '@shared/game/entities/Unit';
import {
  BuildingType,
  JobType,
  type Occupation,
} from '@shared/game/entities/types';
import { NamingSystem } from '@shared/game/systems/NamingSystem';
import { SettlementSystem } from '@shared/game/systems/SettlementSystem';
import { TraversalUtils } from '@shared/game/utils/TraversalUtils';
import type { AuthoritativeGameState } from '@shared/game/AuthoritativeGameState';
import type { GameEffect } from '@shared/game/protocol';

/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
export class SettlementCommandHandler {
  static foundSettlement(
    state: AuthoritativeGameState,
    unitId: string,
    random: () => number,
    generateId: (prefix: string) => string
  ): readonly GameEffect[] {
    const player = this.selectCurrentPlayer(state);
    if (!player) {
      return [];
    }

    const unitIndex = player.units.findIndex((candidate) => candidate.id === unitId);
    const unit = player.units[unitIndex];
    if (!unit) {
      return [];
    }

    const allSettlements = TraversalUtils.getAllSettlements(state.players);
    if (!SettlementSystem.canFoundSettlement(player, unit, state.map, allSettlements)) {
      return [];
    }

    const namingResult = NamingSystem.getNextName(player.nation, 'settlement', state.namingStats);
    state.namingStats = namingResult.updatedStats;

    const newSettlement = SettlementSystem.createSettlement(
      player,
      unit,
      namingResult.name,
      [BuildingType.TOWN_HALL, BuildingType.CARPENTERS_SHOP, BuildingType.BLACKSMITHS_HOUSE],
      state.map,
      random,
      generateId,
    );

    player.units.splice(unitIndex, 1);
    player.settlements.push(newSettlement);

    return [];
  }

  static buyBuilding(
    state: AuthoritativeGameState,
    settlementId: string,
    building: BuildingType
  ): readonly GameEffect[] {
    const player = this.selectCurrentPlayer(state);
    if (!player) {
      return [];
    }

    // Input validation: Ensure valid building type
    if (!Object.values(BuildingType).includes(building)) {
      return [];
    }

    const settlement = player.settlements.find((candidate) => candidate.id === settlementId);
    if (!settlement) {
      return [];
    }

    if (!settlement.buildings.includes(building) && !settlement.productionQueue.includes(building)) {
      settlement.productionQueue.push(building);
    }

    return [];
  }

  static assignJob(
    state: AuthoritativeGameState,
    settlementId: string,
    unitId: string,
    job: string | null
  ): readonly GameEffect[] {
    const settlement = this.selectSettlementById(state, settlementId);
    if (!settlement) {
      return [];
    }

    const owner = this.selectSettlementOwner(state, settlementId);
    if (owner?.id !== state.currentPlayerId) {
      return [];
    }

    if (job === null) {
      this.unassignUnitFromJob(settlement, owner, unitId);
      settlement.population = calculatePopulation(settlement);
      return [];
    }

    const validatedOccupation = this.validateOccupation(job);
    if (!validatedOccupation) {
      return [];
    }

    const unit = this.ensureUnitInSettlement(settlement, owner, unitId);
    if (!unit) {
      return [];
    }

    unit.occupation = validatedOccupation;
    settlement.population = calculatePopulation(settlement);
    return [];
  }

  private static unassignUnitFromJob(settlement: Settlement, owner: Player, unitId: string): void {
    const unitIndex = settlement.units.findIndex((candidate) => candidate.id === unitId);
    const unit = settlement.units[unitIndex];
    if (unit) {
      unit.occupation = { kind: 'RURE', state: 'MOVING' };
      if (!owner.units.some((candidate) => candidate.id === unitId)) {
        owner.units.push({ ...unit });
      }
      settlement.units.splice(unitIndex, 1);
    }
  }

  private static validateOccupation(job: string): Occupation | null {
    if (Object.values(JobType).includes(job as JobType)) {
      return job as JobType;
    }

    if (job.includes(',')) {
      const [rawX, rawY] = job.split(',').map(Number);
      if (
        rawX !== undefined &&
        rawY !== undefined &&
        Number.isInteger(rawX) &&
        Number.isInteger(rawY) &&
        rawX >= 0 &&
        rawY >= 0
      ) {
        return { kind: 'FIELD_WORK', tileX: rawX, tileY: rawY };
      }
    }

    return null;
  }

  private static ensureUnitInSettlement(
    settlement: Settlement,
    owner: Player,
    unitId: string
  ): Unit | undefined {
    let unit = settlement.units.find((candidate) => candidate.id === unitId);
    if (!unit) {
      const playerUnitIndex = owner.units.findIndex((candidate) => candidate.id === unitId);
      const playerUnit = owner.units[playerUnitIndex];
      if (playerUnit) {
        unit = { ...playerUnit };
        settlement.units.push(unit);
        owner.units.splice(playerUnitIndex, 1);
      }
    }
    return unit;
  }

  private static selectCurrentPlayer(state: AuthoritativeGameState): Player | undefined {
    return TraversalUtils.findPlayerById(state.players, state.currentPlayerId);
  }

  private static selectSettlementById(state: AuthoritativeGameState, settlementId: string): Settlement | undefined {
    return TraversalUtils.findSettlementById(state.players, settlementId);
  }

  private static selectSettlementOwner(state: AuthoritativeGameState, settlementId: string): Player | undefined {
    return TraversalUtils.findSettlementOwner(state.players, settlementId);
  }
}
