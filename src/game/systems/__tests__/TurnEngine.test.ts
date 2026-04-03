import { describe, it, expect } from 'vitest';
import { TurnEngine } from '../TurnEngine';
import { Player } from '../../entities/Player';
import { Tile } from '../../entities/Tile';
import { Colony } from '../../entities/Colony';
import { Unit } from '../../entities/Unit';
import { TerrainType, GoodType, UnitType, JobType } from '../../entities/types';

describe('TurnEngine', () => {
  const createMap = (width: number, height: number): Tile[][] => {
    const map: Tile[][] = [];
    for (let y = 0; y < height; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < width; x++) {
        row.push(new Tile(`${x}-${y}`, x, y, TerrainType.GRASSLAND, 1));
      }
      map.push(row);
    }
    return map;
  };

  describe('runProduction', () => {
    it('should calculate food based on workforce and population consumption', () => {
      const map = createMap(5, 5);
      const player = new Player('p1', 'Player 1', true, 0);
      const colony = new Colony('c1', 'p1', 'Colony 1', 2, 2, 1);
      const unit = new Unit('u1', 'p1', UnitType.COLONIST, 2, 2, 1);
      colony.units.push(unit);
      colony.workforce.set(unit.id, JobType.FARMER);
      player.colonies.push(colony);

      const updatedPlayers = TurnEngine.runProduction([player], map);
      const updatedColony = updatedPlayers[0].colonies[0];

      // Farmer produces 3 FOOD.
      // Pop 1 consumes 2 FOOD.
      // Net = 1 FOOD.
      expect(updatedColony.inventory.get(GoodType.FOOD)).toBe(1);
    });
  });

  describe('runAITurn', () => {
    it('should move AI unit toward nearest uncolonized target', () => {
      const map = createMap(10, 10);
      // All GRASSLAND by default
      // Set (5,5) as PLAINS (target)
      map[5][5].terrainType = TerrainType.PLAINS;

      const human = new Player('p1', 'Human', true, 0);
      const ai = new Player('p2', 'AI', false, 0);
      const unit = new Unit('u1', 'p2', UnitType.SOLDIER, 0, 0, 1);
      ai.units.push(unit);

      const updatedPlayers = TurnEngine.runAITurn([human, ai], map);
      const updatedUnit = updatedPlayers[1].units[0];

      // Unit should move from (0,0) towards (5,5)
      // One step diagonally towards (5,5) is (1,1)
      expect(updatedUnit.x).toBe(1);
      expect(updatedUnit.y).toBe(1);
      expect(updatedUnit.movesRemaining).toBe(0);
    });

    it('should found a colony if AI COLONIST is on PLAINS and no adjacent friendly colony', () => {
      const map = createMap(10, 10);
      map[2][2].terrainType = TerrainType.PLAINS;

      const ai = new Player('p1', 'AI', false, 0);
      const unit = new Unit('u1', 'p1', UnitType.COLONIST, 2, 2, 1);
      ai.units.push(unit);

      const updatedPlayers = TurnEngine.runAITurn([ai], map);
      const updatedAI = updatedPlayers[0];

      expect(updatedAI.colonies.length).toBe(1);
      expect(updatedAI.units.length).toBe(0);
      expect(updatedAI.colonies[0].x).toBe(2);
      expect(updatedAI.colonies[0].y).toBe(2);
    });

    it('should not found a colony if there is an adjacent friendly colony', () => {
        const map = createMap(10, 10);
        map[2][2].terrainType = TerrainType.PLAINS;

        const ai = new Player('p1', 'AI', false, 0);
        const colony = new Colony('c1', 'p1', 'Col1', 3, 3, 1);
        ai.colonies.push(colony);
        const unit = new Unit('u1', 'p1', UnitType.COLONIST, 2, 2, 1);
        ai.units.push(unit);

        const updatedPlayers = TurnEngine.runAITurn([ai], map);
        const updatedAI = updatedPlayers[0];

        expect(updatedAI.colonies.length).toBe(1); // Only the existing one
        expect(updatedAI.units.length).toBe(1);
        expect(updatedAI.units[0].x).toBe(2);
        expect(updatedAI.units[0].y).toBe(2);
      });
  });
});
