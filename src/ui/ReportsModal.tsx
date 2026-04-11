import React, { useState, useEffect } from 'react';
import { useGameStore } from '../game/state/gameStore';
import { useUIStore } from '../game/state/uiStore';
import { eventBus } from '../game/state/EventBus';
import type { Position } from '../game/entities/Position';
import { UnitsTab } from './ReportsModal/components/UnitsTab';
import { SettlementsTab } from './ReportsModal/components/SettlementsTab';
import { ResourcesTab } from './ReportsModal/components/ResourcesTab';

type ReportTab = 'units' | 'settlements' | 'resources';

export const ReportsModal: React.FC = () => {
  const {
    players,
    currentPlayerId,
    selectUnit,
    selectSettlement,
  } = useGameStore();
  const {
    isReportsModalOpen,
    setReportsModalOpen,
    isDebugMode,
    setSettlementScreenOpen
  } = useUIStore();
  const [activeTab, setActiveTab] = useState<ReportTab>('units');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isReportsModalOpen && e.key === 'Escape') {
        e.preventDefault();
        setReportsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('keydown', handleKeyDown); };
  }, [isReportsModalOpen, setReportsModalOpen]);

  if (!isReportsModalOpen) return null;

  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  if (!currentPlayer) return null;

  const displayedPlayers = isDebugMode ? players : [currentPlayer];

  const handleUnitClick = (unitId: string, pos: Position) => {
    eventBus.emit('cameraJump', pos);
    selectUnit(unitId);
    setReportsModalOpen(false);
  };

  const handleSettlementClick = (settlementId: string, pos: Position) => {
    eventBus.emit('cameraJump', pos);
    selectSettlement(settlementId);
    setSettlementScreenOpen(true);
    setReportsModalOpen(false);
  };

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[2500] pointer-events-auto backdrop-blur-sm">
      <div className="bg-slate-800 text-white p-6 rounded-xl w-[90vw] max-w-5xl h-[85vh] flex flex-col border border-slate-500 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-black uppercase tracking-tight">Reports</h2>
          <button
            onClick={() => { setReportsModalOpen(false); }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded transition-colors cursor-pointer"
          >
            Close (Esc)
          </button>
        </div>

        <div className="flex gap-2 mb-6 p-1 bg-slate-900/50 rounded-lg">
          {(['units', 'settlements', 'resources'] as ReportTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); }}
              className={`flex-1 py-3 px-4 rounded-md font-bold uppercase text-sm tracking-widest transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {activeTab === 'units' && (
            <UnitsTab
              displayedPlayers={displayedPlayers}
              onUnitClick={handleUnitClick}
            />
          )}
          {activeTab === 'settlements' && (
            <SettlementsTab
              displayedPlayers={displayedPlayers}
              onSettlementClick={handleSettlementClick}
            />
          )}
          {activeTab === 'resources' && (
            <ResourcesTab
              displayedPlayers={displayedPlayers}
              onSettlementClick={handleSettlementClick}
            />
          )}
        </div>
      </div>
    </div>
  );
};
