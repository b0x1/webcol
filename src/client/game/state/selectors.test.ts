import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './gameStore';
import { selectAvailableUnits, selectAvailableUnitsCount, selectDisplayedMovementCost } from './selectors';
import { createPlayer } from '@shared/game/entities/Player';
import { createUnit } from '@shared/game/entities/Unit';
import { createTile } from '@shared/game/entities/Tile';
import { Nation, TerrainType, TurnPhase, UnitType } from '@shared/game/entities/types';

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

  it('shows the movement system cost, using a land unit when nothing is selected', () => {
    const ship = createUnit('ship', 'p1', 'Ship', UnitType.SHIP, 0, 0, 4);
    const player = createPlayer('p1', 'P1', true, 0, Nation.ENGLAND);
    player.units = [ship];
    const map = [[
      createTile('ocean', 0, 0, TerrainType.OCEAN, 1),
      createTile('forest', 1, 0, TerrainType.FOREST, 1),
    ]];
    useGameStore.setState({
      players: [player],
      currentPlayerId: 'p1',
      map,
      selectedUnitId: 'ship',
    });

    expect(selectDisplayedMovementCost(useGameStore.getState(), { x: 0, y: 0 })).toBe(1);
    useGameStore.setState({ selectedUnitId: null });
    expect(selectDisplayedMovementCost(useGameStore.getState(), { x: 1, y: 0 })).toBe(2);
  });
});
