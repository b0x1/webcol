import { calculatePopulation } from '@shared/game/entities/Settlement';
import type { Player } from '@shared/game/entities/Player';
import type { Settlement } from '@shared/game/entities/Settlement';
import { isNeighbor, type Position } from '@shared/game/entities/Position';
import type { Unit } from '@shared/game/entities/Unit';
import { Culture } from '@shared/game/entities/types';
import { CombatSystem } from '@shared/game/systems/CombatSystem';
import { MovementSystem } from '@shared/game/systems/MovementSystem';
import { UnitSystem } from '@shared/game/systems/UnitSystem';
import { TraversalUtils } from '@shared/game/utils/TraversalUtils';
import type { AuthoritativeGameState } from '@shared/game/AuthoritativeGameState';
import type { GameEffect } from '@shared/game/protocol';

/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
export class CombatCommandHandler {
  static attackSettlement(state: AuthoritativeGameState, settlementId: string, unitId: string, random: () => number): readonly GameEffect[] {
    const settlement = this.selectSettlementById(state, settlementId);
    if (!settlement) {
      return [];
    }

    return this.resolveCombat(state, unitId, settlement.position, random);
  }

  static resolveCombat(
    state: AuthoritativeGameState,
    attackerId: string,
    target: Position,
    random: () => number
  ): readonly GameEffect[] {
    const player = this.selectCurrentPlayer(state);
    if (!player) {
      return [];
    }

    const attacker = player.units.find((candidate) => candidate.id === attackerId);
    if (!attacker || attacker.inEurope === true) {
      return [];
    }

    if (!isNeighbor(attacker.position, target) || attacker.movesRemaining <= 0) {
      return [];
    }

    const otherPlayers = state.players.filter((candidate) => candidate.id !== state.currentPlayerId);
    const defenderUnit = TraversalUtils.findUnitsAt(otherPlayers, target)[0];
    const defenderSettlement = TraversalUtils.findSettlementAt(state.players, target);
    const garrison = defenderSettlement && defenderSettlement.ownerId !== state.currentPlayerId
      ? defenderSettlement.units.find((unit) => unit.ownerId === defenderSettlement.ownerId)
      : undefined;
    const defender = defenderUnit ?? garrison ?? (
      defenderSettlement && defenderSettlement.ownerId !== state.currentPlayerId
        ? defenderSettlement
        : undefined
    );

    if (!defender) {
      return [];
    }

    attacker.movesRemaining = 0;

    const defenderTile = state.map[target.y]?.[target.x];
    if (!defenderTile) {
      return [];
    }

    const result = CombatSystem.resolveCombat(
      attacker,
      defender,
      defenderTile,
      defenderSettlement,
      random
    );

    if (result.winner === 'attacker') {
      this.handleCombatVictory(state, player, attacker, defender, target);
    } else {
      this.handleCombatDefeat(player, attackerId);
    }

    return [{ type: 'combatResolved', result }];
  }

  private static handleCombatVictory(
    state: AuthoritativeGameState,
    attackerPlayer: Player,
    attackerUnit: Unit,
    defender: Unit | Settlement,
    target: Position
  ): void {
    const defenderPlayer = this.selectUnitOwner(state, defender.id);
    if (defenderPlayer) {
      const unitIndex = defenderPlayer.units.findIndex((candidate) => candidate.id === defender.id);
      if (unitIndex !== -1) {
        defenderPlayer.units.splice(unitIndex, 1);
      }
    }

    if ('maxMoves' in defender) {
      this.removeDefenderUnit(state, defender.id);
      return;
    }

    const capturedSettlementPlayer = this.selectSettlementOwner(state, defender.id);
    if (!capturedSettlementPlayer || capturedSettlementPlayer.id === state.currentPlayerId) {
      return;
    }

    const settlementIndex = capturedSettlementPlayer.settlements.findIndex(
      (candidate) => candidate.id === defender.id
    );
    const settlement = capturedSettlementPlayer.settlements[settlementIndex];
    if (!settlement) {
      return;
    }

    settlement.ownerId = attackerPlayer.id;
    settlement.units.forEach((unit) => {
      unit.ownerId = attackerPlayer.id;
    });
    attackerPlayer.settlements.push(settlement);
    capturedSettlementPlayer.settlements.splice(settlementIndex, 1);

    const tile = state.map[target.y]?.[target.x];
    if (tile && Number.isFinite(MovementSystem.getMovementCost(attackerUnit, tile))) {
      attackerUnit.position = { ...target };
      UnitSystem.enterSettlement(attackerUnit, attackerPlayer, settlement);
    }
  }

  private static removeDefenderUnit(state: AuthoritativeGameState, unitId: string): void {
    state.players.forEach((player) => {
      const unitIndex = player.units.findIndex((candidate) => candidate.id === unitId);
      if (unitIndex !== -1) {
        player.units.splice(unitIndex, 1);
      }

      player.settlements.forEach((settlement) => {
        const garrisonIndex = settlement.units.findIndex((candidate) => candidate.id === unitId);
        if (garrisonIndex === -1) {
          return;
        }

        settlement.units.splice(garrisonIndex, 1);
        if (settlement.culture !== Culture.NATIVE) {
          settlement.population = calculatePopulation(settlement);
        }
      });
    });
  }

  private static handleCombatDefeat(player: Player, attackerId: string): void {
    const attackerIndex = player.units.findIndex((candidate) => candidate.id === attackerId);
    if (attackerIndex !== -1) {
      player.units.splice(attackerIndex, 1);
    }
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

  private static selectUnitOwner(state: AuthoritativeGameState, unitId: string): Player | undefined {
    return TraversalUtils.findUnitOwner(state.players, unitId);
  }
}
