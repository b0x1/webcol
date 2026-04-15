import { BuildingType, GoodType, JobType, TerrainType } from '../entities/types';

export interface ProductionRule {
  jobType: JobType;
  inputGood?: GoodType;
  outputGood?: GoodType;
  producesHammers?: boolean;
  requiredBuildings: BuildingType[];
}

export const JOB_PRODUCTION_RULES: Record<JobType, ProductionRule> = {
  [JobType.CARPENTER]: {
    jobType: JobType.CARPENTER,
    inputGood: GoodType.LUMBER,
    producesHammers: true,
    requiredBuildings: [BuildingType.CARPENTERS_SHOP, BuildingType.LUMBER_MILL],
  },
  [JobType.BLACKSMITH]: {
    jobType: JobType.BLACKSMITH,
    inputGood: GoodType.ORE,
    outputGood: GoodType.TOOLS,
    requiredBuildings: [BuildingType.BLACKSMITHS_HOUSE, BuildingType.BLACKSMITHS_SHOP, BuildingType.IRON_WORKS],
  },
  [JobType.DISTILLER]: {
    jobType: JobType.DISTILLER,
    inputGood: GoodType.SUGAR,
    outputGood: GoodType.RUM,
    requiredBuildings: [BuildingType.DISTILLERY],
  },
  [JobType.TAILOR]: {
    jobType: JobType.TAILOR,
    inputGood: GoodType.FURS,
    outputGood: GoodType.COATS,
    requiredBuildings: [BuildingType.TAILORS_SHOP],
  },
  [JobType.TOBACCONIST]: {
    jobType: JobType.TOBACCONIST,
    inputGood: GoodType.TOBACCO,
    outputGood: GoodType.CIGARS,
    requiredBuildings: [BuildingType.TOBACCONISTS_SHOP],
  },
  [JobType.ARMORER]: {
    jobType: JobType.ARMORER,
    inputGood: GoodType.TOOLS,
    outputGood: GoodType.MUSKETS,
    requiredBuildings: [BuildingType.ARMORY],
  },
  [JobType.WEAVER]: {
    jobType: JobType.WEAVER,
    inputGood: GoodType.COTTON,
    outputGood: GoodType.CLOTH,
    requiredBuildings: [BuildingType.WEAVERS_SHOP],
  },
  [JobType.LUMBERJACK]: {
    jobType: JobType.LUMBERJACK,
    outputGood: GoodType.LUMBER,
    requiredBuildings: [],
  },
  [JobType.MINER]: {
    jobType: JobType.MINER,
    outputGood: GoodType.ORE,
    requiredBuildings: [],
  },
};

export const TERRAIN_PRODUCTION_RULES: Partial<Record<TerrainType, GoodType>> = {
  [TerrainType.GRASSLAND]: GoodType.FOOD,
  [TerrainType.PRAIRIE]: GoodType.FOOD,
  [TerrainType.PLAINS]: GoodType.COTTON,
  [TerrainType.FOREST]: GoodType.LUMBER,
  [TerrainType.HILLS]: GoodType.ORE,
  [TerrainType.MOUNTAINS]: GoodType.ORE,
  [TerrainType.SWAMP]: GoodType.SUGAR,
  [TerrainType.MARSH]: GoodType.TOBACCO,
  [TerrainType.TUNDRA]: GoodType.FURS,
};
