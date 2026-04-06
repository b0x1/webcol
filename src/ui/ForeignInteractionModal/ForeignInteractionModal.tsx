import React, { useEffect } from 'react';
import { useGameStore } from '../../game/state/gameStore';
import { useUIStore } from '../../game/state/uiStore';
import { GoodType, Attitude, UnitType } from '../../game/entities/types';

export const ForeignInteractionModal: React.FC = () => {
  const {
    players,
    currentPlayerId,
    selectedUnitId,
    tradeWithSettlement,
    learnFromSettlement,
  } = useGameStore();

  const {
    isNativeTradeModalOpen,
    activeSettlementId,
    setNativeTradeModalOpen,
  } = useUIStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isNativeTradeModalOpen && e.key === 'Escape') {
        e.preventDefault();
        setNativeTradeModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNativeTradeModalOpen, setNativeTradeModalOpen]);

  if (!isNativeTradeModalOpen || !activeSettlementId) return null;

  const settlement = players.flatMap(p => p.settlements).find((s) => s.id === activeSettlementId);
  const player = players.find((p) => p.id === currentPlayerId);
  const unit = player?.units.find((u) => u.id === selectedUnitId);

  if (!settlement || !unit) return null;

  const canLearn = unit.type === UnitType.COLONIST && settlement.attitude === Attitude.FRIENDLY;
  const cargoGoods = Array.from(unit.cargo.entries()).filter(([_, amount]) => amount > 0);

  return (
    <div className="absolute inset-0 bg-black/85 flex items-center justify-center z-[1000] pointer-events-auto backdrop-blur-sm">
      <div className="w-[450px] bg-stone-900 text-stone-100 p-8 border-4 border-amber-900 rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="border-b-2 border-amber-900/50 pb-4 mb-6">
          <h3 className="text-3xl font-black uppercase tracking-tighter text-amber-500 italic">{settlement.name}</h3>
          <div className="flex gap-4 mt-2 text-xs font-bold uppercase tracking-widest text-stone-500">
            <span>Culture: <span className="text-stone-300">{settlement.culture}</span></span>
            <span>Attitude: <span className={`px-2 py-0.5 rounded ${
              settlement.attitude === Attitude.FRIENDLY ? 'bg-green-900/50 text-green-400' :
              settlement.attitude === Attitude.HOSTILE ? 'bg-red-900/50 text-red-400' :
              'bg-slate-800 text-slate-400'
            }`}>{settlement.attitude}</span></span>
          </div>
        </div>

        <div className="space-y-8">
          <section>
            <h4 className="text-lg font-black uppercase tracking-widest text-amber-700 mb-3 border-b border-amber-900/30 pb-1">Foreign Trade</h4>
            {cargoGoods.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-stone-400 font-medium italic">Offer a gift from your cargo to improve relations:</p>
                <div className="grid grid-cols-2 gap-2">
                  {cargoGoods.map(([good, amount]) => (
                    <button
                      key={good}
                      onClick={() => tradeWithSettlement(settlement.id, unit.id, good as GoodType)}
                      className="px-4 py-2 bg-stone-800 hover:bg-amber-900/40 text-stone-200 border border-stone-700 hover:border-amber-700 rounded font-bold text-xs transition-all cursor-pointer flex justify-between items-center group"
                    >
                      <span className="capitalize">{good.toLowerCase()}</span>
                      <span className="bg-stone-900 px-1.5 py-0.5 rounded text-[10px] text-stone-500 group-hover:text-amber-500 font-mono">{amount}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-stone-950/50 rounded border border-stone-800 text-stone-600 text-sm italic text-center">
                No goods in cargo to trade.
              </div>
            )}
          </section>

          {canLearn && (
            <section className="animate-in slide-in-from-bottom-2 duration-500">
              <h4 className="text-lg font-black uppercase tracking-widest text-amber-700 mb-3 border-b border-amber-900/30 pb-1">Wisdom of the Elders</h4>
              <div className="bg-amber-950/20 border border-amber-900/30 p-4 rounded-lg">
                <p className="text-stone-300 text-sm leading-relaxed mb-4">The inhabitants are willing to teach you the secrets of the land. Your <span className="text-amber-500 font-bold">Colonist</span> will become a <span className="text-amber-500 font-bold">Pioneer</span>.</p>
                <button
                  onClick={() => learnFromSettlement(settlement.id, unit.id)}
                  className="w-full py-3 bg-amber-700 hover:bg-amber-600 text-stone-100 font-black uppercase tracking-widest text-sm rounded shadow-lg transition-all transform active:scale-95 cursor-pointer"
                >
                  Learn Land Skills
                </button>
              </div>
            </section>
          )}
        </div>

        <div className="mt-10 pt-6 border-t border-amber-900/30 flex justify-end">
          <button
            onClick={() => setNativeTradeModalOpen(false)}
            className="px-8 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-100 font-bold rounded transition-all cursor-pointer text-sm"
          >
            Close (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
