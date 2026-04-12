import React from 'react';
import { GoodType } from '../../game/entities/types';
import type { Settlement } from '../../game/entities/Settlement';
import { GoodBox } from './components/GoodBox';

interface Props {
  settlement: Settlement;
  netProduction: Map<GoodType, number>;
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

export const InventoryPanel: React.FC<Props> = ({ settlement, netProduction }) => {
  return (
    <div className="flex flex-col gap-2 h-full">
      <div className="flex gap-1.5 h-1/2">
        {FINISHED_GOODS.map((good) => (
          <GoodBox
            key={good}
            good={good}
            stock={settlement.inventory.get(good) ?? 0}
            net={netProduction.get(good)}
          />
        ))}
      </div>
      <div className="flex gap-1.5 h-1/2">
        {RAW_MATERIALS.map((good) => (
          <GoodBox
            key={good}
            good={good}
            stock={settlement.inventory.get(good) ?? 0}
            net={netProduction.get(good)}
          />
        ))}
      </div>
    </div>
  );
};
