import React from 'react';
import type { GoodType } from '../../../game/entities/types';
import { ResourceIcon } from '../../ResourceIcon';

interface GoodBoxProps {
  good: GoodType;
  stock: number;
  net?: number | undefined;
}

export const GoodBox: React.FC<GoodBoxProps> = ({ good, stock, net = 0 }) => {
  return (
    <div key={good} className="flex-1 min-w-[80px] bg-slate-800/50 rounded border border-slate-700/50 p-1.5 flex flex-col items-center justify-between shadow-sm relative group overflow-hidden">
      <div className="text-[9px] font-black uppercase tracking-tighter text-slate-400 self-start truncate w-full z-10" title={good.replace('_', ' ')}>
        {good.replace('_', ' ')}
      </div>
      <div className="flex items-center justify-between w-full mt-1 z-10">
        <div className="flex items-center gap-1">
          <ResourceIcon good={good} size={32} />
          <div className="text-sm font-black font-mono leading-none">
            {stock}
          </div>
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
