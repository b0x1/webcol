export const MAP_CONSTANTS = {
  TILE_SIZE: 64,
  WIDTH: 80,
  HEIGHT: 60,
  NATIVE_SETTLEMENT_MIN_COUNT: 6,
  NATIVE_SETTLEMENT_MAX_COUNT: 10,
  NATIVE_SETTLEMENT_MIN_DISTANCE: 8,
  NATIVE_SETTLEMENT_EDGE_MARGIN: 8,
} as const;

export const UNIT_CONSTANTS = {
  DEFAULT_MOVES: 3,
  SHIP_MOVES: 6,
  PIONEER_MOVES: 3,
  SOLDIER_MOVES: 3,
  ANIMATION_DURATION: 200,
} as const;

export const COLONY_CONSTANTS = {
  INITIAL_POPULATION: 1,
  WAREHOUSE_CAPACITY: 400,
  DEFAULT_CAPACITY: 200,
  PRODUCTION_PER_WORKER: 3,
} as const;

export const BUILDING_COSTS = {
  LUMBER_MILL: 100,
  IRON_WORKS: 150,
  SCHOOLHOUSE: 120,
  WAREHOUSE: 80,
  STOCKADE: 200,
  PRINTING_PRESS: 180,
} as const;

export const RECRUITMENT_COSTS = {
  COLONIST: 500,
  SOLDIER: 800,
  PIONEER: 650,
} as const;

export const COMBAT_CONSTANTS = {
  UNIT_STRENGTHS: {
    COLONIST: 1,
    PIONEER: 1,
    SOLDIER: 3,
    SHIP: 2,
  },
  BASE_NATIVE_STRENGTH: 2,
  BASE_COLONY_STRENGTH: 1,
} as const;

export const NATION_BONUSES = {
  ENGLAND: {
    name: 'England',
    bonus: '+1 COLONIST at start',
    description: 'The English crown provides an extra colonist to help jumpstart your colony.',
  },
  FRANCE: {
    name: 'France',
    bonus: 'Native attitudes start FRIENDLY',
    description: 'French explorers are skilled at diplomacy, ensuring peaceful relations with natives from the start.',
  },
  SPAIN: {
    name: 'Spain',
    bonus: 'SOLDIER units cost 600g instead of 800g',
    description: 'The Spanish Empire maintains a powerful military at a reduced cost.',
  },
  NETHERLANDS: {
    name: 'Netherlands',
    bonus: 'Starting gold 200 instead of 100',
    description: 'Dutch merchants start with a larger treasury to fund their colonial ventures.',
  },
  NORSEMEN: {
    name: 'Norsemen',
    bonus: 'Placeholder bonus',
    description: 'Descendants of Vikings, skilled in seafaring and exploration.',
  },
  PORTUGAL: {
    name: 'Portugal',
    bonus: 'Placeholder bonus',
    description: 'Renowned for their navigation and early exploration of the new world.',
  },
} as const;
