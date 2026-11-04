import type { GameOutcome } from '@shared/game/AuthoritativeGameState';
import { GoodType } from '@shared/game/entities/types';
import type { SaveGameState } from '@shared/game/protocol';

export type SaveData = SaveGameState;

/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
export class SaveSystem {
  private constructor() {
    // Static utility class
  }

  static serialize(
   state: SaveGameState
  ): string {
    const data: SaveGameState = {
      players: state.players,
      currentPlayerId: state.currentPlayerId,
      turn: state.turn,
      phase: state.phase,
      europePrices: state.europePrices,
      soldOnTurn: state.soldOnTurn,
      outcome: state.outcome,
      map: state.map,
    };

    return JSON.stringify(data, (key, value) => this.replacer(key, value));
  }

  static deserialize(serialized: string): SaveGameState | null {
    try {
      const parsed = JSON.parse(serialized, (key, value) => this.reviver(key, value)) as unknown;
      if (!this.isValidSaveData(parsed)) {
        return null;
      }
      const soldOnTurn = this.readSoldOnTurn(parsed.soldOnTurn);
      const outcome = this.readOutcome(parsed.outcome);
      if (!soldOnTurn || !outcome) {
        return null;
      }
      return { ...parsed, soldOnTurn, outcome };
    } catch {
      return null;
    }
  }

  private static isValidSaveData(data: unknown): data is SaveGameState & {
    soldOnTurn?: unknown;
    outcome?: unknown;
  } {
    if (typeof data !== 'object' || data === null) {
      return false;
    }

    const candidate = data as Record<string, unknown>;
    return (
      Array.isArray(candidate.players) &&
      typeof candidate.currentPlayerId === 'string' &&
      typeof candidate.turn === 'number' &&
      typeof candidate.phase === 'string' &&
      candidate.europePrices !== null &&
      typeof candidate.europePrices === 'object' &&
      Array.isArray(candidate.map)
    );
  }

  private static readSoldOnTurn(value: unknown): Partial<Record<GoodType, number>> | null {
    if (value === undefined) {
      return {};
    }
    if (!this.isRecord(value)) {
      return null;
    }

    const sold: Partial<Record<GoodType, number>> = {};
    for (const good of Object.values(GoodType)) {
      const amount = value[good];
      if (amount === undefined) {
        continue;
      }
      if (typeof amount !== 'number') {
        return null;
      }
      sold[good] = amount;
    }
    return sold;
  }

  private static isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private static readOutcome(value: unknown): GameOutcome | null {
    if (value === undefined) {
      return 'playing';
    }
    if (value === 'playing' || value === 'loss' || value === 'goal') {
      return value;
    }
    return null;
  }

  private static replacer(_key: string, value: unknown): unknown {
    if (value instanceof Map) {
      return {
        dataType: 'Map',
        value: Array.from(value.entries()),
      };
    }

    return value;
  }

  private static reviver(_key: string, value: unknown): unknown {
    if (this.isSerializedMap(value)) {
      return new Map(value.value);
    }

    return value;
  }

  private static isSerializedMap(
    value: unknown
  ): value is { dataType: 'Map'; value: [unknown, unknown][] } {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const candidate = value as { dataType?: unknown; value?: unknown };
    return candidate.dataType === 'Map' && Array.isArray(candidate.value);
  }
}
