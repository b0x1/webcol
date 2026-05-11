import React from 'react';
import type { Player } from '@shared/game/entities/Player';
import { Flag } from '../../Flag';
import { Sprite } from '../../Sprite';
import { ReportTable } from './ReportTable';
import type { Position } from '@shared/game/entities/Position';

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
            onClick={() => { onUnitClick(unit.id, unit.position); }}
          >
            <td className="p-3">
              <Flag nation={player.nation} size={24} />
            </td>
            <td className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 relative shrink-0">
                  <Sprite type={unit.type} category="units" size={24} />
                </div>
                <span className="font-bold">{unit.type}</span>
              </div>
            </td>
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
              onClick={() => { onUnitClick(unit.id, unit.position); }}
            >
              <td className="p-3">
                <Flag nation={player.nation} size={24} />
              </td>
              <td className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 relative shrink-0 opacity-60">
                    <Sprite type={unit.type} category="units" size={24} />
                  </div>
                  <span>{unit.type} <span className="text-[10px] opacity-70">(In Settlement)</span></span>
                </div>
              </td>
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
