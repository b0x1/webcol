import React, { useEffect, useState, useCallback } from 'react';
import { useGameStore, selectAvailableUnits } from '../game/state/gameStore';
import { useUIStore } from '../game/state/uiStore';
import { eventBus } from '../game/state/EventBus';
import { MiniMapCanvas } from './MiniMap/components/MiniMapCanvas';

export const MiniMap: React.FC = () => {
  const {
    map,
    selectNextUnit,
    endTurn,
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
    showEndTurnConfirm,
    setShowEndTurnConfirm
  } = useUIStore();

  const isAnyModalOpen =
    isSettlementScreenOpen ||
    isEuropeScreenOpen ||
    isReportsModalOpen ||
    isSaveModalOpen ||
    isNativeTradeModalOpen ||
    isHowToPlayModalOpen ||
    isGameSetupModalOpen;

  const [viewport, setViewport] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const availableUnits = useGameStore(selectAvailableUnits);
  const hasAvailableUnits = availableUnits.length > 0;

  const handleEndTurn = useCallback(() => {
    if (hasAvailableUnits) {
      setShowEndTurnConfirm(true);
    } else {
      endTurn();
    }
  }, [hasAvailableUnits, endTurn, setShowEndTurnConfirm]);

  useEffect(() => {
    const unsubscribe = eventBus.on('viewportUpdated', (v) => {
      setViewport(v as { x: number; y: number; width: number; height: number });
    });
    return () => { unsubscribe(); };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isMainMenuOpen || isAnyModalOpen || showEndTurnConfirm) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        handleEndTurn();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('keydown', handleKeyDown); };
  }, [isMainMenuOpen, isAnyModalOpen, showEndTurnConfirm, handleEndTurn]);

  if (isMainMenuOpen || map.length === 0) return null;

  const mapHeight = map.length;
  const mapWidth = map[0].length;

  const handlePointerAction = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1 && e.type !== 'pointerdown') return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * mapWidth);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * mapHeight);
    if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
      eventBus.emit('cameraJump', { x, y });
    }
  };

  return (
    <div className="absolute bottom-5 right-5 flex flex-col gap-2 pointer-events-none">
      <MiniMapCanvas
        map={map}
        viewport={viewport}
        onMapClick={handlePointerAction}
      />
      <button
        onClick={() => { if (hasAvailableUnits) { selectNextUnit(); } else { handleEndTurn(); } }}
        className={`w-full py-3 px-4 font-black uppercase tracking-widest text-sm rounded shadow-2xl transition-all transform active:scale-[0.98] border-2 pointer-events-auto ${
          hasAvailableUnits
            ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400'
            : 'bg-red-700 hover:bg-red-600 text-white border-red-500'
        }`}
      >
        {hasAvailableUnits ? `Next Unit (${availableUnits.length})` : 'End Turn'}
      </button>
    </div>
  );
};
