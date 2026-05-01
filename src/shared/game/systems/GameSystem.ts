import type { Player } from '../entities/Player';
import type { Tile } from '../entities/Tile';
import type { Settlement } from '../entities/Settlement';
import { Nation, UnitType, TerrainType, Attitude, ResourceType } from '../entities/types';
import { TerrainGenerator } from '../map/TerrainGenerator';
import { RESOURCE_TERRAIN_RULES } from '../rules/ResourceRules';
import { NATION_BONUSES } from '../constants';
import type { Unit } from '../entities/Unit';
import { createUnit } from '../entities/Unit';
import { NamingSystem, type NamingStats } from './NamingSystem';

/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
export class GameSystem {
  private constructor() {
    // Static utility class
  }

  static initGame(params: {
    playerName: string;
    nation: Nation;
    mapSize: 'Small' | 'Medium' | 'Large';
    aiCount: number;
    random: () => number;
    generateId: (prefix: string) => string;
  }): {
    map: Tile[][];
    players: Player[];
    namingStats: NamingStats;
  } {
    const { nation, mapSize, aiCount, random, generateId } = params;
    const playerName = (params.playerName || 'Colonist').trim().slice(0, 24);
    const dimensions = {
      Small: { width: 40, height: 30 },
      Medium: { width: 80, height: 60 },
      Large: { width: 120, height: 90 },
    }[mapSize];

    const generator = new TerrainGenerator(dimensions.width, dimensions.height);
    const terrainData = generator.generate();
    const generatedNativeSettlements = generator.generateSettlements(terrainData);

    const map = this.initializeMap(terrainData, random);
    let namingStats: NamingStats = {};

    const humanResult = this.initializeHumanPlayer(
      playerName,
      nation,
      map,
      namingStats,
      generateId
    );
    namingStats = humanResult.namingStats;

    const aiResult = this.initializeAIPlayers(
      humanResult.humanPlayer,
      map,
      aiCount,
      generatedNativeSettlements,
      namingStats,
      random,
      generateId
    );

    return {
      map,
      players: aiResult.players,
      namingStats: aiResult.namingStats,
    };
  }

