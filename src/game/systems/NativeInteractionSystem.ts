import { Settlement } from '../entities/Settlement';
import { Unit } from '../entities/Unit';
import { GoodType, Attitude, UnitType } from '../entities/types';

export class NativeInteractionSystem {
  static trade(
    settlement: Settlement,
    unit: Unit,
    goodOffered: GoodType
  ): {
    updatedSettlement: Settlement;
    updatedUnit: Unit;
    goodReceived: GoodType;
  } {
    const amountOffered = unit.cargo.get(goodOffered) || 0;
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
      (updatedSettlementGoods.get(goodOffered) || 0) + amountOffered
    );

    // Native gives a random good from their inventory
    const nativeGoods = Array.from(settlement.goods.keys()).filter(g => (settlement.goods.get(g) || 0) > 0);
    const goodReceived = nativeGoods[Math.floor(Math.random() * nativeGoods.length)] || GoodType.FOOD;
    const amountReceived = Math.min(20, settlement.goods.get(goodReceived) || 10);

    updatedUnitCargo.set(goodReceived, (updatedUnitCargo.get(goodReceived) || 0) + amountReceived);
    updatedSettlementGoods.set(
      goodReceived,
      Math.max(0, (updatedSettlementGoods.get(goodReceived) || 0) - amountReceived)
    );

    const updatedSettlement = new Settlement(
      settlement.id,
      settlement.ownerId,
      settlement.name,
      settlement.x,
      settlement.y,
      settlement.population,
      settlement.culture,
      settlement.organization
    );
    updatedSettlement.attitude = this.shiftAttitude(settlement.attitude);
    updatedSettlement.goods = updatedSettlementGoods;

    const updatedUnit = new Unit(
      unit.id,
      unit.ownerId,
      unit.type,
      unit.x,
      unit.y,
      unit.movesRemaining
    );
    updatedUnit.cargo = updatedUnitCargo;
    updatedUnit.maxMoves = unit.maxMoves;

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
      throw new Error('Only colonists can learn from natives');
    }

    const updatedUnit = new Unit(
      unit.id,
      unit.ownerId,
      UnitType.PIONEER,
      unit.x,
      unit.y,
      unit.movesRemaining
    );
    updatedUnit.cargo = new Map(unit.cargo);
    updatedUnit.maxMoves = unit.maxMoves;

    const updatedSettlement = new Settlement(
      settlement.id,
      settlement.ownerId,
      settlement.name,
      settlement.x,
      settlement.y,
      settlement.population,
      settlement.culture,
      settlement.organization
    );
    updatedSettlement.attitude = Attitude.NEUTRAL;
    updatedSettlement.goods = new Map(settlement.goods);

    return { updatedSettlement, updatedUnit };
  }

  static shiftAttitude(currentAttitude: Attitude): Attitude {
    if (currentAttitude === Attitude.FRIENDLY) return Attitude.NEUTRAL;
    if (currentAttitude === Attitude.NEUTRAL) return Attitude.HOSTILE;
    return Attitude.HOSTILE;
  }
}
