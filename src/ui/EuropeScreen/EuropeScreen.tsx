import React from 'react';
import { useGameStore } from '../../game/state/gameStore';
import { MarketPanel } from './MarketPanel';
import { RecruitPanel } from './RecruitPanel';
import { UnitType } from '../../game/entities/types';

export const EuropeScreen: React.FC = () => {
  const { isEuropeScreenOpen, setEuropeScreenOpen, players, currentPlayerId, selectedUnitId } =
    useGameStore();
  const player = players.find((p) => p.id === currentPlayerId);
  const selectedUnit = player?.units.find((u) => u.id === selectedUnitId);

  if (!isEuropeScreenOpen) return null;

  const isShipSelected = selectedUnit?.type === UnitType.SHIP;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(40, 20, 0, 0.95)',
        color: 'white',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        padding: '40px',
        boxSizing: 'border-box',
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h2>Europe Trade</h2>
        <button
          onClick={() => setEuropeScreenOpen(false)}
          style={{ padding: '10px 20px', cursor: 'pointer' }}
        >
          Return to Colony
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {!isShipSelected ? (
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h3>Please select a SHIP to trade or recruit.</h3>
          </div>
        ) : (
          <>
            <MarketPanel />
            <RecruitPanel />
          </>
        )}
      </div>

      <div style={{ marginTop: '20px', textAlign: 'right' }}>
        <strong>Current Treasury: {player?.gold ?? 0} gold</strong>
      </div>
    </div>
  );
};
