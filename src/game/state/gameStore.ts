/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */
import { enableMapSet } from 'immer';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Tile } from '../entities/Tile';
import type { Settlement } from '../entities/Settlement';
import type { Unit } from '../entities/Unit';
import type { GoodType } from '../entities/types';
import type { GameState } from './types';
export type { GameState } from './types';
import { ProductionSystem } from '../systems/ProductionSystem';
import { MovementSystem } from '../systems/MovementSystem';
import { createSelectionSlice } from './slices/selectionSlice';
import { createTurnSlice } from './slices/turnSlice';
import { createUnitSlice } from './slices/unitSlice';
import { createSettlementSlice } from './slices/settlementSlice';
import { createInteractionSlice } from './slices/interactionSlice';
import { createGameSlice } from './slices/gameSlice';

enableMapSet();

export const useGameStore = create<GameState>()(
  immer((...a) => ({
    ...createGameSlice(...a),
    ...createSelectionSlice(...a),
    ...createTurnSlice(...a),
    ...createUnitSlice(...a),
    ...createSettlementSlice(...a),
    ...createInteractionSlice(...a),
  })),
);

if (typeof window !== 'undefined') {
  (window as any).useGameStore = useGameStore;
}

export const getReachableTilesForUnit = (
  unit: Unit,
  map: Tile[][]
): ({ x: number; y: number; cost: number })[] => MovementSystem.getReachableTiles(unit, map);

export const getSettlementProduction = (
  settlement: Settlement,
  map: Tile[][]
): { netProduction: Map<GoodType, number>; hammersProduced: number } =>
  ProductionSystem.calculateSettlementProduction(settlement, map);
