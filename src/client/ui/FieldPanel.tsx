import React from 'react';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';
import { useGameStore, selectDisplayedMovementCost, selectUnitsAtPosition } from '@client/game/state/gameStore';
import { TerrainType, type GoodType } from '@shared/game/entities/types';
import { Sprite } from './Sprite';
import { ResourceIcon } from './ResourceIcon';

export const FieldPanel: React.FC = () => {
  const selectedTile = useGameStore((state) => state.selectedTile);
  const map = useGameStore((state) => state.map);
  const selectedUnitId = useGameStore((state) => state.selectedUnitId);
  const movementCost = useGameStore((state) => {
    const position = state.selectedTile?.position;
    if (!position) {
      return null;
    }
    return selectDisplayedMovementCost(state, position);
  });

  const unitsAtTile = useStoreWithEqualityFn(
    useGameStore,
    (state) => (selectedTile ? selectUnitsAtPosition(state, selectedTile.position) : []),
    shallow,
  );

  if (!selectedTile) return null;

  const tile = map[selectedTile.position.y]?.[selectedTile.position.x] as
    | { terrainType: TerrainType; hasResource: string | null }
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
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 shrink-0 bg-slate-900/50 rounded border border-white/10 overflow-hidden" aria-hidden="true">
            <Sprite type={tile.terrainType} category="terrain" size={40} />
          </div>
          <h3 className="text-lg font-black uppercase tracking-tight text-green-400">
            {tile.terrainType.replace(/_/g, ' ')}
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-500">
          {selectedTile.position.x}, {selectedTile.position.y}
        </span>
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 uppercase tracking-widest text-[9px] font-bold">Resources</span>
          <div className="flex items-center gap-1.5">
            {tile.hasResource ? (
              <>
                <ResourceIcon good={tile.hasResource as GoodType} size={16} className="shrink-0" aria-hidden="true" />
                <span className="font-bold text-blue-300 capitalize">
                  {tile.hasResource.toLowerCase().replace(/_/g, ' ')}
                </span>
              </>
            ) : (
              <span className="font-bold text-slate-600 italic">None</span>
            )}
          </div>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400 uppercase tracking-widest text-[9px] font-bold">Movement Cost</span>
          <span className="font-bold text-yellow-400">
            {movementCost !== null && Number.isFinite(movementCost) ? movementCost : '—'}
          </span>
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
