import { TerrainType } from '../entities/types';

export const PIONEER_CLEARING: Partial<Record<TerrainType, TerrainType>> = {
  [TerrainType.FOREST]: TerrainType.PLAINS,
  [TerrainType.SWAMP]: TerrainType.GRASSLAND,
  [TerrainType.MARSH]: TerrainType.PRAIRIE,
};
