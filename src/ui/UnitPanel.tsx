import React from 'react';
import { useGameStore } from '../game/state/gameStore';

export const UnitPanel: React.FC = () => {
  const { selectedUnitId, players, endTurn, isMainMenuOpen } = useGameStore();

  if (isMainMenuOpen) return null;

  const unit = players
    .flatMap((p) => p.units)
    .find((u) => u.id === selectedUnitId);

  if (!unit) return null;

  const foundColony = useGameStore((state) => state.foundColony);

  return (
    <div
      className="unit-panel"
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        width: '250px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        pointerEvents: 'auto',
      }}
    >
      <h3>Unit: {unit.type}</h3>
      <p>Moves: {unit.movesRemaining} / {unit.maxMoves}</p>
      <div>
        Cargo:
        {unit.cargo.size === 0 ? (
          <span> Empty</span>
        ) : (
          <ul>
            {Array.from(unit.cargo.entries()).map(([good, amount]) => (
              <li key={good}>
                {good}: {amount}
              </li>
            ))}
          </ul>
        )}
      </div>
      {unit.type === 'COLONIST' && (
        <button
          onClick={() => foundColony(unit.id)}
          style={{
            marginTop: '10px',
            width: '100%',
            padding: '8px',
            cursor: 'pointer',
            backgroundColor: '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          Found Colony
        </button>
      )}
      <button
        onClick={() => endTurn()}
        style={{
          marginTop: '10px',
          width: '100%',
          padding: '8px',
          cursor: 'pointer',
        }}
      >
        End Turn
      </button>
    </div>
  );
};
