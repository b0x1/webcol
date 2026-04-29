import React, { useEffect, useMemo } from 'react';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';
import {
  useGameStore,
  selectCurrentPlayer,
  selectSettlementById,
  selectSettlementOwner,
  selectUnitsAtSettlement,
  getSettlementProduction,
} from '../../game/state/gameStore';
import { useUIStore } from '../../game/state/uiStore';
import type { Unit } from '../../game/entities/Unit';
import { SettlementScreenView } from './SettlementScreenView';

const EMPTY_UNITS: Unit[] = [];

export const SettlementScreenContainer: React.FC = () => {
  const { isSettlementScreenOpen, setSettlementScreenOpen, isDebugMode } = useUIStore();
  const selectedSettlementId = useStoreWithEqualityFn(useGameStore, (state) => state.selectedSettlementId);
  const selectSettlement = useStoreWithEqualityFn(useGameStore, (state) => state.selectSettlement);
  const player = useStoreWithEqualityFn(useGameStore, selectCurrentPlayer);
  const settlement = useStoreWithEqualityFn(useGameStore, (state) =>
    selectSettlementById(state, state.selectedSettlementId),
  );
  const settlementOwner = useStoreWithEqualityFn(useGameStore, (state) =>
    selectSettlementOwner(state, state.selectedSettlementId),
  );
  const map = useStoreWithEqualityFn(useGameStore, (state) => state.map);
  const unitsAtSettlement = useStoreWithEqualityFn(
    useGameStore,
    (state) =>
      state.selectedSettlementId
        ? selectUnitsAtSettlement(state, state.selectedSettlementId)
        : EMPTY_UNITS,
    shallow,
  );
  const production = useMemo(
    () =>
      settlement && map.length > 0 ? getSettlementProduction(settlement, map) : undefined,
    // ⚡ Turbo: Depend only on settlement.units and settlement.buildings as those are the only factors affecting production
    // This avoids redundant calculations when settlement inventory or hammers change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settlement?.units, settlement?.buildings, map],
  );

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
    const state = useGameStore.getState();
    const currentTile = state.selectedTile;
    if (currentTile) {
      // Re-select tile but skip auto-selection to avoid re-entering settlement
      state.selectTile(currentTile, { skipAutoSelection: true });
    }
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
