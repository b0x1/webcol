
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
import React, { useState } from 'react';
import { useGameStore } from '../../game/state/gameStore';
import { useUIStore } from '../../game/state/uiStore';
import { Nation } from '../../game/entities/types';
import { NATION_BONUSES } from '../../game/constants';
import { Flag } from '../Flag';

export const GameSetupModal: React.FC = () => {
  const { isGameSetupModalOpen, setGameSetupModalOpen } = useUIStore();
  const initGame = useGameStore((state) => state.initGame);

  const [playerName, setPlayerName] = useState('Colonist');
  const [nation, setNation] = useState<Nation>(Nation.ENGLAND);
  const [mapSize, setMapSize] = useState<'Small' | 'Medium' | 'Large'>('Medium');
  const [aiCount, setAiCount] = useState(1);

  if (!isGameSetupModalOpen) return null;

  const labelClass = "block mb-2 font-black uppercase tracking-widest text-xs text-slate-400";
  const inputClass = "w-full p-3 mb-6 bg-slate-900 text-white border border-slate-700 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-bold";

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[2000] pointer-events-auto backdrop-blur-sm">
      <div className="bg-slate-800 text-white p-8 rounded-xl w-[500px] max-h-[85vh] overflow-y-auto border border-slate-500 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black uppercase tracking-tighter italic">Start New Game</h2>
          <button
            onClick={() => { setGameSetupModalOpen(false); }}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded transition-colors cursor-pointer text-sm"
          >
            Cancel
          </button>
        </div>

        <label className={labelClass}>Player Name</label>
        <input
          className={inputClass}
          type="text"
          value={playerName}
          onChange={(e) => { setPlayerName(e.target.value); }}
        />

        <label className={labelClass}>Select Nation</label>
        <div className="grid grid-cols-2 gap-3 mb-8">
          {(Object.keys(Nation) as Nation[]).map((n) => (
            <div
              key={n}
              onClick={() => { setNation(n); }}
              title={NATION_BONUSES[n].description}
              className={`p-4 rounded-lg cursor-pointer transition-all border-2 flex flex-row items-center gap-4 ${
                nation === n
                  ? 'bg-blue-600 border-white shadow-lg transform scale-[1.02]'
                  : 'bg-slate-900/50 border-transparent hover:border-slate-600'
              }`}
            >
              <Flag nation={n} size={40} className="shrink-0" />
              <div className="flex flex-col gap-1 overflow-hidden">
                <div className="font-black uppercase tracking-wider text-sm truncate">{NATION_BONUSES[n].name}</div>
                <div className={`text-[10px] font-bold leading-tight ${nation === n ? 'text-blue-100' : 'text-slate-500'}`}>
                  {NATION_BONUSES[n].bonus}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4 mb-8">
          <div className="flex-1">
            <label className={labelClass}>Map Size</label>
            <select
              className={inputClass}
              value={mapSize}
              onChange={(e) => { setMapSize(e.target.value as any); }}
            >
              <option value="Small">Small (40x30)</option>
              <option value="Medium">Medium (80x60)</option>
              <option value="Large">Large (120x90)</option>
            </select>
          </div>
          <div className="flex-1">
            <label className={labelClass}>AI Opponents</label>
            <select
              className={inputClass}
              value={aiCount}
              onChange={(e) => { setAiCount(parseInt(e.target.value)); }}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </div>
        </div>

        <button
          className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-black text-xl uppercase tracking-widest rounded shadow-xl transition-all transform active:scale-[0.98] cursor-pointer"
          onClick={() => { initGame({ playerName, nation, mapSize, aiCount }); }}
        >
          Start Game
        </button>
      </div>
    </div>
  );
};
