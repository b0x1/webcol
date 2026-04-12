import type { StateCreator } from 'zustand';
import type { GameState } from '../types';
import { UnitType, GoodType, Nation } from '../../entities/types';
import type { Position } from '../../entities/Position';
import { TraversalUtils } from '../../utils/TraversalUtils';
import { UnitSystem } from '../../systems/UnitSystem';
import { MovementSystem } from '../../systems/MovementSystem';
import { EconomySystem } from '../../systems/EconomySystem';
import { NamingSystem } from '../../systems/NamingSystem';
import { RECRUITMENT_COSTS } from '../../constants';
import { selectCurrentPlayer } from '../selectors';

export interface UnitSlice {
  europePrices: Record<GoodType, number>;
  moveUnit: (unitId: string, to: Position) => void;
  sellGood: (unitId: string, good: GoodType, amount: number) => void;
  buyGood: (unitId: string, good: GoodType, amount: number) => void;
  recruitUnit: (unitType: UnitType) => void;
}

export const createUnitSlice: StateCreator<
  GameState,
  [['zustand/immer', never]],
  [],
  UnitSlice
> = (set) => ({
  europePrices: {
    [GoodType.FOOD]: 1,
    [GoodType.LUMBER]: 2,
    [GoodType.ORE]: 3,
    [GoodType.TOBACCO]: 4,
    [GoodType.COTTON]: 3,
    [GoodType.FURS]: 5,
    [GoodType.SUGAR]: 3,
    [GoodType.RUM]: 8,
    [GoodType.CLOTH]: 8,
    [GoodType.COATS]: 10,
    [GoodType.CIGARS]: 10,
    [GoodType.TOOLS]: 5,
    [GoodType.TRADE_GOODS]: 6,
    [GoodType.MUSKETS]: 12,
  },

  moveUnit: (unitId, to) => {
    set((state) => {
      const player = selectCurrentPlayer(state);
      if (!player) return;

      const unitIndex = player.units.findIndex((u) => u.id === unitId);
      if (unitIndex === -1) return;
      const unit = player.units[unitIndex];

      if (UnitSystem.canMoveTo(unit, to.x, to.y, state.map)) {
        const targetTile = state.map[to.y][to.x];
        unit.position = { ...to };
        unit.movesRemaining -= MovementSystem.getMovementCost(unit, targetTile);

        // Check if entering own settlement
        const settlement = TraversalUtils.findSettlementAt([player], to);
        if (settlement) {
          if (!settlement.units.some(u => u.id === unit.id)) {
            settlement.units.push({ ...unit });
          }
          player.units.splice(unitIndex, 1);
          state.selectedUnitId = null;
        }
      }
    });
  },

  sellGood: (unitId, good, amount) => {
    set((state) => {
      const player = selectCurrentPlayer(state);
      const unit = player?.units.find((u) => u.id === unitId);
      if (!player || !unit) return;

      const { goldGained, newPrice, actualSellAmount } = EconomySystem.sellGood(
        player,
        unit,
        good,
        amount,
        state.europePrices[good]
      );

      if (actualSellAmount <= 0) return;

      unit.cargo.set(good, (unit.cargo.get(good) ?? 0) - actualSellAmount);
      player.gold += goldGained;
      state.europePrices[good] = newPrice;
    });
  },

  buyGood: (unitId, good, amount) => {
    set((state) => {
      const player = selectCurrentPlayer(state);
      const unit = player?.units.find((u) => u.id === unitId);
      if (!player || !unit) return;

      const { cost, canAfford } = EconomySystem.buyGood(
        player.gold,
        good,
        amount,
        state.europePrices[good]
      );

      if (!canAfford) return;

      unit.cargo.set(good, (unit.cargo.get(good) ?? 0) + amount);
      player.gold -= cost;
    });
  },

  recruitUnit: (unitType) => {
    set((state) => {
      const player = selectCurrentPlayer(state);
      if (!player) return;

      const selectedUnit = player.units.find((u) => u.id === state.selectedUnitId);
      if (selectedUnit?.type !== UnitType.SHIP) return;

      const costs: Record<string, number> = {
        ...RECRUITMENT_COSTS,
        [UnitType.SHIP]: 0,
      };

      let goldCost = costs[unitType] ?? 0;
      if (unitType === UnitType.SOLDIER && player.nation === Nation.SPAIN) {
        goldCost = 600;
      }
      if (player.gold < goldCost) return;

      let musketsToConsume = 0;
      if (unitType === UnitType.SOLDIER) {
        musketsToConsume = 50;
        const currentMuskets = selectedUnit.cargo.get(GoodType.MUSKETS) ?? 0;
        if (currentMuskets < musketsToConsume) return;
      }

      if (musketsToConsume > 0) {
        selectedUnit.cargo.set(GoodType.MUSKETS, (selectedUnit.cargo.get(GoodType.MUSKETS) ?? 0) - musketsToConsume);
      }

      player.gold -= goldCost;
      const { name: newUnitName, updatedStats } = NamingSystem.getNextName(player.nation, unitType === UnitType.SHIP ? 'ship' : 'unit', state.namingStats);
      state.namingStats = updatedStats;

      player.units.push({
        id: `unit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ownerId: player.id,
        name: newUnitName,
        type: unitType,
        position: { ...selectedUnit.position },
        movesRemaining: 1,
        maxMoves: 1,
        isSkipping: false,
        cargo: new Map(),
        turnsInJob: 0,
      });
    });
  },
});
