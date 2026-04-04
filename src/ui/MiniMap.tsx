import React from 'react';
import { useGameStore } from '../game/state/gameStore';

export const MiniMap: React.FC = () => {
  const isMainMenuOpen = useGameStore((state) => state.isMainMenuOpen);
  if (isMainMenuOpen) return null;

  return (
    <div
      className="minimap"
      style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        width: '200px',
        height: '150px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        border: '2px solid #555',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
      }}
    >
      MiniMap Placeholder
    </div>
  );
};
