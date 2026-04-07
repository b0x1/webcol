import React, { useMemo } from 'react';
import { GoodType } from '../../game/entities/types';
import type { Tile } from '../../game/entities/Tile';
import type { Settlement } from '../../game/entities/Settlement';
import { ProductionSystem } from '../../game/systems/ProductionSystem';
import { ResourceIcon } from '../ResourceIcon';

interface Props {
  settlement: Settlement;
  map: Tile[][];
}

const RAW_MATERIALS = [
  GoodType.FOOD,
  GoodType.LUMBER,
  GoodType.ORE,
  GoodType.TOBACCO,
  GoodType.COTTON,
  GoodType.FURS,
  GoodType.SUGAR,
];

const FINISHED_GOODS = [
  GoodType.RUM,
  GoodType.CLOTH,
  GoodType.COATS,
  GoodType.CIGARS,
  GoodType.TOOLS,
  GoodType.MUSKETS,
  GoodType.TRADE_GOODS,
];

export const InventoryPanel: React.FC<Props> = ({ settlement, map }) => {
  const { netProduction } = useMemo(
    () => ProductionSystem.calculateSettlementProduction(settlement, map),
    [settlement, map]
  );

  const renderGoodBox = (good: GoodType) => {
    const stock = settlement.inventory.get(good) || 0;
    const net = netProduction.get(good) || 0;

    return (
      <div key={good} className="flex-1 min-w-[80px] bg-slate-800/50 rounded border border-slate-700/50 p-1.5 flex flex-col items-center justify-between shadow-sm relative group overflow-hidden">
        <div className="absolute top-0 right-0 p-0.5 pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity">
            <ResourceIcon good={good} size={24} />
        </div>
        <div className="text-[9px] font-black uppercase tracking-tighter text-slate-400 self-start truncate w-full z-10" title={good.replace('_', ' ')}>
          {good.replace('_', ' ')}
        </div>
        <div className="flex items-end justify-between w-full mt-1 z-10">
          <div className="text-sm font-black font-mono leading-none">
            {stock}
          </div>
          {net !== 0 && (
            <div className={`text-[10px] font-bold font-mono leading-none px-1 rounded ${net > 0 ? 'text-green-400 bg-green-900/20' : 'text-red-400 bg-red-900/20'}`}>
              {net > 0 ? '+' : ''}{net}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex gap-1.5 h-1/2">
        {FINISHED_GOODS.map(renderGoodBox)}
      </div>
      <div className="flex gap-1.5 h-1/2">
        {RAW_MATERIALS.map(renderGoodBox)}
      </div>
    </div>
  );
};
