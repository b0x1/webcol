/* eslint-disable @typescript-eslint/no-confusing-void-expression, @typescript-eslint/no-non-null-assertion */
import React from 'react';
import { BuildingType, JobType } from '../../game/entities/types';
import { useGameStore } from '../../game/state/gameStore';
import { JOB_PRODUCTION_RULES } from '../../game/rules/ProductionRules';
import { Sprite } from '../Sprite';

const BUILDINGS_LIST = [
  { type: BuildingType.TOWN_HALL, name: 'Town Hall', bonus: 'Governance' },
  { type: BuildingType.CARPENTERS_SHOP, name: 'Carpenter\'s Shop', bonus: 'Lumber -> Hammers' },
  { type: BuildingType.BLACKSMITHS_HOUSE, name: 'Blacksmith\'s House', bonus: 'Ore -> Tools' },
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

interface Props {
  settlementId: string;
  ownedBuildings: BuildingType[];
}

export const BuildingSlots: React.FC<Props> = ({ settlementId, ownedBuildings }) => {
  const { assignJob, players } = useGameStore();
  const settlement = players.flatMap(p => p.settlements).find(s => s.id === settlementId);

  if (!settlement) return null;

  const handleDrop = (e: React.DragEvent, jobType: JobType) => {
    e.preventDefault();
    const unitId = e.dataTransfer.getData('unitId');
    if (unitId) {
      assignJob(settlementId, unitId, jobType);
    }
  };

  const handleDragStart = (e: React.DragEvent, unitId: string) => {
    e.dataTransfer.setData('unitId', unitId);
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {BUILDINGS_LIST.filter(b => ownedBuildings.includes(b.type)).map((b) => {
        const associatedJob = Object.values(JOB_PRODUCTION_RULES).find(rule => rule.requiredBuildings.includes(b.type))?.jobType;
        const workers = Array.from(settlement.workforce.entries())
          .filter(([_, assignment]) => assignment === associatedJob)
          .map(([id]) => settlement.units.find(u => u.id === id))
          .filter(Boolean);

        return (
          <div
            key={b.type}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={(e) => associatedJob && handleDrop(e, associatedJob)}
            className="p-3 bg-slate-800/80 rounded-lg border border-slate-700 shadow-lg min-h-[120px] flex flex-col justify-between hover:border-blue-500/50 transition-colors"
          >
            <div>
              <div className="font-black text-xs uppercase tracking-widest text-blue-400 mb-1">{b.name}</div>
              <div className="text-[10px] text-slate-400 italic mb-2">{b.bonus}</div>
            </div>

            <div className="flex gap-1 mt-auto pt-2 border-t border-slate-700/50 h-12">
              {workers.length > 0 ? (
                workers.map(unit => (
                  <div
                    key={unit!.id}
                    draggable
                    onDragStart={(e) => { handleDragStart(e, unit!.id); }}
                    title={`${unit!.type}${unit!.specialty ? ` (Expert ${unit!.specialty})` : ''}`}
                    className="w-10 h-10 bg-blue-600/40 rounded border border-blue-400/30 shadow-sm flex items-center justify-center relative overflow-hidden cursor-grab active:cursor-grabbing"
                  >
                    <Sprite type={unit!.type} category="units" size={40} />
                  </div>
                ))
              ) : (
                <div className="text-[8px] text-slate-600 uppercase font-bold tracking-tighter self-center">Empty</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
