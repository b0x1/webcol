import type { Player } from '@shared/game/entities/Player';
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

    const landing = player.settlements[0]?.position ?? ship.position;
    ship.inEurope = false;
    ship.movesRemaining = 0;
    player.units.forEach((unit) => {
      if (unit.inEurope !== true || unit.id === ship.id) {
        return;
      }
      unit.inEurope = false;
      if (unit.type !== UnitType.SHIP) {
        unit.position = { ...landing };
      }
    });

    return [{ type: 'notification', message: `${ship.name} returned from Europe.` }];
  }

  private static selectCurrentPlayer(state: AuthoritativeGameState): Player | undefined {
    return TraversalUtils.findPlayerById(state.players, state.currentPlayerId);
  }
}
