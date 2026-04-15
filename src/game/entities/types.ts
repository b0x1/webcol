export const GoodType = {
  FOOD: 'FOOD',
  LUMBER: 'LUMBER',
  ORE: 'ORE',
  TOBACCO: 'TOBACCO',
  COTTON: 'COTTON',
  FURS: 'FURS',
  SUGAR: 'SUGAR',
  RUM: 'RUM',
  CLOTH: 'CLOTH',
  COATS: 'COATS',
  CIGARS: 'CIGARS',
  TOOLS: 'TOOLS',
  TRADE_GOODS: 'TRADE_GOODS',
  MUSKETS: 'MUSKETS',
} as const;
export type GoodType = (typeof GoodType)[keyof typeof GoodType];

export const ResourceType = {
  TIMBER: 'TIMBER',
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
  VILLAGER: 'VILLAGER',
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
  SCHOOLHOUSE: 'SCHOOLHOUSE',
  STOCKADE: 'STOCKADE',
  PRINTING_PRESS: 'PRINTING_PRESS',
  DISTILLERY: 'DISTILLERY',
  WEAVERS_SHOP: 'WEAVERS_SHOP',
  TOBACCONISTS_SHOP: 'TOBACCONISTS_SHOP',
  TAILORS_SHOP: 'TAILORS_SHOP',
  ARMORY: 'ARMORY',
} as const;
export type BuildingType = (typeof BuildingType)[keyof typeof BuildingType];

export const JobType = {
  LUMBERJACK: 'LUMBERJACK',
  MINER: 'MINER',
  TOBACCONIST: 'TOBACCONIST',
  WEAVER: 'WEAVER',
  CARPENTER: 'CARPENTER',
  BLACKSMITH: 'BLACKSMITH',
  DISTILLER: 'DISTILLER',
  TAILOR: 'TAILOR',
  ARMORER: 'ARMORER',
} as const;
export type JobType = (typeof JobType)[keyof typeof JobType];

export const RureState = {
  MOVING: 'MOVING',
  SLEEPING: 'SLEEPING',
  FORTIFIED: 'FORTIFIED',
} as const;
export type RureState = (typeof RureState)[keyof typeof RureState];

export interface Rure {
  kind: 'RURE';
  state: RureState;
}

export interface FieldWork {
  kind: 'FIELD_WORK';
  tileX: number;
  tileY: number;
}

export type Occupation = JobType | FieldWork | Rure;

export const TurnPhase = {
  MOVEMENT: 'MOVEMENT',
  PRODUCTION: 'PRODUCTION',
  TRADE: 'TRADE',
  AI: 'AI',
  END_TURN: 'END_TURN',
} as const;
export type TurnPhase = (typeof TurnPhase)[keyof typeof TurnPhase];

export const Culture = {
  EUROPEAN: 'EUROPEAN',
  NATIVE: 'NATIVE',
} as const;
export type Culture = (typeof Culture)[keyof typeof Culture];

export const Organization = {
  TRIBE: 'TRIBE',
  CHIEFDOM: 'CHIEFDOM',
  STATE: 'STATE',
} as const;
export type Organization = (typeof Organization)[keyof typeof Organization];

export const Attitude = {
  FRIENDLY: 'FRIENDLY',
  NEUTRAL: 'NEUTRAL',
  HOSTILE: 'HOSTILE',
} as const;
export type Attitude = (typeof Attitude)[keyof typeof Attitude];

export const Nation = {
  // European States
  ENGLAND: 'ENGLAND',
  FRANCE: 'FRANCE',
  SPAIN: 'SPAIN',
  NETHERLANDS: 'NETHERLANDS',
  NORSEMEN: 'NORSEMEN',
  PORTUGAL: 'PORTUGAL',
  // Native States
  AZTEC: 'AZTEC',
  INCA: 'INCA',
  MAYA: 'MAYA',
  // Native Chiefdoms
  CAHOKIA: 'CAHOKIA',
  MUISCA: 'MUISCA',
  POWHATAN: 'POWHATAN',
  ARAWAK: 'ARAWAK',
  // Native Tribes
  IROQUOIS: 'IROQUOIS',
  HOHOKAM: 'HOHOKAM',
  PUEBLO: 'PUEBLO',
  OMAHA: 'OMAHA',
} as const;
export type Nation = (typeof Nation)[keyof typeof Nation];
