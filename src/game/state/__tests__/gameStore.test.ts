import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../gameStore';
import { createPlayer } from '../../entities/Player';
import { createUnit } from '../../entities/Unit';
import { createTile } from '../../entities/Tile';
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
      const player = createPlayer('p1', 'Player 1', true, 100, Nation.ENGLAND);
      const unit = createUnit('u1', 'p1', UnitType.COLONIST, 0, 0, 3);
      player.units = [unit];

      const map = [
        [createTile('t00', 0, 0, TerrainType.PLAINS, 1), createTile('t10', 1, 0, TerrainType.PLAINS, 1)],
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
      const player = createPlayer('p1', 'Player 1', true, 100, Nation.ENGLAND);
      const unit = createUnit('u1', 'p1', UnitType.COLONIST, 0, 0, 1);
      player.units = [unit];

      const map = [
        [createTile('t00', 0, 0, TerrainType.PLAINS, 1), createTile('t10', 1, 0, TerrainType.FOREST, 2)],
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
      const p1 = createPlayer('p1', 'Player 1', true, 100, Nation.ENGLAND);
      const map = [[createTile('t00', 0, 0, TerrainType.PLAINS, 1)]];
      useGameStore.setState({ players: [p1], currentPlayerId: 'p1', phase: TurnPhase.MOVEMENT, map });

      useGameStore.getState().endTurn();

      expect(useGameStore.getState().phase).toBe(TurnPhase.MOVEMENT);
    });

    it('should cycle to next player and reset phase after END_TURN phase', () => {
      const p1 = createPlayer('p1', 'Player 1', true, 100, Nation.ENGLAND);
      const p2 = createPlayer('p2', 'Player 2', true, 100, Nation.SPAIN);

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
      const p1 = createPlayer('p1', 'Player 1', true, 100, Nation.ENGLAND);
      const p2 = createPlayer('p2', 'Player 2', false, 100, Nation.SPAIN);

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
      const p1 = createPlayer('p1', 'Player 1', true, 100, Nation.ENGLAND);
      const unit1 = createUnit('u1', 'p1', UnitType.COLONIST, 0, 0, 0);
      unit1.maxMoves = 3;
      p1.units = [unit1];

      const p2 = createPlayer('p2', 'Player 2', true, 100, Nation.SPAIN);
      const unit2 = createUnit('u2', 'p2', UnitType.COLONIST, 0, 0, 0);
      unit2.maxMoves = 2;
      p2.units = [unit2];

      const map = [
        [createTile('t00', 0, 0, TerrainType.PLAINS, 1)],
      ];

      useGameStore.setState({
        players: [p1, p2],
        currentPlayerId: 'p1',
        phase: TurnPhase.END_TURN,
        map
      });

      useGameStore.getState().endTurn();

      const updatedP2 = useGameStore.getState().players.find(p => p.id === 'p2')!;
      expect(updatedP2.units[0].movesRemaining).toBe(2);

      const updatedP1 = useGameStore.getState().players.find(p => p.id === 'p1')!;
      expect(updatedP1.units[0].movesRemaining).toBe(0);
    });
  });
});
