import React, { useState, useEffect } from 'react';
import { useGameStore } from '../game/state/gameStore';
import { useUIStore } from '../game/state/uiStore';
import { GoodType } from '../game/entities/types';
import { Flag } from './Flag';
import { eventBus } from '../game/state/EventBus';

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
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReportsModalOpen, setReportsModalOpen]);

  if (!isReportsModalOpen) return null;

  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  if (!currentPlayer) return null;

  const displayedPlayers = isDebugMode ? players : [currentPlayer];

  const handleUnitClick = (unitId: string, x: number, y: number) => {
    eventBus.emit('cameraJump', { x, y });
    selectUnit(unitId);
    setReportsModalOpen(false);
  };

  const handleSettlementClick = (settlementId: string, x: number, y: number) => {
    eventBus.emit('cameraJump', { x, y });
    selectSettlement(settlementId);
    setSettlementScreenOpen(true);
    setReportsModalOpen(false);
  };

  const renderUnitsReport = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-600 bg-slate-800/50">
            <th className="p-3 font-bold">Flag</th>
            <th className="p-3 font-bold">Unit Type</th>
            <th className="p-3 font-bold">Position (X, Y)</th>
            <th className="p-3 font-bold">Moves Left</th>
          </tr>
        </thead>
        <tbody>
          {displayedPlayers.map(player => (
            <React.Fragment key={player.id}>
              {player.units.map((unit) => (
                <tr
                  key={unit.id}
                  className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors cursor-pointer"
                  onClick={() => handleUnitClick(unit.id, unit.x, unit.y)}
                >
                  <td className="p-3"><Flag nation={player.nation} size={24} /></td>
                  <td className="p-3">{unit.type}</td>
                  <td className="p-3">{unit.x}, {unit.y}</td>
                  <td className="p-3 font-mono">{unit.movesRemaining} / {unit.maxMoves}</td>
                </tr>
              ))}
              {player.settlements.flatMap(c => c.units).map((unit) => (
                <tr
                  key={unit.id}
                  className="border-b border-slate-700 italic text-slate-400 hover:bg-slate-700/30 transition-colors cursor-pointer"
                  onClick={() => handleUnitClick(unit.id, unit.x, unit.y)}
                >
                  <td className="p-3"><Flag nation={player.nation} size={24} /></td>
                  <td className="p-3">{unit.type} (In Settlement)</td>
                  <td className="p-3">{unit.x}, {unit.y}</td>
                  <td className="p-3 font-mono text-xs opacity-50">N/A</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderSettlementsReport = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-600 bg-slate-800/50">
            <th className="p-3 font-bold">Flag</th>
            <th className="p-3 font-bold">Name</th>
            <th className="p-3 font-bold">Population</th>
            <th className="p-3 font-bold">Buildings</th>
          </tr>
        </thead>
        <tbody>
          {displayedPlayers.map(player =>
            player.settlements.map((settlement) => (
              <tr
                key={settlement.id}
                className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors cursor-pointer"
                onClick={() => handleSettlementClick(settlement.id, settlement.x, settlement.y)}
              >
                <td className="p-3"><Flag nation={player.nation} size={24} /></td>
                <td className="p-3 font-semibold text-blue-300">{settlement.name}</td>
                <td className="p-3">{settlement.population}</td>
                <td className="p-3 text-sm text-slate-300">{settlement.buildings.join(', ') || 'None'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderResourcesReport = () => {
    const goods = Object.values(GoodType);
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-600 bg-slate-800/50">
              <th className="p-3 font-bold sticky left-0 bg-slate-800 z-10">Flag</th>
              <th className="p-3 font-bold sticky left-[64px] bg-slate-800 z-10">Settlement</th>
              {goods.map(good => (
                <th key={good} className="p-3 text-[10px] uppercase tracking-wider font-bold text-slate-400">{good}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayedPlayers.map(player =>
              player.settlements.map((settlement) => (
                <tr
                  key={settlement.id}
                  className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors cursor-pointer"
                  onClick={() => handleSettlementClick(settlement.id, settlement.x, settlement.y)}
                >
                  <td className="p-3 sticky left-0 bg-slate-800"><Flag nation={player.nation} size={24} /></td>
                  <td className="p-3 font-bold sticky left-[64px] bg-slate-800 text-blue-300">{settlement.name}</td>
                  {goods.map(good => (
                    <td key={good} className="p-3 font-mono">
                      {settlement.inventory.get(good) || 0}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[2500] pointer-events-auto backdrop-blur-sm">
      <div className="bg-slate-800 text-white p-6 rounded-xl w-[90vw] max-w-5xl h-[85vh] flex flex-col border border-slate-500 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-black uppercase tracking-tight">Reports</h2>
          <button
            onClick={() => setReportsModalOpen(false)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded transition-colors cursor-pointer"
          >
            Close (Esc)
          </button>
        </div>

        <div className="flex gap-2 mb-6 p-1 bg-slate-900/50 rounded-lg">
          {(['units', 'settlements', 'resources'] as ReportTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
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
          {activeTab === 'units' && renderUnitsReport()}
          {activeTab === 'settlements' && renderSettlementsReport()}
          {activeTab === 'resources' && renderResourcesReport()}
        </div>
      </div>
    </div>
  );
};
