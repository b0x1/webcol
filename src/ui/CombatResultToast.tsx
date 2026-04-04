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
      return () => clearTimeout(timer);
    }
  }, [combatResult, clearCombatResult]);

  if (!combatResult) return null;

  const isSuccess = combatResult.winner === 'attacker';

  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: isSuccess ? 'rgba(46, 125, 50, 0.9)' : 'rgba(198, 40, 40, 0.9)',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        zIndex: 1000,
        pointerEvents: 'auto',
        fontWeight: 'bold',
        fontSize: '1.1rem',
        textAlign: 'center',
        border: '2px solid white',
      }}
    >
      {combatResult.message}
    </div>
  );
};
