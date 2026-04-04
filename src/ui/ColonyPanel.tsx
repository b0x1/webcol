import React from 'react';
import { useGameStore } from '../game/state/gameStore';

export const ColonyPanel: React.FC = () => {
  const { selectedColonyId, players, selectColony, setColonyScreenOpen, isMainMenuOpen } = useGameStore();

  if (isMainMenuOpen) return null;

  const colony = players
    .flatMap((p) => p.colonies)
    .find((c) => c.id === selectedColonyId);

  if (!colony) return null;

  return (
    <div
      className="colony-modal-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
      }}
      onClick={() => selectColony(null)}
    >
      <div
        className="colony-panel"
        style={{
          width: '400px',
          backgroundColor: '#2c3e50',
          color: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>{colony.name}</h2>
          <button onClick={() => selectColony(null)} style={{ cursor: 'pointer' }}>X</button>
        </div>
        <p>Population: {colony.population}</p>
        <div>
          <h3>Inventory:</h3>
          {colony.inventory.size === 0 ? (
            <p>Empty</p>
          ) : (
            <ul>
              {Array.from(colony.inventory.entries()).map(([good, amount]) => (
                <li key={good}>
                  {good}: {amount}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          onClick={() => setColonyScreenOpen(true)}
          style={{
            marginTop: '20px',
            width: '100%',
            padding: '10px',
            backgroundColor: '#3498db',
            border: 'none',
            color: 'white',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Manage Colony
        </button>
      </div>
    </div>
  );
};
