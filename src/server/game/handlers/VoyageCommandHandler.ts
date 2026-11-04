import type { Player } from '@shared/game/entities/Player';
import type { Settlement } from '@shared/game/entities/Settlement';
import { distance, getNeighbors, type Position } from '@shared/game/entities/Position';
import type { Tile } from '@shared/game/entities/Tile';
import { TerrainType, UnitType } from '@shared/game/entities/types';
import { TraversalUtils } from '@shared/game/utils/TraversalUtils';
import type { AuthoritativeGameState } from '@shared/game/AuthoritativeGameState';
import type { GameEffect } from '@shared/game/protocol';

/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
export class VoyageCommandHandler {
  static sailToEurope(state: AuthoritativeGameState, unitId: string): readonly GameEffect[] {
    const player = this.selectCurrentPlayer(state);
    if (!player) {
      return [];
    }

    const ship = player.units.find((candidate) => candidate.id === unitId);
    if (ship?.type !== UnitType.SHIP || ship.inEurope === true || ship.movesRemaining <= 0) {
      return [];
    }

    const tile = state.map[ship.position.y]?.[ship.position.x];
    if (!tile || (tile.terrainType !== TerrainType.OCEAN && tile.terrainType !== TerrainType.COAST)) {
      return [];
    }

    ship.inEurope = true;
    ship.movesRemaining = 0;
    return [{ type: 'notification', message: `${ship.name} sailed for Europe.` }];
  }

  static returnFromEurope(state: AuthoritativeGameState, unitId: string): readonly GameEffect[] {
    const player = this.selectCurrentPlayer(state);
    if (!player) {
      return [];
    }

    const ship = player.units.find((candidate) => candidate.id === unitId);
    if (ship?.type !== UnitType.SHIP || ship.inEurope !== true) {
      return [];
    }

    const colony = this.nearestColony(player, ship.position);
    const harbor = colony ? this.harborTile(colony.position, state.map) : undefined;
    if (!colony || !harbor) {
      return [];
    }

    ship.position = { ...harbor };
    ship.inEurope = false;
    ship.movesRemaining = 0;
    player.units.forEach((unit) => {
      if (unit.inEurope !== true || unit.type === UnitType.SHIP) {
        return;
      }
      unit.inEurope = false;
      unit.position = { ...colony.position };
    });

    return [{ type: 'notification', message: `${ship.name} returned from Europe.` }];
  }

  private static nearestColony(player: Player, origin: Position): Settlement | undefined {
    let best: Settlement | undefined;
    let bestDistance = Infinity;
    for (const settlement of player.settlements) {
      const tileDistance = distance(origin, settlement.position);
      if (tileDistance < bestDistance) {
        bestDistance = tileDistance;
        best = settlement;
      }
    }
    return best;
  }

  private static harborTile(colony: Position, map: Tile[][]): Position | undefined {
    const width = map[0]?.length ?? 0;
    const height = map.length;
    return getNeighbors(colony, width, height).find((position) => {
      const terrain = map[position.y]?.[position.x]?.terrainType;
      return terrain === TerrainType.OCEAN || terrain === TerrainType.COAST;
    });
  }

  private static selectCurrentPlayer(state: AuthoritativeGameState): Player | undefined {
    return TraversalUtils.findPlayerById(state.players, state.currentPlayerId);
  }
}
