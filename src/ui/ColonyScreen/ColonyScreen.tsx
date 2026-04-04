import React from 'react';
import { useGameStore } from '../../game/state/gameStore';
import { BuildingSlots } from './BuildingSlots';
import { WorkforcePanel } from './WorkforcePanel';
import { InventoryPanel } from './InventoryPanel';

export const ColonyScreen: React.FC = () => {
  const { isColonyScreenOpen, selectedColonyId, players, setColonyScreenOpen, currentPlayerId } = useGameStore();

  if (!isColonyScreenOpen || !selectedColonyId) return null;

  const player = players.find((p) => p.id === currentPlayerId);
  const colony = player?.colonies.find((c) => c.id === selectedColonyId);

  if (!colony || !player) return null;

  return (
    <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-10 text-white z-[1000] pointer-events-auto backdrop-blur-sm">
      <div className="w-[700px] bg-slate-800 rounded-xl p-6 grid grid-cols-[2fr_1fr] grid-rows-[auto_1fr_auto] gap-5 max-h-[85vh] overflow-y-auto border border-slate-600 shadow-2xl text-white">
        {/* Header */}
        <div className="col-span-2 flex justify-between items-center border-b border-slate-700 pb-4 mb-2">
          <div>
            <h1 className="text-4xl font-black m-0 uppercase tracking-tight text-blue-400">{colony.name}</h1>
            <div className="text-slate-400 font-bold flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Population: {colony.population}
            </div>
          </div>
          <button
            onClick={() => setColonyScreenOpen(false)}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded transition-all transform active:scale-95 cursor-pointer shadow-lg"
          >
            Close
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-col gap-5">
          <BuildingSlots colonyId={colony.id} ownedBuildings={colony.buildings} playerGold={player.gold} />
          <InventoryPanel
            inventory={colony.inventory}
            workforce={colony.workforce}
            buildings={colony.buildings}
            population={colony.population}
          />
        </div>

        <div className="h-full">
          <WorkforcePanel colonyId={colony.id} units={colony.units} workforce={colony.workforce} />
        </div>

        <div className="col-span-2 text-right text-slate-400 text-sm font-mono pt-4 border-t border-slate-700">
            Available Gold: <span className="text-yellow-400 font-bold">{player.gold}g</span>
        </div>
      </div>
    </div>
  );
};
