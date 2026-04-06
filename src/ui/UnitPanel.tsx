import React, { useEffect } from 'react';
import { useGameStore } from '../game/state/gameStore';
import { useUIStore } from '../game/state/uiStore';
import { UnitType } from '../game/entities/types';
import { UnitSelector } from './UnitPanel/components/UnitSelector';

export const UnitPanel: React.FC = () => {
  const {
    currentPlayerId,
    selectedUnitId,
    selectedTile,
    players,
    npcSettlements,
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isMainMenuOpen || isAnyModalOpen) return;

      if ((e.code === 'Space') && selectedUnitId) {
        e.preventDefault();
        skipUnit(selectedUnitId);
      } else if (e.key.toLowerCase() === 'b' && selectedUnitId) {
        const unit = players.flatMap((p) => p.units).find((u) => u.id === selectedUnitId);
        if (unit && (unit.type === UnitType.COLONIST || unit.type === UnitType.VILLAGER)) {
          e.preventDefault();
          foundSettlement(selectedUnitId);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedUnitId, skipUnit, isMainMenuOpen, isAnyModalOpen, players, foundSettlement]);

  if (isMainMenuOpen) return null;

  const allUnits = players.flatMap((p) => p.units);
  const unit = allUnits.find((u) => u.id === selectedUnitId);

  const player = players.find(p => p.id === currentPlayerId);
  const settlementAtTile = selectedTile
    ? players.flatMap(p => p.settlements).find(s => s.x === selectedTile.x && s.y === selectedTile.y)
    : null;

  const unitsAtTile = selectedTile
    ? allUnits.filter(u => u.x === selectedTile.x && u.y === selectedTile.y)
    : [];

  if (selectedTile && settlementAtTile && player && settlementAtTile.ownerId === player.id) {
     const availableUnitsInSettlement = settlementAtTile.units.filter(u => !settlementAtTile.workforce.has(u.id));
     availableUnitsInSettlement.forEach(au => {
        if (!unitsAtTile.some(u => u.id === au.id)) {
           unitsAtTile.push(au);
        }
     });
  }

  if (!unit && selectedTile && (unitsAtTile.length > 1 || (settlementAtTile && (unitsAtTile.length > 0 || (player && settlementAtTile.ownerId === player.id))))) {
    return (
      <UnitSelector
        unitsAtTile={unitsAtTile}
        settlementAtTile={settlementAtTile}
        players={players}
        onSelectUnit={selectUnit}
        onSelectSettlement={useGameStore.getState().selectSettlement}
      />
    );
  }

  if (!unit) return null;

  const isReadOnly = unit.ownerId !== currentPlayerId;
  const unitOwner = players.find(p => p.id === unit.ownerId);

  const allSettlements = [
    ...players.flatMap(p => p.settlements),
    ...npcSettlements
  ];

  const isAdjacentToSettlement = allSettlements.some(s =>
    Math.abs(s.x - unit.x) <= 1 && Math.abs(s.y - unit.y) <= 1
  );

  const canBuildSettlement = (unit.type === UnitType.COLONIST || unit.type === UnitType.VILLAGER) && !isAdjacentToSettlement;

  return (
    <div className="absolute bottom-5 left-5 w-64 bg-black/80 text-white p-5 rounded-xl pointer-events-auto shadow-2xl border border-white/10 backdrop-blur-sm font-sans">
      <h3 className="text-xl font-black uppercase tracking-tight mb-1 text-blue-400">Unit: {unit.type}</h3>
      {unit.specialty && <div className="text-[10px] font-black uppercase tracking-widest text-yellow-500 mb-1 bg-yellow-900/40 px-1.5 py-0.5 rounded border border-yellow-800/30 w-fit">Expert {unit.specialty}</div>}
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
                onClick={() => canBuildSettlement && foundSettlement(unit.id)}
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
              onClick={() => skipUnit(unit.id)}
              className="flex-1 py-2.5 cursor-pointer bg-red-700 hover:bg-red-600 text-white font-black uppercase tracking-widest text-[10px] rounded shadow-lg transition-all transform active:scale-95"
            >
              SKIP (Space)
            </button>
            <button
              onClick={() => selectUnit(null)}
              className="flex-1 py-2.5 cursor-pointer bg-slate-700 hover:bg-slate-600 text-white font-black uppercase tracking-widest text-[10px] rounded shadow-lg transition-all transform active:scale-95"
            >
              Wait
            </button>
          </div>
        </div>
      )}
      {isReadOnly && (
        <button
          onClick={() => selectUnit(null)}
          className="w-full py-2.5 cursor-pointer bg-slate-700 hover:bg-slate-600 text-white font-black uppercase tracking-widest text-[10px] rounded shadow-lg transition-all transform active:scale-95"
        >
          Close
        </button>
      )}
    </div>
  );
};
