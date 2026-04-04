import React from 'react';
import { useGameStore } from '../game/state/gameStore';
import { UnitType } from '../game/entities/types';

export const HUD: React.FC = () => {
  const {
    players,
    currentPlayerId,
    turn,
    setEuropeScreenOpen,
    setSaveModalOpen,
    setReportsModalOpen,
    isMainMenuOpen
  } = useGameStore();

  if (isMainMenuOpen) return null;

  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const hasShip = currentPlayer?.units.some((u) => u.type === UnitType.SHIP);

  return (
    <div
      className="hud"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '40px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        pointerEvents: 'auto',
        zIndex: 1000,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button onClick={() => setSaveModalOpen(true)}>Load / Save Game</button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
        <button onClick={() => setEuropeScreenOpen(true)} disabled={!hasShip} style={{ cursor: hasShip ? 'pointer' : 'not-allowed' }}>
          Sail to Europe
        </button>
        <div>Turn: {turn}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button onClick={() => setReportsModalOpen(true)}>Reports</button>
        <div style={{ minWidth: '100px' }}>Gold: {currentPlayer?.gold ?? 0}</div>
      </div>
    </div>
  );
};
