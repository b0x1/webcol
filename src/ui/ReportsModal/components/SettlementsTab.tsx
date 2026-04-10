import React from 'react';
import type { Player } from '../../../game/entities/Player';
import { Flag } from '../../Flag';
import { ReportTable } from './ReportTable';
import type { Position } from '../../../game/entities/Position';

interface Props {
  displayedPlayers: Player[];
  onSettlementClick: (settlementId: string, pos: Position) => void;
}

export const SettlementsTab: React.FC<Props> = ({ displayedPlayers, onSettlementClick }) => (
  <ReportTable headers={['Flag', 'Name', 'Population', 'Buildings']}>
    {displayedPlayers.map((player) =>
      player.settlements.map((settlement) => (
        <tr
          key={settlement.id}
          className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors cursor-pointer"
          onClick={() => onSettlementClick(settlement.id, settlement.position)}
        >
          <td className="p-3">
            <Flag nation={player.nation} size={24} />
          </td>
          <td className="p-3 font-semibold text-blue-300">{settlement.name}</td>
          <td className="p-3">{settlement.population}</td>
          <td className="p-3 text-sm text-slate-300">{settlement.buildings.join(', ') || 'None'}</td>
        </tr>
      ))
    )}
  </ReportTable>
);
