import React, { useEffect } from 'react';
import { useGameStore } from '../game/state/gameStore';

export const UnitPanel: React.FC = () => {
  const { selectedUnitId, players, isMainMenuOpen, skipUnit, selectUnit } = useGameStore();
  const foundColony = useGameStore((state) => state.foundColony);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && selectedUnitId) {
        e.preventDefault();
        skipUnit(selectedUnitId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedUnitId, skipUnit]);

  if (isMainMenuOpen) return null;

  const unit = players
    .flatMap((p) => p.units)
    .find((u) => u.id === selectedUnitId);

  if (!unit) return null;

  return (
    <div className="absolute bottom-5 left-5 w-64 bg-black/80 text-white p-5 rounded-xl pointer-events-auto shadow-2xl border border-white/10 backdrop-blur-sm font-sans">
      <h3 className="text-xl font-black uppercase tracking-tight mb-1 text-blue-400">Unit: {unit.type}</h3>
      <div className="flex items-center gap-2 mb-4">
        <div className="h-1.5 flex-1 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${(unit.movesRemaining / unit.maxMoves) * 100}%` }}
          ></div>
        </div>
        <span className="text-[10px] font-mono font-bold text-slate-400">{unit.movesRemaining}/{unit.maxMoves} MOVES</span>
      </div>

      <div className="text-xs bg-slate-900/50 p-3 rounded-lg border border-white/5 mb-4">
        <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Cargo Inventory</span>
        {unit.cargo.size === 0 ? (
          <span className="text-slate-600 italic text-center block py-1">Empty Cargo Hold</span>
        ) : (
          <ul className="space-y-1">
            {Array.from(unit.cargo.entries()).map(([good, amount]) => (
              <li key={good} className="flex justify-between items-center border-b border-white/5 pb-1 last:border-0">
                <span className="capitalize text-slate-300 font-medium">{good.toLowerCase()}</span>
                <span className="font-mono font-bold text-blue-300">{amount}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        {unit.type === 'COLONIST' && (
          <button
            onClick={() => foundColony(unit.id)}
            className="w-full py-2.5 cursor-pointer bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-widest text-xs rounded shadow-lg transition-all transform active:scale-95"
          >
            Found Colony
          </button>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => skipUnit(unit.id)}
            className="flex-1 py-2.5 cursor-pointer bg-red-700 hover:bg-red-600 text-white font-black uppercase tracking-widest text-[10px] rounded shadow-lg transition-all transform active:scale-95"
          >
            Skip (Space)
          </button>
          <button
            onClick={() => selectUnit(null)}
            className="flex-1 py-2.5 cursor-pointer bg-slate-700 hover:bg-slate-600 text-white font-black uppercase tracking-widest text-[10px] rounded shadow-lg transition-all transform active:scale-95"
          >
            Wait
          </button>
        </div>
      </div>
    </div>
  );
};
