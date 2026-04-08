import { Nation, UnitType } from '../entities/types';
import englandSettlements from '../../assets/names/settlement/ENGLAND.json';
import englandUnits from '../../assets/names/unit/ENGLAND.json';
import englandShips from '../../assets/names/ship/ENGLAND.json';
import franceSettlements from '../../assets/names/settlement/FRANCE.json';
import franceUnits from '../../assets/names/unit/FRANCE.json';
import franceShips from '../../assets/names/ship/FRANCE.json';
import spainSettlements from '../../assets/names/settlement/SPAIN.json';
import spainUnits from '../../assets/names/unit/SPAIN.json';
import spainShips from '../../assets/names/ship/SPAIN.json';
import netherlandsSettlements from '../../assets/names/settlement/NETHERLANDS.json';
import netherlandsUnits from '../../assets/names/unit/NETHERLANDS.json';
import netherlandsShips from '../../assets/names/ship/NETHERLANDS.json';
import portugalSettlements from '../../assets/names/settlement/PORTUGAL.json';
import portugalUnits from '../../assets/names/unit/PORTUGAL.json';
import portugalShips from '../../assets/names/ship/PORTUGAL.json';
import iroquoisSettlements from '../../assets/names/settlement/IROQUOIS.json';
import iroquoisUnits from '../../assets/names/unit/IROQUOIS.json';
import iroquoisShips from '../../assets/names/ship/IROQUOIS.json';
import aztecSettlements from '../../assets/names/settlement/AZTEC.json';
import aztecUnits from '../../assets/names/unit/AZTEC.json';
import aztecShips from '../../assets/names/ship/AZTEC.json';
import incaSettlements from '../../assets/names/settlement/INCA.json';
import incaUnits from '../../assets/names/unit/INCA.json';
import incaShips from '../../assets/names/ship/INCA.json';
import powhatanSettlements from '../../assets/names/settlement/POWHATAN.json';
import powhatanUnits from '../../assets/names/unit/POWHATAN.json';
import powhatanShips from '../../assets/names/ship/POWHATAN.json';

const NAME_LISTS: Record<string, Record<string, string[]>> = {
  [Nation.ENGLAND]: { settlement: englandSettlements, unit: englandUnits, ship: englandShips },
  [Nation.FRANCE]: { settlement: franceSettlements, unit: franceUnits, ship: franceShips },
  [Nation.SPAIN]: { settlement: spainSettlements, unit: spainUnits, ship: spainShips },
  [Nation.NETHERLANDS]: { settlement: netherlandsSettlements, unit: netherlandsUnits, ship: netherlandsShips },
  [Nation.PORTUGAL]: { settlement: portugalSettlements, unit: portugalUnits, ship: portugalShips },
  [Nation.IROQUOIS]: { settlement: iroquoisSettlements, unit: iroquoisUnits, ship: iroquoisShips },
  [Nation.AZTEC]: { settlement: aztecSettlements, unit: aztecUnits, ship: aztecShips },
  [Nation.INCA]: { settlement: incaSettlements, unit: incaUnits, ship: incaShips },
  [Nation.POWHATAN]: { settlement: powhatanSettlements, unit: powhatanUnits, ship: powhatanShips },
};

export interface NamingStats {
  [nation: string]: {
    settlement: number;
    unit: number;
    ship: number;
  };
}

export class NamingSystem {
  static getNextName(nation: Nation, type: 'settlement' | 'unit' | 'ship', stats: NamingStats): { name: string; updatedStats: NamingStats } {
    const nationKey = nation as string;
    const lists = NAME_LISTS[nationKey] || NAME_LISTS[Nation.ENGLAND]; // Fallback to England if missing
    const list = lists[type] || lists.unit;

    if (!stats[nationKey]) {
      stats[nationKey] = { settlement: 0, unit: 0, ship: 0 };
    }

    const currentIndex = stats[nationKey][type];
    const nameIndex = currentIndex % list.length;
    const cycle = Math.floor(currentIndex / list.length);

    let name = list[nameIndex];
    if (cycle > 0) {
      name = `${name} ${this.toRoman(cycle + 1)}`;
    }

    const updatedStats = {
      ...stats,
      [nationKey]: {
        ...stats[nationKey],
        [type]: currentIndex + 1,
      },
    };

    return { name, updatedStats };
  }

  private static toRoman(num: number): string {
    const romanMap: [number, string][] = [
      [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
      [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
      [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
    ];
    let result = '';
    for (const [val, symbol] of romanMap) {
      while (num >= val) {
        result += symbol;
        num -= val;
      }
    }
    return result;
  }
}
