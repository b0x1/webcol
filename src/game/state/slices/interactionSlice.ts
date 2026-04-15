/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import type { StateCreator } from 'zustand';
import type { GameState } from '../types';
import type { CombatResult } from '../../systems/CombatSystem';
import type { Position } from '../../entities/Position';
import { TraversalUtils } from '../../utils/TraversalUtils';
import type { GoodType } from '../../entities/types';
import { ForeignInteractionSystem } from '../../systems/ForeignInteractionSystem';
import { CombatSystem } from '../../systems/CombatSystem';
import { random } from '../utils';
import { selectCurrentPlayer, selectSettlementById, selectSettlementOwner, selectUnitOwner } from '../selectors';

export interface InteractionSlice {
  combatResult: CombatResult | null;
  tradeWithSettlement: (settlementId: string, unitId: string, goodOffered: GoodType) => void;
  learnFromSettlement: (settlementId: string, unitId: string) => void;
  attackSettlement: (settlementId: string, unitId: string) => void;
  resolveCombat: (attackerId: string, target: Position) => void;
  clearCombatResult: () => void;
}

export const createInteractionSlice: StateCreator<
  GameState,
  [['zustand/immer', never]],
  [],
  InteractionSlice
> = (set, get) => ({
  combatResult: null,

  tradeWithSettlement: (settlementId, unitId, goodOffered) => {
    set((state) => {
      const player = selectCurrentPlayer(state);
      const unit = player?.units.find((u) => u.id === unitId);
      if (!unit || !player) return;

      const foreignPlayer = selectSettlementOwner(state, settlementId);
      if (!foreignPlayer) return;

      const sIdx = foreignPlayer.settlements.findIndex(s => s.id === settlementId);
      const settlement = foreignPlayer.settlements[sIdx];
      if (!settlement) return;

      const { updatedSettlement, updatedUnit } = ForeignInteractionSystem.trade(
        settlement as unknown as import('../../entities/Settlement').Settlement,
        unit as unknown as import('../../entities/Unit').Unit,
        goodOffered,
        random
      );

      foreignPlayer.settlements[sIdx] = updatedSettlement as unknown as import('../../entities/Settlement').Settlement;
      const uIdx = player.units.findIndex(u => u.id === unitId);
      const playerUnit = player.units[uIdx];
      if (playerUnit) {
        player.units[uIdx] = updatedUnit as unknown as import('../../entities/Unit').Unit;
      }
    });
  },

  learnFromSettlement: (settlementId, unitId) => {
    set((state) => {
      const player = selectCurrentPlayer(state);
      const unit = player?.units.find((u) => u.id === unitId);
      if (!unit || !player) return;

      const foreignPlayer = selectSettlementOwner(state, settlementId);
      if (!foreignPlayer) return;

      const sIdx = foreignPlayer.settlements.findIndex(s => s.id === settlementId);
      const settlement = foreignPlayer.settlements[sIdx];
      if (!settlement) return;

      const { updatedSettlement, updatedUnit } = ForeignInteractionSystem.learn(
        settlement as unknown as import('../../entities/Settlement').Settlement,
        unit as unknown as import('../../entities/Unit').Unit
      );

      foreignPlayer.settlements[sIdx] = updatedSettlement as unknown as import('../../entities/Settlement').Settlement;
      const uIdx = player.units.findIndex(u => u.id === unitId);
      const playerUnit = player.units[uIdx];
      if (playerUnit) {
        player.units[uIdx] = updatedUnit as unknown as import('../../entities/Unit').Unit;
      }
    });
  },

  attackSettlement: (settlementId, unitId) => {
    const state = get();
    const settlement = selectSettlementById(state, settlementId);

    if (settlement) {
      state.resolveCombat(unitId, settlement.position);
    }
  },

  clearCombatResult: () => {
    set((state) => {
      state.combatResult = null;
    });
  },

  resolveCombat: (attackerId, target) => {
    set((state) => {
      const player = selectCurrentPlayer(state);
      if (!player) return;

      const attacker = player.units.find((u) => u.id === attackerId);
      if (!attacker) return;

      const otherPlayers = state.players.filter(p => p.id !== state.currentPlayerId);
      const defenderUnit = TraversalUtils.findUnitsAt(otherPlayers, target)[0];
      const defenderSettlement = TraversalUtils.findSettlementAt(state.players, target);

      let defender: any = defenderUnit;
      if (!defender && defenderSettlement && defenderSettlement.ownerId !== state.currentPlayerId) {
        defender = defenderSettlement;
      }

      if (!defender) return;

      const defenderTile = state.map[target.y]?.[target.x];
      if (!defenderTile) return;
      const result = CombatSystem.resolveCombat(attacker as any, defender, defenderTile, defenderSettlement, random);

      if (result.winner === 'attacker') {
        const defenderPlayer = selectUnitOwner(state, defender.id);
        if (defenderPlayer) {
          const uIdx = defenderPlayer.units.findIndex(u => u.id === (defender).id);
          if (uIdx !== -1) {
            defenderPlayer.units.splice(uIdx, 1);
          }
        }

        const capturedSettlementPlayer = selectSettlementOwner(state, defender.id);
        if (capturedSettlementPlayer && capturedSettlementPlayer.id !== state.currentPlayerId) {
          const sIdx = capturedSettlementPlayer.settlements.findIndex(s => s.id === defender.id);
           const s = capturedSettlementPlayer.settlements[sIdx];
           if (s) {
             if (s.units.length > 1) {
                s.units.pop();
                s.population = s.units.length;
             }

             attacker.position = { ...target };
             attacker.movesRemaining = 0;

             s.ownerId = player.id;
             s.units.forEach(u => u.ownerId = player.id);
             player.settlements.push(s as any);
             capturedSettlementPlayer.settlements.splice(sIdx, 1);
           }
         }
      } else {
        const aIdx = player.units.findIndex(u => u.id === attackerId);
        if (aIdx !== -1) {
          player.units.splice(aIdx, 1);
        }
        state.selectedUnitId = null;
      }

      state.combatResult = result;
    });
  },
});
