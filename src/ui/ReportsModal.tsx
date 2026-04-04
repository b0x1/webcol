import React, { useState } from 'react';
import { useGameStore } from '../game/state/gameStore';
import { GoodType } from '../game/entities/types';

type ReportTab = 'units' | 'settlements' | 'resources';

export const ReportsModal: React.FC = () => {
  const { isReportsModalOpen, setReportsModalOpen, players, currentPlayerId } = useGameStore();
  const [activeTab, setActiveTab] = useState<ReportTab>('units');

  if (!isReportsModalOpen) return null;

  const player = players.find((p) => p.id === currentPlayerId);
  if (!player) return null;

  const renderUnitsReport = () => (
    <div>
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #555' }}>
            <th style={{ padding: '10px' }}>Unit Type</th>
            <th style={{ padding: '10px' }}>Position (X, Y)</th>
            <th style={{ padding: '10px' }}>Moves Left</th>
          </tr>
        </thead>
        <tbody>
          {player.units.map((unit) => (
            <tr key={unit.id} style={{ borderBottom: '1px solid #333' }}>
              <td style={{ padding: '10px' }}>{unit.type}</td>
              <td style={{ padding: '10px' }}>{unit.x}, {unit.y}</td>
              <td style={{ padding: '10px' }}>{unit.movesRemaining} / {unit.maxMoves}</td>
            </tr>
          ))}
          {player.colonies.flatMap(c => c.units).map((unit) => (
            <tr key={unit.id} style={{ borderBottom: '1px solid #333', fontStyle: 'italic' }}>
              <td style={{ padding: '10px' }}>{unit.type} (In Colony)</td>
              <td style={{ padding: '10px' }}>{unit.x}, {unit.y}</td>
              <td style={{ padding: '10px' }}>N/A</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderSettlementsReport = () => (
    <div>
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #555' }}>
            <th style={{ padding: '10px' }}>Name</th>
            <th style={{ padding: '10px' }}>Population</th>
            <th style={{ padding: '10px' }}>Buildings</th>
          </tr>
        </thead>
        <tbody>
          {player.colonies.map((colony) => (
            <tr key={colony.id} style={{ borderBottom: '1px solid #333' }}>
              <td style={{ padding: '10px' }}>{colony.name}</td>
              <td style={{ padding: '10px' }}>{colony.population}</td>
              <td style={{ padding: '10px' }}>{colony.buildings.join(', ') || 'None'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderResourcesReport = () => {
    const goods = Object.values(GoodType);
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #555' }}>
              <th style={{ padding: '10px' }}>Colony</th>
              {goods.map(good => (
                <th key={good} style={{ padding: '10px', fontSize: '0.8rem' }}>{good}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {player.colonies.map((colony) => (
              <tr key={colony.id} style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>{colony.name}</td>
                {goods.map(good => (
                  <td key={good} style={{ padding: '10px' }}>
                    {colony.inventory.get(good) || 0}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2500,
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          backgroundColor: '#2c3e50',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          width: '80vw',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          border: '2px solid #ecf0f1',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Reports</h2>
          <button onClick={() => setReportsModalOpen(false)}>Close</button>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('units')}
            style={{
              backgroundColor: activeTab === 'units' ? '#3498db' : '#34495e',
              flex: 1,
              padding: '10px',
            }}
          >
            Units
          </button>
          <button
            onClick={() => setActiveTab('settlements')}
            style={{
              backgroundColor: activeTab === 'settlements' ? '#3498db' : '#34495e',
              flex: 1,
              padding: '10px',
            }}
          >
            Settlements
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            style={{
              backgroundColor: activeTab === 'resources' ? '#3498db' : '#34495e',
              flex: 1,
              padding: '10px',
            }}
          >
            Resources
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'units' && renderUnitsReport()}
          {activeTab === 'settlements' && renderSettlementsReport()}
          {activeTab === 'resources' && renderResourcesReport()}
        </div>
      </div>
    </div>
  );
};
