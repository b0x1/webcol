import React, { useState } from 'react';
import { useGameStore, selectSelectedUnit } from '../../game/state/gameStore';
import { GoodType } from '../../game/entities/types';

export const MarketPanel: React.FC = () => {
  const { europePrices, sellGood, buyGood } =
    useGameStore();
  const selectedUnit = useGameStore(selectSelectedUnit);

  const [buyAmounts, setBuyAmounts] = useState<Record<string, number>>({});

  if (!selectedUnit) return <div>No unit selected</div>;

  return (
    <div className="bg-slate-900/40 p-6 rounded-xl border border-slate-700 shadow-inner">
      <h3 className="text-2xl font-black uppercase tracking-tight mb-4 text-blue-300">Market Prices</h3>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-600 text-slate-400 text-xs uppercase tracking-widest bg-slate-800/30">
            <th className="p-3 font-bold">Good</th>
            <th className="p-3 font-bold">Price</th>
            <th className="p-3 font-bold">Cargo</th>
            <th className="p-3 font-bold text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(GoodType).map((good) => {
            const price = europePrices[good];
            const cargo = selectedUnit.cargo.get(good) ?? 0;
            return (
              <tr key={good} className="border-b border-slate-800 hover:bg-slate-700/20 transition-colors">
                <td className="p-3 font-bold capitalize">{good.toLowerCase().replace('_', ' ')}</td>
                <td className="p-3 font-mono text-yellow-400 font-bold">{price}g</td>
                <td className="p-3 font-mono">{cargo}</td>
                <td className="p-3 text-right">
                  <div className="flex justify-end items-center gap-2">
                    <button
                      onClick={() => { sellGood(selectedUnit.id, good, cargo); }}
                      disabled={cargo === 0}
                      className={`px-3 py-1 text-xs font-bold rounded transition-colors cursor-pointer ${
                        cargo > 0 ? 'bg-green-600 hover:bg-green-500 text-white shadow-sm' : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                      }`}
                    >
                      Sell All
                    </button>
                    <div className="flex items-center gap-1 ml-4 bg-slate-800 p-1 rounded border border-slate-600">
                      <input
                        type="number"
                        min="1"
                        className="w-12 bg-transparent text-white text-xs font-mono focus:outline-none px-1 text-center"
                        placeholder="Qty"
                        value={buyAmounts[good] || ''}
                        onChange={(e) =>
                          { setBuyAmounts({ ...buyAmounts, [good]: parseInt(e.target.value) }); }
                        }
                      />
                      <button
                        onClick={() => {
                          const amount = buyAmounts[good] ?? 0;
                          if (amount > 0) buyGood(selectedUnit.id, good, amount);
                        }}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded shadow-sm transition-colors cursor-pointer"
                      >
                        Buy
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
