import type { Tile } from '../entities/Tile';
import type { TerrainType } from '../entities/types';
import { ResourceType } from '../entities/types';
import { RESOURCE_TERRAIN_RULES } from '../rules/ResourceRules';

/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
export class MapInitializer {
  static initializeMap(terrainData: TerrainType[][], random: () => number): Tile[][] {
    return terrainData.map((row, y) =>
      row.map((type, x) => {
        const tile: Tile = {
          id: `${x}-${y}`,
          position: { x, y },
          terrainType: type,
          movementCost: 1,
          hasResource: null,
        };

        const possibleResources = (Object.keys(RESOURCE_TERRAIN_RULES) as ResourceType[]).filter(res =>
          RESOURCE_TERRAIN_RULES[res].includes(type)
        );

        if (possibleResources.length > 0) {
          for (const res of possibleResources) {
            let probability = 0.05;
            if (res === ResourceType.TIMBER || res === ResourceType.FERTILE_LAND) {
              probability = 0.1;
            }

            if (random() < probability) {
              tile.hasResource = res;
              break;
            }
          }
        }
        return tile;
      })
    );
  }
}
