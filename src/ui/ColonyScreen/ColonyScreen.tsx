import React from 'react';
import { useGameStore } from '../../game/state/gameStore';
import { BuildingSlots } from './BuildingSlots';
import { WorkforcePanel } from './WorkforcePanel';
import { InventoryPanel } from './InventoryPanel';

export const ColonyScreen: React.FC = () => {
  const { isColonyScreenOpen, selectedColonyId, players, setColonyScreenOpen, currentPlayerId } = useGameStore();

  if (!isColonyScreenOpen || !selectedColonyId) return null;

  const player = players.find((p) => p.id === currentPlayerId);
  const colony = player?.colonies.find((c) => c.id === selectedColonyId);

  if (!colony || !player) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        color: 'white',
        zIndex: 1000,
        pointerEvents: 'auto'
      }}
    >
      <div
        style={{
          width: '700px',
          backgroundColor: '#2c3e50',
          borderRadius: '12px',
          padding: '24px',
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gridTemplateRows: 'auto 1fr auto',
          gap: '20px',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0 }}>{colony.name}</h1>
            <div style={{ color: '#bdc3c7' }}>Population: {colony.population}</div>
          </div>
          <button
            onClick={() => setColonyScreenOpen(false)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>

        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <BuildingSlots colonyId={colony.id} ownedBuildings={colony.buildings} playerGold={player.gold} />
          <InventoryPanel
            inventory={colony.inventory}
            workforce={colony.workforce}
            buildings={colony.buildings}
            population={colony.population}
          />
        </div>

        <div style={{ height: '100%' }}>
          <WorkforcePanel colonyId={colony.id} units={colony.units} workforce={colony.workforce} />
        </div>

        <div style={{ gridColumn: 'span 2', textAlign: 'right', color: '#bdc3c7', fontSize: '0.9em' }}>
            Available Gold: {player.gold}g
        </div>
      </div>
    </div>
  );
};
