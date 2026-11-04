import type { Player } from '../entities/Player';
import type { Settlement } from '../entities/Settlement';
import type { Tile } from '../entities/Tile';
import type { Unit } from '../entities/Unit';
import { distance, getNeighbors, type Position } from '../entities/Position';
import { GoodType, UnitType } from '../entities/types';
import type { AuthoritativeGameState } from '../AuthoritativeGameState';
import type { GameCommand } from '../protocol';
import { TERRAIN_PRODUCTION_RULES } from '../rules/ProductionRules';
import { MovementSystem } from './MovementSystem';
import { SettlementSystem } from './SettlementSystem';

/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
export class AISystem {
  private constructor() {
    // Static utility class
  }

  static chooseCommands(state: AuthoritativeGameState): readonly GameCommand[] {
    const player = state.players.find((candidate) => candidate.id === state.currentPlayerId);
    if (!player || player.isHuman) {
      return [];
    }

    const settlements = state.players.flatMap((candidate) => candidate.settlements);
    const commands: GameCommand[] = [];
    const ordered = new Set<string>();

    for (const unit of player.units) {
      if (!this.isSettler(unit) || unit.inEurope === true) {
        continue;
      }

      if (SettlementSystem.canFoundSettlement(player, unit, state.map, settlements)) {
        commands.push({ type: 'foundSettlement', unitId: unit.id });
        ordered.add(unit.id);
        continue;
      }

      const target = this.nearestFoundingTile(player, unit, state.map, settlements);
      const step = target ? this.stepToward(unit, target, state.map) : undefined;
      if (step) {
        commands.push({ type: 'moveUnit', unitId: unit.id, to: step });
      }
      commands.push({ type: 'skipUnit', unitId: unit.id });
      ordered.add(unit.id);
    }

    const job = this.oneFieldJob(player, state.map, ordered);
    if (job) {
      commands.push(job);
    }

    return commands;
  }

  private static oneFieldJob(
    player: Player,
    map: Tile[][],
    orderedUnitIds: ReadonlySet<string>,
  ): GameCommand | undefined {
    for (const settlement of player.settlements) {
      const worker = this.idleWorker(player, settlement, orderedUnitIds);
      const tile = worker ? this.openFoodTile(settlement, map) : undefined;
      if (worker && tile) {
        return {
          type: 'assignJob',
          settlementId: settlement.id,
          unitId: worker.id,
          job: `${tile.x},${tile.y}`,
        };
      }
    }
    return undefined;
  }

  private static idleWorker(
    player: Player,
    settlement: Settlement,
    orderedUnitIds: ReadonlySet<string>,
  ): Unit | undefined {
    const atColony = player.units.filter(
      (unit) => unit.position.x === settlement.position.x && unit.position.y === settlement.position.y,
    );
    return [...settlement.units, ...atColony].find(
      (unit) => !orderedUnitIds.has(unit.id) && this.isIdle(unit),
    );
  }

  private static openFoodTile(settlement: Settlement, map: Tile[][]): Position | undefined {
    const width = map[0]?.length ?? 0;
    const height = map.length;
    return getNeighbors(settlement.position, width, height).find((position) => {
      const tile = map[position.y]?.[position.x];
      if (!tile || TERRAIN_PRODUCTION_RULES[tile.terrainType] !== GoodType.FOOD) {
        return false;
      }
      return !settlement.units.some((unit) => {
        return (
          typeof unit.occupation !== 'string' &&
          unit.occupation.kind === 'FIELD_WORK' &&
          unit.occupation.tileX === position.x &&
          unit.occupation.tileY === position.y
        );
      });
    });
  }

  private static nearestFoundingTile(
    player: Player,
    unit: Unit,
    map: Tile[][],
    settlements: Settlement[],
  ): Position | undefined {
    let best: Position | undefined;
    let bestDistance = Infinity;
    const height = map.length;
    const width = map[0]?.length ?? 0;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const probe = { ...unit, position: { x, y } };
        if (!SettlementSystem.canFoundSettlement(player, probe, map, settlements)) {
          continue;
        }
        const tileDistance = distance(unit.position, { x, y });
        if (tileDistance < bestDistance) {
          bestDistance = tileDistance;
          best = { x, y };
        }
      }
    }

    return best;
  }

  private static stepToward(unit: Unit, target: Position, map: Tile[][]): Position | undefined {
    const width = map[0]?.length ?? 0;
    const height = map.length;
    let best: Position | undefined;
    let bestDistance = distance(unit.position, target);

    for (const neighbor of getNeighbors(unit.position, width, height)) {
      const tile = map[neighbor.y]?.[neighbor.x];
      if (!tile || MovementSystem.getMovementCost(unit, tile) > unit.movesRemaining) {
        continue;
      }
      const nextDistance = distance(neighbor, target);
      if (nextDistance < bestDistance) {
        bestDistance = nextDistance;
        best = neighbor;
      }
    }

    return best;
  }

  private static isSettler(unit: Unit): boolean {
    return unit.type === UnitType.COLONIST || unit.type === UnitType.VILLAGER;
  }

  private static isIdle(unit: Unit): boolean {
    return this.isSettler(unit) && unit.inEurope !== true && typeof unit.occupation !== 'string' && unit.occupation.kind === 'RURE';
  }
}
