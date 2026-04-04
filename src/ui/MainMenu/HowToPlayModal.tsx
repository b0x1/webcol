import React from 'react';
import { useGameStore } from '../../game/state/gameStore';

export const HowToPlayModal: React.FC = () => {
  const isHowToPlayModalOpen = useGameStore((state) => state.isHowToPlayModalOpen);
  const setHowToPlayModalOpen = useGameStore((state) => state.setHowToPlayModalOpen);

  if (!isHowToPlayModalOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[2000] pointer-events-auto backdrop-blur-sm">
      <div className="bg-slate-800 text-white p-8 rounded-xl w-[600px] max-h-[85vh] overflow-y-auto border border-slate-500 shadow-2xl">
        <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
          <h2 className="text-3xl font-black uppercase tracking-tighter italic text-blue-400">How to Play</h2>
          <button
            onClick={() => setHowToPlayModalOpen(false)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded transition-colors cursor-pointer text-sm"
          >
            Close
          </button>
        </div>

        <div className="space-y-8">
          <section>
            <h3 className="text-xl font-black uppercase tracking-widest text-slate-200 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              Objective
            </h3>
            <p className="text-slate-400 leading-relaxed font-medium">Explore the New World, establish thriving colonies, trade goods, and manage relations with native tribes.</p>
          </section>

          <section>
            <h3 className="text-xl font-black uppercase tracking-widest text-slate-200 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              Movement
            </h3>
            <p className="text-slate-400 leading-relaxed font-medium">Select a unit with <span className="text-white font-bold underline decoration-blue-500/50">Left Click</span>. <span className="text-white font-bold underline decoration-blue-500/50">Right Click</span> on a highlighted green tile to move.</p>
          </section>

          <section>
            <h3 className="text-xl font-black uppercase tracking-widest text-slate-200 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              Colonies
            </h3>
            <p className="text-slate-400 leading-relaxed font-medium">Found a colony by selecting a Colonist and clicking the <span className="text-white font-bold px-1.5 py-0.5 bg-green-900/50 rounded border border-green-700 text-xs">Found Colony</span> button in the Unit Panel. Within colonies, you can assign jobs, build structures, and manage inventory.</p>
          </section>

          <section>
            <h3 className="text-xl font-black uppercase tracking-widest text-slate-200 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              Trade
            </h3>
            <p className="text-slate-400 leading-relaxed font-medium">Use Ships to transport goods. You can trade with Europe or interact with Native Settlements for unique resources.</p>
          </section>

          <section>
            <h3 className="text-xl font-black uppercase tracking-widest text-slate-200 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              Combat
            </h3>
            <p className="text-slate-400 leading-relaxed font-medium">Move Soldier units onto enemy tiles to initiate combat. Combat outcomes depend on unit strength and various terrain/building modifiers.</p>
          </section>
        </div>
      </div>
    </div>
  );
};
