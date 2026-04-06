import { TerrainType } from '../entities/types';

export class TileMap {
  public readonly width: number;
  public readonly height: number;
  public readonly data: TerrainType[][];

  constructor(width: number, height: number, data: TerrainType[][]) {
    this.width = width;
    this.height = height;
    this.data = data;
  }

  public getTerrainAt(x: number, y: number): TerrainType | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return null;
    }
    return this.data[y][x];
  }
}
