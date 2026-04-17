
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
} from '../game/state/gameStore';
import { useUIStore } from '../game/state/uiStore';
import { UnitType } from '../game/entities/types';
import { UnitSelector } from './UnitPanel/components/UnitSelector';
import { distance } from '../game/entities/Position';
import type { Unit } from '../game/entities/Unit';

const EMPTY_TILE_UNITS: readonly Unit[] = [];

export const UnitPanel: React.FC = () => {
  const {
    selectedUnitId,
    selectedTile,
    skipUnit,
    selectUnit,
  } = useGameStore();
  const {
    isMainMenuOpen,
    isSettlementScreenOpen,
    isEuropeScreenOpen,
    isReportsModalOpen,
    isSaveModalOpen,
    isNativeTradeModalOpen,
    isHowToPlayModalOpen,
    isGameSetupModalOpen,
  } = useUIStore();
  const foundSettlement = useGameStore((state) => state.foundSettlement);

  const isAnyModalOpen =
    isSettlementScreenOpen ||
    isEuropeScreenOpen ||
    isReportsModalOpen ||
    isSaveModalOpen ||
    isNativeTradeModalOpen ||
    isHowToPlayModalOpen ||
    isGameSetupModalOpen;

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
  const allSettlements = useStoreWithEqualityFn(
    useGameStore,
    (state) => state.players.flatMap((p) => p.settlements),
    shallow,
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

  useEffect(() => {
    if (unit || !selectedTile || isMainMenuOpen || isAnyModalOpen) return;

    const availableUnits = unitsForTileSelector;
    const hasSettlement = !!settlementAtTile;

    // If exactly one unit and no settlement, auto-select it
    if (availableUnits.length === 1 && !hasSettlement) {
      const targetUnit = availableUnits[0];
      if (targetUnit) {
        selectUnit(targetUnit.id);
      }
    }
    // If only settlement and no units, auto-select it
    else if (availableUnits.length === 0 && hasSettlement) {
      useGameStore.getState().selectSettlement(settlementAtTile.id);
    }
  }, [unit, selectedTile, unitsForTileSelector, settlementAtTile, selectUnit, isMainMenuOpen, isAnyModalOpen]);

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

  const isAdjacentToSettlement = allSettlements.some(s =>
    distance(s.position, unit.position) <= 1
  );

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
              <li key={good} className="flex justify-between items-center border-b border-white/5 pb-1 last:border-0">
                <span className="capitalize text-slate-300 font-medium">{good.toLowerCase()}</span>
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
                className={`w-full py-2.5 bg-green-600 text-white font-black uppercase tracking-widest text-xs rounded shadow-lg transition-all transform ${canBuildSettlement ? 'cursor-pointer hover:bg-green-500 active:scale-95' : 'opacity-50 cursor-not-allowed'}`}
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
              className="flex-1 py-2.5 cursor-pointer bg-red-700 hover:bg-red-600 text-white font-black uppercase tracking-widest text-[10px] rounded shadow-lg transition-all transform active:scale-95"
            >
              SKIP (Space)
            </button>
            <button
              onClick={() => { selectUnit(null); }}
              className="flex-1 py-2.5 cursor-pointer bg-slate-700 hover:bg-slate-600 text-white font-black uppercase tracking-widest text-[10px] rounded shadow-lg transition-all transform active:scale-95"
            >
              Wait
            </button>
          </div>
        </div>
      )}
      {isReadOnly && (
        <button
          onClick={() => { selectUnit(null); }}
          className="w-full py-2.5 cursor-pointer bg-slate-700 hover:bg-slate-600 text-white font-black uppercase tracking-widest text-[10px] rounded shadow-lg transition-all transform active:scale-95"
        >
          Close
        </button>
      )}
    </div>
  );
};
