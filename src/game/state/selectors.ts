import { ProductionSystem } from '../systems/ProductionSystem';
import type { GameState } from './types';
import type { Player } from '../entities/Player';
import type { Settlement } from '../entities/Settlement';
import type { Unit } from '../entities/Unit';
import type { Position } from '../entities/Position';
import { isSame } from '../entities/Position';
import { TraversalUtils } from '../utils/TraversalUtils';

/**
 * Returns the currently active player based on currentPlayerId.
 */
export const selectCurrentPlayer = (state: GameState): Player | undefined =>
  TraversalUtils.findPlayerById(state.players, state.currentPlayerId);

/**
 * Finds a settlement by its ID across all players.
 */
export const selectSettlementById = (state: GameState, id: string | null): Settlement | undefined =>
  TraversalUtils.findSettlementById(state.players, id);

/**
 * Finds the player who owns the settlement with the given ID.
 */
export const selectSettlementOwner = (state: GameState, settlementId: string | null): Player | undefined =>
  TraversalUtils.findSettlementOwner(state.players, settlementId);

/**
 * Finds a unit by its ID across all players (both in player.units and settlement.units).
 */
export const selectUnitById = (state: GameState, id: string | null): Unit | undefined =>
  TraversalUtils.findUnitById(state.players, id);

/**
 * Finds the player who owns the unit with the given ID.
 */
export const selectUnitOwner = (state: GameState, unitId: string | null): Player | undefined =>
  TraversalUtils.findUnitOwner(state.players, unitId);

/**
 * Returns the currently selected unit.
 */
export const selectSelectedUnit = (state: GameState): Unit | undefined =>
  selectUnitById(state, state.selectedUnitId);

/**
 * Returns the currently selected settlement.
 */
export const selectSelectedSettlement = (state: GameState): Settlement | undefined =>
  selectSettlementById(state, state.selectedSettlementId);

/**
 * Finds a settlement at a specific map position.
 */
export const selectSettlementAtPosition = (state: GameState, pos: Position | null): Settlement | undefined =>
  TraversalUtils.findSettlementAt(state.players, pos);

/**
 * Returns all units at a specific map position across all players.
 */
export const selectUnitsAtPosition = (state: GameState, pos: Position): Unit[] =>
  TraversalUtils.findAllUnitsAt(state.players, pos);

/**
 * Returns all units physically present at a settlement, combining those inside
 * (settlement.units) and those available on the same tile (owner.units).
 */
export const selectUnitsAtSettlement = (state: GameState, settlementId: string): Unit[] => {
  const settlement = selectSettlementById(state, settlementId);
  const owner = selectSettlementOwner(state, settlementId);
  if (!settlement || !owner) return [];

  const units = [...settlement.units];
  for (const unit of owner.units) {
    if (isSame(unit.position, settlement.position)) {
      if (!units.some(u => u.id === unit.id)) {
        units.push(unit);
      }
    }
  }
  return units;
};

/**
 * Calculates production for a given settlement ID.
 */
export const selectSettlementProduction = (state: GameState, settlementId: string): ReturnType<typeof ProductionSystem.calculateSettlementProduction> | undefined => {
  const settlement = selectSettlementById(state, settlementId);
  if (!settlement) return undefined;
  return ProductionSystem.calculateSettlementProduction(settlement, state.map);
};

/**
 * Returns units owned by the current player that have moves remaining and are not skipping.
 */
export const selectAvailableUnits = (state: GameState): Unit[] => {
  const player = selectCurrentPlayer(state);
  if (!player) return [];
  return player.units.filter((u) => u.movesRemaining > 0 && !u.isSkipping);
};

/**
 * Count of units the current player can still move this turn (moves left, not skipping).
 * Prefer this in React selectors so getSnapshot returns a stable primitive.
 */
export const selectAvailableUnitsCount = (state: GameState): number =>
  selectAvailableUnits(state).length;

/**
 * Checks if a settlement is owned by the current player.
 */
export const selectIsSettlementOwnedByCurrentPlayer = (state: GameState, settlementId: string | null): boolean => {
  if (!settlementId) return false;
  const player = selectCurrentPlayer(state);
  return player?.settlements.some((s) => s.id === settlementId) ?? false;
};
