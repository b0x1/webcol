import React from 'react';
import { useGameStore } from '../game/state/gameStore';

export const ColonyPanel: React.FC = () => {
  const { selectedColonyId, players, selectColony, setColonyScreenOpen, isMainMenuOpen } = useGameStore();

  if (isMainMenuOpen) return null;

  const colony = players
    .flatMap((p) => p.colonies)
    .find((c) => c.id === selectedColonyId);

  if (!colony) return null;

  return (
    <div
      className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-auto z-[1000]"
      onClick={() => selectColony(null)}
    >
      <div
        className="w-[400px] bg-slate-800 text-white p-6 rounded-xl shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{colony.name}</h2>
          <button
            onClick={() => selectColony(null)}
            className="cursor-pointer text-gray-400 hover:text-white transition-colors text-xl font-bold"
          >
            ✕
          </button>
        </div>
        <p className="text-gray-300 mb-4">Population: {colony.population}</p>
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 border-b border-white/10 pb-1">Inventory:</h3>
          {colony.inventory.size === 0 ? (
            <p className="text-gray-400 italic">Empty</p>
          ) : (
            <ul className="grid grid-cols-2 gap-2">
              {Array.from(colony.inventory.entries()).map(([good, amount]) => (
                <li key={good} className="text-sm bg-slate-700/50 p-2 rounded border border-white/5 flex justify-between">
                  <span className="capitalize">{good.toLowerCase()}:</span>
                  <span className="font-mono font-bold">{amount}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          onClick={() => setColonyScreenOpen(true)}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all transform active:scale-[0.98] cursor-pointer shadow-lg"
        >
          Manage Colony
        </button>
      </div>
    </div>
  );
};
