import type { GameState } from '../state/gameStore';
import { Player } from '../entities/Player';
import { Unit } from '../entities/Unit';
import { Colony } from '../entities/Colony';
import { Tile } from '../entities/Tile';
import { NativeSettlement } from '../entities/NativeSettlement';

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
  nativeSettlements: any[];
}

export class SaveSystem {
  private static readonly MANIFEST_KEY = 'colonization_saves';
  private static readonly SAVE_PREFIX = 'colonization_save_';

  static save(state: GameState, slotName: string): void {
    const data: SaveData = {
      players: state.players,
      currentPlayerId: state.currentPlayerId,
      turn: state.turn,
      phase: state.phase,
      europePrices: state.europePrices,
      map: state.map,
      nativeSettlements: state.nativeSettlements,
    };

    const serialized = JSON.stringify(data, this.replacer);
    localStorage.setItem(`${this.SAVE_PREFIX}${slotName}`, serialized);

    this.updateManifest(slotName, state);
  }

  static load(slotName: string): GameState | null {
    const serialized = localStorage.getItem(`${this.SAVE_PREFIX}${slotName}`);
    if (!serialized) return null;

    try {
      const data = JSON.parse(serialized, this.reviver) as SaveData;
      return this.hydrateState(data);
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

  private static replacer(key: string, value: any): any {
    if (value instanceof Map) {
      return {
        dataType: 'Map',
        value: Array.from(value.entries()),
      };
    }
    return value;
  }

  private static reviver(key: string, value: any): any {
    if (typeof value === 'object' && value !== null) {
      if (value.dataType === 'Map') {
        return new Map(value.value);
      }
    }
    return value;
  }

  private static hydrateState(data: SaveData): any {
    const players = data.players.map((pData) => {
      const player = new Player(pData.id, pData.name, pData.isHuman, pData.gold);
      player.units = pData.units.map((uData: any) => {
        const unit = new Unit(
          uData.id,
          uData.ownerId,
          uData.type,
          uData.x,
          uData.y,
          uData.movesRemaining
        );
        unit.cargo = uData.cargo;
        unit.maxMoves = uData.maxMoves;
        return unit;
      });
      player.colonies = pData.colonies.map((cData: any) => {
        const colony = new Colony(
          cData.id,
          cData.ownerId,
          cData.name,
          cData.x,
          cData.y,
          cData.population
        );
        colony.buildings = cData.buildings;
        colony.inventory = cData.inventory;
        colony.productionQueue = cData.productionQueue;
        colony.workforce = cData.workforce;
        colony.units = cData.units.map((uData: any) => {
          const unit = new Unit(
            uData.id,
            uData.ownerId,
            uData.type,
            uData.x,
            uData.y,
            uData.movesRemaining
          );
          unit.cargo = uData.cargo;
          unit.maxMoves = uData.maxMoves;
          return unit;
        });
        return colony;
      });
      return player;
    });

    const map = data.map.map((row) =>
      row.map((tData) => {
        const tile = new Tile(
          tData.id,
          tData.x,
          tData.y,
          tData.terrainType,
          tData.movementCost,
          tData.hasResource
        );
        return tile;
      })
    );

    const nativeSettlements = data.nativeSettlements.map((sData) => {
      const settlement = new NativeSettlement(
        sData.id,
        sData.name,
        sData.tribe,
        sData.x,
        sData.y,
        sData.population,
        sData.attitude,
        sData.goods
      );
      return settlement;
    });

    return {
      players,
      currentPlayerId: data.currentPlayerId,
      turn: data.turn,
      phase: data.phase,
      europePrices: data.europePrices,
      map,
      nativeSettlements,
    };
  }
}
