import React from 'react';
import type { Unit } from '../../../game/entities/Unit';
import type { Settlement } from '../../../game/entities/Settlement';
import { useGameStore } from '../../../game/state/gameStore';
import { Sprite } from '../../Sprite';
import { Flag } from '../../Flag';

interface Props {
  unitsAtTile: Unit[];
  settlementAtTile?: Settlement | null | undefined;
  onSelectUnit: (unitId: string | null) => void;
  onSelectSettlement: (settlementId: string | null) => void;
}

export const UnitSelector: React.FC<Props> = ({ unitsAtTile, settlementAtTile, onSelectUnit, onSelectSettlement }) => {
  const players = useGameStore((state) => state.players);
  const currentPlayerId = useGameStore((state) => state.currentPlayerId);
  const isOwnedSettlement = settlementAtTile?.ownerId === currentPlayerId;
  const settlementOwner = players.find(p => p.id === settlementAtTile?.ownerId);

  return (
    <div className="absolute bottom-5 left-5 w-64 bg-black/80 text-white p-5 rounded-xl pointer-events-auto shadow-2xl border border-white/10 backdrop-blur-sm font-sans" role="dialog" aria-label="Tile Selection">
      <h3 className="text-xl font-black uppercase tracking-tight mb-4 text-blue-400">Tile Selection</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        {settlementAtTile && (
          <button
            onClick={() => { onSelectSettlement(settlementAtTile.id); }}
            aria-label={`Select settlement ${settlementAtTile.name}`}
            className={`w-full p-3 ${isOwnedSettlement ? 'bg-blue-900/40 hover:bg-blue-800/40 border-blue-500/30' : 'bg-slate-900/40 hover:bg-slate-800/40 border-slate-500/30'} border rounded-lg flex items-center gap-3 transition-all text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer`}
          >
            <div className={`w-10 h-10 ${isOwnedSettlement ? 'bg-blue-900/60 border-blue-400/30 group-hover:border-blue-300/50' : 'bg-slate-900/60 border-slate-400/30 group-hover:border-slate-300/50'} rounded flex items-center justify-center border relative overflow-hidden shrink-0`}>
              {settlementOwner ? (
                <Flag nation={settlementOwner.nation} size={32} />
              ) : (
                <span className={`text-xs font-black ${isOwnedSettlement ? 'text-blue-300' : 'text-slate-300'}`}>S</span>
              )}
            </div>
            <div className="min-w-0">
              <div className={`text-xs font-black uppercase tracking-widest truncate ${isOwnedSettlement ? 'text-blue-200' : 'text-slate-200'}`}>{settlementAtTile.name}</div>
              <div className={`text-[10px] ${isOwnedSettlement ? 'text-blue-400' : 'text-slate-400'} font-bold uppercase tracking-tight`}>
                {isOwnedSettlement ? 'Enter Settlement' : 'Settlement'}
              </div>
            </div>
          </button>
        )}
      {unitsAtTile.map((u) => {
        const unitOwner = players.find(p => p.id === u.ownerId);
        const isOwnedUnit = u.ownerId === currentPlayerId;
        return (
          <button
            key={u.id}
            onClick={() => { onSelectUnit(u.id); }}
            aria-label={`Select unit ${u.name}`}
            className="w-full p-3 bg-slate-900/50 hover:bg-slate-700/50 border border-white/5 rounded-lg flex items-center gap-3 transition-all text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
          >
            <div className="w-10 h-10 bg-slate-800 rounded flex items-center justify-center border border-white/10 group-hover:border-blue-500/50 relative overflow-hidden shrink-0">
              <Sprite type={u.type} category="units" size={40} />
              {!isOwnedUnit && unitOwner && (
                <div className="absolute bottom-0 right-0 shadow-sm border border-black/20 rounded-sm overflow-hidden">
                  <Flag nation={unitOwner.nation} size={16} />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black uppercase tracking-widest text-slate-300 truncate">{u.name}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{u.type}</div>
            </div>
          </button>
        );
      })}
      </div>
    </div>
  );
};
