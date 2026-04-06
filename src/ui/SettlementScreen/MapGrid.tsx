import React from 'react';
import { useGameStore } from '../../game/state/gameStore';
import { JobType } from '../../game/entities/types';
import { Sprite } from './Sprite';

interface Props {
  settlementId: string;
}

export const MapGrid: React.FC<Props> = ({ settlementId }) => {
  const { map, players, assignJob } = useGameStore();
  const settlement = players.flatMap(p => p.settlements).find(s => s.id === settlementId);

  if (!settlement) return null;

  const tiles = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const tx = settlement.x + dx;
      const ty = settlement.y + dy;
      tiles.push(map[ty]?.[tx]);
    }
  }

  const handleDrop = (e: React.DragEvent, tx: number, ty: number) => {
    e.preventDefault();
    const unitId = e.dataTransfer.getData('unitId');
    if (unitId) {
      assignJob(settlementId, unitId, `${tx}-${ty}`);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded border border-slate-700">
      {tiles.map((tile, i) => {
        if (!tile) return <div key={i} className="aspect-square bg-black/50" />;

        const workers = Array.from(settlement.workforce.entries())
          .filter(([_, assignment]) => assignment === `${tile.x}-${tile.y}`)
          .map(([id]) => id);

        const isSettlementTile = tile.x === settlement.x && tile.y === settlement.y;

        return (
          <div
            key={`${tile.x}-${tile.y}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, tile.x, tile.y)}
            className={`aspect-square relative flex items-center justify-center border border-white/5 overflow-hidden group hover:border-blue-500/50 transition-colors ${isSettlementTile ? 'bg-blue-900/20' : 'bg-slate-800'}`}
          >
            <Sprite type={tile.terrainType} category="terrain" size={200} />
            {tile.hasResource && (
              <Sprite type={tile.hasResource} category="resources" size={200} />
            )}

            <div className="text-[8px] absolute top-0.5 left-1 font-bold text-white uppercase bg-black/50 px-1 rounded shadow-sm z-10">
              {tile.terrainType.slice(0, 3)}
            </div>
            {workers.length > 0 && (
              <div className="flex flex-wrap gap-0.5 justify-center p-1">
                {workers.map(id => (
                   <div key={id} className="w-4 h-4 bg-blue-600 rounded-full border border-white/20 shadow-sm" title={id} />
                ))}
              </div>
            )}
            {isSettlementTile && <div className="absolute inset-0 border-2 border-yellow-500/30 pointer-events-none" />}
          </div>
        );
      })}
    </div>
  );
};
