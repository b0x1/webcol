
import React, { useEffect, useMemo } from 'react';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';
import {
  useGameStore,
  selectCurrentPlayer,
  selectSelectedUnit,
  selectSettlementAtPosition,
  selectUnitById,
  selectUnitsAtPosition,
  selectIsUnitAdjacentToAnySettlement,
} from '@client/game/state/gameStore';
import { useUIStore } from '@client/game/state/uiStore';
import { UnitType } from '@shared/game/entities/types';
import { UnitSelector } from './UnitPanel/components/UnitSelector';
import { ResourceIcon } from './ResourceIcon';
import type { Unit } from '@shared/game/entities/Unit';

const EMPTY_TILE_UNITS: readonly Unit[] = [];

export const UnitPanel: React.FC = () => {
  const selectedUnitId = useGameStore((state) => state.selectedUnitId);
  const selectedTile = useGameStore((state) => state.selectedTile);
  const skipUnit = useGameStore((state) => state.skipUnit);
  const selectUnit = useGameStore((state) => state.selectUnit);
  const foundSettlement = useGameStore((state) => state.foundSettlement);

  const isMainMenuOpen = useUIStore((state) => state.isMainMenuOpen);
  const isAnyModalOpen = useUIStore((state) =>
    state.isSettlementScreenOpen ||
    state.isEuropeScreenOpen ||
    state.isReportsModalOpen ||
    state.isSaveModalOpen ||
    state.isNativeTradeModalOpen ||
    state.isHowToPlayModalOpen ||
    state.isGameSetupModalOpen
  );

  const unit = useGameStore(selectSelectedUnit);
  const player = useGameStore(selectCurrentPlayer);
  const settlementAtTile = useGameStore((state) =>
    selectSettlementAtPosition(state, state.selectedTile?.position ?? null),
  );
  const unitsAtTile = useStoreWithEqualityFn(
    useGameStore,
    (state) => {
      const tile = state.selectedTile;
      return tile ? selectUnitsAtPosition(state, tile.position) : EMPTY_TILE_UNITS;
    },
    shallow,
  );
  const unitOwner = useGameStore((state) => {
    const selected = selectUnitById(state, state.selectedUnitId);
    return state.players.find((p) => p.id === selected?.ownerId);
  });
  const isAdjacentToSettlement = useGameStore((state) =>
    selectIsUnitAdjacentToAnySettlement(state, state.selectedUnitId),
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isMainMenuOpen || isAnyModalOpen) return;

      if ((e.code === 'Space') && selectedUnitId) {
        e.preventDefault();
        skipUnit(selectedUnitId);
      } else if (e.key.toLowerCase() === 'b' && unit) {
        if (unit.type === UnitType.COLONIST || unit.type === UnitType.VILLAGER) {
          e.preventDefault();
          foundSettlement(unit.id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('keydown', handleKeyDown); };
  }, [selectedUnitId, unit, skipUnit, isMainMenuOpen, isAnyModalOpen, foundSettlement]);

  const unitsForTileSelector = useMemo((): readonly Unit[] => {
    if (!selectedTile) return EMPTY_TILE_UNITS;

    // unitsAtTile comes from selectUnitsAtPosition which uses TraversalUtils.findAllUnitsAt
    // which we already modified to only return "available" units in settlements.
    return unitsAtTile;
  }, [selectedTile, unitsAtTile]);

  if (isMainMenuOpen) return null;

  // Only show selector if there is ambiguity (more than one option)
  const hasSettlement = !!settlementAtTile;
  const hasAmbiguity = (unitsForTileSelector.length + (hasSettlement ? 1 : 0)) > 1;

  if (!unit && selectedTile && hasAmbiguity) {
    return (
      <UnitSelector
        unitsAtTile={[...unitsForTileSelector]}
        settlementAtTile={settlementAtTile}
        onSelectUnit={selectUnit}
        onSelectSettlement={useGameStore.getState().selectSettlement}
      />
    );
  }

  if (!unit) return null;

  const isReadOnly = unit.ownerId !== player?.id;

  const canBuildSettlement = (unit.type === UnitType.COLONIST || unit.type === UnitType.VILLAGER) && !isAdjacentToSettlement;

  return (
    <div className="absolute bottom-5 left-5 w-64 bg-black/80 text-white p-5 rounded-xl pointer-events-auto shadow-2xl border border-white/10 backdrop-blur-sm font-sans">
      <h3 className="text-xl font-black uppercase tracking-tight mb-0 text-blue-400">{unit.name}</h3>
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{unit.type}</div>
      {unit.expertise && <div className="text-[10px] font-black uppercase tracking-widest text-yellow-500 mb-1 bg-yellow-900/40 px-1.5 py-0.5 rounded border border-yellow-800/30 w-fit">Expert {unit.expertise}</div>}
      {isReadOnly && <div className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-2">[READ ONLY - {unitOwner?.name}]</div>}
      <div className="flex items-center gap-2 mb-4">
        <div className="h-1.5 flex-1 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${(unit.movesRemaining / unit.maxMoves) * 100}%` }}
          ></div>
        </div>
        <span className="text-[10px] font-mono font-bold text-slate-400">{unit.movesRemaining}/{unit.maxMoves} MOVES</span>
      </div>

      <div className="text-xs bg-slate-900/50 p-3 rounded-lg border border-white/5 mb-4">
        <span className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Cargo Inventory</span>
        {unit.cargo.size === 0 ? (
          <span className="text-slate-600 italic text-center block py-1">Empty Cargo Hold</span>
        ) : (
          <ul className="space-y-1">
            {Array.from(unit.cargo.entries()).map(([good, amount]) => (
              <li key={good} className="flex justify-between items-center border-b border-white/5 pb-1 last:border-0 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <ResourceIcon good={good} size={16} className="shrink-0" />
                  <span className="capitalize text-slate-300 font-medium truncate">{good.replace('_', ' ').toLowerCase()}</span>
                </div>
                <span className="font-mono font-bold text-blue-300">{amount}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!isReadOnly && (
        <div className="space-y-2">
          {(unit.type === UnitType.COLONIST || unit.type === UnitType.VILLAGER) && (
            <div className="relative group/tooltip">
              <button
                onClick={() => { if (canBuildSettlement) { foundSettlement(unit.id); }} }
                disabled={!canBuildSettlement}
                className={`w-full py-2.5 bg-green-600 text-white font-black uppercase tracking-widest text-xs rounded shadow-lg transition-all transform focus-visible:ring-2 focus-visible:ring-blue-500 outline-none ${canBuildSettlement ? 'cursor-pointer hover:bg-green-500 active:scale-95' : 'opacity-50 cursor-not-allowed'}`}
                aria-label="Build Settlement (B)"
              >
                <span className="text-yellow-400 font-black">B</span>UILD SETTLEMENT
              </button>
              {isAdjacentToSettlement && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none text-center shadow-xl border border-white/10 z-50">
                  Cannot build adjacent to another settlement.
                </div>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => { skipUnit(unit.id); }}
              className="flex-1 py-2.5 cursor-pointer bg-red-700 hover:bg-red-600 text-white font-black uppercase tracking-widest text-[10px] rounded shadow-lg transition-all transform active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
              aria-label="Skip Unit (Space)"
            >
              SKIP (Space)
            </button>
            <button
              onClick={() => { selectUnit(null); }}
              className="flex-1 py-2.5 cursor-pointer bg-slate-700 hover:bg-slate-600 text-white font-black uppercase tracking-widest text-[10px] rounded shadow-lg transition-all transform active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
              aria-label="Wait"
            >
              Wait
            </button>
          </div>
        </div>
      )}
      {isReadOnly && (
        <button
          onClick={() => { selectUnit(null); }}
          className="w-full py-2.5 cursor-pointer bg-slate-700 hover:bg-slate-600 text-white font-black uppercase tracking-widest text-[10px] rounded shadow-lg transition-all transform active:scale-95 focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
          aria-label="Close"
        >
          Close
        </button>
      )}
    </div>
  );
};
