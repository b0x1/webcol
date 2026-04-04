import React, { useState } from 'react';
import { useGameStore } from '../../game/state/gameStore';
import { Nation } from '../../game/entities/types';
import { NATION_BONUSES } from '../../game/constants';

export const GameSetupModal: React.FC = () => {
  const isGameSetupModalOpen = useGameStore((state) => state.isGameSetupModalOpen);
  const setGameSetupModalOpen = useGameStore((state) => state.setGameSetupModalOpen);
  const initGame = useGameStore((state) => state.initGame);

  const [playerName, setPlayerName] = useState('Colonist');
  const [nation, setNation] = useState<Nation>(Nation.ENGLAND);
  const [mapSize, setMapSize] = useState<'Small' | 'Medium' | 'Large'>('Medium');
  const [aiCount, setAiCount] = useState(1);

  if (!isGameSetupModalOpen) return null;

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px',
    marginBottom: '20px',
    backgroundColor: '#34495e',
    color: 'white',
    border: '1px solid #7f8c8d',
    borderRadius: '4px',
    boxSizing: 'border-box',
  };

  const nationCardStyle = (n: Nation): React.CSSProperties => ({
    padding: '10px',
    marginBottom: '10px',
    backgroundColor: nation === n ? '#2980b9' : 'rgba(255, 255, 255, 0.05)',
    border: `2px solid ${nation === n ? '#ecf0f1' : 'transparent'}`,
    borderRadius: '4px',
    cursor: 'pointer',
    position: 'relative',
  });

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
        zIndex: 2000,
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          backgroundColor: '#2c3e50',
          color: 'white',
          padding: '30px',
          borderRadius: '8px',
          width: '500px',
          maxHeight: '80vh',
          overflowY: 'auto',
          border: '2px solid #ecf0f1',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Start New Game</h2>
          <button onClick={() => setGameSetupModalOpen(false)}>Cancel</button>
        </div>

        <label style={labelStyle}>Player Name</label>
        <input
          style={inputStyle}
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />

        <label style={labelStyle}>Select Nation</label>
        <div style={{ marginBottom: '20px' }}>
          {(Object.keys(Nation) as Nation[]).map((n) => (
            <div
              key={n}
              style={nationCardStyle(n)}
              onClick={() => setNation(n)}
              title={NATION_BONUSES[n].description}
            >
              <div style={{ fontWeight: 'bold' }}>{NATION_BONUSES[n].name}</div>
              <div style={{ fontSize: '0.8rem', color: '#bdc3c7' }}>
                {NATION_BONUSES[n].bonus}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Map Size</label>
            <select
              style={inputStyle}
              value={mapSize}
              onChange={(e) => setMapSize(e.target.value as any)}
            >
              <option value="Small">Small (40x30)</option>
              <option value="Medium">Medium (80x60)</option>
              <option value="Large">Large (120x90)</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>AI Opponents</label>
            <select
              style={inputStyle}
              value={aiCount}
              onChange={(e) => setAiCount(parseInt(e.target.value))}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </div>
        </div>

        <button
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '18px',
            backgroundColor: '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
          onClick={() => initGame({ playerName, nation, mapSize, aiCount })}
        >
          Start Game
        </button>
      </div>
    </div>
  );
};
