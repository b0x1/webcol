import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './gameStore';
import { selectAvailableUnits, selectAvailableUnitsCount } from './selectors';
import { createPlayer } from '../entities/Player';
import { createUnit } from '../entities/Unit';
import { createTile } from '../entities/Tile';
import { Nation, TerrainType, TurnPhase, UnitType } from '../entities/types';

describe('selectors', () => {
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

  it('selectAvailableUnitsCount matches selectAvailableUnits length', () => {
    const player = createPlayer('p1', 'P1', true, 100, Nation.ENGLAND);
    const movable = createUnit('u1', 'p1', 'A', UnitType.COLONIST, 0, 0, 2);
    const exhausted = createUnit('u2', 'p1', 'B', UnitType.COLONIST, 1, 0, 0);
    const skipping = createUnit('u3', 'p1', 'C', UnitType.COLONIST, 2, 0, 2);
    skipping.isSkipping = true;
    player.units = [movable, exhausted, skipping];
    const map = [[createTile('t', 0, 0, TerrainType.PLAINS, 1)]];
    useGameStore.setState({ players: [player], currentPlayerId: 'p1', map });
    const state = useGameStore.getState();
    expect(selectAvailableUnitsCount(state)).toBe(selectAvailableUnits(state).length);
    expect(selectAvailableUnitsCount(state)).toBe(1);
  });
});
