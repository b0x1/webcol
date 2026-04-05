import React, { useEffect } from 'react';
import { useGameStore } from '../../game/state/gameStore';
import { useUIStore } from '../../game/state/uiStore';
import { BuildingSlots } from './BuildingSlots';
import { WorkforcePanel } from './WorkforcePanel';
import { InventoryPanel } from './InventoryPanel';
import { Flag } from '../Flag';

export const SettlementScreen: React.FC = () => {
  const { selectedSettlementId, players, currentPlayerId } = useGameStore();
  const { isSettlementScreenOpen, setSettlementScreenOpen } = useUIStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSettlementScreenOpen && e.key === 'Escape') {
        e.preventDefault();
        setSettlementScreenOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettlementScreenOpen, setSettlementScreenOpen]);

  if (!isSettlementScreenOpen || !selectedSettlementId) return null;

  const player = players.find((p) => p.id === currentPlayerId);
  const settlementOwner = players.find((p) => p.settlements.some((s) => s.id === selectedSettlementId));
  const settlement = settlementOwner?.settlements.find((c) => c.id === selectedSettlementId);

  if (!settlement || !player || !settlementOwner) return null;

  const isReadOnly = settlement.ownerId !== currentPlayerId;

  return (
    <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-10 text-white z-[1000] pointer-events-auto backdrop-blur-sm">
      <div className="w-[700px] bg-slate-800 rounded-xl p-6 grid grid-cols-[2fr_1fr] grid-rows-[auto_1fr_auto] gap-5 max-h-[85vh] overflow-y-auto border border-slate-600 shadow-2xl text-white">
        {/* Header */}
        <div className="col-span-2 flex justify-between items-center border-b border-slate-700 pb-4 mb-2">
          <div className="flex items-center gap-4">
            <Flag nation={settlementOwner.nation} size={48} />
            <div>
              <h1 className="text-4xl font-black m-0 uppercase tracking-tight text-blue-400">{settlement.name}</h1>
              <div className="text-slate-400 font-bold flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full animate-pulse ${isReadOnly ? 'bg-red-500' : 'bg-green-500'}`}></span>
                Population: {settlement.population}
                {isReadOnly && <span className="ml-2 text-red-500 text-xs font-black uppercase tracking-widest">[READ ONLY - {settlementOwner.name}]</span>}
              </div>
            </div>
          </div>
          <button
            onClick={() => setSettlementScreenOpen(false)}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded transition-all transform active:scale-95 cursor-pointer shadow-lg"
          >
            Close (Esc)
          </button>
        </div>

        {/* Main Content */}
        <div className={`flex flex-col gap-5 ${isReadOnly ? 'pointer-events-none opacity-80' : ''}`}>
          <BuildingSlots settlementId={settlement.id} ownedBuildings={settlement.buildings} playerGold={player.gold} />
          <InventoryPanel
            inventory={settlement.inventory}
            workforce={settlement.workforce}
            buildings={settlement.buildings}
            population={settlement.population}
          />
        </div>

        <div className={`h-full ${isReadOnly ? 'pointer-events-none opacity-80' : ''}`}>
          <WorkforcePanel settlementId={settlement.id} units={settlement.units} workforce={settlement.workforce} />
        </div>

        <div className="col-span-2 text-right text-slate-400 text-sm font-mono pt-4 border-t border-slate-700">
            Available Gold: <span className="text-yellow-400 font-bold">{player.gold}g</span>
        </div>
      </div>
    </div>
  );
};
