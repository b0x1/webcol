import type { Player } from '../entities/Player';
import type { Tile } from '../entities/Tile';
import type { Nation } from '../entities/types';
import { TerrainGenerator } from '../map/TerrainGenerator';
import type { NamingStats } from './NamingSystem';
import { MapInitializer } from '../initializers/MapInitializer';
import { PlayerInitializer } from '../initializers/PlayerInitializer';

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

    const map = MapInitializer.initializeMap(terrainData, random);
    let namingStats: NamingStats = {};

    const humanResult = PlayerInitializer.initializeHumanPlayer(
      playerName,
      nation,
      map,
      namingStats,
      generateId
    );
    namingStats = humanResult.namingStats;

    const aiResult = PlayerInitializer.initializeAIPlayers(
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
}
