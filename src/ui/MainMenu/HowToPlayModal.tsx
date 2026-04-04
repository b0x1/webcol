import React from 'react';
import { useGameStore } from '../../game/state/gameStore';

export const HowToPlayModal: React.FC = () => {
  const isHowToPlayModalOpen = useGameStore((state) => state.isHowToPlayModalOpen);
  const setHowToPlayModalOpen = useGameStore((state) => state.setHowToPlayModalOpen);

  if (!isHowToPlayModalOpen) return null;

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
          width: '600px',
          maxHeight: '80vh',
          overflowY: 'auto',
          border: '2px solid #ecf0f1',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>How to Play</h2>
          <button onClick={() => setHowToPlayModalOpen(false)}>Close</button>
        </div>

        <div style={{ lineHeight: '1.6' }}>
          <h3>Objective</h3>
          <p>Explore the New World, establish thriving colonies, trade goods, and manage relations with native tribes.</p>

          <h3>Movement</h3>
          <p>Select a unit with Left Click. Right Click on a highlighted green tile to move.</p>

          <h3>Colonies</h3>
          <p>Found a colony by selecting a Colonist and clicking the "Found Colony" button in the Unit Panel. Within colonies, you can assign jobs, build structures, and manage inventory.</p>

          <h3>Trade</h3>
          <p>Use Ships to transport goods. You can trade with Europe or interact with Native Settlements for unique resources.</p>

          <h3>Combat</h3>
          <p>Move Soldier units onto enemy tiles to initiate combat. Combat outcomes depend on unit strength and various terrain/building modifiers.</p>
        </div>
      </div>
    </div>
  );
};
