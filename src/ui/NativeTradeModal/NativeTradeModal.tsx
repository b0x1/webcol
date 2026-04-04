import React from 'react';
import { useGameStore } from '../../game/state/gameStore';
import { GoodType, Attitude, UnitType } from '../../game/entities/types';

export const NativeTradeModal: React.FC = () => {
  const {
    isNativeTradeModalOpen,
    activeSettlementId,
    nativeSettlements,
    players,
    currentPlayerId,
    selectedUnitId,
    setNativeTradeModalOpen,
    tradeWithNativeSettlement,
    learnFromNativeSettlement,
  } = useGameStore();

  if (!isNativeTradeModalOpen || !activeSettlementId) return null;

  const settlement = nativeSettlements.find((s) => s.id === activeSettlementId);
  const player = players.find((p) => p.id === currentPlayerId);
  const unit = player?.units.find((u) => u.id === selectedUnitId);

  if (!settlement || !unit) return null;

  const canLearn = unit.type === UnitType.COLONIST && settlement.attitude === Attitude.FRIENDLY;
  const cargoGoods = Array.from(unit.cargo.entries()).filter(([_, amount]) => amount > 0);

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: '#2d2d2d',
        color: '#ffffff',
        padding: '20px',
        border: '2px solid #8b4513',
        borderRadius: '8px',
        zIndex: 1000,
        pointerEvents: 'auto',
        minWidth: '300px',
      }}
    >
      <h3>{settlement.name}</h3>
      <p>Tribe: {settlement.tribe}</p>
      <p>Attitude: {settlement.attitude}</p>

      <div style={{ marginTop: '20px' }}>
        <h4>Trade</h4>
        {cargoGoods.length > 0 ? (
          <div>
            <p>Offer a good from your cargo:</p>
            {cargoGoods.map(([good, amount]) => (
              <button
                key={good}
                onClick={() => tradeWithNativeSettlement(settlement.id, unit.id, good as GoodType)}
                style={{
                  marginRight: '10px',
                  marginBottom: '10px',
                  padding: '5px 10px',
                  cursor: 'pointer',
                }}
              >
                {good} ({amount})
              </button>
            ))}
          </div>
        ) : (
          <p>No goods in cargo to trade.</p>
        )}
      </div>

      {canLearn && (
        <div style={{ marginTop: '20px' }}>
          <h4>Learn Land Skills</h4>
          <p>The natives are willing to teach you their ways.</p>
          <button
            onClick={() => learnFromNativeSettlement(settlement.id, unit.id)}
            style={{ padding: '5px 10px', cursor: 'pointer' }}
          >
            Train as Pioneer
          </button>
        </div>
      )}

      <div style={{ marginTop: '30px', textAlign: 'right' }}>
        <button
          onClick={() => setNativeTradeModalOpen(false)}
          style={{ padding: '5px 15px', cursor: 'pointer' }}
        >
          Close
        </button>
      </div>
    </div>
  );
};
