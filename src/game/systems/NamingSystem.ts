import { Nation } from '../entities/types';

// European Nations
import englandSettlements from '../../assets/names/settlement/ENGLAND.txt?raw';
import englandUnits from '../../assets/names/unit/ENGLAND.txt?raw';
import englandShips from '../../assets/names/ship/ENGLAND.txt?raw';
import franceSettlements from '../../assets/names/settlement/FRANCE.txt?raw';
import franceUnits from '../../assets/names/unit/FRANCE.txt?raw';
import franceShips from '../../assets/names/ship/FRANCE.txt?raw';
import spainSettlements from '../../assets/names/settlement/SPAIN.txt?raw';
import spainUnits from '../../assets/names/unit/SPAIN.txt?raw';
import spainShips from '../../assets/names/ship/SPAIN.txt?raw';
import netherlandsSettlements from '../../assets/names/settlement/NETHERLANDS.txt?raw';
import netherlandsUnits from '../../assets/names/unit/NETHERLANDS.txt?raw';
import netherlandsShips from '../../assets/names/ship/NETHERLANDS.txt?raw';
import portugalSettlements from '../../assets/names/settlement/PORTUGAL.txt?raw';
import portugalUnits from '../../assets/names/unit/PORTUGAL.txt?raw';
import portugalShips from '../../assets/names/ship/PORTUGAL.txt?raw';
import norsemenSettlements from '../../assets/names/settlement/NORSEMEN.txt?raw';
import norsemenUnits from '../../assets/names/unit/NORSEMEN.txt?raw';
import norsemenShips from '../../assets/names/ship/NORSEMEN.txt?raw';

// Native Nations
import iroquoisSettlements from '../../assets/names/settlement/IROQUOIS.txt?raw';
import iroquoisUnits from '../../assets/names/unit/IROQUOIS.txt?raw';
import iroquoisShips from '../../assets/names/ship/IROQUOIS.txt?raw';
import aztecSettlements from '../../assets/names/settlement/AZTEC.txt?raw';
import aztecUnits from '../../assets/names/unit/AZTEC.txt?raw';
import aztecShips from '../../assets/names/ship/AZTEC.txt?raw';
import incaSettlements from '../../assets/names/settlement/INCA.txt?raw';
import incaUnits from '../../assets/names/unit/INCA.txt?raw';
import incaShips from '../../assets/names/ship/INCA.txt?raw';
import powhatanSettlements from '../../assets/names/settlement/POWHATAN.txt?raw';
import powhatanUnits from '../../assets/names/unit/POWHATAN.txt?raw';
import powhatanShips from '../../assets/names/ship/POWHATAN.txt?raw';
import mayaSettlements from '../../assets/names/settlement/MAYA.txt?raw';
import mayaUnits from '../../assets/names/unit/MAYA.txt?raw';
import mayaShips from '../../assets/names/ship/MAYA.txt?raw';
import cahokiaSettlements from '../../assets/names/settlement/CAHOKIA.txt?raw';
import cahokiaUnits from '../../assets/names/unit/CAHOKIA.txt?raw';
import cahokiaShips from '../../assets/names/ship/CAHOKIA.txt?raw';
import muiscaSettlements from '../../assets/names/settlement/MUISCA.txt?raw';
import muiscaUnits from '../../assets/names/unit/MUISCA.txt?raw';
import muiscaShips from '../../assets/names/ship/MUISCA.txt?raw';
import arawakSettlements from '../../assets/names/settlement/ARAWAK.txt?raw';
import arawakUnits from '../../assets/names/unit/ARAWAK.txt?raw';
import arawakShips from '../../assets/names/ship/ARAWAK.txt?raw';
import hohokamSettlements from '../../assets/names/settlement/HOHOKAM.txt?raw';
import hohokamUnits from '../../assets/names/unit/HOHOKAM.txt?raw';
import hohokamShips from '../../assets/names/ship/HOHOKAM.txt?raw';
import puebloSettlements from '../../assets/names/settlement/PUEBLO.txt?raw';
import puebloUnits from '../../assets/names/unit/PUEBLO.txt?raw';
import puebloShips from '../../assets/names/ship/PUEBLO.txt?raw';
import omahaSettlements from '../../assets/names/settlement/OMAHA.txt?raw';
import omahaUnits from '../../assets/names/unit/OMAHA.txt?raw';
import omahaShips from '../../assets/names/ship/OMAHA.txt?raw';

