/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-non-null-assertion */
import type { StateCreator } from 'zustand';
import type { GameState } from '../types';
import type { CombatResult } from '../../systems/CombatSystem';
import type { Position } from '../../entities/Position';
import { isSame } from '../../entities/Position';
import type { GoodType } from '../../entities/types';
import { ForeignInteractionSystem } from '../../systems/ForeignInteractionSystem';
import { CombatSystem } from '../../systems/CombatSystem';

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
      const player = state.players.find((p) => p.id === state.currentPlayerId);
      const unit = player?.units.find((u) => u.id === unitId);
      if (!unit) return;

      const foreignPlayer = state.players.find(p => p.settlements.some(s => s.id === settlementId));
      if (!foreignPlayer) return;

      const sIdx = foreignPlayer.settlements.findIndex(s => s.id === settlementId);

      const { updatedSettlement, updatedUnit } = ForeignInteractionSystem.trade(
        foreignPlayer.settlements[sIdx],
        unit,
        goodOffered
      );

      foreignPlayer.settlements[sIdx] = updatedSettlement;
      const uIdx = player!.units.findIndex(u => u.id === unitId);
      player!.units[uIdx] = updatedUnit;
    });
  },

  learnFromSettlement: (settlementId, unitId) => {
    set((state) => {
      const player = state.players.find((p) => p.id === state.currentPlayerId);
      const unit = player?.units.find((u) => u.id === unitId);
      if (!unit) return;

      const foreignPlayer = state.players.find(p => p.settlements.some(s => s.id === settlementId));
      if (!foreignPlayer) return;

      const sIdx = foreignPlayer.settlements.findIndex(s => s.id === settlementId);

      const { updatedSettlement, updatedUnit } = ForeignInteractionSystem.learn(
        foreignPlayer.settlements[sIdx],
        unit
      );

      foreignPlayer.settlements[sIdx] = updatedSettlement;
      const uIdx = player!.units.findIndex(u => u.id === unitId);
      player!.units[uIdx] = updatedUnit;
    });
  },

  attackSettlement: (settlementId, unitId) => {
    const state = get();
    let settlement;
    for (const p of state.players) {
      settlement = p.settlements.find(s => s.id === settlementId);
      if (settlement) break;
    }

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
      const player = state.players.find((p) => p.id === state.currentPlayerId);
      if (!player) return;

      const attacker = player.units.find((u) => u.id === attackerId);
      if (!attacker) return;

      let defender: any;
      let defenderSettlement: any;

      for (const p of state.players) {
        if (p.id !== state.currentPlayerId) {
          const unit = p.units.find((u) => isSame(u.position, target));
          if (unit) {
            defender = unit;
            break;
          }
        }
      }

      for (const p of state.players) {
        const settlement = p.settlements.find((c) => isSame(c.position, target));
        if (settlement) {
          defenderSettlement = settlement;
          if (!defender && p.id !== state.currentPlayerId) {
            defender = settlement;
          }
          break;
        }
      }

      if (!defender) return;

      const defenderTile = state.map[target.y][target.x];
      const result = CombatSystem.resolveCombat(attacker, defender, defenderTile, defenderSettlement);

      if (result.winner === 'attacker') {
           const defenderPlayer = state.players.find(p => p.units.some(u => u.id === (defender).id));
         if (defenderPlayer) {
              const uIdx = defenderPlayer.units.findIndex(u => u.id === (defender).id);
            if (uIdx !== -1) {
              defenderPlayer.units.splice(uIdx, 1);
            }
         }

         const capturedSettlementPlayer = state.players.find(p => p.settlements.some(s => s.id === defender.id));
         if (capturedSettlementPlayer && capturedSettlementPlayer.id !== state.currentPlayerId) {
           const sIdx = capturedSettlementPlayer.settlements.findIndex(s => s.id === defender.id);
           const s = capturedSettlementPlayer.settlements[sIdx];
           if (s.population > 1) {
              s.population -= 1;
           }
         }

         if (capturedSettlementPlayer && capturedSettlementPlayer.id !== state.currentPlayerId) {
            const sIdx = capturedSettlementPlayer.settlements.findIndex(s => s.id === defender.id);
            const s = capturedSettlementPlayer.settlements[sIdx];

            attacker.position = { ...target };
            attacker.movesRemaining = 0;

            s.ownerId = player.id;
            s.units.forEach(u => u.ownerId = player.id);
            player.settlements.push(s);
            capturedSettlementPlayer.settlements.splice(sIdx, 1);
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
