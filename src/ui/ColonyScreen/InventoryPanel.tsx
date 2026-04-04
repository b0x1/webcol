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
            const stock = inventory.get(good) || 0;
            const net = calculateProduction(good);
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
