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
    INDIAN_BRAVE: 2,
  },
  BASE_NATIVE_STRENGTH: 2,
  BASE_COLONY_STRENGTH: 1,
} as const;

export interface NationData {
  name: string;
  bonus: string;
  description: string;
  culture: 'EUROPEAN' | 'NATIVE';
  organization: 'TRIBE' | 'CHIEFDOM' | 'STATE';
}

export const NATION_BONUSES: Record<string, NationData> = {
  ENGLAND: {
    name: 'England',
    bonus: '+1 COLONIST at start',
    description: 'The English crown provides an extra colonist to help jumpstart your settlement.',
    culture: 'EUROPEAN',
    organization: 'STATE',
  },
  FRANCE: {
    name: 'France',
    bonus: 'Native attitudes start FRIENDLY',
    description: 'French explorers are skilled at diplomacy, ensuring peaceful relations with natives from the start.',
    culture: 'EUROPEAN',
    organization: 'STATE',
  },
  SPAIN: {
    name: 'Spain',
    bonus: 'SOLDIER units cost 600g instead of 800g',
    description: 'The Spanish Empire maintains a powerful military at a reduced cost.',
    culture: 'EUROPEAN',
    organization: 'STATE',
  },
  NETHERLANDS: {
    name: 'Netherlands',
    bonus: 'Starting gold 200 instead of 100',
    description: 'Dutch merchants start with a larger treasury to fund their colonial ventures.',
    culture: 'EUROPEAN',
    organization: 'STATE',
  },
  NORSEMEN: {
    name: 'Norsemen',
    bonus: 'Seafaring experts',
    description: 'Descendants of Vikings, skilled in seafaring and exploration.',
    culture: 'EUROPEAN',
    organization: 'STATE',
  },
  PORTUGAL: {
    name: 'Portugal',
    bonus: 'Expert navigators',
    description: 'Renowned for their navigation and early exploration of the new world.',
    culture: 'EUROPEAN',
    organization: 'STATE',
  },
  AZTEC: {
    name: 'Aztec',
    bonus: 'Powerful state organization',
    description: 'A mighty empire with highly organized military and agriculture.',
    culture: 'NATIVE',
    organization: 'STATE',
  },
  INCA: {
    name: 'Inca',
    bonus: 'Mountain masters',
    description: 'Skilled in mountain agriculture and high-altitude living.',
    culture: 'NATIVE',
    organization: 'STATE',
  },
  MAYA: {
    name: 'Maya',
    bonus: 'Advanced astronomy',
    description: 'Masters of mathematics and calendar systems.',
    culture: 'NATIVE',
    organization: 'STATE',
  },
  CAHOKIA: {
    name: 'Cahokia',
    bonus: 'Mound builders',
    description: 'Centuries of tradition in building large earthen mounds.',
    culture: 'NATIVE',
    organization: 'CHIEFDOM',
  },
  MUISCA: {
    name: 'Muisca',
    bonus: 'Golden traditions',
    description: 'Famed for their skilled goldsmiths and emerald mines.',
    culture: 'NATIVE',
    organization: 'CHIEFDOM',
  },
  POWHATAN: {
    name: 'Powhatan',
    bonus: 'Coastal masters',
    description: 'A powerful confederacy of tribes along the coast.',
    culture: 'NATIVE',
    organization: 'CHIEFDOM',
  },
  ARAWAK: {
    name: 'Arawak',
    bonus: 'Caribbean navigators',
    description: 'Peaceful islanders with deep knowledge of the sea.',
    culture: 'NATIVE',
    organization: 'CHIEFDOM',
  },
  IROQUOIS: {
    name: 'Iroquois',
    bonus: 'Great Law of Peace',
    description: 'A powerful confederacy governed by a council of chiefs.',
    culture: 'NATIVE',
    organization: 'TRIBE',
  },
  HOHOKAM: {
    name: 'Hohokam',
    bonus: 'Desert irrigation',
    description: 'Masters of desert survival and irrigation systems.',
    culture: 'NATIVE',
    organization: 'TRIBE',
  },
  PUEBLO: {
    name: 'Pueblo',
    bonus: 'Cliff dwellers',
    description: 'Skilled in building defensive multistoried houses.',
    culture: 'NATIVE',
    organization: 'TRIBE',
  },
  OMAHA: {
    name: 'Omaha',
    bonus: 'Plains hunters',
    description: 'Skilled in tracking and hunting on the Great Plains.',
    culture: 'NATIVE',
    organization: 'TRIBE',
  },
} as const;
