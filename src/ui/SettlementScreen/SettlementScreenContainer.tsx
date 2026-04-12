import React, { useEffect } from 'react';
import { useGameStore, selectCurrentPlayer, selectSettlementById, selectSettlementOwner, selectSettlementProduction, selectUnitsAtSettlement } from '../../game/state/gameStore';
import { useUIStore } from '../../game/state/uiStore';
import { useShallow } from 'zustand/react/shallow';
import { SettlementScreenView } from './SettlementScreenView';

export const SettlementScreenContainer: React.FC = () => {
  const { selectedSettlementId, selectSettlement } = useGameStore();
  const { isSettlementScreenOpen, setSettlementScreenOpen } = useUIStore();

  const player = useGameStore(selectCurrentPlayer);
  const settlement = useGameStore((state) => selectSettlementById(state, selectedSettlementId));
  const settlementOwner = useGameStore((state) => selectSettlementOwner(state, selectedSettlementId));
  const production = useGameStore(
    useShallow((state) =>
      selectedSettlementId ? selectSettlementProduction(state, selectedSettlementId) : undefined,
    ),
  );
  const unitsAtSettlement = useGameStore(
    useShallow((state) =>
      selectedSettlementId ? selectUnitsAtSettlement(state, selectedSettlementId) : [],
    ),
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSettlementScreenOpen && e.key === 'Escape') {
        e.preventDefault();
        setSettlementScreenOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSettlementScreenOpen, setSettlementScreenOpen]);

  const handleClose = () => {
    setSettlementScreenOpen(false);
    selectSettlement(null);
  };

  if (!isSettlementScreenOpen || !selectedSettlementId || !player || 
    !settlement || !settlementOwner || production === undefined) 
    return null;

  const isReadOnly = settlement.ownerId !== player.id;
  const { hammersProduced, netProduction } = production;

  return (
    <SettlementScreenView
      settlement={settlement}
      player={player}
      settlementOwner={settlementOwner}
      isReadOnly={isReadOnly}
      hammersProduced={hammersProduced}
      unitsAtSettlement={unitsAtSettlement}
      netProduction={netProduction}
      onClose={handleClose}
    />
  );
};
