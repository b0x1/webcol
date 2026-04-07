import React, { useEffect } from 'react';
import { useGameStore } from '../../game/state/gameStore';
import { useUIStore } from '../../game/state/uiStore';
import { MarketPanel } from './MarketPanel';
import { RecruitPanel } from './RecruitPanel';
import { UnitType } from '../../game/entities/types';

export const EuropeScreen: React.FC = () => {
  const { players, currentPlayerId, selectedUnitId } = useGameStore();
  const { isEuropeScreenOpen, setEuropeScreenOpen } = useUIStore();
  const player = players.find((p) => p.id === currentPlayerId);
  const selectedUnit = player?.units.find((u) => u.id === selectedUnitId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEuropeScreenOpen && e.key === 'Escape') {
        e.preventDefault();
        setEuropeScreenOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEuropeScreenOpen, setEuropeScreenOpen]);

  if (!isEuropeScreenOpen) return null;

  const isShipSelected = selectedUnit?.type === UnitType.SHIP;

  return (
    <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-10 z-[1000] pointer-events-auto backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-slate-800 rounded-xl p-8 flex flex-col gap-6 max-h-[85vh] overflow-y-auto border border-slate-600 shadow-2xl text-white">
        <div className="flex justify-between items-center border-b border-slate-700 pb-4">
          <h2 className="text-4xl font-black uppercase tracking-tight text-blue-400">Europe Trade</h2>
          <button
            onClick={() => setEuropeScreenOpen(false)}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded transition-all transform active:scale-95 cursor-pointer shadow-lg"
          >
            Return to Settlement (Esc)
          </button>
        </div>

        <div className="flex-1">
          {!isShipSelected ? (
            <div className="text-center mt-12 p-10 bg-slate-900/50 rounded-xl border border-slate-700 border-dashed">
              <h3 className="text-2xl font-bold text-slate-400">Please select a <span className="text-blue-400">SHIP</span> to trade or recruit.</h3>
            </div>
          ) : (
            <div className="space-y-8">
              <MarketPanel />
              <RecruitPanel />
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-700 text-right">
          <strong className="text-xl font-black text-yellow-400 font-mono">Current Treasury: {player?.gold ?? 0} gold</strong>
        </div>
      </div>
    </div>
  );
};
