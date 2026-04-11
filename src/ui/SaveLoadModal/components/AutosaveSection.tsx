import React from 'react';
import type { SaveMeta } from '../../../game/systems/SaveSystem';

interface Props {
  save: SaveMeta | undefined;
  onLoad: (slotName: string) => void;
  onDownload: (slotName: string) => void;
  onDelete: (slotName: string) => void;
}

export const AutosaveSection: React.FC<Props> = ({ save, onLoad, onDownload, onDelete }) => (
  <div className="mb-8">
    <h3 className="text-lg font-bold mb-3 text-blue-400 border-b border-slate-700 pb-1">Autosave</h3>
    {save ? (
      <div className="flex justify-between items-center p-4 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors">
        <div>
          <div className="font-bold">Turn {save.turn} - {save.playerName}</div>
          <div className="text-xs text-slate-400 mt-1">
            {new Date(save.timestamp).toLocaleString()}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { onDownload('autosave'); }}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded transition-colors cursor-pointer text-xs"
          >
            Download
          </button>
          <button
            onClick={() => { onLoad('autosave'); }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition-colors cursor-pointer text-sm"
          >
            Load
          </button>
          <button
            onClick={() => { onDelete('autosave'); }}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded transition-colors cursor-pointer text-xs"
          >
            Delete
          </button>
        </div>
      </div>
    ) : (
      <div className="p-4 text-slate-500 italic bg-slate-900/30 rounded-lg border border-slate-800">No autosave found</div>
    )}
  </div>
);
