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
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          width: '400px',
          backgroundColor: '#2d2d2d',
          color: '#ffffff',
          padding: '24px',
          border: '2px solid #8b4513',
          borderRadius: '12px',
          maxHeight: '80vh',
          overflowY: 'auto',
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
            style={{
              padding: '10px 20px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
