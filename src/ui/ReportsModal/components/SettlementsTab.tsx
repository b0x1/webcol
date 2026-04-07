import React from 'react';
import type { Player } from '../../../game/entities/Player';
import { Flag } from '../../Flag';

interface Props {
  displayedPlayers: Player[];
  onSettlementClick: (settlementId: string, x: number, y: number) => void;
}

export const SettlementsTab: React.FC<Props> = ({ displayedPlayers, onSettlementClick }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b border-slate-600 bg-slate-800/50">
          <th className="p-3 font-bold">Flag</th>
          <th className="p-3 font-bold">Name</th>
          <th className="p-3 font-bold">Population</th>
          <th className="p-3 font-bold">Buildings</th>
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
              <td className="p-3"><Flag nation={player.nation} size={24} /></td>
              <td className="p-3 font-semibold text-blue-300">{settlement.name}</td>
              <td className="p-3">{settlement.population}</td>
              <td className="p-3 text-sm text-slate-300">{settlement.buildings.join(', ') || 'None'}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);
