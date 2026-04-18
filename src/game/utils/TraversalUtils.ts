import type { Player } from '../entities/Player';
import type { Settlement } from '../entities/Settlement';
import type { Unit } from '../entities/Unit';
import type { Position } from '../entities/Position';
import { isSame } from '../entities/Position';

/**
 * Pure utility functions for traversing game entities.
 */
/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
export class TraversalUtils {
  private constructor() {
    // Static utility class
  }

  /**
   * Returns all settlements across all players.
   */
  static getAllSettlements(players: Player[]): Settlement[] {
    return players.flatMap((p) => p.settlements);
  }

  /**
   * Returns all units across all players, including those in settlements.
   */
  static getAllUnits(players: Player[]): Unit[] {
    const units: Unit[] = [];
    for (const player of players) {
      units.push(...player.units);
      for (const settlement of player.settlements) {
        units.push(...settlement.units);
      }
    }
    return units;
  }

  /**
   * Finds a player by ID.
   */
  static findPlayerById(players: Player[], id: string | null): Player | undefined {
    if (!id) return undefined;
    return players.find((p) => p.id === id);
  }

  /**
   * Finds a settlement by ID.
   */
  static findSettlementById(players: Player[], id: string | null): Settlement | undefined {
    if (!id) return undefined;
    for (const player of players) {
      const s = player.settlements.find((settlement) => settlement.id === id);
      if (s) return s;
    }
    return undefined;
  }

  /**
   * Finds a unit by ID across all players and settlements.
   */
  static findUnitById(players: Player[], id: string | null): Unit | undefined {
    if (!id) return undefined;
    for (const player of players) {
      const u = player.units.find((unit) => unit.id === id);
      if (u) return u;
      for (const settlement of player.settlements) {
        const su = settlement.units.find((unit) => unit.id === id);
        if (su) return su;
      }
    }
    return undefined;
  }

  /**
   * Finds the player who owns the settlement with the given ID.
   */
  static findSettlementOwner(players: Player[], settlementId: string | null): Player | undefined {
    if (!settlementId) return undefined;
    return players.find((p) => p.settlements.some((s) => s.id === settlementId));
  }

  /**
   * Finds the player who owns the unit with the given ID.
   */
  static findUnitOwner(players: Player[], unitId: string | null): Player | undefined {
    if (!unitId) return undefined;
    return players.find((p) =>
      p.units.some((u) => u.id === unitId) ||
      p.settlements.some((s) => s.units.some((u) => u.id === unitId))
    );
  }

  /**
   * Finds a settlement at a specific position.
   */
  static findSettlementAt(players: Player[], pos: Position | null): Settlement | undefined {
    if (!pos) return undefined;
    for (const player of players) {
      const s = player.settlements.find((settlement) => isSame(settlement.position, pos));
      if (s) return s;
    }
    return undefined;
  }

  /**
   * Finds units at a specific position (only those in player.units, not inside settlements).
   */
  static findUnitsAt(players: Player[], pos: Position | null): Unit[] {
    if (!pos) return [];
    const units: Unit[] = [];
    for (const player of players) {
      for (const unit of player.units) {
        if (isSame(unit.position, pos)) {
          units.push(unit);
        }
      }
    }
    return units;
  }

  /**
   * Finds all units at a specific position, including those inside settlements.
   * Only returns "available units" (those not working in a building or field) for settlements.
   */
  static findAllUnitsAt(players: Player[], pos: Position | null): Unit[] {
    if (!pos) return [];
    const units: Unit[] = this.findUnitsAt(players, pos);
    for (const player of players) {
      for (const settlement of player.settlements) {
        for (const unit of settlement.units) {
          if (isSame(unit.position, pos)) {
            // Only include available units (RURE occupation)
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (typeof unit.occupation === 'object' && unit.occupation?.kind === 'RURE') {
              units.push(unit);
            }
          }
        }
      }
    }
    return units;
  }
}
