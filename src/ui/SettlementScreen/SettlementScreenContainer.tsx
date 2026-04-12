import React, { useEffect, useMemo } from 'react';
import { getSettlementProduction, useGameStore } from '../../game/state/gameStore';
import { useUIStore } from '../../game/state/uiStore';
import { isSame } from '../../game/entities/Position';
import { SettlementScreenView } from './SettlementScreenView';

export const SettlementScreenContainer: React.FC = () => {
  const { selectedSettlementId, players, currentPlayerId, map, selectSettlement } = useGameStore();
  const { isSettlementScreenOpen, setSettlementScreenOpen } = useUIStore();

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

  const data = useMemo(() => {
    if (!isSettlementScreenOpen || !selectedSettlementId) return null;

    const player = players.find((p) => p.id === currentPlayerId);
    const settlementOwner = players.find((p) => p.settlements.some((s) => s.id === selectedSettlementId));
    const settlement = settlementOwner?.settlements.find((c) => c.id === selectedSettlementId);

    if (!settlement || !player || !settlementOwner) return null;

    const isReadOnly = settlement.ownerId !== currentPlayerId;
    const { hammersProduced, netProduction } = getSettlementProduction(settlement, map);

    // Collect units physically at the settlement
    const unitsAtSettlement = [
      ...settlement.units,
      ...settlementOwner.units.filter(u => isSame(u.position, settlement.position))
    ].reduce<typeof settlement.units>((acc, unit) => {
      // Avoid duplicates by ID
      if (!acc.find(u => u.id === unit.id)) {
        acc.push(unit);
      }
      return acc;
    }, []);

    return {
      settlement,
      player,
      settlementOwner,
      isReadOnly,
      hammersProduced,
      unitsAtSettlement,
      netProduction
    };
  }, [isSettlementScreenOpen, selectedSettlementId, players, currentPlayerId, map]);

  if (!data) return null;

  return (
    <SettlementScreenView
      {...data}
      onClose={handleClose}
    />
  );
};
