import React from 'react';
import type { Player } from '../../../game/entities/Player';
import { GoodType } from '../../../game/entities/types';
import { Flag } from '../../Flag';

interface Props {
  displayedPlayers: Player[];
  onSettlementClick: (settlementId: string, x: number, y: number) => void;
}

export const ResourcesTab: React.FC<Props> = ({ displayedPlayers, onSettlementClick }) => {
  const goods = Object.values(GoodType);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-600 bg-slate-800/50">
            <th className="p-3 font-bold sticky left-0 bg-slate-800 z-10">Flag</th>
            <th className="p-3 font-bold sticky left-[64px] bg-slate-800 z-10">Settlement</th>
            {goods.map(good => (
              <th key={good} className="p-3 text-[10px] uppercase tracking-wider font-bold text-slate-400">{good}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayedPlayers.map(player =>
            player.settlements.map((settlement) => (
              <tr
                key={settlement.id}
                className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors cursor-pointer"
                onClick={() => onSettlementClick(settlement.id, settlement.x, settlement.y)}
              >
                <td className="p-3 sticky left-0 bg-slate-800"><Flag nation={player.nation} size={24} /></td>
                <td className="p-3 font-bold sticky left-[64px] bg-slate-800 text-blue-300">{settlement.name}</td>
                {goods.map(good => (
                  <td key={good} className="p-3 font-mono">
                    {settlement.inventory.get(good) || 0}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
