export const TerrainType = {
  OCEAN: 0,
  COAST: 1,
  PLAINS: 2,
  FOREST: 3,
  HILLS: 4,
  MOUNTAINS: 5,
} as const;

export type TerrainType = (typeof TerrainType)[keyof typeof TerrainType];
