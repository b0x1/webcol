import React from 'react';
import { BuildingType, UnitType } from '../../game/entities/types';
import { useGameStore } from '../../game/state/gameStore';
import { BUILDING_COSTS, UNIT_BUILD_COSTS } from '../../game/constants';

const BUILDINGS_LIST = [
  { type: BuildingType.LUMBER_MILL, name: 'Lumber Mill', bonus: '+2 LUMBER/turn' },
  { type: BuildingType.IRON_WORKS, name: 'Iron Works', bonus: '+2 ORE/turn' },
  { type: BuildingType.SCHOOLHOUSE, name: 'Schoolhouse', bonus: 'Education' },
  { type: BuildingType.WAREHOUSE, name: 'Warehouse', bonus: '400 Storage' },
  { type: BuildingType.STOCKADE, name: 'Stockade', bonus: '+2 Defense' },
  { type: BuildingType.PRINTING_PRESS, name: 'Printing Press', bonus: '+1 Growth' },
  { type: BuildingType.DISTILLERY, name: 'Distillery', bonus: 'Sugar -> Rum' },
  { type: BuildingType.WEAVERS_SHOP, name: 'Weaver Shop', bonus: 'Cotton -> Cloth' },
  { type: BuildingType.TOBACCONISTS_SHOP, name: 'Tobacconist', bonus: 'Tobacco -> Cigars' },
  { type: BuildingType.TAILORS_SHOP, name: 'Tailor', bonus: 'Furs -> Coats' },
  { type: BuildingType.ARMORY, name: 'Armory', bonus: 'Tools -> Muskets' },
];

const UNITS_LIST = [
  { type: UnitType.COLONIST, name: 'Colonist', bonus: 'Basic worker' },
  { type: UnitType.PIONEER, name: 'Pioneer', bonus: 'Improve tiles' },
  { type: UnitType.SOLDIER, name: 'Soldier', bonus: 'Defense/Attack' },
];

interface Props {
  settlementId: string;
  ownedBuildings: BuildingType[];
  playerGold: number;
}

export const BuildingSlots: React.FC<Props> = ({ settlementId, ownedBuildings, playerGold }) => {
  const buyBuilding = useGameStore((state) => state.buyBuilding);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2.5 p-2.5 bg-slate-900/50 rounded-lg border border-slate-700">
        {BUILDINGS_LIST.map((b) => {
          const isBuilt = ownedBuildings.includes(b.type);
          const cost = BUILDING_COSTS[b.type];
          const settlement = useGameStore.getState().players.flatMap(p => p.settlements).find(s => s.id === settlementId);
          const isQueued = settlement?.productionQueue.includes(b.type);

          return (
            <div
              key={b.type}
              className={`p-2.5 rounded shadow-sm flex flex-col justify-between min-h-[100px] border transition-all ${
                isBuilt
                  ? 'bg-green-900/40 border-green-700'
                  : isQueued
                  ? 'bg-blue-900/40 border-blue-700'
                  : 'bg-slate-800 border-slate-700'
              }`}
            >
              <div>
                <div className="font-black text-[0.8rem] uppercase tracking-wider text-slate-200">{b.name}</div>
                <div className="text-[0.7rem] text-slate-400 mt-1">{b.bonus}</div>
                {!isBuilt && cost && (
                    <div className="text-[0.6rem] text-slate-500 mt-1 font-mono">
                        Cost: {cost.hammers}H {cost.tools > 0 ? `, ${cost.tools}T` : ''}
                    </div>
                )}
              </div>

              {!isBuilt ? (
                <button
                  onClick={() => buyBuilding(settlementId, b.type)}
                  disabled={isQueued}
                  className={`mt-2 py-1.5 px-2 text-[0.75rem] font-bold rounded transition-colors shadow-inner ${
                    !isQueued
                      ? 'bg-yellow-600 hover:bg-yellow-500 text-white cursor-pointer'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                  }`}
                >
                  {isQueued ? 'Queued' : 'Add to Queue'}
                </button>
              ) : (
                <div className="mt-2 py-1 text-[0.7rem] font-black text-green-400 text-center bg-green-950/50 rounded border border-green-800/30 uppercase tracking-widest">
                  Built
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2.5 p-2.5 bg-slate-900/50 rounded-lg border border-slate-700">
        {UNITS_LIST.map((u) => {
          const cost = UNIT_BUILD_COSTS[u.type];
          const settlement = useGameStore.getState().players.flatMap(p => p.settlements).find(s => s.id === settlementId);
          // For units, multiple can be in queue, but we just check if it's currently selected?
          // Actually building multiple units is fine. Let's just allow adding.

          return (
            <div
              key={u.type}
              className="p-2.5 rounded shadow-sm flex flex-col justify-between min-h-[100px] border bg-slate-800 border-slate-700"
            >
              <div>
                <div className="font-black text-[0.8rem] uppercase tracking-wider text-slate-200">{u.name}</div>
                <div className="text-[0.7rem] text-slate-400 mt-1">{u.bonus}</div>
                {cost && (
                    <div className="text-[0.6rem] text-slate-500 mt-1 font-mono">
                        Cost: {cost.hammers}H {cost.tools > 0 ? `, ${cost.tools}T` : ''} {cost.muskets > 0 ? `, ${cost.muskets}M` : ''}
                    </div>
                )}
              </div>

              <button
                onClick={() => buyBuilding(settlementId, u.type as any)}
                className="mt-2 py-1.5 px-2 text-[0.75rem] font-bold rounded transition-colors shadow-inner bg-yellow-600 hover:bg-yellow-500 text-white cursor-pointer"
              >
                Add Unit
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
