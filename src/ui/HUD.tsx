import React from 'react';
import { useGameStore } from '../game/state/gameStore';
import { UnitType } from '../game/entities/types';

export const HUD: React.FC = () => {
  const { players, currentPlayerId, turn, phase, setEuropeScreenOpen } = useGameStore();
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
        justifyContent: 'space-around',
        padding: '0 20px',
        pointerEvents: 'auto',
      }}
    >
      <div>Player: {currentPlayer?.name || 'N/A'}</div>
      <div>Gold: {currentPlayer?.gold ?? 0}</div>
      <div>Turn: {turn}</div>
      <div>Phase: {phase}</div>
      <button
        disabled={!hasShip}
        onClick={() => setEuropeScreenOpen(true)}
        style={{ cursor: hasShip ? 'pointer' : 'not-allowed' }}
      >
        Sail to Europe
      </button>
    </div>
  );
};
