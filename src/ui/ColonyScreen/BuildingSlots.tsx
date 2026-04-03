import React from 'react';
import { BuildingType } from '../../game/entities/types';
import { useGameStore } from '../../game/state/gameStore';

const BUILDINGS_LIST = [
  { type: BuildingType.LUMBER_MILL, name: 'Lumber Mill', bonus: '+2 LUMBER/turn', cost: 100 },
  { type: BuildingType.IRON_WORKS, name: 'Iron Works', bonus: '+2 ORE/turn', cost: 150 },
  { type: BuildingType.SCHOOLHOUSE, name: 'Schoolhouse', bonus: 'Unlocks PIONEER', cost: 120 },
  { type: BuildingType.WAREHOUSE, name: 'Warehouse', bonus: '400 Storage', cost: 80 },
  { type: BuildingType.STOCKADE, name: 'Stockade', bonus: '+2 Defense', cost: 200 },
  { type: BuildingType.PRINTING_PRESS, name: 'Printing Press', bonus: '+1 Growth', cost: 180 },
];

interface Props {
  colonyId: string;
  ownedBuildings: BuildingType[];
  playerGold: number;
}

export const BuildingSlots: React.FC<Props> = ({ colonyId, ownedBuildings, playerGold }) => {
  const buyBuilding = useGameStore((state) => state.buyBuilding);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '10px',
      padding: '10px',
      backgroundColor: '#34495e',
      borderRadius: '8px'
    }}>
      {BUILDINGS_LIST.map((b) => {
        const isBuilt = ownedBuildings.includes(b.type);
        const canAfford = playerGold >= b.cost;

        return (
          <div key={b.type} style={{
            padding: '10px',
            backgroundColor: isBuilt ? '#27ae60' : '#7f8c8d',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '100px'
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '0.9em' }}>{b.name}</div>
            <div style={{ fontSize: '0.8em' }}>{b.bonus}</div>
            {!isBuilt && (
              <button
                onClick={() => buyBuilding(colonyId, b.type)}
                disabled={!canAfford}
                style={{
                  marginTop: '5px',
                  padding: '4px',
                  fontSize: '0.8em',
                  cursor: canAfford ? 'pointer' : 'not-allowed',
                  backgroundColor: canAfford ? '#f1c40f' : '#bdc3c7',
                  border: 'none',
                  borderRadius: '2px'
                }}
              >
                Build ({b.cost}g)
              </button>
            )}
            {isBuilt && <div style={{ fontSize: '0.8em', color: '#ecf0f1', textAlign: 'center' }}>Built</div>}
          </div>
        );
      })}
    </div>
  );
};
