
import type { Settlement } from '../entities/Settlement';
import type { Unit } from '../entities/Unit';
import { GoodType, Attitude, UnitType, JobType } from '../entities/types';
import { TRADE_CONSTANTS } from '../constants';

 /* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
 export class ForeignInteractionSystem {
   private constructor() {
     // Static utility class
   }
  static trade(
    settlement: Settlement,
    unit: Unit,
    goodOffered: GoodType,
    random: () => number
  ): {
    updatedSettlement: Settlement;
    updatedUnit: Unit;
    goodReceived: GoodType;
  } {
    const amountOffered = unit.cargo.get(goodOffered) ?? 0;
    if (amountOffered <= 0) {
      throw new Error('Unit does not have the offered good');
    }

    // Update unit cargo: remove offered good
    const updatedUnitCargo = new Map(unit.cargo);
    updatedUnitCargo.delete(goodOffered);

    // Update settlement goods: add offered good
    const updatedSettlementGoods = new Map(settlement.goods);
    updatedSettlementGoods.set(
      goodOffered,
      (updatedSettlementGoods.get(goodOffered) ?? 0) + amountOffered
    );

    // Foreigner gives a random good from their inventory
    const foreignGoods = Array.from(settlement.goods.keys()).filter(g => (settlement.goods.get(g) ?? 0) > 0);
    const goodReceived = foreignGoods[Math.floor(random() * foreignGoods.length)] ?? GoodType.FOOD;
    const amountReceived = Math.min(
      TRADE_CONSTANTS.GIFT_CAP,
      settlement.goods.get(goodReceived) ?? TRADE_CONSTANTS.FOOD_FALLBACK,
    );

    updatedUnitCargo.set(goodReceived, (updatedUnitCargo.get(goodReceived) ?? 0) + amountReceived);
    updatedSettlementGoods.set(
      goodReceived,
      Math.max(0, (updatedSettlementGoods.get(goodReceived) ?? 0) - amountReceived)
    );

    const updatedSettlement: Settlement = {
      ...settlement,
      attitude: this.shiftAttitude(settlement.attitude),
      goods: updatedSettlementGoods,
    };

    const updatedUnit: Unit = {
      ...unit,
      cargo: updatedUnitCargo,
    };

    return { updatedSettlement, updatedUnit, goodReceived };
  }

  static learn(
    settlement: Settlement,
    unit: Unit
  ): {
    updatedSettlement: Settlement;
    updatedUnit: Unit;
  } {
    if (settlement.attitude !== Attitude.FRIENDLY) {
      throw new Error('Settlement is not friendly enough to teach');
    }

    if (unit.type !== UnitType.COLONIST) {
      throw new Error('Only colonists can learn from foreigners');
    }

    const updatedUnit: Unit = {
      ...unit,
      type: UnitType.PIONEER,
      expertise: JobType.LUMBERJACK,
      cargo: new Map(unit.cargo),
    };

    const updatedSettlement: Settlement = {
      ...settlement,
      attitude: Attitude.FRIENDLY,
      goods: new Map(settlement.goods),
    };

    return { updatedSettlement, updatedUnit };
  }

  static shiftAttitude(currentAttitude: Attitude): Attitude {
    if (currentAttitude === Attitude.HOSTILE) return Attitude.NEUTRAL;
    if (currentAttitude === Attitude.NEUTRAL) return Attitude.FRIENDLY;
    return Attitude.FRIENDLY;
  }
}
