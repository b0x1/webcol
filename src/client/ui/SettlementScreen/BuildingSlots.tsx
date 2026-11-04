import React from 'react';
import type { Unit } from '@shared/game/entities/Unit';
import type { JobType } from '@shared/game/entities/types';
import { BuildingType } from '@shared/game/entities/types';
import { BUILDING_COSTS } from '@shared/game/constants';
import { useGameStore, selectSettlementById } from '@client/game/state/gameStore';
import { JOB_PRODUCTION_RULES } from '@shared/game/rules/ProductionRules';
import { Sprite } from '../Sprite';

const BUILDINGS_LIST = [
  { type: BuildingType.TOWN_HALL, name: 'Town Hall', bonus: 'Governance' },
  { type: BuildingType.CARPENTERS_SHOP, name: 'Carpenter\'s Shop', bonus: 'Lumber -> Hammers' },
  { type: BuildingType.BLACKSMITHS_HOUSE, name: 'Blacksmith\'s House', bonus: 'Ore -> Tools' },
  { type: BuildingType.LUMBER_MILL, name: 'Lumber Mill', bonus: '+2 LUMBER/turn' },
  { type: BuildingType.IRON_WORKS, name: 'Iron Works', bonus: '+2 ORE/turn' },
  { type: BuildingType.SCHOOLHOUSE, name: 'Schoolhouse', bonus: 'Faster training' },
  { type: BuildingType.STABLES, name: 'Stables', bonus: '+1 pioneer move' },
  { type: BuildingType.WAREHOUSE, name: 'Warehouse', bonus: '400 Storage' },
  { type: BuildingType.STOCKADE, name: 'Stockade', bonus: '+2 Defense' },
  { type: BuildingType.PRINTING_PRESS, name: 'Printing Press', bonus: '+1 Growth' },
  { type: BuildingType.DISTILLERY, name: 'Distillery', bonus: 'Sugar -> Rum' },
  { type: BuildingType.WEAVERS_SHOP, name: 'Weaver Shop', bonus: 'Cotton -> Cloth' },
  { type: BuildingType.TOBACCONISTS_SHOP, name: 'Tobacconist', bonus: 'Tobacco -> Cigars' },
  { type: BuildingType.TAILORS_SHOP, name: 'Tailor', bonus: 'Furs -> Coats' },
  { type: BuildingType.ARMORY, name: 'Armory', bonus: 'Tools -> Muskets' },
];

/**
 * Pre-calculated mapping of building types to their primary associated job.
 * Prevents O(N*M) lookups during render cycles.
 */
const BUILDING_TO_JOB = (() => {
  const mapping: Partial<Record<BuildingType, JobType>> = {};
  Object.values(JOB_PRODUCTION_RULES).forEach(rule => {
    rule.requiredBuildings.forEach(b => {
      // We take the first job that matches, matching current find() behavior
      if (!(b in mapping)) {
        mapping[b] = rule.jobType;
      }
    });
  });
  return mapping;
})();

interface Props {
  settlementId: string;
  ownedBuildings: BuildingType[];
}

const BuildingSlotsBase: React.FC<Props> = ({ settlementId, ownedBuildings }) => {
  const assignJob = useGameStore(state => state.assignJob);
  const buyBuilding = useGameStore(state => state.buyBuilding);
  // ⚡ Bolt: Use targeted selector to avoid re-renders when other players or unrelated settlement data changes
  const settlement = useGameStore(state => selectSettlementById(state, settlementId));
  const units = settlement?.units;

  const workersByJob = React.useMemo(() => {
    const map = new Map<string, Unit[]>();
    if (!units) return map;

    units.forEach(unit => {
      if (typeof unit.occupation === 'string') {
        const list = map.get(unit.occupation) ?? [];
        list.push(unit);
        map.set(unit.occupation, list);
      }
    });
    return map;
  }, [units]);

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

  const queued = new Set(settlement.productionQueue);
  const forSale = (Object.keys(BUILDING_COSTS) as BuildingType[]).filter(
    (building) => !ownedBuildings.includes(building) && !queued.has(building),
  );

  return (
    <div className="flex flex-col gap-4">
    {forSale.length > 0 && (
      <div className="flex flex-wrap gap-2">
        {forSale.map((building) => {
          const cost = BUILDING_COSTS[building];
          const label = BUILDINGS_LIST.find((entry) => entry.type === building)?.name ?? building;
          return (
            <button
              key={building}
              type="button"
              onClick={() => { buyBuilding(settlementId, building); }}
              className="px-3 py-2 bg-slate-800 border border-slate-600 rounded text-xs font-bold uppercase tracking-wide hover:border-blue-400 cursor-pointer"
            >
              Queue {label}
              {cost ? ` (${cost.hammers} hammers)` : ''}
            </button>
          );
        })}
      </div>
    )}
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {BUILDINGS_LIST.filter(b => ownedBuildings.includes(b.type)).map((b) => {
        const associatedJob = BUILDING_TO_JOB[b.type];
        const workers = associatedJob ? (workersByJob.get(associatedJob) ?? []) : [];

        return (
          <div
            key={b.type}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={(e) => { if (associatedJob) handleDrop(e, associatedJob); }}
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
                    key={unit.id}
                    draggable
                    onDragStart={(e) => { handleDragStart(e, unit.id); }}
                    title={`${unit.type}${unit.expertise ? ` (Expert ${unit.expertise})` : ''}`}
                    className="w-10 h-10 bg-blue-600/40 rounded border border-blue-400/30 shadow-sm flex items-center justify-center relative overflow-hidden cursor-grab active:cursor-grabbing"
                  >
                    <Sprite type={unit.type} category="units" size={40} />
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
    </div>
  );
};

export const BuildingSlots = React.memo(BuildingSlotsBase);
