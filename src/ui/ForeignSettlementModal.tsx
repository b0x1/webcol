import React from 'react';
import { useGameStore } from '../game/state/gameStore';
import { useUIStore } from '../game/state/uiStore';
import { Flag } from './Flag';

export const ForeignSettlementModal: React.FC = () => {
  const { selectedSettlementId, npcSettlements, players } = useGameStore();

  if (!selectedSettlementId) return null;

  const allSettlements = [
    ...players.flatMap(p => p.settlements),
    ...npcSettlements
  ];

  const settlement = allSettlements.find(s => s.id === selectedSettlementId);
  if (!settlement) return null;

  const currentPlayerId = useGameStore.getState().currentPlayerId;
  const isOwned = settlement.ownerId === currentPlayerId;
  if (isOwned && !useUIStore.getState().isDebugMode) return null;

  const owner = players.find(p => p.id === settlement.ownerId);
  const isNpc = !owner;

  // For NPC settlements, nation name is the culture/organization type or similar
  const nationName = owner ? owner.name : settlement.culture;
  const nation = owner ? owner.nation : 'IROQUOIS'; // Default for NPC flag if not specific

  return (
    <div className="absolute left-5 bottom-80 w-64 bg-black/90 text-white p-5 rounded-xl pointer-events-auto shadow-2xl border border-blue-500/30 backdrop-blur-md font-sans z-50">
      <div className="flex items-center gap-3 mb-4">
        <Flag nation={nation as any} size={40} />
        <div>
          <h3 className="text-xl font-black uppercase tracking-tight text-blue-400 leading-tight">{settlement.name}</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{nationName}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Population</span>
            <span className="text-sm font-bold text-white">{settlement.population}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Attitude</span>
            <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
              settlement.attitude === 'FRIENDLY' ? 'bg-green-900/40 text-green-400 border border-green-800/30' :
              settlement.attitude === 'HOSTILE' ? 'bg-red-900/40 text-red-400 border border-red-800/30' :
              'bg-slate-800 text-slate-400 border border-slate-700/50'
            }`}>
              {settlement.attitude}
            </span>
          </div>
        </div>

        <button
          onClick={() => useGameStore.getState().selectSettlement(null)}
          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-widest text-[10px] rounded transition-colors border border-white/5"
        >
          Close
        </button>
      </div>
    </div>
  );
};
