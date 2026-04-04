import React from 'react';
import { BuildingType } from '../../game/entities/types';
import { useGameStore } from '../../game/state/gameStore';

const BUILDINGS_LIST = [
  { type: BuildingType.LUMBER_MILL, name: 'Lumber Mill', bonus: '+2 LUMBER/turn', cost: 100 },
  { type: BuildingType.IRON_WORKS, name: 'Iron Works', bonus: '+2 ORE/turn', cost: 150 },
  { type: BuildingType.SCHOOLHOUSE, name: 'Schoolhouse', bonus: 'Unlocks PIONEER', cost: 120 },
  { type: BuildingType.WAREHOUSE, name: 'Warehouse', bonus: '400 Storage', cost: 80 },
  { type: BuildingType.STOCKADE, name: 'Stockade', bonus: '+2 Defense', cost: 200 },
  { type: BuildingType.PRINTING_PRESS, name: 'Printing Press', bonus: '+1 Growth', cost: 180 },
];

interface Props {
  colonyId: string;
  ownedBuildings: BuildingType[];
  playerGold: number;
}

export const BuildingSlots: React.FC<Props> = ({ colonyId, ownedBuildings, playerGold }) => {
  const buyBuilding = useGameStore((state) => state.buyBuilding);

  return (
    <div className="grid grid-cols-3 gap-2.5 p-2.5 bg-slate-900/50 rounded-lg border border-slate-700">
      {BUILDINGS_LIST.map((b) => {
        const isBuilt = ownedBuildings.includes(b.type);
        const canAfford = playerGold >= b.cost;

        return (
          <div
            key={b.type}
            className={`p-2.5 rounded shadow-sm flex flex-col justify-between min-h-[100px] border transition-all ${
              isBuilt
                ? 'bg-green-900/40 border-green-700'
                : 'bg-slate-800 border-slate-700'
            }`}
          >
            <div>
              <div className="font-black text-[0.8rem] uppercase tracking-wider text-slate-200">{b.name}</div>
              <div className="text-[0.7rem] text-slate-400 mt-1">{b.bonus}</div>
            </div>

            {!isBuilt ? (
              <button
                onClick={() => buyBuilding(colonyId, b.type)}
                disabled={!canAfford}
                className={`mt-2 py-1.5 px-2 text-[0.75rem] font-bold rounded transition-colors shadow-inner ${
                  canAfford
                    ? 'bg-yellow-600 hover:bg-yellow-500 text-white cursor-pointer'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                }`}
              >
                Build ({b.cost}g)
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
  );
};
