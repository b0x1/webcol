import { ResourceType, TerrainType } from '../entities/types';

export const RESOURCE_TERRAIN_RULES: Record<ResourceType, TerrainType[]> = {
  [ResourceType.TIMBER]: [TerrainType.FOREST],
  [ResourceType.FISH]: [TerrainType.COAST, TerrainType.OCEAN],
  [ResourceType.ORE_DEPOSIT]: [TerrainType.HILLS, TerrainType.MOUNTAINS],
  [ResourceType.FERTILE_LAND]: [TerrainType.PLAINS, TerrainType.GRASSLAND, TerrainType.PRAIRIE],
};
