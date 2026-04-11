import type { Player } from '../entities/Player';
import type { Tile } from '../entities/Tile';
import type { Settlement } from '../entities/Settlement';
import { Nation, UnitType, TerrainType, Attitude, ResourceType } from '../entities/types';
import { TerrainGenerator } from '../map/TerrainGenerator';
import { NATION_BONUSES } from '../constants';
import type { Unit } from '../entities/Unit';
import { NamingSystem, type NamingStats } from './NamingSystem';
import type { Position } from '../entities/Position';

export class GameSystem {
  static initGame(params: { playerName: string; nation: Nation; mapSize: 'Small' | 'Medium' | 'Large'; aiCount: number }): {
    map: Tile[][];
    players: Player[];
    namingStats: NamingStats;
  } {
    const { playerName, nation, mapSize, aiCount } = params;
    const dimensions = {
      Small: { width: 40, height: 30 },
      Medium: { width: 80, height: 60 },
      Large: { width: 120, height: 90 },
    }[mapSize];

    const generator = new TerrainGenerator(dimensions.width, dimensions.height);
    const terrainData = generator.generate();
    const generatedNativeSettlements = generator.generateSettlements(terrainData);

    const map: Tile[][] = terrainData.map((row, y) =>
      row.map((type, x) => {
        const tile: Tile = {
          id: `${x}-${y}`,
          position: { x, y },
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
    let namingStats: NamingStats = {};

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

    const units: Unit[] = [];
    if (nationData.culture === 'EUROPEAN') {
      const startingUnitTypes = [UnitType.COLONIST, UnitType.COLONIST, UnitType.SOLDIER, UnitType.PIONEER];
      if (nation === Nation.ENGLAND) {
        startingUnitTypes.push(UnitType.COLONIST);
      }

      startingUnitTypes.forEach((type, i) => {
        const { name, updatedStats } = NamingSystem.getNextName(nation, 'unit', namingStats);
        namingStats = updatedStats;
        units.push(
          this.createBaseUnit(`u${i + 1}`, 'player-1', name, type, {
            x: startX + (type === UnitType.SOLDIER ? 1 : 0),
            y: startY + (type === UnitType.PIONEER ? 1 : 0),
          }, 3)
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
      const { name: shipName, updatedStats: shipStats } = NamingSystem.getNextName(nation, 'ship', namingStats);
      namingStats = shipStats;
      units.push(this.createBaseUnit('u5', 'player-1', shipName, UnitType.SHIP, { x: shipX, y: shipY }, 6));
    } else {
      // Native nation
      for (let i = 0; i < 3; i++) {
        const { name, updatedStats } = NamingSystem.getNextName(nation, 'unit', namingStats);
        namingStats = updatedStats;
        units.push(this.createBaseUnit(`u${i + 1}`, 'player-1', name, UnitType.VILLAGER, { x: startX, y: startY }, 3));
      }

      // Native settlement (starts empty but exists)
      const { name: settlementName, updatedStats: settlementStats } = NamingSystem.getNextName(nation, 'settlement', namingStats);
      namingStats = settlementStats;

      const startSettlement: Settlement = {
        id: `settlement-start-${Date.now()}`,
        ownerId: 'player-1',
        name: settlementName,
        position: { x: startX, y: startY },
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
    const allNations = Object.keys(Nation) as Nation[];
    const europeanNations = allNations.filter(n => NATION_BONUSES[n].culture === 'EUROPEAN');

    // Create European AI Players
    const availableEuropeanNations = europeanNations.filter(n => n !== nation);
    for (let i = 0; i < aiCount; i++) {
      const aiNation = availableEuropeanNations.splice(Math.floor(Math.random() * availableEuropeanNations.length), 1)[0] || Nation.PORTUGAL;
      const aiPlayer: Player = {
        id: `ai-euro-${i}`,
        name: `${NATION_BONUSES[aiNation].name} AI`,
        isHuman: false,
        gold: 100,
        nation: aiNation,
        units: [],
        settlements: [],
      };

      // Search in different quadrants for AI starting positions
      let aiStartX = 1;
      let aiStartY = 1;
      let aiFound = false;
      const quadrantX = i % 2 === 0 ? 5 : dimensions.width - 15;
      const quadrantY = i < 2 ? 5 : dimensions.height - 15;

      for (let y = quadrantY; y < quadrantY + 10; y++) {
        for (let x = quadrantX; x < quadrantX + 10; x++) {
          if (map[y]?.[x] && map[y][x].terrainType !== TerrainType.OCEAN && map[y][x].terrainType !== TerrainType.COAST) {
            aiStartX = x;
            aiStartY = y;
            aiFound = true;
            break;
          }
        }
        if (aiFound) break;
      }

      const { name: aiUnitName, updatedStats: aiUnitStats } = NamingSystem.getNextName(aiNation, 'unit', namingStats);
      namingStats = aiUnitStats;
      aiPlayer.units = [this.createBaseUnit(`ai-euro-${i}-u1`, aiPlayer.id, aiUnitName, UnitType.COLONIST, { x: aiStartX, y: aiStartY }, 3)];
      players.push(aiPlayer);
    }

    // Create Native AI Players based on generated settlements
    const settlementsByNation = new Map<Nation, Settlement[]>();
    generatedNativeSettlements.forEach(s => {
      const n = s.ownerId as Nation;
      if (!settlementsByNation.has(n)) settlementsByNation.set(n, []);
      settlementsByNation.get(n)!.push(s);
    });

    settlementsByNation.forEach((settlements, nativeNation) => {
      const renamedSettlements = settlements.map(s => {
        const { name, updatedStats } = NamingSystem.getNextName(nativeNation, 'settlement', namingStats);
        namingStats = updatedStats;
        return {
          ...s,
          name,
          position: { x: s.position.x, y: s.position.y },
          ownerId: `ai-native-${nativeNation}`,
          attitude: nation === Nation.FRANCE ? Attitude.FRIENDLY : s.attitude
        };
      });

      const aiPlayer: Player = {
        id: `ai-native-${nativeNation}`,
        name: NATION_BONUSES[nativeNation].name,
        isHuman: false,
        gold: 0,
        nation: nativeNation,
        units: [],
        settlements: renamedSettlements,
      };
      // Give each native nation a villager at their first settlement
      if (renamedSettlements.length > 0) {
        const { name: nativeUnitName, updatedStats: nativeUnitStats } = NamingSystem.getNextName(nativeNation, 'unit', namingStats);
        namingStats = nativeUnitStats;
        aiPlayer.units.push(this.createBaseUnit(`ai-native-${nativeNation}-u1`, aiPlayer.id, nativeUnitName, UnitType.VILLAGER, renamedSettlements[0].position, 3));
      }
      players.push(aiPlayer);
    });

    return { map, players, namingStats };
  }

  private static createBaseUnit(id: string, ownerId: string, name: string, type: UnitType, position: Position, moves: number): Unit {
    return {
      id,
      ownerId,
      name,
      type,
      position,
      movesRemaining: moves,
      maxMoves: moves,
      isSkipping: false,
      cargo: new Map(),
      turnsInJob: 0,
    };
  }
}
