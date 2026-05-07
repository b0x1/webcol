import React from 'react';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';
import { useGameStore, selectUnitsAtPosition } from '@client/game/state/gameStore';
import { TerrainType } from '@shared/game/entities/types';

export const FieldPanel: React.FC = () => {
  const selectedTile = useGameStore((state) => state.selectedTile);
  const map = useGameStore((state) => state.map);
  const selectedUnitId = useGameStore((state) => state.selectedUnitId);

  const unitsAtTile = useStoreWithEqualityFn(
    useGameStore,
    (state) => (selectedTile ? selectUnitsAtPosition(state, selectedTile.position) : []),
    shallow,
  );

  if (!selectedTile) return null;

  const tile = map[selectedTile.position.y]?.[selectedTile.position.x] as
    | { terrainType: TerrainType; hasResource: string | null; movementCost: number }
    | undefined;
  if (!tile) return null;

  const getDefenseBonus = (type: TerrainType) => {
    switch (type) {
      case TerrainType.MOUNTAINS:
        return 1.0;
      case TerrainType.HILLS:
        return 0.5;
      case TerrainType.FOREST:
        return 0.25;
      case TerrainType.SWAMP:
        return -0.25;
      default:
        return 0;
    }
  };

  const defenseBonus = getDefenseBonus(tile.terrainType);

  const showAboveUnitPanel = selectedUnitId ?? unitsAtTile.length > 1;

  return (
    <div className={`absolute left-5 w-64 bg-black/80 text-white p-4 rounded-xl pointer-events-auto shadow-2xl border border-white/10 backdrop-blur-sm font-sans mb-2 ${showAboveUnitPanel ? 'bottom-[calc(20px+16rem)]' : 'bottom-5'}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-black uppercase tracking-tight text-green-400">
          {tile.terrainType.replace('_', ' ')}
        </h3>
        <span className="text-[10px] font-mono text-slate-500">
          {selectedTile.position.x}, {selectedTile.position.y}
        </span>
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-400 uppercase tracking-widest text-[9px] font-bold">Resources</span>
          <span className="font-bold text-blue-300 capitalize">
            {tile.hasResource ? tile.hasResource.toLowerCase().replace('_', ' ') : 'None'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400 uppercase tracking-widest text-[9px] font-bold">Movement Cost</span>
          <span className="font-bold text-yellow-400">{tile.movementCost}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400 uppercase tracking-widest text-[9px] font-bold">Defense Bonus</span>
          <span className={`font-bold ${defenseBonus >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {defenseBonus > 0 ? '+' : ''}{Math.round(defenseBonus * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};
