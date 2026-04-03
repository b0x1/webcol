import React from 'react';
import { GoodType, JobType, BuildingType } from '../../game/entities/types';

interface Props {
  inventory: Map<GoodType, number>;
  workforce: Map<string, JobType>;
  buildings: BuildingType[];
  population: number;
}

export const InventoryPanel: React.FC<Props> = ({ inventory, workforce, buildings, population }) => {
  const calculateProduction = (good: GoodType) => {
    let prod = 0;

    // Base production from workforce
    workforce.forEach((job) => {
      if (job === JobType.FARMER && good === GoodType.FOOD) prod += 3;
      if (job === JobType.LUMBERJACK && good === GoodType.LUMBER) prod += 3;
      if (job === JobType.MINER && good === GoodType.ORE) prod += 3;
      if (job === JobType.TOBACCONIST && good === GoodType.TOBACCO) prod += 3;
      if (job === JobType.WEAVER && good === GoodType.TRADE_GOODS) prod += 3;
    });

    // Building bonuses
    if (good === GoodType.LUMBER && buildings.includes(BuildingType.LUMBER_MILL)) prod += 2;
    if (good === GoodType.ORE && buildings.includes(BuildingType.IRON_WORKS)) prod += 2;

    // Food consumption
    if (good === GoodType.FOOD) {
        prod -= population * 2;
    }

    return prod;
  };

  const cap = buildings.includes(BuildingType.WAREHOUSE) ? 400 : 200;

  return (
    <div style={{
      padding: '10px',
      backgroundColor: '#34495e',
      borderRadius: '8px'
    }}>
      <h3 style={{ marginTop: 0 }}>Inventory (Cap: {cap})</h3>
      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #7f8c8d' }}>
            <th>Good</th>
            <th>Stock</th>
            <th>Net/Turn</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(GoodType).map((good) => {
            const stock = inventory.get(good) || 0;
            const net = calculateProduction(good);
            return (
              <tr key={good} style={{ borderBottom: '1px solid #2c3e50' }}>
                <td>{good}</td>
                <td>{stock}</td>
                <td style={{ color: net >= 0 ? '#27ae60' : '#e74c3c' }}>
                  {net >= 0 ? '+' : ''}{net}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
