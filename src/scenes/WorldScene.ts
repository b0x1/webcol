import Phaser from 'phaser';
import { TileMap } from '../game/map/TileMap';
import { TerrainRenderer } from '../game/map/TerrainRenderer';
import { SpriteLoader } from '../game/utils/SpriteLoader';
import { useGameStore } from '../game/state/gameStore';
import type { Unit } from '../game/entities/Unit';
import { MovementSystem } from '../game/systems/MovementSystem';
import { eventBus } from '../game/state/EventBus';
import { MAP_CONSTANTS, UNIT_CONSTANTS } from '../game/constants';
import { UnitRenderer } from '../game/map/UnitRenderer';
import { CameraManager } from '../game/map/CameraManager';
import { InputHandler } from '../game/map/InputHandler';

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

  preload() {
    SpriteLoader.preload(this, 'terrain', 'terrain.avif', 'terrain.json');
    SpriteLoader.preload(this, 'units', 'units.avif', 'units.json');
    SpriteLoader.preload(this, 'resources', 'resources.avif', 'resources.json');
    SpriteLoader.preload(this, 'other', 'other.avif', 'other.json');
  }

  private reachableTiles: { x: number; y: number; cost: number }[] = [];

  create() {
    ['terrain', 'units', 'resources', 'other'].forEach((key) => {
      SpriteLoader.register(this, key);
    });

    this.terrainRenderer = new TerrainRenderer(this as any, this.TILE_SIZE);
    this.unitRenderer = new UnitRenderer(this, this.terrainRenderer, this.TILE_SIZE);
    this.cameraManager = new CameraManager(this, this.terrainRenderer, this.TILE_SIZE);
    this.inputHandler = new InputHandler(this, this.terrainRenderer);

    const state = useGameStore.getState();
    const tiles = state.map;
    const mapWidth = tiles[0].length;
    const mapHeight = tiles.length;

    this.tileMap = new TileMap(mapWidth, mapHeight, tiles.map(row => row.map(t => t.terrainType)));
    this.terrainRenderer.renderTileMap(tiles, [], state.players.flatMap(p => p.settlements));
    this.cameraManager.setup(mapWidth, mapHeight);

    this.inputHandler.setup(
      mapWidth,
      mapHeight,
      () => this.reachableTiles,
      (id, x, y) => this.handleMove(id, x, y)
    );

    this.storeUnsubscribe = useGameStore.subscribe((state, prevState) => {
      if (!this.scene?.scene) return;
      if (!this.scene.isActive('WorldScene')) return;

      const playerSettlements = state.players.flatMap(p => p.settlements);
      const prevPlayerSettlements = prevState.players.flatMap(p => p.settlements);
      if (
        state.map !== prevState.map ||
        playerSettlements.length !== prevPlayerSettlements.length ||
        !playerSettlements.every((c, i) => c === prevPlayerSettlements[i])
      ) {
        this.terrainRenderer.renderTileMap(state.map, [], playerSettlements);
      }

      this.unitRenderer.render(state.players, state.selectedUnitId);

      const selectedUnit = state.players.flatMap((p) => p.units).find((u) => u.id === state.selectedUnitId);
      if (selectedUnit) {
        this.reachableTiles = MovementSystem.getReachableTiles(selectedUnit, state.map);
        this.terrainRenderer.updateReachableHighlights(this.reachableTiles);
      } else {
        this.reachableTiles = [];
        this.terrainRenderer.clearReachableHighlights();
      }
    });

    this.gameLoadedUnsubscribe = eventBus.on('gameLoaded', () => {
      this.scene.restart();
    });

    this.cameraJumpUnsubscribe = eventBus.on('cameraJump', ({ x, y }) => {
      this.cameraManager.centerOn(x, y);
    });

    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      if (this.cameras && this.cameras.main) {
        this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
        this.cameraManager.emitViewportUpdate();
      }
    });

    this.unitRenderer.render(state.players, state.selectedUnitId);
    this.cameraManager.emitViewportUpdate();
  }

  private isAnimating = false;

  private handleMove(unitId: string, toX: number, toY: number) {
    if (this.isAnimating) return;

    const state = useGameStore.getState();
    const unit = state.players.flatMap((p) => p.units).find((u) => u.id === unitId);
    if (!unit) return;

    const fromX = unit.x;
    const fromY = unit.y;

    this.isAnimating = true;

    this.animateUnitMove(unit, fromX, fromY, toX, toY, () => {
      useGameStore.getState().moveUnit(unitId, toX, toY);
      this.isAnimating = false;
      eventBus.emit('unitMoved', { id: unitId, fromX, fromY, toX, toY });
    });
  }

  private animateUnitMove(unit: Unit, fromX: number, fromY: number, toX: number, toY: number, onComplete: () => void) {
    const { x: startX, y: startY } = this.terrainRenderer.tileToWorld(fromX, fromY);
    const { x: endX, y: endY } = this.terrainRenderer.tileToWorld(toX, toY);

    this.unitRenderer.unitSprites.getChildren().forEach((child: any) => {
      if (
        child instanceof Phaser.GameObjects.Image &&
        child.texture.key === 'units' &&
        child.frame.name === unit.type &&
        child.x === startX + this.TILE_SIZE / 2 &&
        child.y === startY + this.TILE_SIZE / 2
      ) {
        child.setVisible(false);
      }
    });

    const tempSprite = this.add.image(
      startX + this.TILE_SIZE / 2,
      startY + this.TILE_SIZE / 2,
      'units',
      unit.type
    );
    tempSprite.setDepth(300);

    this.tweens.add({
      targets: tempSprite,
      x: endX + this.TILE_SIZE / 2,
      y: endY + this.TILE_SIZE / 2,
      duration: UNIT_CONSTANTS.ANIMATION_DURATION,
      onComplete: () => {
        tempSprite.destroy();
        onComplete();
      },
    });
  }

  destroy() {
    if (this.storeUnsubscribe) this.storeUnsubscribe();
    if (this.gameLoadedUnsubscribe) this.gameLoadedUnsubscribe();
    if (this.cameraJumpUnsubscribe) this.cameraJumpUnsubscribe();
    this.terrainRenderer.destroy();
    this.unitRenderer.destroy();
  }

  update() {
    this.cameraManager.update();
  }
}
