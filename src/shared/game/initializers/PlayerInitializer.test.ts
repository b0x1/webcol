import { describe, expect, it } from 'vitest';
import { NATION_BONUSES } from '../constants';
import { createTile } from '../entities/Tile';
import { Nation, TerrainType, UnitType } from '../entities/types';
import { PlayerInitializer } from './PlayerInitializer';

function mapWithNearbyOcean(): ReturnType<typeof createTile>[][] {
  const size = 22;
  const map = [];
  for (let y = 0; y < size; y += 1) {
    const row = [];
    for (let x = 0; x < size; x += 1) {
      const terrain = x === 11 && y === 10 ? TerrainType.OCEAN : TerrainType.PLAINS;
      row.push(createTile(`${x}-${y}`, x, y, terrain, 1));
    }
    map.push(row);
  }
  return map;
}

describe('PlayerInitializer', () => {
  it('gives every European nation unique starting unit ids', () => {
    const map = mapWithNearbyOcean();
    const europeanNations = Object.values(Nation).filter(
      (nation) => NATION_BONUSES[nation]?.culture === 'EUROPEAN',
    );

    for (const nation of europeanNations) {
      const { humanPlayer } = PlayerInitializer.initializeHumanPlayer(
        'Player',
        nation,
        map,
        {},
        (prefix) => `${prefix}-1`,
      );
      const ids = humanPlayer.units.map((unit) => unit.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(humanPlayer.units.filter((unit) => unit.type === UnitType.SHIP)).toHaveLength(1);
    }
  });
});
