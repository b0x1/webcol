import React, { useState, useEffect } from 'react';
import { useGameStore } from '../game/state/gameStore';
import { SaveSystem } from '../game/systems/SaveSystem';
import type { SaveMeta } from '../game/systems/SaveSystem';
import { eventBus } from '../game/state/EventBus';

export const SaveLoadModal: React.FC = () => {
  const isSaveModalOpen = useGameStore((state) => state.isSaveModalOpen);
  const isMainMenuOpen = useGameStore((state) => state.isMainMenuOpen);
  const setSaveModalOpen = useGameStore((state) => state.setSaveModalOpen);
  const loadGameState = useGameStore((state) => state.loadGameState);
  const gameState = useGameStore((state) => state);
  const resetGame = useGameStore((state) => state.resetGame);

  const [saves, setSaves] = useState<SaveMeta[]>([]);

  useEffect(() => {
    if (isSaveModalOpen) {
      setSaves(SaveSystem.listSaves());
    }
  }, [isSaveModalOpen]);

  if (!isSaveModalOpen) return null;

  const handleSave = (slotName: string) => {
    SaveSystem.save(gameState, slotName);
    setSaves(SaveSystem.listSaves());
  };

  const handleLoad = (slotName: string) => {
    const loadedState = SaveSystem.load(slotName);
    if (loadedState) {
      loadGameState(loadedState);
      eventBus.emit('gameLoaded');
    }
  };

  const handleDelete = (slotName: string) => {
    SaveSystem.deleteSave(slotName);
    setSaves(SaveSystem.listSaves());
  };

  const slots = ['1', '2', '3', '4', '5'];
  const autoSave = saves.find((s) => s.slotName === 'autosave');

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[2000] pointer-events-auto backdrop-blur-sm">
      <div className="bg-slate-800 text-white p-6 rounded-xl w-[500px] max-h-[80vh] overflow-y-auto border border-slate-500 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black uppercase tracking-tight">Save / Load Game</h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (confirm('Are you sure you want to return to the main menu? Unsaved progress will be lost.')) {
                  resetGame();
                  setSaveModalOpen(false);
                }
              }}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded transition-colors cursor-pointer text-sm"
            >
              Main Menu
            </button>
            <button
              onClick={() => setSaveModalOpen(false)}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded transition-colors cursor-pointer text-sm"
            >
              Close
            </button>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-bold mb-3 text-blue-400 border-b border-slate-700 pb-1">Autosave</h3>
          {autoSave ? (
            <div className="flex justify-between items-center p-4 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors">
              <div>
                <div className="font-bold">Turn {autoSave.turn} - {autoSave.playerName}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {new Date(autoSave.timestamp).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => handleLoad('autosave')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition-colors cursor-pointer"
              >
                Load
              </button>
            </div>
          ) : (
            <div className="p-4 text-slate-500 italic bg-slate-900/30 rounded-lg border border-slate-800">No autosave found</div>
          )}
        </div>

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
                      onClick={() => handleSave(slot)}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded transition-colors cursor-pointer text-xs"
                    >
                      {save ? 'Overwrite' : 'Save'}
                    </button>
                  )}
                  {save && (
                    <>
                      <button
                        onClick={() => handleLoad(slot)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition-colors cursor-pointer text-xs"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDelete(slot)}
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
      </div>
    </div>
  );
};
