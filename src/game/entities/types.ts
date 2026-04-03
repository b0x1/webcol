export const GoodType = {
  FOOD: 'FOOD',
  LUMBER: 'LUMBER',
  ORE: 'ORE',
  TOBACCO: 'TOBACCO',
  COTTON: 'COTTON',
  FURS: 'FURS',
  TRADE_GOODS: 'TRADE_GOODS',
} as const;
export type GoodType = (typeof GoodType)[keyof typeof GoodType];

export const ResourceType = {
  FOREST: 'FOREST',
  ORE_DEPOSIT: 'ORE_DEPOSIT',
  FISH: 'FISH',
  FERTILE_LAND: 'FERTILE_LAND',
} as const;
export type ResourceType = (typeof ResourceType)[keyof typeof ResourceType];

export const UnitType = {
  COLONIST: 'COLONIST',
  SOLDIER: 'SOLDIER',
  PIONEER: 'PIONEER',
  SHIP: 'SHIP',
} as const;
export type UnitType = (typeof UnitType)[keyof typeof UnitType];

export const TerrainType = {
  OCEAN: 'OCEAN',
  COAST: 'COAST',
  PLAINS: 'PLAINS',
  FOREST: 'FOREST',
  HILLS: 'HILLS',
  MOUNTAINS: 'MOUNTAINS',
  GRASSLAND: 'GRASSLAND',
  PRAIRIE: 'PRAIRIE',
  TUNDRA: 'TUNDRA',
  ARCTIC: 'ARCTIC',
  DESERT: 'DESERT',
  SWAMP: 'SWAMP',
  MARSH: 'MARSH',
} as const;
export type TerrainType = (typeof TerrainType)[keyof typeof TerrainType];

export const BuildingType = {
  TOWN_HALL: 'TOWN_HALL',
  CARPENTERS_SHOP: 'CARPENTERS_SHOP',
  LUMBER_MILL: 'LUMBER_MILL',
  BLACKSMITHS_HOUSE: 'BLACKSMITHS_HOUSE',
  BLACKSMITHS_SHOP: 'BLACKSMITHS_SHOP',
  IRON_WORKS: 'IRON_WORKS',
  STABLES: 'STABLES',
  WAREHOUSE: 'WAREHOUSE',
} as const;
export type BuildingType = (typeof BuildingType)[keyof typeof BuildingType];

export const TurnPhase = {
  MOVEMENT: 'MOVEMENT',
  PRODUCTION: 'PRODUCTION',
  TRADE: 'TRADE',
  AI: 'AI',
  END_TURN: 'END_TURN',
} as const;
export type TurnPhase = (typeof TurnPhase)[keyof typeof TurnPhase];
