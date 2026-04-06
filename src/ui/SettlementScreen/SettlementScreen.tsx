import React, { useEffect } from 'react';
import { useGameStore } from '../../game/state/gameStore';
import { useUIStore } from '../../game/state/uiStore';
import { BuildingSlots } from './BuildingSlots';
import { WorkforcePanel } from './WorkforcePanel';
import { MapGrid } from './MapGrid';
import { AvailableUnits } from './AvailableUnits';
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
              <h1 className="text-2xl font-black m-0 uppercase tracking-tight text-blue-400">{settlement.name}</h1>
              <div className="text-slate-400 font-bold flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                <div className="flex items-center gap-1.5 text-sm">
                  <span className={`w-2 h-2 rounded-full animate-pulse ${isReadOnly ? 'bg-red-500' : 'bg-green-500'}`}></span>
                  Pop: {settlement.population}
                </div>
                <div className="flex items-center gap-1.5 text-blue-300 text-sm">
                  <span className="text-[9px] font-black uppercase tracking-widest bg-blue-900/50 px-1.5 py-0.5 rounded border border-blue-700/50">Hammers</span>
                  {settlement.hammers}
                </div>
                {settlement.productionQueue.length > 0 && (
                  <div className="flex items-center gap-1.5 text-orange-300 text-sm">
                    <span className="text-[9px] font-black uppercase tracking-widest bg-orange-900/50 px-1.5 py-0.5 rounded border border-orange-700/50">Building</span>
                    <span className="truncate max-w-[120px]">{settlement.productionQueue[0].replace('_', ' ')}</span>
                  </div>
                )}
                {isReadOnly && <span className="text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-950/30 px-2 py-0.5 rounded border border-red-900/30">[READ ONLY - {settlementOwner.name}]</span>}
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
            settlement={settlement}
            map={useGameStore.getState().map}
          />
        </div>

        <div className={`flex flex-col gap-5 ${isReadOnly ? 'pointer-events-none opacity-80' : ''}`}>
          <MapGrid settlementId={settlement.id} />
          <WorkforcePanel settlementId={settlement.id} units={settlement.units} workforce={settlement.workforce} />
        </div>

        <div className="col-span-2">
          <AvailableUnits settlementId={settlement.id} units={settlement.units} />
        </div>

        <div className="col-span-2 text-right text-slate-400 text-sm font-mono pt-4 border-t border-slate-700">
            Available Gold: <span className="text-yellow-400 font-bold">{player.gold}g</span>
        </div>
      </div>
    </div>
  );
};
