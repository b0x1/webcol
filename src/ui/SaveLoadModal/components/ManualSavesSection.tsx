import React from 'react';
import type { SaveMeta } from '../../../game/systems/SaveSystem';

interface Props {
  slots: string[];
  saves: SaveMeta[];
  isMainMenuOpen: boolean;
  onSave: (slotName: string) => void;
  onLoad: (slotName: string) => void;
  onDownload: (slotName: string) => void;
  onDelete: (slotName: string) => void;
}

export const ManualSavesSection: React.FC<Props> = ({ slots, saves, isMainMenuOpen, onSave, onLoad, onDownload, onDelete }) => (
  <>
    <h3 className="text-lg font-bold mb-3 text-blue-400 border-b border-slate-700 pb-1">Manual Saves</h3>
    <div className="space-y-3">
      {slots.map((slot) => {
        const save = saves.find((s) => s.slotName === slot);
        return (
          <div
            key={slot}
            className="flex justify-between items-center p-4 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors"
          >
            <div className="flex-1">
              <div className="font-black text-slate-300">Slot {slot}</div>
              {save ? (
                <>
                  <div className="font-bold">Turn {save.turn} - {save.playerName}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {new Date(save.timestamp).toLocaleString()}
                  </div>
                </>
              ) : (
                <div className="text-sm text-slate-500 italic mt-1">Empty</div>
              )}
            </div>
            <div className="flex gap-2">
              {!isMainMenuOpen && (
                <button
                  onClick={() => onSave(slot)}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded transition-colors cursor-pointer text-xs"
                >
                  {save ? 'Overwrite' : 'Save'}
                </button>
              )}
              {save && (
                <>
                  <button
                    onClick={() => onDownload(slot)}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded transition-colors cursor-pointer text-xs"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => onLoad(slot)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition-colors cursor-pointer text-xs"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => onDelete(slot)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded transition-colors cursor-pointer text-xs"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  </>
);
