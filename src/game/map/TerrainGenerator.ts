import { createNoise2D } from 'simplex-noise';
import type { Nation } from '../entities/types';
import { TerrainType, Attitude, GoodType } from '../entities/types';
import type { Settlement } from '../entities/Settlement';
import { MAP_CONSTANTS, NATION_BONUSES } from '../constants';

export class TerrainGenerator {
  private width: number;
  private height: number;
  private noise2D: (x: number, y: number) => number;
  private random: () => number;

  constructor(width: number, height: number, seed = 'a-new-world') {
    this.width = width;
    this.height = height;

    // Simple pseudo-random seed to function with simplex-noise
    this.random = this.createRandom(seed);
    this.noise2D = createNoise2D(this.random);
  }

  private createRandom(seed: string) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }

    return () => {
      const t = (hash += 0x6d2b79f5);
      let z = Math.imul(t ^ (t >>> 15), t | 1);
      z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
      return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
    };
  }

  generate(): TerrainType[][] {
    const map: TerrainType[][] = [];

    for (let y = 0; y < this.height; y++) {
      const row: TerrainType[] = [];
      for (let x = 0; x < this.width; x++) {
        // Multi-layered noise for better terrain distribution
        const nx = x / this.width - 0.5;
        const ny = y / this.height - 0.5;

        // Base elevation noise
        const e =
          1 * this.noise2D(1 * nx, 1 * ny) +
          0.5 * this.noise2D(2 * nx, 2 * ny) +
          0.25 * this.noise2D(4 * nx, 4 * ny);

        const elevation = e / (1 + 0.5 + 0.25);

        // Secondary noise for features like forests
        const f = this.noise2D(6 * nx, 6 * ny);

        row.push(this.getTerrainFromElevation(elevation, f));
      }
      map.push(row);
    }

    return map;
  }

  generateSettlements(terrain: TerrainType[][]): Settlement[] {
    const settlements: Settlement[] = [];
    const count =
      MAP_CONSTANTS.NATIVE_SETTLEMENT_MIN_COUNT +
      Math.floor(
        this.random() *
          (MAP_CONSTANTS.NATIVE_SETTLEMENT_MAX_COUNT - MAP_CONSTANTS.NATIVE_SETTLEMENT_MIN_COUNT + 1),
      );

    const margin = MAP_CONSTANTS.NATIVE_SETTLEMENT_EDGE_MARGIN;
    const minDistance = MAP_CONSTANTS.NATIVE_SETTLEMENT_MIN_DISTANCE;

    const nativeNations = Object.entries(NATION_BONUSES)
      .filter(([_, data]) => data.culture === 'NATIVE')
      .map(([key, _]) => key as Nation);

    let attempts = 0;
    while (settlements.length < count && attempts < 500) {
      attempts++;
      const x = margin + Math.floor(this.random() * (this.width - 2 * margin));
      const y = margin + Math.floor(this.random() * (this.height - 2 * margin));

      if (terrain[y][x] === TerrainType.OCEAN || terrain[y][x] === TerrainType.COAST) {
        continue;
      }

      const tooClose = settlements.some((s) => {
        const dx = s.position.x - x;
        const dy = s.position.y - y;
        return Math.sqrt(dx * dx + dy * dy) < minDistance;
      });

      if (tooClose) continue;

      const nationKey = nativeNations[Math.floor(this.random() * nativeNations.length)];
      const nationData = NATION_BONUSES[nationKey];
      const id = `settlement-native-${settlements.length}-${Math.floor(this.random() * 1000000)}`;
      const name = `${nationData.name} Settlement`;

      const s: Settlement = {
        id,
        ownerId: nationKey, // Store nationKey directly as ownerId for now
        name,
        position: { x, y },
        population: 3 + Math.floor(this.random() * 5),
        culture: 'NATIVE',
        organization: nationData.organization,
        buildings: [],
        inventory: new Map(),
        productionQueue: [],
        workforce: new Map(),
        units: [],
        goods: new Map([
          [GoodType.FOOD, 50 + Math.floor(this.random() * 50)],
          [GoodType.FURS, 20 + Math.floor(this.random() * 30)],
        ]),
        attitude: Attitude.FRIENDLY,
        hammers: 0,
      };

      settlements.push(s);
    }

    return settlements;
  }

  private getTerrainFromElevation(e: number, f: number): TerrainType {
    if (e < -0.2) return TerrainType.OCEAN;
    if (e < -0.1) return TerrainType.COAST;

    // Land
    if (e > 0.4) return TerrainType.MOUNTAINS;
    if (e > 0.2) return TerrainType.HILLS;

    // Plains or Forests
    if (f > 0.3) return TerrainType.FOREST;

    return TerrainType.PLAINS;
  }
}
