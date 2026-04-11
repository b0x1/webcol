import React, { useState, useEffect } from 'react';
import { useGameStore } from '../game/state/gameStore';
import { useUIStore } from '../game/state/uiStore';
import { SaveSystem } from '../game/systems/SaveSystem';
import type { SaveMeta } from '../game/systems/SaveSystem';
import { eventBus } from '../game/state/EventBus';
import { AutosaveSection } from './SaveLoadModal/components/AutosaveSection';
import { ManualSavesSection } from './SaveLoadModal/components/ManualSavesSection';

export const SaveLoadModal: React.FC = () => {
  const { isSaveModalOpen, isMainMenuOpen, setSaveModalOpen } = useUIStore();
  const loadGameState = useGameStore((state) => state.loadGameState);
  const gameState = useGameStore((state) => state);
  const resetGame = useGameStore((state) => state.resetGame);

  const [saves, setSaves] = useState<SaveMeta[]>(() =>
    isSaveModalOpen ? SaveSystem.listSaves() : [],
  );

  useEffect(() => {
    if (isSaveModalOpen) {
      const allSaves = SaveSystem.listSaves();
      setSaves(allSaves);
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

  const handleDownload = (slotName: string) => {
    SaveSystem.downloadSave(slotName);
  };

  const handleDelete = (slotName: string) => {
    if (confirm(`Are you sure you want to delete this save (${slotName})?`)) {
      SaveSystem.deleteSave(slotName);
      setSaves(SaveSystem.listSaves());
    }
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
              onClick={() => { setSaveModalOpen(false); }}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded transition-colors cursor-pointer text-sm"
            >
              Close (Esc)
            </button>
          </div>
        </div>

        <AutosaveSection
          save={autoSave}
          onLoad={handleLoad}
          onDownload={handleDownload}
          onDelete={handleDelete}
        />

        <ManualSavesSection
          slots={slots}
          saves={saves}
          isMainMenuOpen={isMainMenuOpen}
          onSave={handleSave}
          onLoad={handleLoad}
          onDownload={handleDownload}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
};
