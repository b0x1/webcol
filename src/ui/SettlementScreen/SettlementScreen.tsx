import React, { useEffect } from 'react';
import { useGameStore } from '../../game/state/gameStore';
import { useUIStore } from '../../game/state/uiStore';
import { BuildingSlots } from './BuildingSlots';
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

  const handleClose = () => {
    setSettlementScreenOpen(false);
    useGameStore.getState().selectSettlement(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-950 text-white z-[1000] flex flex-col pointer-events-auto">
      {/* Header */}
      <div className="flex justify-between items-center bg-slate-900 p-4 border-b border-slate-800">
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
              {isReadOnly && <span className="text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-950/30 px-2 py-0.5 rounded border border-red-900/30">[READ ONLY - {settlementOwner.name}]</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right text-slate-400 text-sm font-mono">
            Available Gold: <span className="text-yellow-400 font-bold">{player.gold}g</span>
          </div>
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest rounded transition-all transform active:scale-95 cursor-pointer shadow-lg border border-red-500/50"
          >
            Return to Map (Esc)
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-[2fr_1fr] grid-rows-[1fr_auto] gap-4 p-4 overflow-hidden">
        {/* Left Side: Buildings (Top) and Inventory (Bottom) */}
        <div className="flex flex-col gap-4 overflow-hidden">
          <div className="flex-1 overflow-y-auto min-h-0 bg-slate-900/30 rounded-xl border border-slate-800 p-4">
            <BuildingSlots settlementId={settlement.id} ownedBuildings={settlement.buildings} />
          </div>
          <div className="h-48 bg-slate-900/30 rounded-xl border border-slate-800 p-4">
            <InventoryPanel settlement={settlement} map={useGameStore.getState().map} />
          </div>
        </div>

        {/* Right Side: MapGrid (Top) and Available Units (Bottom) */}
        <div className="flex flex-col gap-4 overflow-hidden h-full">
          <div className="flex-[2] bg-slate-900/30 rounded-xl border border-slate-800 p-4 flex items-center justify-center min-h-0">
             <MapGrid settlementId={settlement.id} />
          </div>
          <div className="flex-[1] overflow-y-auto bg-slate-900/30 rounded-xl border border-slate-800 p-4 min-h-0">
            <AvailableUnits settlementId={settlement.id} units={settlement.units} />
          </div>
        </div>
      </div>
    </div>
  );
};
