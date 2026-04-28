import React, { useEffect } from 'react';

interface Props {
  onConfirm: () => void;
  onCancel: () => void;
  remainingUnits: number;
}

export const EndTurnConfirmationModal: React.FC<Props> = ({ onConfirm, onCancel, remainingUnits }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('keydown', handleKeyDown); };
  }, [onConfirm, onCancel]);

  return (
    <div
      className="absolute inset-0 bg-black/70 flex items-center justify-center z-[3000] pointer-events-auto backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="end-turn-title"
      aria-describedby="end-turn-description"
    >
      <div className="bg-slate-800 text-white p-8 rounded-xl w-[400px] border border-slate-500 shadow-2xl">
        <h2 id="end-turn-title" className="text-2xl font-black uppercase tracking-tight mb-4 text-red-400">Wait a moment!</h2>
        <p id="end-turn-description" className="text-slate-300 mb-6 font-bold">
          You still have <span className="text-white">{remainingUnits}</span> unit{remainingUnits > 1 ? 's' : ''} that can move. Are you sure you want to end your turn?
        </p>
        <div className="flex gap-4">
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-sm rounded shadow-lg transition-all transform active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
          >
            Yes, End Turn
          </button>
          <button
            onClick={onCancel}
            autoFocus
            className="flex-1 py-3 bg-slate-600 hover:bg-slate-500 text-white font-black uppercase tracking-widest text-sm rounded shadow-lg transition-all transform active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 outline-none"
          >
            No, Back
          </button>
        </div>
      </div>
    </div>
  );
};
