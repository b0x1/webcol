import type { Player } from '../entities/Player';
import type { Tile } from '../entities/Tile';
import type { Settlement } from '../entities/Settlement';
import { Nation, UnitType, TerrainType, Attitude, ResourceType } from '../entities/types';
import { TerrainGenerator } from '../map/TerrainGenerator';
import { NATION_BONUSES } from '../constants';
import type { Unit } from '../entities/Unit';

export class GameSystem {
  static initGame(params: { playerName: string; nation: Nation; mapSize: 'Small' | 'Medium' | 'Large'; aiCount: number }): {
    map: Tile[][];
    npcSettlements: Settlement[];
    players: Player[];
  } {
    const { playerName, nation, mapSize, aiCount } = params;
    const dimensions = {
      Small: { width: 40, height: 30 },
      Medium: { width: 80, height: 60 },
      Large: { width: 120, height: 90 },
    }[mapSize];

    const generator = new TerrainGenerator(dimensions.width, dimensions.height);
    const terrainData = generator.generate();
    const npcSettlements = generator.generateSettlements(terrainData);

    if (nation === Nation.FRANCE) {
      npcSettlements.forEach(s => s.attitude = Attitude.FRIENDLY);
    }

    const map: Tile[][] = terrainData.map((row, y) =>
      row.map((type, x) => {
        const tile: Tile = {
          id: `${x}-${y}`,
          x,
          y,
          terrainType: type,
          movementCost: 1, // Default, will be overridden by MovementSystem
          hasResource: null,
        };
        if (type === TerrainType.OCEAN && Math.random() < 0.05) {
          tile.hasResource = ResourceType.FISH;
        } else if (type === TerrainType.FOREST && Math.random() < 0.1) {
          tile.hasResource = ResourceType.FOREST;
        } else if (type === TerrainType.PLAINS && Math.random() < 0.05) {
          tile.hasResource = ResourceType.ORE_DEPOSIT;
        } else if (type === TerrainType.PLAINS && Math.random() < 0.1) {
          tile.hasResource = ResourceType.FERTILE_LAND;
        }
        return tile;
      })
    );

    const startingGold = nation === Nation.NETHERLANDS ? 200 : 100;
    const nationData = NATION_BONUSES[nation];
    const humanPlayer: Player = {
      id: 'player-1',
      name: playerName,
      isHuman: true,
      gold: startingGold,
      nation,
      units: [],
      settlements: [],
    };

    // Starting position search
    let startX = Math.floor(dimensions.width / 2);
    let startY = Math.floor(dimensions.height / 2);
    let found = false;

    for (let y = 10; y < dimensions.height - 10; y++) {
      for (let x = 10; x < dimensions.width - 10; x++) {
        if (map[y][x].terrainType !== TerrainType.OCEAN && map[y][x].terrainType !== TerrainType.COAST) {
          startX = x;
          startY = y;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    let units: Unit[] = [];
    if (nationData.culture === 'EUROPEAN') {
      units = [
        this.createBaseUnit('u1', 'player-1', UnitType.COLONIST, startX, startY, 3),
        this.createBaseUnit('u2', 'player-1', UnitType.COLONIST, startX, startY, 3),
        this.createBaseUnit('u3', 'player-1', UnitType.SOLDIER, startX + 1, startY, 3),
        this.createBaseUnit('u4', 'player-1', UnitType.PIONEER, startX, startY + 1, 3),
      ];

      if (nation === Nation.ENGLAND) {
        units.push(this.createBaseUnit('u-extra', 'player-1', UnitType.COLONIST, startX, startY, 3));
      }

      let shipX = startX;
      let shipY = startY;
      found = false;
      for (let d = 1; d < 10; d++) {
        for (let dy = -d; dy <= d; dy++) {
          for (let dx = -d; dx <= d; dx++) {
            const nx = startX + dx;
            const ny = startY + dy;
            if (ny >= 0 && ny < dimensions.height && nx >= 0 && nx < dimensions.width) {
              if (map[ny][nx].terrainType === TerrainType.OCEAN) {
                shipX = nx;
                shipY = ny;
                found = true;
                break;
              }
            }
          }
          if (found) break;
        }
        if (found) break;
      }
      units.push(this.createBaseUnit('u5', 'player-1', UnitType.SHIP, shipX, shipY, 6));
    } else {
      // Native nation
      units = [
        this.createBaseUnit('u1', 'player-1', UnitType.VILLAGER, startX, startY, 3),
        this.createBaseUnit('u2', 'player-1', UnitType.VILLAGER, startX, startY, 3),
        this.createBaseUnit('u3', 'player-1', UnitType.VILLAGER, startX, startY, 3),
      ];
      // Native settlement (starts empty but exists)
      const startSettlement: Settlement = {
        id: `settlement-start-${Date.now()}`,
        ownerId: 'player-1',
        name: `${playerName}'s Settlement`,
        x: startX,
        y: startY,
        population: 0,
        culture: nationData.culture,
        organization: nationData.organization,
        buildings: [],
        inventory: new Map(),
        productionQueue: [],
        workforce: new Map(),
        units: [],
        attitude: 'NEUTRAL',
        goods: new Map(),
        hammers: 0,
      };
      humanPlayer.settlements.push(startSettlement);
    }

    humanPlayer.units = units;

    const players = [humanPlayer];
    const availableNations = (Object.keys(Nation) as Nation[]).filter(n => n !== nation);

    for (let i = 0; i < aiCount; i++) {
      const aiNation = availableNations.splice(Math.floor(Math.random() * availableNations.length), 1)[0] || Nation.PORTUGAL;
      const aiPlayer: Player = {
        id: `ai-${i}`,
        name: `AI Opponent ${i + 1}`,
        isHuman: false,
        gold: 100,
        nation: aiNation,
        units: [],
        settlements: [],
      };

      // Basic AI initialization
      const aiNationData = NATION_BONUSES[aiNation];

      // AI starting position search
      let aiStartX = 1;
      let aiStartY = 1;
      let aiFound = false;

      // Search in different quadrants for AI starting positions
      const quadrantX = i % 2 === 0 ? 5 : dimensions.width - 15;
      const quadrantY = i < 2 ? 5 : dimensions.height - 15;

      for (let y = quadrantY; y < quadrantY + 10; y++) {
        for (let x = quadrantX; x < quadrantX + 10; x++) {
          if (map[y] && map[y][x] && map[y][x].terrainType !== TerrainType.OCEAN && map[y][x].terrainType !== TerrainType.COAST) {
            aiStartX = x;
            aiStartY = y;
            aiFound = true;
            break;
          }
        }
        if (aiFound) break;
      }

      if (aiNationData.culture === 'NATIVE') {
         aiPlayer.units = [this.createBaseUnit(`ai-${i}-u1`, aiPlayer.id, UnitType.VILLAGER, aiStartX, aiStartY, 3)];
      } else {
         aiPlayer.units = [this.createBaseUnit(`ai-${i}-u1`, aiPlayer.id, UnitType.COLONIST, aiStartX, aiStartY, 3)];
      }

      players.push(aiPlayer);
    }

    return { map, npcSettlements, players };
  }

  private static createBaseUnit(id: string, ownerId: string, type: UnitType, x: number, y: number, moves: number): Unit {
    return {
      id,
      ownerId,
      type,
      x,
      y,
      movesRemaining: moves,
      maxMoves: moves,
      isSkipping: false,
      cargo: new Map(),
      turnsInJob: 0,
    };
  }
}
