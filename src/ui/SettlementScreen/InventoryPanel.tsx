import React, { useMemo } from 'react';
import { GoodType, BuildingType } from '../../game/entities/types';
import type { Tile } from '../../game/entities/Tile';
import type { Settlement } from '../../game/entities/Settlement';
import { ProductionSystem } from '../../game/systems/ProductionSystem';
import { COLONY_CONSTANTS } from '../../game/constants';

interface Props {
  settlement: Settlement;
  map: Tile[][];
}

export const InventoryPanel: React.FC<Props> = ({ settlement, map }) => {
  const { netProduction } = useMemo(
    () => ProductionSystem.calculateSettlementProduction(settlement, map),
    [settlement, map]
  );

  const cap = settlement.buildings.includes(BuildingType.WAREHOUSE)
    ? COLONY_CONSTANTS.WAREHOUSE_CAPACITY
    : COLONY_CONSTANTS.DEFAULT_CAPACITY;

  return (
    <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 shadow-inner">
      <h3 className="text-lg font-black uppercase tracking-tight mb-4 text-slate-300 flex justify-between items-center">
        Inventory
        <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">Cap: {cap}</span>
      </h3>
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-700 text-slate-500 text-[10px] uppercase tracking-widest">
            <th className="pb-2 font-bold">Good</th>
            <th className="pb-2 font-bold">Stock</th>
            <th className="pb-2 font-bold text-right">Net/Turn</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(GoodType).map((good) => {
            const stock = settlement.inventory.get(good) || 0;
            const net = netProduction.get(good) || 0;
            return (
              <tr key={good} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                <td className="py-2 text-slate-300 font-medium capitalize">{good.toLowerCase().replace('_', ' ')}</td>
                <td className="py-2 font-mono font-bold">{stock}</td>
                <td className={`py-2 text-right font-mono font-bold ${net > 0 ? 'text-green-400' : net < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                  {net > 0 ? '+' : ''}{net}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
