import React, { useEffect } from 'react';
import { useGameStore, selectCurrentPlayer } from '@client/game/state/gameStore';
import { useUIStore } from '@client/game/state/uiStore';
import { UnitType } from '@shared/game/entities/types';

export const HUD: React.FC = () => {
  const turn = useGameStore((state) => state.turn);
  const gold = useGameStore((state) => selectCurrentPlayer(state)?.gold ?? 0);
  const hasShip = useGameStore((state) =>
    selectCurrentPlayer(state)?.units.some((u) => u.type === UnitType.SHIP) ?? false
  );

  const isMainMenuOpen = useUIStore((state) => state.isMainMenuOpen);
  const isDebugMode = useUIStore((state) => state.isDebugMode);
  const setEuropeScreenOpen = useUIStore((state) => state.setEuropeScreenOpen);
  const setSaveModalOpen = useUIStore((state) => state.setSaveModalOpen);
  const setReportsModalOpen = useUIStore((state) => state.setReportsModalOpen);
  const toggleDebugMode = useUIStore((state) => state.toggleDebugMode);

  const isAnyModalOpen = useUIStore((state) =>
    state.isSettlementScreenOpen ||
    state.isEuropeScreenOpen ||
    state.isReportsModalOpen ||
    state.isSaveModalOpen ||
    state.isNativeTradeModalOpen ||
    state.isHowToPlayModalOpen ||
    state.isGameSetupModalOpen
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isMainMenuOpen || isAnyModalOpen) return;

      if (e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setSaveModalOpen(true);
      } else if (e.key.toLowerCase() === 'e' && hasShip) {
        e.preventDefault();
        setEuropeScreenOpen(true);
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        setReportsModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('keydown', handleKeyDown); };
  }, [isMainMenuOpen, isAnyModalOpen, hasShip, setSaveModalOpen, setEuropeScreenOpen, setReportsModalOpen]);

  if (isMainMenuOpen) return null;

  return (
    <div className="absolute top-0 left-0 right-0 h-10 bg-black/70 text-white flex items-center justify-between px-5 pointer-events-auto z-[1000] font-sans text-sm">
      <div className="flex items-center gap-5">
        <button
          className="hover:text-blue-400 transition-colors cursor-pointer font-bold uppercase tracking-tight focus-visible:ring-2 focus-visible:ring-blue-500 outline-none rounded px-1"
          onClick={() => { setSaveModalOpen(true); }}
          aria-label="Load or Save Game (L)"
        >
          <span className="text-yellow-400 font-black">L</span>OAD / SAVE GAME
        </button>
        <button
          className={`transition-colors cursor-pointer font-bold uppercase tracking-tight px-3 py-1 rounded border focus-visible:ring-2 focus-visible:ring-blue-500 outline-none ${
            isDebugMode ? 'bg-red-600 border-red-400 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'bg-slate-800/50 border-slate-600 text-slate-400 hover:text-white'
          }`}
          onClick={() => { toggleDebugMode(); }}
          aria-pressed={isDebugMode}
          aria-label={`Debug Mode: ${isDebugMode ? 'ON' : 'OFF'}`}
        >
          DEBUG: {isDebugMode ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="flex items-center gap-8 font-bold uppercase tracking-widest text-xs">
        <button
          className={`transition-colors py-1 px-3 rounded border focus-visible:ring-2 focus-visible:ring-blue-500 outline-none ${hasShip ? 'cursor-pointer hover:text-blue-400 hover:border-blue-400/30 bg-blue-600/10 border-transparent' : 'cursor-not-allowed opacity-30 border-transparent'}`}
          onClick={() => { setEuropeScreenOpen(true); }}
          disabled={!hasShip}
          aria-label="Sail to Europe (E)"
          title={!hasShip ? "You need a Ship to sail to Europe" : "Sail to Europe (E)"}
        >
          SAIL TO <span className="text-yellow-400 font-black">E</span>UROPE
        </button>
        <div className="text-slate-300">Turn: <span className="text-white">{turn}</span></div>
      </div>

      <div className="flex items-center gap-6">
        <button
          className="hover:text-blue-400 transition-colors cursor-pointer font-bold uppercase tracking-tight focus-visible:ring-2 focus-visible:ring-blue-500 outline-none rounded px-1"
          onClick={() => { setReportsModalOpen(true); }}
          aria-label="View Reports (R)"
        >
          <span className="text-yellow-400 font-black">R</span>EPORTS
        </button>
        <div className="min-w-[100px] font-mono font-bold bg-slate-900/50 px-3 py-1 rounded border border-white/10">
          GOLD: <span className="text-yellow-400">{gold}</span>
        </div>
      </div>
    </div>
  );
};
