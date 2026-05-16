import * as Phaser from 'phaser';
import { TileMap } from '../game/map/TileMap';
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
  public tileMap!: TileMap;
  private terrainRenderer!: TerrainRenderer;
  private unitRenderer!: UnitRenderer;
  private cameraManager!: CameraManager;
  private inputHandler!: InputHandler;
  private storeUnsubscribe: (() => void) | null = null;
  private gameLoadedUnsubscribe: (() => void) | null = null;
  private cameraJumpUnsubscribe: (() => void) | null = null;

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

    this.terrainRenderer = new TerrainRenderer(this, this.TILE_SIZE);
    this.unitRenderer = new UnitRenderer(this, this.terrainRenderer, this.TILE_SIZE);
    this.cameraManager = new CameraManager(this, this.terrainRenderer, this.TILE_SIZE);
    this.inputHandler = new InputHandler(this, this.terrainRenderer, this.cameraManager);

    const state = useGameStore.getState();
    const tiles = state.map;
    const mapWidth = tiles[0]?.length ?? 0;
    const mapHeight = tiles.length;

    this.tileMap = new TileMap(mapWidth, mapHeight, tiles.map(row => row.map(t => t.terrainType)));
    this.terrainRenderer.renderTileMap(tiles, [], state.players.flatMap(p => p.settlements));
    this.cameraManager.setup(mapWidth, mapHeight);

    this.inputHandler.setup(mapWidth, mapHeight, () => this.reachableTiles);

    this.storeUnsubscribe = useGameStore.subscribe((state, prevState) => {
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
        this.terrainRenderer.renderTileMap(state.map, [], playerSettlements, mapChanged);
      }

      // 2. Unit Rendering - Skip if no units or selections changed
      if (playersChanged || selectionChanged) {
        this.unitRenderer.render(state.players, state.selectedUnitId);
      }

      // 3. Pathfinding / Reachable Highlights - Skip if selected unit or map hasn't changed
      if (selectionChanged || playersChanged || mapChanged) {
        const selectedUnit = selectUnitById(state, state.selectedUnitId);
        const prevSelectedUnit = selectUnitById(prevState, prevState.selectedUnitId);

        if (selectedUnit !== prevSelectedUnit || mapChanged) {
          if (selectedUnit) {
            this.reachableTiles = getReachableTilesForUnit(selectedUnit, state.map);
            this.terrainRenderer.updateReachableHighlights(this.reachableTiles);
          } else {
            this.reachableTiles = [];
            this.terrainRenderer.clearReachableHighlights();
          }
        }
      }
    });

    this.gameLoadedUnsubscribe = eventBus.on('gameLoaded', () => {
      this.scene.restart();
    });

    this.cameraJumpUnsubscribe = eventBus.on('cameraJump', (pos: Position) => {
      this.cameraManager.centerOn(pos);
    });

    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
      this.cameraManager.emitViewportUpdate();
    });

    this.unitRenderer.render(state.players, state.selectedUnitId);
    this.cameraManager.emitViewportUpdate();
  }
  destroy(): void {
    if (this.storeUnsubscribe) this.storeUnsubscribe();
    if (this.gameLoadedUnsubscribe) this.gameLoadedUnsubscribe();
    if (this.cameraJumpUnsubscribe) this.cameraJumpUnsubscribe();
    this.inputHandler.destroy();
    this.terrainRenderer.destroy();
    this.unitRenderer.destroy();
  }
}
