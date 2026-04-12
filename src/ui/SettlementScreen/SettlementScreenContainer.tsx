import React, { useEffect } from 'react';
import { useGameStore, selectCurrentPlayer, selectSettlementById, selectSettlementOwner, selectSettlementProduction, selectUnitsAtSettlement } from '../../game/state/gameStore';
import { useUIStore } from '../../game/state/uiStore';
import { useShallow } from 'zustand/react/shallow';
import { SettlementScreenView } from './SettlementScreenView';

export const SettlementScreenContainer: React.FC = () => {
  const { isSettlementScreenOpen, setSettlementScreenOpen, isDebugMode } = useUIStore();
  const {
    selectedSettlementId,
    selectSettlement,
    player,
    settlement,
    settlementOwner,
    production,
    unitsAtSettlement
  } = useGameStore(useShallow(state => ({
    selectedSettlementId: state.selectedSettlementId,
    selectSettlement: state.selectSettlement,
    player: selectCurrentPlayer(state),
    settlement: selectSettlementById(state, state.selectedSettlementId),
    settlementOwner: selectSettlementOwner(state, state.selectedSettlementId),
    production: state.selectedSettlementId ? selectSettlementProduction(state, state.selectedSettlementId) : undefined,
    unitsAtSettlement: state.selectedSettlementId ? selectUnitsAtSettlement(state, state.selectedSettlementId) : []
  })));

  useEffect(() => {
    if (selectedSettlementId && !isSettlementScreenOpen) {
      const isOwned = settlement?.ownerId === player?.id;
      if (isOwned || isDebugMode) {
        setSettlementScreenOpen(true);
      }
    }
  }, [selectedSettlementId, isSettlementScreenOpen, settlement?.ownerId, player?.id, isDebugMode, setSettlementScreenOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSettlementScreenOpen && e.key === 'Escape') {
        e.preventDefault();
        setSettlementScreenOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('keydown', handleKeyDown); };
  }, [isSettlementScreenOpen, setSettlementScreenOpen]);

  const handleClose = () => {
    setSettlementScreenOpen(false);
    selectSettlement(null);
  };

  if (!isSettlementScreenOpen || !selectedSettlementId || !player || !settlement || !settlementOwner || !production) return null;

  const isReadOnly = settlement.ownerId !== player.id;
  const { hammersProduced, netProduction } = production;

  return (
    <SettlementScreenView
      player={player}
      settlement={settlement}
      settlementOwner={settlementOwner}
      isReadOnly={isReadOnly}
      hammersProduced={hammersProduced}
      unitsAtSettlement={unitsAtSettlement}
      netProduction={netProduction}
      onClose={handleClose}
    />
  );
};
