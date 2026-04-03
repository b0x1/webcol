import { createNoise2D } from 'simplex-noise';
import { TerrainType } from './TerrainType';

export class TerrainGenerator {
  private width: number;
  private height: number;
  private noise2D: (x: number, y: number) => number;

  constructor(width: number, height: number, seed = 'web-colonization') {
    this.width = width;
    this.height = height;

    // Simple pseudo-random seed to function with simplex-noise
    const seedFn = this.createRandom(seed);
    this.noise2D = createNoise2D(seedFn);
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
