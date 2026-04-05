import React from 'react';
import { JobType } from '../../game/entities/types';
import type { Unit } from '../../game/entities/Unit';
import { useGameStore } from '../../game/state/gameStore';

interface Props {
  settlementId: string;
  units: Unit[];
  workforce: Map<string, JobType | string>;
}

export const WorkforcePanel: React.FC<Props> = ({ settlementId, units, workforce }) => {
  const assignJob = useGameStore((state) => state.assignJob);

  const assignedUnits = units.filter(u => workforce.has(u.id));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const unitId = e.dataTransfer.getData('unitId');
    if (unitId) {
      assignJob(settlementId, unitId, JobType.FARMER); // Default to Farmer when dropped on workforce panel
    }
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 flex-1 overflow-y-auto shadow-inner min-h-[150px]"
    >
      <h3 className="text-lg font-black uppercase tracking-tight mb-4 text-slate-300">Workforce (Buildings)</h3>
      <div className="flex flex-col gap-3">
        {assignedUnits.map((unit) => {
          const assignment = workforce.get(unit.id) || JobType.FARMER;
          const isJob = Object.values(JobType).includes(assignment as JobType);
          const currentJob = isJob ? (assignment as JobType) : JobType.FARMER;

          return (
            <div
              key={unit.id}
              className="p-3 bg-slate-800 rounded border border-slate-700 flex justify-between items-center group hover:border-slate-500 transition-colors shadow-sm"
            >
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-blue-400">
                  {unit.type} {unit.specialty && <span className="text-yellow-400 ml-1 text-[8px] tracking-tight font-bold bg-yellow-900/40 px-1 py-0.5 rounded border border-yellow-800/30">EXPERT {unit.specialty}</span>}
                </div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {isJob ? 'Assigned to Building' : `Assigned to Tile ${assignment}`}
                </div>
              </div>
              {isJob && (
                <select
                  value={currentJob}
                  onChange={(e) => assignJob(settlementId, unit.id, e.target.value as JobType)}
                  className="bg-slate-900 text-white border border-slate-600 rounded px-2 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer hover:bg-slate-700 transition-colors"
                >
                  {Object.values(JobType).map((job) => (
                    <option key={job} value={job} className="bg-slate-900 font-sans">{job}</option>
                  ))}
                </select>
              )}
              {!isJob && (
                <button
                  onClick={() => assignJob(settlementId, unit.id, JobType.FARMER)}
                  className="text-[10px] bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded font-bold uppercase"
                >
                  Move to Building
                </button>
              )}
            </div>
          );
        })}
        {assignedUnits.length === 0 && (
          <div className="text-slate-600 italic text-sm text-center py-4">Drag units here to assign to buildings</div>
        )}
      </div>
    </div>
  );
};
