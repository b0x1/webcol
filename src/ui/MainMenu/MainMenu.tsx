import React from 'react';
import { useGameStore } from '../../game/state/gameStore';

export const MainMenu: React.FC = () => {
  const isMainMenuOpen = useGameStore((state) => state.isMainMenuOpen);
  const setGameSetupModalOpen = useGameStore((state) => state.setGameSetupModalOpen);
  const setHowToPlayModalOpen = useGameStore((state) => state.setHowToPlayModalOpen);
  const setSaveModalOpen = useGameStore((state) => state.setSaveModalOpen);

  if (!isMainMenuOpen) return null;

  const buttonClass = "w-64 py-4 px-6 mb-4 bg-slate-800 hover:bg-slate-700 text-white font-black text-xl uppercase tracking-widest border-2 border-slate-100/20 rounded shadow-xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer pointer-events-auto backdrop-blur-sm";

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-[1000] bg-black/20">
      <div className="flex flex-col items-center mt-24 animate-in fade-in zoom-in duration-500">
        <h1 className="text-8xl font-black text-white mb-16 drop-shadow-2xl uppercase tracking-tighter italic">
          WEB<span className="text-blue-500">COL</span>
        </h1>
        <button className={buttonClass} onClick={() => setGameSetupModalOpen(true)}>
          New Game
        </button>
        <button className={buttonClass} onClick={() => setSaveModalOpen(true)}>
          Load Game
        </button>
        <button className={buttonClass} onClick={() => setHowToPlayModalOpen(true)}>
          How to Play
        </button>
      </div>
    </div>
  );
};
