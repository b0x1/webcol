import type { Player } from '../entities/Player';
import type { Tile } from '../entities/Tile';
import type { GoodType, TurnPhase } from '../entities/types';

export interface SaveData {
  players: Player[];
  currentPlayerId: string;
  turn: number;
  phase: TurnPhase;
  europePrices: Record<GoodType, number>;
  map: Tile[][];
}

/* eslint-disable-next-line @typescript-eslint/no-extraneous-class */
export class SaveSystem {
  private constructor() {
    // Static utility class
  }

  static serialize(
   state: SaveData
  ): string {
    const data: SaveData = {
      players: state.players,
      currentPlayerId: state.currentPlayerId,
      turn: state.turn,
      phase: state.phase,
      europePrices: state.europePrices,
      map: state.map,
    };

    return JSON.stringify(data, (key, value) => this.replacer(key, value));
  }

  static deserialize(serialized: string): SaveData | null {
    try {
      const parsed = JSON.parse(serialized, (key, value) => this.reviver(key, value)) as unknown;
      if (this.isValidSaveData(parsed)) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  private static isValidSaveData(data: unknown): data is SaveData {
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
