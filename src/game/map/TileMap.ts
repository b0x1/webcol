import { TerrainType } from '../entities/types';
import type { Position } from '../entities/Position';

export class TileMap {
  public readonly width: number;
  public readonly height: number;
  public readonly data: TerrainType[][];

  constructor(width: number, height: number, data: TerrainType[][]) {
    this.width = width;
    this.height = height;
    this.data = data;
  }

  public getTerrainAt(pos: Position): TerrainType | null {
    if (pos.x < 0 || pos.x >= this.width || pos.y < 0 || pos.y >= this.height) {
      return null;
    }
    return this.data[pos.y][pos.x];
  }
}