const parseList = (raw: string) => raw.split('\n').map(s => s.trim()).filter(Boolean);

const NAME_LISTS: Record<string, Record<string, string[]>> = {
  [Nation.ENGLAND]: { settlement: parseList(englandSettlements), unit: parseList(englandUnits), ship: parseList(englandShips) },
  [Nation.FRANCE]: { settlement: parseList(franceSettlements), unit: parseList(franceUnits), ship: parseList(franceShips) },
  [Nation.SPAIN]: { settlement: parseList(spainSettlements), unit: parseList(spainUnits), ship: parseList(spainShips) },
  [Nation.NETHERLANDS]: { settlement: parseList(netherlandsSettlements), unit: parseList(netherlandsUnits), ship: parseList(netherlandsShips) },
  [Nation.PORTUGAL]: { settlement: parseList(portugalSettlements), unit: parseList(portugalUnits), ship: parseList(portugalShips) },
  [Nation.NORSEMEN]: { settlement: parseList(norsemenSettlements), unit: parseList(norsemenUnits), ship: parseList(norsemenShips) },
  [Nation.IROQUOIS]: { settlement: parseList(iroquoisSettlements), unit: parseList(iroquoisUnits), ship: parseList(iroquoisShips) },
  [Nation.AZTEC]: { settlement: parseList(aztecSettlements), unit: parseList(aztecUnits), ship: parseList(aztecShips) },
  [Nation.INCA]: { settlement: parseList(incaSettlements), unit: parseList(incaUnits), ship: parseList(incaShips) },
  [Nation.POWHATAN]: { settlement: parseList(powhatanSettlements), unit: parseList(powhatanUnits), ship: parseList(powhatanShips) },
  [Nation.MAYA]: { settlement: parseList(mayaSettlements), unit: parseList(mayaUnits), ship: parseList(mayaShips) },
  [Nation.CAHOKIA]: { settlement: parseList(cahokiaSettlements), unit: parseList(cahokiaUnits), ship: parseList(cahokiaShips) },
  [Nation.MUISCA]: { settlement: parseList(muiscaSettlements), unit: parseList(muiscaUnits), ship: parseList(muiscaShips) },
  [Nation.ARAWAK]: { settlement: parseList(arawakSettlements), unit: parseList(arawakUnits), ship: parseList(arawakShips) },
  [Nation.HOHOKAM]: { settlement: parseList(hohokamSettlements), unit: parseList(hohokamUnits), ship: parseList(hohokamShips) },
  [Nation.PUEBLO]: { settlement: parseList(puebloSettlements), unit: parseList(puebloUnits), ship: parseList(puebloShips) },
  [Nation.OMAHA]: { settlement: parseList(omahaSettlements), unit: parseList(omahaUnits), ship: parseList(omahaShips) },
};

export type NamingStats = Record<string, {
  settlement: number;
  unit: number;
  ship: number;
}>;

export class NamingSystem {  // eslint-disable-line @typescript-eslint/no-extraneous-class
  static getNextName(nation: Nation, type: 'settlement' | 'unit' | 'ship', stats: NamingStats): { name: string; updatedStats: NamingStats } {
    const nationKey = nation as string;
    const lists = NAME_LISTS[nationKey] ?? NAME_LISTS[Nation.ENGLAND]; // Fallback to England if missing
    const list = lists[type] ?? lists.unit;

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
