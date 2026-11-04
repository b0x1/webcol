import * as Phaser from 'phaser';
import { TerrainRenderer } from '../game/map/TerrainRenderer';
import { SpriteLoader } from '../game/utils/SpriteLoader';
import { getReachableTilesForUnit, useGameStore, selectUnitById } from '@client/game/state/gameStore';
import { eventBus } from '@client/game/state/EventBus';
import { MAP_CONSTANTS } from '@shared/game/constants';
import { UnitRenderer } from '../game/map/UnitRenderer';
import { CameraManager } from '../game/map/CameraManager';
import { InputHandler } from '../game/map/InputHandler';
import type { Position } from '@shared/game/entities/Position';

export class WorldScene extends Phaser.Scene {
  private readonly TILE_SIZE = MAP_CONSTANTS.TILE_SIZE;

  constructor() {
    super('WorldScene');
  }

  preload(): void {
    SpriteLoader.preload(this, 'terrain', 'terrain.avif', 'terrain.json');
    SpriteLoader.preload(this, 'units', 'units.avif', 'units.json');
    SpriteLoader.preload(this, 'resources', 'resources.avif', 'resources.json');
    SpriteLoader.preload(this, 'other', 'other.avif', 'other.json');
  }

  private reachableTiles: (Position & { cost: number })[] = [];


  create(): void {
    ['terrain', 'units', 'resources', 'other'].forEach((key) => {
      SpriteLoader.register(this, key);
    });

    const terrainRenderer = new TerrainRenderer(this, this.TILE_SIZE);
    const unitRenderer = new UnitRenderer(this, terrainRenderer, this.TILE_SIZE);
    const cameraManager = new CameraManager(this, terrainRenderer, this.TILE_SIZE);
    const inputHandler = new InputHandler(this, terrainRenderer, cameraManager);

    const state = useGameStore.getState();
    const tiles = state.map;
    const mapWidth = tiles[0]?.length ?? 0;
    const mapHeight = tiles.length;

    terrainRenderer.renderTileMap(tiles, [], state.players.flatMap(p => p.settlements));
    cameraManager.setup(mapWidth, mapHeight);

    inputHandler.setup(mapWidth, mapHeight, () => this.reachableTiles);

    const storeUnsubscribe = useGameStore.subscribe((state, prevState) => {
      if (!this.scene.isActive('WorldScene')) return;

      const mapChanged = state.map !== prevState.map;
      const playersChanged = state.players !== prevState.players;
      const selectionChanged = state.selectedUnitId !== prevState.selectedUnitId;

      if (!mapChanged && !playersChanged && !selectionChanged) return;

      // 1. Terrain Rendering - Skip if nothing relevant changed
      // We check for map changes or settlement changes (via player array or settlement list references)
      const settlementsChanged = playersChanged && (
        state.players.length !== prevState.players.length ||
        state.players.some((p, i) => p.settlements !== prevState.players[i]?.settlements)
      );

      if (mapChanged || settlementsChanged) {
        const playerSettlements = state.players.flatMap(p => p.settlements);
        terrainRenderer.renderTileMap(state.map, [], playerSettlements, mapChanged);
      }

      // 2. Unit Rendering - Skip if no units or selections changed
      if (playersChanged || selectionChanged) {
        unitRenderer.render(state.players, state.selectedUnitId);
      }

      // 3. Pathfinding / Reachable Highlights - Skip if selected unit or map hasn't changed
      if (selectionChanged || playersChanged || mapChanged) {
        const selectedUnit = selectUnitById(state, state.selectedUnitId);
        const prevSelectedUnit = selectUnitById(prevState, prevState.selectedUnitId);

        if (selectedUnit !== prevSelectedUnit || mapChanged) {
          if (selectedUnit) {
            this.reachableTiles = getReachableTilesForUnit(selectedUnit, state.map);
            terrainRenderer.updateReachableHighlights(this.reachableTiles);
          } else {
            this.reachableTiles = [];
            terrainRenderer.clearReachableHighlights();
          }
        }
      }
    });

    const gameLoadedUnsubscribe = eventBus.on('gameLoaded', () => {
      this.scene.restart();
    });

    const cameraJumpUnsubscribe = eventBus.on('cameraJump', (pos: Position) => {
      cameraManager.centerOn(pos);
    });

    const onResize = (gameSize: Phaser.Structs.Size): void => {
      this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
      cameraManager.emitViewportUpdate();
    };
    this.scale.on('resize', onResize);

    let released = false;
    const release = (): void => {
      if (released) {
        return;
      }
      released = true;
      storeUnsubscribe();
      gameLoadedUnsubscribe();
      cameraJumpUnsubscribe();
      this.scale.off('resize', onResize);
      inputHandler.destroy();
      terrainRenderer.destroy();
      unitRenderer.destroy();
    };
    this.events.once('shutdown', release);

    unitRenderer.render(state.players, state.selectedUnitId);
    cameraManager.emitViewportUpdate();
  }
}