  private static initializeMap(terrainData: TerrainType[][], random: () => number): Tile[][] {
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

  private static initializeHumanPlayer(
    playerName: string,
    nation: Nation,
    map: Tile[][],
    namingStats: NamingStats,
    _generateId: (prefix: string) => string
  ): { humanPlayer: Player; namingStats: NamingStats } {
    let currentNamingStats = namingStats;
    const startingGold = nation === Nation.NETHERLANDS ? 200 : 100;
    const nationData = NATION_BONUSES[nation];
    if (!nationData) throw new Error(`Invalid nation: ${nation}`);

    const humanPlayer: Player = {
      id: 'player-1',
      name: playerName,
      isHuman: true,
      gold: startingGold,
      nation,
      units: [],
      settlements: [],
    };

    const width = map[0]?.length ?? 0;
    const height = map.length;

    let startX = Math.floor(width / 2);
    let startY = Math.floor(height / 2);
    let found = false;

    for (let y = 10; y < height - 10; y++) {
      for (let x = 10; x < width - 10; x++) {
        const tile = map[y]?.[x];
        if (tile && tile.terrainType !== TerrainType.OCEAN && tile.terrainType !== TerrainType.COAST) {
          startX = x;
          startY = y;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    const units: Unit[] = [];
    if (nationData.culture === 'EUROPEAN') {
      const startingUnitTypes = [UnitType.COLONIST, UnitType.COLONIST, UnitType.SOLDIER, UnitType.PIONEER];
      if (nation === Nation.ENGLAND) {
        startingUnitTypes.push(UnitType.COLONIST);
      }

      startingUnitTypes.forEach((type, i) => {
        const { name, updatedStats } = NamingSystem.getNextName(nation, 'unit', currentNamingStats);
        currentNamingStats = updatedStats;
        units.push(
          createUnit(`u${i + 1}`, 'player-1', name, type, startX + (type === UnitType.SOLDIER ? 1 : 0), startY + (type === UnitType.PIONEER ? 1 : 0), 3)
        );
      });

      let shipX = startX;
      let shipY = startY;
      found = false;
      for (let d = 1; d < 10; d++) {
        for (let dy = -d; dy <= d; dy++) {
          for (let dx = -d; dx <= d; dx++) {
            const nx = startX + dx;
            const ny = startY + dy;
            const tile = map[ny]?.[nx];
            if (tile?.terrainType === TerrainType.OCEAN) {
              shipX = nx;
              shipY = ny;
              found = true;
              break;
            }
          }
          if (found) break;
        }
        if (found) break;
      }
      const { name: shipName, updatedStats: shipStats } = NamingSystem.getNextName(nation, 'ship', currentNamingStats);
      currentNamingStats = shipStats;
      units.push(createUnit('u5', 'player-1', shipName, UnitType.SHIP, shipX, shipY, 6));
    } else {
      for (let i = 0; i < 3; i++) {
        const { name, updatedStats } = NamingSystem.getNextName(nation, 'unit', currentNamingStats);
        currentNamingStats = updatedStats;
        units.push(createUnit(`u${i + 1}`, 'player-1', name, UnitType.VILLAGER, startX, startY, 3));
      }

      const { name: settlementName, updatedStats: settlementStats } = NamingSystem.getNextName(nation, 'settlement', currentNamingStats);
      currentNamingStats = settlementStats;

      const startSettlement: Settlement = {
        id: _generateId('settlement-start'),
        ownerId: 'player-1',
        name: settlementName,
        position: { x: startX, y: startY },
        population: 0,
        culture: nationData.culture,
        organization: nationData.organization,
        buildings: [],
        inventory: new Map(),
        productionQueue: [],
        units: [],
        attitude: 'NEUTRAL',
        goods: new Map(),
        hammers: 0,
      };
      humanPlayer.settlements.push(startSettlement);
    }

    humanPlayer.units = units;
    return { humanPlayer, namingStats: currentNamingStats };
  }

  private static initializeAIPlayers(
    humanPlayer: Player,
    map: Tile[][],
    aiCount: number,
    generatedNativeSettlements: Settlement[],
    namingStats: NamingStats,
    random: () => number,
    _generateId: (prefix: string) => string
  ): { players: Player[]; namingStats: NamingStats } {
    let currentNamingStats = namingStats;
    const players = [humanPlayer];
    const width = map[0]?.length ?? 0;
    const height = map.length;

    const europeanNations = Object.values(Nation).filter(n => NATION_BONUSES[n]?.culture === 'EUROPEAN');
    const availableEuropeanNations = europeanNations.filter(n => n !== humanPlayer.nation);

    for (let i = 0; i < aiCount; i++) {
      const aiNation = availableEuropeanNations.splice(Math.floor(random() * availableEuropeanNations.length), 1)[0] ?? Nation.PORTUGAL;
      const aiNationData = NATION_BONUSES[aiNation];
      if (!aiNationData) continue;

      const aiPlayer: Player = {
        id: `ai-euro-${i}`,
        name: `${aiNationData.name} AI`,
        isHuman: false,
        gold: 100,
        nation: aiNation,
        units: [],
        settlements: [],
      };

      let aiStartX = 1;
      let aiStartY = 1;
      let aiFound = false;
      const quadrantX = i % 2 === 0 ? 5 : width - 15;
      const quadrantY = i < 2 ? 5 : height - 15;

      for (let y = quadrantY; y < quadrantY + 10; y++) {
        for (let x = quadrantX; x < quadrantX + 10; x++) {
          const tile = map[y]?.[x];
          if (tile && tile.terrainType !== TerrainType.OCEAN && tile.terrainType !== TerrainType.COAST) {
            aiStartX = x;
            aiStartY = y;
            aiFound = true;
            break;
          }
        }
        if (aiFound) break;
      }

      const { name: aiUnitName, updatedStats: aiUnitStats } = NamingSystem.getNextName(aiNation, 'unit', currentNamingStats);
      currentNamingStats = aiUnitStats;
      aiPlayer.units = [createUnit(`ai-euro-${i}-u1`, aiPlayer.id, aiUnitName, UnitType.COLONIST, aiStartX, aiStartY, 3)];
      players.push(aiPlayer);
    }

    const settlementsByNation = new Map<Nation, Settlement[]>();
    generatedNativeSettlements.forEach(s => {
      const n = s.ownerId as Nation;
      let nationSettlements = settlementsByNation.get(n);
      if (!nationSettlements) {
        nationSettlements = [];
        settlementsByNation.set(n, nationSettlements);
      }
      nationSettlements.push(s);
    });

    settlementsByNation.forEach((settlements, nativeNation) => {
      const nativeNationData = NATION_BONUSES[nativeNation];
      if (!nativeNationData) return;

      const renamedSettlements = settlements.map(s => {
        const { name, updatedStats } = NamingSystem.getNextName(nativeNation, 'settlement', currentNamingStats);
        currentNamingStats = updatedStats;
        return {
          ...s,
          name,
          ownerId: `ai-native-${nativeNation}`,
          attitude: humanPlayer.nation === Nation.FRANCE ? Attitude.FRIENDLY : s.attitude
        };
      });

      const aiPlayer: Player = {
        id: `ai-native-${nativeNation}`,
        name: nativeNationData.name,
        isHuman: false,
        gold: 0,
        nation: nativeNation,
        units: [],
        settlements: renamedSettlements,
      };

      const nativeStartSettlement = renamedSettlements[0];
      if (nativeStartSettlement) {
        const { name: nativeUnitName, updatedStats: nativeUnitStats } = NamingSystem.getNextName(nativeNation, 'unit', currentNamingStats);
        currentNamingStats = nativeUnitStats;
        aiPlayer.units.push(createUnit(`ai-native-${nativeNation}-u1`, aiPlayer.id, nativeUnitName, UnitType.VILLAGER, nativeStartSettlement.position.x, nativeStartSettlement.position.y, 3));
      }
      players.push(aiPlayer);
    });

    return { players, namingStats: currentNamingStats };
  }
}
