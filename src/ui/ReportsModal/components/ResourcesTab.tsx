import React from 'react';
import type { Player } from '../../../game/entities/Player';
import { GoodType } from '../../../game/entities/types';
import { Flag } from '../../Flag';
import { ReportTable } from './ReportTable';
import type { Position } from '../../../game/entities/Position';

interface Props {
  displayedPlayers: Player[];
  onSettlementClick: (settlementId: string, pos: Position) => void;
}

export const ResourcesTab: React.FC<Props> = ({ displayedPlayers, onSettlementClick }) => {
  const goods = Object.values(GoodType);
  const headers = [
    { content: 'Flag', className: 'sticky left-0 bg-slate-800 z-10' },
    { content: 'Settlement', className: 'sticky left-[64px] bg-slate-800 z-10' },
    ...goods.map((good) => ({
      content: good,
      className: 'text-[10px] uppercase tracking-wider font-bold text-slate-400',
    })),
  ];

  return (
    <ReportTable headers={headers}>
      {displayedPlayers.map((player) =>
        player.settlements.map((settlement) => (
          <tr
            key={settlement.id}
            className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors cursor-pointer"
            onClick={() => onSettlementClick(settlement.id, settlement.position)}
          >
            <td className="p-3 sticky left-0 bg-slate-800">
              <Flag nation={player.nation} size={24} />
            </td>
            <td className="p-3 font-bold sticky left-[64px] bg-slate-800 text-blue-300">
              {settlement.name}
            </td>
            {goods.map((good) => (
              <td key={good} className="p-3 font-mono">
                {settlement.inventory.get(good) || 0}
              </td>
            ))}
          </tr>
        ))
      )}
    </ReportTable>
  );
};
