import React, { useState } from 'react';
import { useGameStore } from '../../game/state/gameStore';
import { GoodType } from '../../game/entities/types';

export const MarketPanel: React.FC = () => {
  const { europePrices, players, currentPlayerId, selectedUnitId, sellGood, buyGood } =
    useGameStore();
  const player = players.find((p) => p.id === currentPlayerId);
  const selectedUnit = player?.units.find((u) => u.id === selectedUnitId);

  const [buyAmounts, setBuyAmounts] = useState<Record<string, number>>({});

  if (!selectedUnit) return <div>No unit selected</div>;

  return (
    <div
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: '10px',
        borderRadius: '5px',
        marginBottom: '20px',
      }}
    >
      <h3>Market</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid white' }}>
            <th>Good</th>
            <th>Price</th>
            <th>Cargo</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(GoodType).map((good) => {
            const price = europePrices[good];
            const cargo = selectedUnit.cargo.get(good) || 0;
            return (
              <tr key={good} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <td>{good}</td>
                <td>{price}g</td>
                <td>{cargo}</td>
                <td>
                  <button onClick={() => sellGood(selectedUnit.id, good, cargo)}>Sell All</button>
                  <input
                    type="number"
                    min="1"
                    style={{ width: '50px', marginLeft: '10px' }}
                    value={buyAmounts[good] || ''}
                    onChange={(e) =>
                      setBuyAmounts({ ...buyAmounts, [good]: parseInt(e.target.value) || 0 })
                    }
                  />
                  <button
                    onClick={() => {
                      const amount = buyAmounts[good] || 0;
                      if (amount > 0) buyGood(selectedUnit.id, good, amount);
                    }}
                  >
                    Buy
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
