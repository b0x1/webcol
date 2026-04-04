import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../gameStore';
import { Player } from '../../entities/Player';
import { Unit } from '../../entities/Unit';
import { Tile } from '../../entities/Tile';
import { TerrainType, TurnPhase, UnitType, Nation } from '../../entities/types';

describe('gameStore', () => {
  beforeEach(() => {
    useGameStore.setState({
      players: [],
      currentPlayerId: '',
      turn: 1,
      phase: TurnPhase.MOVEMENT,
      selectedUnitId: null,
      map: [],
    });
  });

  describe('moveUnit', () => {
    it('should update unit position and movesRemaining when move is valid', () => {
      const player = new Player('p1', 'Player 1', true, 100, Nation.ENGLAND);
      const unit = new Unit('u1', 'p1', UnitType.COLONIST, 0, 0, 3);
      player.units = [unit];

      const map = [
        [new Tile('t00', 0, 0, TerrainType.PLAINS, 1), new Tile('t10', 1, 0, TerrainType.PLAINS, 1)],
      ];

      useGameStore.setState({ players: [player], currentPlayerId: 'p1', map });

      useGameStore.getState().moveUnit('u1', 1, 0);

      const updatedPlayer = useGameStore.getState().players[0];
      const updatedUnit = updatedPlayer.units[0];
      expect(updatedUnit.x).toBe(1);
      expect(updatedUnit.y).toBe(0);
      expect(updatedUnit.movesRemaining).toBe(2);
    });

    it('should not update unit position when not enough movesRemaining', () => {
      const player = new Player('p1', 'Player 1', true, 100, Nation.ENGLAND);
      const unit = new Unit('u1', 'p1', UnitType.COLONIST, 0, 0, 1);
      player.units = [unit];

      const map = [
        [new Tile('t00', 0, 0, TerrainType.PLAINS, 1), new Tile('t10', 1, 0, TerrainType.PLAINS, 2)],
      ];

      useGameStore.setState({ players: [player], currentPlayerId: 'p1', map });

      useGameStore.getState().moveUnit('u1', 1, 0);

      const updatedPlayer = useGameStore.getState().players[0];
      const updatedUnit = updatedPlayer.units[0];
      expect(updatedUnit.x).toBe(0);
      expect(updatedUnit.y).toBe(0);
      expect(updatedUnit.movesRemaining).toBe(1);
    });
  });

  describe('endTurn', () => {
    it('should advance phases correctly', () => {
      // We need players and a map for endTurn to not cycle immediately if logic relies on it
      const p1 = new Player('p1', 'Player 1', true, 100, Nation.ENGLAND);
      const map = [[new Tile('t00', 0, 0, TerrainType.PLAINS, 1)]];
      useGameStore.setState({ players: [p1], currentPlayerId: 'p1', phase: TurnPhase.MOVEMENT, map });

      // In the new implementation, endTurn() auto-advances phases that don't require manual input
      // MOVEMENT (manual) -> endTurn() -> PRODUCTION (auto) -> TRADE (auto) -> AI (auto) -> END_TURN (auto) -> next player MOVEMENT

      useGameStore.getState().endTurn();

      // Since all phases after MOVEMENT are auto-advanced in this simple setup,
      // calling endTurn() once from MOVEMENT should go through all of them and end up at MOVEMENT again (for the next player or same player if only one)
      expect(useGameStore.getState().phase).toBe(TurnPhase.MOVEMENT);
    });

    it('should cycle to next player and reset phase after END_TURN phase', () => {
      const p1 = new Player('p1', 'Player 1', true, 100, Nation.ENGLAND);
      const p2 = new Player('p2', 'Player 2', true, 100, Nation.SPAIN); // Make p2 human so it doesn't auto-skip

      useGameStore.setState({
        players: [p1, p2],
        currentPlayerId: 'p1',
        phase: TurnPhase.END_TURN
      });

      useGameStore.getState().endTurn();

      expect(useGameStore.getState().currentPlayerId).toBe('p2');
      expect(useGameStore.getState().phase).toBe(TurnPhase.MOVEMENT);
      expect(useGameStore.getState().turn).toBe(1);
    });

    it('should increment turn when cycling back to first player', () => {
      const p1 = new Player('p1', 'Player 1', true, 100, Nation.ENGLAND);
      const p2 = new Player('p2', 'Player 2', false, 100, Nation.SPAIN);

      useGameStore.setState({
        players: [p1, p2],
        currentPlayerId: 'p2',
        phase: TurnPhase.END_TURN,
        turn: 1
      });

      useGameStore.getState().endTurn();

      expect(useGameStore.getState().currentPlayerId).toBe('p1');
      expect(useGameStore.getState().turn).toBe(2);
    });

    it('should reset movesRemaining to maxMoves for the NEW current player', () => {
      const p1 = new Player('p1', 'Player 1', true, 100, Nation.ENGLAND);
      const unit1 = new Unit('u1', 'p1', UnitType.COLONIST, 0, 0, 0);
      unit1.maxMoves = 3;
      p1.units = [unit1];

      const p2 = new Player('p2', 'Player 2', true, 100, Nation.SPAIN); // Make p2 human so it doesn't auto-skip
      const unit2 = new Unit('u2', 'p2', UnitType.COLONIST, 0, 0, 0); // Corrected to be within map bounds
      unit2.maxMoves = 2;
      p2.units = [unit2];

      const map = [
        [new Tile('t00', 0, 0, TerrainType.PLAINS, 1)],
      ];

      useGameStore.setState({
        players: [p1, p2],
        currentPlayerId: 'p1',
        phase: TurnPhase.END_TURN,
        map
      });

      useGameStore.getState().endTurn();

      // New current player is p2
      const updatedP2 = useGameStore.getState().players.find(p => p.id === 'p2')!;
      expect(updatedP2.units[0].movesRemaining).toBe(2);

      // Moves for p1 should NOT have been reset yet (they reset when it's p1's turn again)
      const updatedP1 = useGameStore.getState().players.find(p => p.id === 'p1')!;
      expect(updatedP1.units[0].movesRemaining).toBe(0);
    });
  });
});
