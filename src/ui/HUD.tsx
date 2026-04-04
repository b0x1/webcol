import React from 'react';
import { useGameStore } from '../game/state/gameStore';
import { UnitType } from '../game/entities/types';

export const HUD: React.FC = () => {
  const {
    players,
    currentPlayerId,
    turn,
    setEuropeScreenOpen,
    setSaveModalOpen,
    setReportsModalOpen,
    isMainMenuOpen
  } = useGameStore();

  if (isMainMenuOpen) return null;

  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const hasShip = currentPlayer?.units.some((u) => u.type === UnitType.SHIP);

  return (
    <div className="absolute top-0 left-0 right-0 h-10 bg-black/70 text-white flex items-center justify-between px-5 pointer-events-auto z-[1000] font-sans text-sm">
      <div className="flex items-center gap-5">
        <button
          className="hover:text-blue-400 transition-colors cursor-pointer font-bold uppercase tracking-tight"
          onClick={() => setSaveModalOpen(true)}
        >
          Load / Save Game
        </button>
      </div>

      <div className="flex items-center gap-8 font-bold uppercase tracking-widest text-xs">
        <button
          className={`transition-colors py-1 px-3 rounded border border-transparent ${hasShip ? 'cursor-pointer hover:text-blue-400 hover:border-blue-400/30 bg-blue-600/10' : 'cursor-not-allowed opacity-30'}`}
          onClick={() => setEuropeScreenOpen(true)}
          disabled={!hasShip}
        >
          Sail to Europe
        </button>
        <div className="text-slate-300">Turn: <span className="text-white">{turn}</span></div>
      </div>

      <div className="flex items-center gap-6">
        <button
          className="hover:text-blue-400 transition-colors cursor-pointer font-bold uppercase tracking-tight"
          onClick={() => setReportsModalOpen(true)}
        >
          Reports
        </button>
        <div className="min-w-[100px] font-mono font-bold bg-slate-900/50 px-3 py-1 rounded border border-white/10">
          GOLD: <span className="text-yellow-400">{currentPlayer?.gold ?? 0}</span>
        </div>
      </div>
    </div>
  );
};
