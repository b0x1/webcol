import React from 'react';
import { useGameStore } from '../../game/state/gameStore';
import { UnitType, GoodType } from '../../game/entities/types';

export const RecruitPanel: React.FC = () => {
  const { players, currentPlayerId, selectedUnitId, recruitUnit } = useGameStore();
  const player = players.find((p) => p.id === currentPlayerId);
  const selectedUnit = player?.units.find((u) => u.id === selectedUnitId);

  const unitsToRecruit = [
    { type: UnitType.COLONIST, cost: 500, requirement: 'None' },
    { type: UnitType.SOLDIER, cost: 800, requirement: '50 Muskets' },
    { type: UnitType.PIONEER, cost: 650, requirement: 'None' },
  ];

  if (!selectedUnit || selectedUnit.type !== UnitType.SHIP) return null;

  return (
    <div
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: '10px',
        borderRadius: '5px',
      }}
    >
      <h3>Recruit Units</h3>
      <div style={{ display: 'flex', gap: '20px' }}>
        {unitsToRecruit.map((u) => {
          const canAffordGold = (player?.gold || 0) >= u.cost;
          const hasMuskets =
            u.type !== UnitType.SOLDIER || (selectedUnit.cargo.get(GoodType.MUSKETS) || 0) >= 50;
          const canRecruit = canAffordGold && hasMuskets;

          return (
            <div
              key={u.type}
              style={{
                border: '1px solid white',
                padding: '10px',
                borderRadius: '5px',
                flex: 1,
                textAlign: 'center',
              }}
            >
              <h4>{u.type}</h4>
              <p>Cost: {u.cost}g</p>
              <p>Req: {u.requirement}</p>
              <button disabled={!canRecruit} onClick={() => recruitUnit(u.type)}>
                Recruit
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
