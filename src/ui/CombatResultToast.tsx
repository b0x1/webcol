import React, { useEffect } from 'react';
import { useGameStore } from '../game/state/gameStore';

export const CombatResultToast: React.FC = () => {
  const combatResult = useGameStore((state) => state.combatResult);
  const clearCombatResult = useGameStore((state) => state.clearCombatResult);

  useEffect(() => {
    if (combatResult) {
      const timer = setTimeout(() => {
        clearCombatResult();
      }, 3000);
      return () => { clearTimeout(timer); };
    }
  }, [combatResult, clearCombatResult]);

  if (!combatResult) return null;

  const isSuccess = combatResult.winner === 'attacker';

  return (
    <div
      className={`absolute top-5 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-xl z-[1000] pointer-events-auto font-bold text-lg text-center border-2 border-white text-white ${
        isSuccess ? 'bg-green-700/90' : 'bg-red-700/90'
      }`}
    >
      {combatResult.message}
    </div>
  );
};
