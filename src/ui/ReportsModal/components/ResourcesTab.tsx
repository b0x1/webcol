import React from 'react';
import type { Player } from '../../../game/entities/Player';
import { GoodType } from '../../../game/entities/types';
import { Flag } from '../../Flag';
import { ReportTable } from './ReportTable';
import type { Position } from '../../../game/entities/Position';
import type { Tile } from '../../../game/entities/Tile';
import { ProductionSystem } from '../../../game/systems/ProductionSystem';

interface Props {
  displayedPlayers: Player[];
  onSettlementClick: (settlementId: string, pos: Position) => void;
  map: Tile[][];
}

export const ResourcesTab: React.FC<Props> = ({ displayedPlayers, onSettlementClick, map }) => {
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
        player.settlements.map((settlement) => {
          const { netProduction } = ProductionSystem.calculateSettlementProduction(settlement, map);
          return (
            <tr
              key={settlement.id}
              className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors cursor-pointer"
              onClick={() => { onSettlementClick(settlement.id, settlement.position); }}
            >
              <td className="p-3 sticky left-0 bg-slate-800">
                <Flag nation={player.nation} size={24} />
              </td>
              <td className="p-3 font-bold sticky left-[64px] bg-slate-800 text-blue-300">
                {settlement.name}
              </td>
              {goods.map((good) => {
                const stock = settlement.inventory.get(good) ?? 0;
                const net = netProduction.get(good) ?? 0;
                return (
                  <td key={good} className="p-3 font-mono">
                    <div className="flex items-center gap-2">
                      <span>{stock}</span>
                      {net !== 0 && (
                        <span className={`text-[10px] font-bold px-1 rounded ${net > 0 ? 'text-green-400 bg-green-900/20' : 'text-red-400 bg-red-900/20'}`}>
                          {net > 0 ? '+' : ''}{net}
                        </span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          );
        })
      )}
    </ReportTable>
  );
};
