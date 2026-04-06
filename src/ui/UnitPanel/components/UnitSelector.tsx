import React from 'react';
import type { Unit } from '../../../game/entities/Unit';
import type { Player } from '../../../game/entities/Player';
import type { Settlement } from '../../../game/entities/Settlement';

interface Props {
  unitsAtTile: Unit[];
  settlementAtTile?: Settlement | null;
  players: Player[];
  onSelectUnit: (unitId: string) => void;
  onSelectSettlement: (settlementId: string) => void;
}

export const UnitSelector: React.FC<Props> = ({ unitsAtTile, settlementAtTile, players, onSelectUnit, onSelectSettlement }) => (
  <div className="absolute bottom-5 left-5 w-64 bg-black/80 text-white p-5 rounded-xl pointer-events-auto shadow-2xl border border-white/10 backdrop-blur-sm font-sans">
    <h3 className="text-xl font-black uppercase tracking-tight mb-4 text-blue-400">Tile Selection</h3>
    <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
      {settlementAtTile && (
        <button
          onClick={() => onSelectSettlement(settlementAtTile.id)}
          className="w-full p-3 bg-blue-900/40 hover:bg-blue-800/40 border border-blue-500/30 rounded-lg flex items-center gap-3 transition-all text-left group"
        >
          <div className="w-10 h-10 bg-blue-900/60 rounded flex items-center justify-center border border-blue-400/30 group-hover:border-blue-300/50">
            <span className="text-xs font-black text-blue-300">S</span>
          </div>
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-blue-200">{settlementAtTile.name}</div>
            <div className="text-[10px] text-blue-400 font-bold uppercase tracking-tight">Settlement</div>
          </div>
        </button>
      )}
      {unitsAtTile.map((u) => {
        const owner = players.find(p => p.id === u.ownerId);
        return (
          <button
            key={u.id}
            onClick={() => onSelectUnit(u.id)}
            className="w-full p-3 bg-slate-900/50 hover:bg-slate-700/50 border border-white/5 rounded-lg flex items-center gap-3 transition-all text-left group"
          >
            <div className="w-10 h-10 bg-slate-800 rounded flex items-center justify-center border border-white/10 group-hover:border-blue-500/50">
              <span className="text-xs font-black text-slate-500">{u.type[0]}</span>
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-slate-300">{u.type}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{owner?.name}</div>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);
