import React, { useState, useEffect } from 'react';
import { useGameStore } from '../game/state/gameStore';
import { SaveSystem } from '../game/systems/SaveSystem';
import type { SaveMeta } from '../game/systems/SaveSystem';
import { eventBus } from '../game/state/EventBus';

export const SaveLoadModal: React.FC = () => {
  const isSaveModalOpen = useGameStore((state) => state.isSaveModalOpen);
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
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          backgroundColor: '#2c3e50',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          width: '500px',
          maxHeight: '80vh',
          overflowY: 'auto',
          border: '2px solid #ecf0f1',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Save / Load Game</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to return to the main menu? Unsaved progress will be lost.')) {
                  resetGame();
                  setSaveModalOpen(false);
                }
              }}
              style={{ backgroundColor: '#e67e22', color: 'white' }}
            >
              Main Menu
            </button>
            <button onClick={() => setSaveModalOpen(false)}>Close</button>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>Autosave</h3>
          {autoSave ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                marginBottom: '5px',
              }}
            >
              <div>
                <div>Turn {autoSave.turn} - {autoSave.playerName}</div>
                <div style={{ fontSize: '0.8rem', color: '#bdc3c7' }}>
                  {new Date(autoSave.timestamp).toLocaleString()}
                </div>
              </div>
              <button onClick={() => handleLoad('autosave')}>Load</button>
            </div>
          ) : (
            <div style={{ padding: '10px', fontStyle: 'italic', color: '#bdc3c7' }}>No autosave found</div>
          )}
        </div>

        <h3>Manual Saves</h3>
        {slots.map((slot) => {
          const save = saves.find((s) => s.slotName === slot);
          return (
            <div
              key={slot}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                marginBottom: '10px',
                border: '1px solid #34495e',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold' }}>Slot {slot}</div>
                {save ? (
                  <>
                    <div>Turn {save.turn} - {save.playerName}</div>
                    <div style={{ fontSize: '0.8rem', color: '#bdc3c7' }}>
                      {new Date(save.timestamp).toLocaleString()}
                    </div>
                  </>
                ) : (
                  <div style={{ fontStyle: 'italic', color: '#7f8c8d' }}>Empty</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={() => handleSave(slot)}>{save ? 'Overwrite' : 'Save'}</button>
                {save && (
                  <>
                    <button onClick={() => handleLoad(slot)}>Load</button>
                    <button
                      onClick={() => handleDelete(slot)}
                      style={{ backgroundColor: '#c0392b', color: 'white' }}
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
  );
};
