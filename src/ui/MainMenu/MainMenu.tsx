import React from 'react';
import { useGameStore } from '../../game/state/gameStore';

export const MainMenu: React.FC = () => {
  const isMainMenuOpen = useGameStore((state) => state.isMainMenuOpen);
  const setGameSetupModalOpen = useGameStore((state) => state.setGameSetupModalOpen);
  const setHowToPlayModalOpen = useGameStore((state) => state.setHowToPlayModalOpen);
  const setSaveModalOpen = useGameStore((state) => state.setSaveModalOpen);

  if (!isMainMenuOpen) return null;

  const buttonStyle: React.CSSProperties = {
    padding: '12px 24px',
    fontSize: '20px',
    backgroundColor: '#34495e',
    color: 'white',
    border: '2px solid #ecf0f1',
    borderRadius: '4px',
    cursor: 'pointer',
    width: '200px',
    marginBottom: '10px',
    pointerEvents: 'auto',
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: '100px',
        }}
      >
        <button style={buttonStyle} onClick={() => setGameSetupModalOpen(true)}>
          New Game
        </button>
        <button style={buttonStyle} onClick={() => setSaveModalOpen(true)}>
          Load Game
        </button>
        <button style={buttonStyle} onClick={() => setHowToPlayModalOpen(true)}>
          How to Play
        </button>
      </div>
    </div>
  );
};
