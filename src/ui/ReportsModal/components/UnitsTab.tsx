import React from 'react';
import type { Player } from '../../../game/entities/Player';
import { Flag } from '../../Flag';

interface Props {
  displayedPlayers: Player[];
  onUnitClick: (unitId: string, x: number, y: number) => void;
}

export const UnitsTab: React.FC<Props> = ({ displayedPlayers, onUnitClick }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b border-slate-600 bg-slate-800/50">
          <th className="p-3 font-bold">Flag</th>
          <th className="p-3 font-bold">Unit Type</th>
          <th className="p-3 font-bold">Position (X, Y)</th>
          <th className="p-3 font-bold">Moves Left</th>
        </tr>
      </thead>
      <tbody>
        {displayedPlayers.map(player => (
          <React.Fragment key={player.id}>
            {player.units.map((unit) => (
              <tr
                key={unit.id}
                className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors cursor-pointer"
                onClick={() => onUnitClick(unit.id, unit.position.x, unit.position.y)}
              >
                <td className="p-3"><Flag nation={player.nation} size={24} /></td>
                <td className="p-3">{unit.type}</td>
                <td className="p-3">{unit.position.x}, {unit.position.y}</td>
                <td className="p-3 font-mono">{unit.movesRemaining} / {unit.maxMoves}</td>
              </tr>
            ))}
            {player.settlements.flatMap(c => c.units).map((unit) => (
              <tr
                key={unit.id}
                className="border-b border-slate-700 italic text-slate-400 hover:bg-slate-700/30 transition-colors cursor-pointer"
                onClick={() => onUnitClick(unit.id, unit.position.x, unit.position.y)}
              >
                <td className="p-3"><Flag nation={player.nation} size={24} /></td>
                <td className="p-3">{unit.type} (In Settlement)</td>
                <td className="p-3">{unit.position.x}, {unit.position.y}</td>
                <td className="p-3 font-mono text-xs opacity-50">N/A</td>
              </tr>
            ))}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  </div>
);
