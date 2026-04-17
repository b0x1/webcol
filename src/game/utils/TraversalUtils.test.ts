import { describe, it, expect } from 'vitest';
import { TraversalUtils } from './TraversalUtils';
import { createPlayer } from '../entities/Player';
import { createSettlement } from '../entities/Settlement';
import { createUnit } from '../entities/Unit';
import { Nation, UnitType, JobType } from '../entities/types';

describe('TraversalUtils', () => {
  it('findAllUnitsAt should filter units inside settlements correctly', () => {
    const player = createPlayer('p1', 'Player 1', true, 100, Nation.ENGLAND);
    const settlement = createSettlement('s1', 'p1', 'Settlement 1', 5, 5, 1, 'EUROPEAN', 'STATE');

    // Unit inside settlement working (FIELD_WORK) - should NOT be returned by findAllUnitsAt
    const unitWorking = createUnit('u1', 'p1', 'Worker', UnitType.COLONIST, 5, 5, 3);
    unitWorking.occupation = { kind: 'FIELD_WORK', tileX: 5, tileY: 6 };

    // Unit inside settlement available (RURE) - should be returned
    const unitAvailable = createUnit('u2', 'p1', 'Available', UnitType.COLONIST, 5, 5, 3);
    unitAvailable.occupation = { kind: 'RURE', state: 'SLEEPING' };

    // Unit on the map tile (not inside settlement array) - should be returned
    const unitOnMap = createUnit('u3', 'p1', 'OnMap', UnitType.COLONIST, 5, 5, 3);

    settlement.units = [unitWorking, unitAvailable];
    player.units = [unitOnMap];
    player.settlements = [settlement];

    const players = [player];
    const pos = { x: 5, y: 5 };

    const units = TraversalUtils.findAllUnitsAt(players, pos);

    expect(units).toHaveLength(2);
    expect(units.map(u => u.id)).toContain('u2');
    expect(units.map(u => u.id)).toContain('u3');
    expect(units.map(u => u.id)).not.toContain('u1');
  });

  it('findAllUnitsAt should return units working in buildings as NOT available', () => {
    const player = createPlayer('p1', 'Player 1', true, 100, Nation.ENGLAND);
    const settlement = createSettlement('s1', 'p1', 'Settlement 1', 5, 5, 1, 'EUROPEAN', 'STATE');

    const unitInBuilding = createUnit('u1', 'p1', 'Carpenter', UnitType.COLONIST, 5, 5, 3);
    unitInBuilding.occupation = JobType.CARPENTER;

    settlement.units = [unitInBuilding];
    player.settlements = [settlement];

    const units = TraversalUtils.findAllUnitsAt([player], { x: 5, y: 5 });
    expect(units).toHaveLength(0);
  });
});
