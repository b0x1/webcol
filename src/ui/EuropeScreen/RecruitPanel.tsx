import React from 'react';
import { useGameStore } from '../../game/state/gameStore';
import { UnitType, GoodType } from '../../game/entities/types';

export const RecruitPanel: React.FC = () => {
  const { players, currentPlayerId, selectedUnitId, recruitUnit } = useGameStore();
  const player = players.find((p) => p.id === currentPlayerId);
  const selectedUnit = player?.units.find((u) => u.id === selectedUnitId);

  const unitsToRecruit = [
    { type: UnitType.COLONIST, cost: 500, requirement: 'None' },
    { type: UnitType.SOLDIER, cost: 800, requirement: '50 Muskets' },
    { type: UnitType.PIONEER, cost: 650, requirement: 'None' },
  ];

  if (selectedUnit?.type !== UnitType.SHIP) return null;

  return (
    <div className="bg-slate-900/40 p-6 rounded-xl border border-slate-700 shadow-inner">
      <h3 className="text-2xl font-black uppercase tracking-tight mb-6 text-blue-300">Recruit Units</h3>
      <div className="grid grid-cols-3 gap-6">
        {unitsToRecruit.map((u) => {
          const canAffordGold = (player?.gold || 0) >= u.cost;
          const hasMuskets =
            u.type !== UnitType.SOLDIER || (selectedUnit.cargo.get(GoodType.MUSKETS) || 0) >= 50;
          const canRecruit = canAffordGold && hasMuskets;

          return (
            <div
              key={u.type}
              className={`p-5 rounded-lg border flex flex-col items-center gap-3 transition-all ${
                canRecruit ? 'bg-slate-800 border-slate-600 hover:border-blue-500 shadow-lg' : 'bg-slate-900/50 border-slate-800 opacity-75'
              }`}
            >
              <h4 className="text-lg font-black uppercase tracking-widest text-slate-200">{u.type}</h4>
              <div className="space-y-1 text-center">
                <p className="text-yellow-400 font-bold font-mono">{u.cost}g</p>
                <p className="text-[10px] uppercase text-slate-500 font-bold tracking-tighter">Requirement: {u.requirement}</p>
              </div>
              <button
                disabled={!canRecruit}
                onClick={() => { recruitUnit(u.type); }}
                className={`w-full py-2 px-4 rounded font-bold uppercase text-xs tracking-widest transition-all cursor-pointer ${
                  canRecruit
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md active:scale-95'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                Recruit
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
