import { describe, it, expect } from 'vitest';
import { TurnEngine } from '../TurnEngine';
import { createPlayer } from '../../entities/Player';
import { createTile } from '../../entities/Tile';
import { createSettlement } from '../../entities/Settlement';
import { createUnit } from '../../entities/Unit';
import { TerrainType, GoodType, UnitType, JobType, Nation } from '../../entities/types';

describe('TurnEngine', () => {
  const createMap = (width: number, height: number): any[][] => {
    const map: any[][] = [];
    for (let y = 0; y < height; y++) {
      const row: any[] = [];
      for (let x = 0; x < width; x++) {
        row.push(createTile(`${x}-${y}`, x, y, TerrainType.GRASSLAND, 1));
      }
      map.push(row);
    }
    return map;
  };

  describe('runProduction', () => {
    it('should calculate food based on workforce and population consumption', () => {
      const player = createPlayer('p1', 'Player 1', true, 0, Nation.FRANCE);
      const settlement = createSettlement('c1', 'p1', 'Settlement 1', 2, 2, 1, 'EUROPEAN', 'STATE');
      const unit = createUnit('u1', 'p1', UnitType.COLONIST, 2, 2, 1);
      settlement.units.push(unit);
      settlement.workforce.set(unit.id, JobType.FARMER);
      player.settlements.push(settlement);

      const updatedPlayers = TurnEngine.runProduction([player], []);
      const updatedSettlement = updatedPlayers[0].settlements[0];

      // Farmer produces 3 FOOD.
      // Pop 1 consumes 2 FOOD.
      // Net = 1 FOOD.
      expect(updatedSettlement.inventory.get(GoodType.FOOD)).toBe(1);
    });
  });

  describe('runAITurn', () => {
    it('should move AI unit toward nearest uncolonized target', () => {
      const map = createMap(10, 10);
      // All GRASSLAND by default
      // Set (5,5) as PLAINS (target)
      map[5][5].terrainType = TerrainType.PLAINS;

      const human = createPlayer('p1', 'Human', true, 0, Nation.SPAIN);
      const ai = createPlayer('p2', 'AI', false, 0, Nation.NORSEMEN);
      const unit = createUnit('u1', 'p2', UnitType.SOLDIER, 0, 0, 1);
      ai.units.push(unit);

      const updatedPlayers = TurnEngine.runAITurn([human, ai], map);
      const updatedUnit = updatedPlayers[1].units[0];

      // Unit should move from (0,0) towards (5,5)
      // One step diagonally towards (5,5) is (1,1)
      expect(updatedUnit.x).toBe(1);
      expect(updatedUnit.y).toBe(1);
      expect(updatedUnit.movesRemaining).toBe(0);
    });

    it('should found a settlement if AI COLONIST is on PLAINS and no adjacent friendly settlement', () => {
      const map = createMap(10, 10);
      map[2][2].terrainType = TerrainType.PLAINS;

      const ai = createPlayer('p1', 'AI', false, 0, Nation.PORTUGAL);
      const unit = createUnit('u1', 'p1', UnitType.COLONIST, 2, 2, 1);
      ai.units.push(unit);

      const updatedPlayers = TurnEngine.runAITurn([ai], map);
      const updatedAI = updatedPlayers[0];

      expect(updatedAI.settlements.length).toBe(1);
      expect(updatedAI.units.length).toBe(0);
      expect(updatedAI.settlements[0].x).toBe(2);
      expect(updatedAI.settlements[0].y).toBe(2);
    });

    it('should not found a settlement if there is an adjacent friendly settlement', () => {
        const map = createMap(10, 10);
        map[2][2].terrainType = TerrainType.PLAINS;

        const ai = createPlayer('p1', 'AI', false, 0, Nation.NETHERLANDS);
        const settlement = createSettlement('c1', 'p1', 'Col1', 3, 3, 1, 'EUROPEAN', 'STATE');
        ai.settlements.push(settlement);
        const unit = createUnit('u1', 'p1', UnitType.COLONIST, 2, 2, 1);
        ai.units.push(unit);

        const updatedPlayers = TurnEngine.runAITurn([ai], map);
        const updatedAI = updatedPlayers[0];

        expect(updatedAI.settlements.length).toBe(1); // Only the existing one
        expect(updatedAI.units.length).toBe(1);
        expect(updatedAI.units[0].x).toBe(2);
        expect(updatedAI.units[0].y).toBe(2);
      });
  });
});
