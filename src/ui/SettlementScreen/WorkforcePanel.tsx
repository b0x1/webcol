import React from 'react';
import { JobType } from '../../game/entities/types';
import { Unit } from '../../game/entities/Unit';
import { useGameStore } from '../../game/state/gameStore';

interface Props {
  settlementId: string;
  units: Unit[];
  workforce: Map<string, JobType>;
}

export const WorkforcePanel: React.FC<Props> = ({ settlementId, units, workforce }) => {
  const assignJob = useGameStore((state) => state.assignJob);

  return (
    <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 h-full overflow-y-auto shadow-inner">
      <h3 className="text-lg font-black uppercase tracking-tight mb-4 text-slate-300">Workforce</h3>
      <div className="flex flex-col gap-3">
        {units.map((unit) => {
          const currentJob = workforce.get(unit.id) || JobType.FARMER;
          return (
            <div
              key={unit.id}
              className="p-3 bg-slate-800 rounded border border-slate-700 flex justify-between items-center group hover:border-slate-500 transition-colors shadow-sm"
            >
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-blue-400">{unit.type}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {unit.id.slice(0, 8)}</div>
              </div>
              <select
                value={currentJob}
                onChange={(e) => assignJob(settlementId, unit.id, e.target.value as JobType)}
                className="bg-slate-900 text-white border border-slate-600 rounded px-2 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer hover:bg-slate-700 transition-colors"
              >
                {Object.values(JobType).map((job) => (
                  <option key={job} value={job} className="bg-slate-900 font-sans">{job}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
};
