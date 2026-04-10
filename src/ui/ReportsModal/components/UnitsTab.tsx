import React from 'react';
import type { Player } from '../../../game/entities/Player';
import { Flag } from '../../Flag';
import { ReportTable } from './ReportTable';
import type { Position } from '../../../game/entities/Position';

interface Props {
  displayedPlayers: Player[];
  onUnitClick: (unitId: string, pos: Position) => void;
}

export const UnitsTab: React.FC<Props> = ({ displayedPlayers, onUnitClick }) => (
  <ReportTable headers={['Flag', 'Unit Type', 'Position (X, Y)', 'Moves Left']}>
    {displayedPlayers.map((player) => (
      <React.Fragment key={player.id}>
        {player.units.map((unit) => (
          <tr
            key={unit.id}
            className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors cursor-pointer"
            onClick={() => onUnitClick(unit.id, unit.position)}
          >
            <td className="p-3">
              <Flag nation={player.nation} size={24} />
            </td>
            <td className="p-3">{unit.type}</td>
            <td className="p-3">
              {unit.position.x}, {unit.position.y}
            </td>
            <td className="p-3 font-mono">
              {unit.movesRemaining} / {unit.maxMoves}
            </td>
          </tr>
        ))}
        {player.settlements
          .flatMap((c) => c.units)
          .map((unit) => (
            <tr
              key={unit.id}
              className="border-b border-slate-700 italic text-slate-400 hover:bg-slate-700/30 transition-colors cursor-pointer"
              onClick={() => onUnitClick(unit.id, unit.position)}
            >
              <td className="p-3">
                <Flag nation={player.nation} size={24} />
              </td>
              <td className="p-3">{unit.type} (In Settlement)</td>
              <td className="p-3">
                {unit.position.x}, {unit.position.y}
              </td>
              <td className="p-3 font-mono text-xs opacity-50">N/A</td>
            </tr>
          ))}
      </React.Fragment>
    ))}
  </ReportTable>
);
