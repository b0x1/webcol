import React from 'react';

interface Props {
  onConfirm: () => void;
  onCancel: () => void;
  remainingUnits: number;
}

export const EndTurnConfirmationModal: React.FC<Props> = ({ onConfirm, onCancel, remainingUnits }) => {
  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-[3000] pointer-events-auto backdrop-blur-sm">
      <div className="bg-slate-800 text-white p-8 rounded-xl w-[400px] border border-slate-500 shadow-2xl">
        <h2 className="text-2xl font-black uppercase tracking-tight mb-4 text-red-400">Wait a moment!</h2>
        <p className="text-slate-300 mb-6 font-bold">
          You still have <span className="text-white">{remainingUnits}</span> unit{remainingUnits > 1 ? 's' : ''} that can move. Are you sure you want to end your turn?
        </p>
        <div className="flex gap-4">
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-sm rounded shadow-lg transition-all transform active:scale-95 cursor-pointer"
          >
            Yes, End Turn
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-slate-600 hover:bg-slate-500 text-white font-black uppercase tracking-widest text-sm rounded shadow-lg transition-all transform active:scale-95 cursor-pointer"
          >
            No, Back
          </button>
        </div>
      </div>
    </div>
  );
};
