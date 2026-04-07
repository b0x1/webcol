import type { GameState } from '../state/gameStore';

export interface SaveMeta {
  slotName: string;
  timestamp: number;
  playerName: string;
  turn: number;
}

export interface SaveData {
  players: any[];
  currentPlayerId: string;
  turn: number;
  phase: any;
  europePrices: any;
  map: any[][];
}

export class SaveSystem {
  private static readonly MANIFEST_KEY = 'webcol_saves';
  private static readonly SAVE_PREFIX = 'webcol_save_';

  static save(state: GameState, slotName: string): void {
    const data: SaveData = {
      players: state.players,
      currentPlayerId: state.currentPlayerId,
      turn: state.turn,
      phase: state.phase,
      europePrices: state.europePrices,
      map: state.map,
    };

    const serialized = JSON.stringify(data, this.replacer);
    localStorage.setItem(`${this.SAVE_PREFIX}${slotName}`, serialized);

    this.updateManifest(slotName, state);
  }

  static load(slotName: string): Partial<GameState> | null {
    const serialized = localStorage.getItem(`${this.SAVE_PREFIX}${slotName}`);
    if (!serialized) return null;

    try {
      const data = JSON.parse(serialized, this.reviver) as SaveData;
      return data;
    } catch (e) {
      console.error('Failed to load save:', e);
      return null;
    }
  }

  static listSaves(): SaveMeta[] {
    const manifestJson = localStorage.getItem(this.MANIFEST_KEY);
    if (!manifestJson) return [];
    return JSON.parse(manifestJson);
  }

  static downloadSave(slotName: string): void {
    const serialized = localStorage.getItem(`${this.SAVE_PREFIX}${slotName}`);
    if (!serialized) return;

    const blob = new Blob([serialized], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `webcol_save_${slotName}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static deleteSave(slotName: string): void {
    localStorage.removeItem(`${this.SAVE_PREFIX}${slotName}`);
    const manifest = this.listSaves();
    const updatedManifest = manifest.filter((m) => m.slotName !== slotName);
    localStorage.setItem(this.MANIFEST_KEY, JSON.stringify(updatedManifest));
  }

  private static updateManifest(slotName: string, state: GameState): void {
    const manifest = this.listSaves();
    const humanPlayer = state.players.find((p) => p.isHuman);
    const newMeta: SaveMeta = {
      slotName,
      timestamp: Date.now(),
      playerName: humanPlayer?.name || 'Unknown',
      turn: state.turn,
    };

    const existingIndex = manifest.findIndex((m) => m.slotName === slotName);
    if (existingIndex >= 0) {
      manifest[existingIndex] = newMeta;
    } else {
      manifest.push(newMeta);
    }

    localStorage.setItem(this.MANIFEST_KEY, JSON.stringify(manifest));
  }

  private static replacer(_key: string, value: any): any {
    if (value instanceof Map) {
      return {
        dataType: 'Map',
        value: Array.from(value.entries()),
      };
    }
    return value;
  }

  private static reviver(_key: string, value: any): any {
    if (typeof value === 'object' && value !== null) {
      if (value.dataType === 'Map') {
        return new Map(value.value);
      }
    }
    return value;
  }
}
