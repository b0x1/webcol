import React from 'react';
import type { Unit } from '../../game/entities/Unit';
import { useGameStore } from '../../game/state/gameStore';

interface Props {
  settlementId: string;
  units: Unit[];
}

export const AvailableUnits: React.FC<Props> = ({ settlementId, units }) => {
  const { assignJob, players } = useGameStore();

  const settlement = players.flatMap(p => p.settlements).find(s => s.id === settlementId);
  if (!settlement) return null;

  const assignedUnitIds = Array.from(settlement.workforce.keys());
  const availableUnits = units.filter(u => !assignedUnitIds.includes(u.id));

  const handleDragStart = (e: React.DragEvent, unitId: string) => {
    e.dataTransfer.setData('unitId', unitId);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const unitId = e.dataTransfer.getData('unitId');
    if (unitId) {
      assignJob(settlementId, unitId, null); // Remove from workforce/map
    }
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 h-48 overflow-x-auto shadow-inner"
    >
      <h3 className="text-lg font-black uppercase tracking-tight mb-4 text-slate-300">Available Units</h3>
      <div className="flex gap-4 min-w-max pr-4">
        {availableUnits.map((unit) => {
          return (
            <div
              key={unit.id}
              draggable
              onDragStart={(e) => handleDragStart(e, unit.id)}
              className="p-3 bg-slate-800 rounded border border-slate-700 flex flex-col items-center gap-2 group hover:border-blue-500 transition-colors shadow-sm cursor-grab active:cursor-grabbing w-24 shrink-0"
            >
              <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center border border-white/10 group-hover:border-blue-500/50">
                <span className="text-lg font-black text-slate-500">{unit.type[0]}</span>
              </div>
              <div className="text-center w-full">
                <div className="text-[10px] font-black uppercase tracking-widest text-blue-400 truncate w-full">{unit.type}</div>
                {unit.specialty && <div className="text-[8px] text-yellow-500 font-black uppercase tracking-tighter truncate w-full">Expert {unit.specialty}</div>}
                <div className="text-[8px] text-slate-500 font-mono mt-0.5">ID: {unit.id.slice(0, 4)}</div>
              </div>
            </div>
          );
        })}
        {availableUnits.length === 0 && (
          <div className="text-slate-600 italic text-sm self-center">No units available</div>
        )}
      </div>
    </div>
  );
};
