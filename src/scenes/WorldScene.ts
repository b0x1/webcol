import Phaser from 'phaser';
import { TerrainGenerator } from '../game/map/TerrainGenerator';
import { TileMap } from '../game/map/TileMap';
import { TerrainType, ResourceType } from '../game/entities/types';
import { TerrainRenderer } from '../game/map/TerrainRenderer';
import { Tile } from '../game/entities/Tile';
import { SpriteLoader } from '../game/utils/SpriteLoader';
import { useGameStore } from '../game/state/gameStore';
import { Unit } from '../game/entities/Unit';
import { Player } from '../game/entities/Player';
import { UnitType, Attitude } from '../game/entities/types';
import { MovementSystem } from '../game/systems/MovementSystem';
import { eventBus } from '../game/state/EventBus';
import { MAP_CONSTANTS, UNIT_CONSTANTS } from '../game/constants';

export class WorldScene extends Phaser.Scene {
  public tileMap!: TileMap;
  private terrainRenderer!: TerrainRenderer;
  private unitSprites!: Phaser.GameObjects.Group;
  private selectionRings!: Phaser.GameObjects.Group;
  private unitBadges!: Phaser.GameObjects.Group;
  private storeUnsubscribe: (() => void) | null = null;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private zoomKeys!: {
    plus: Phaser.Input.Keyboard.Key;
    minus: Phaser.Input.Keyboard.Key;
  };
  private gameLoadedUnsubscribe: (() => void) | null = null;
  private cameraJumpUnsubscribe: (() => void) | null = null;

  private readonly TILE_SIZE = MAP_CONSTANTS.TILE_SIZE;
  private readonly MAP_WIDTH = MAP_CONSTANTS.WIDTH;
  private readonly MAP_HEIGHT = MAP_CONSTANTS.HEIGHT;

  constructor() {
    super('WorldScene');
  }

  preload() {
    // Load AVIF spritesheets via SpriteLoader
    SpriteLoader.preload(this, 'terrain', 'terrain.avif', 'terrain.json');
    SpriteLoader.preload(this, 'units', 'units.avif', 'units.json');
    SpriteLoader.preload(this, 'resources', 'resources.avif', 'resources.json');
    SpriteLoader.preload(this, 'other', 'other.avif', 'other.json');
  }

  private reachableTiles: { x: number; y: number; cost: number }[] = [];

  create() {
    // Register frames from manifests via SpriteLoader
    ['terrain', 'units', 'resources', 'other'].forEach((key) => {
      SpriteLoader.register(this, key);
    });

    this.terrainRenderer = new TerrainRenderer(this as any, this.TILE_SIZE);

    this.unitSprites = this.add.group();
    this.selectionRings = this.add.group();
    this.unitBadges = this.add.group();

    const state = useGameStore.getState();
    const tiles = state.map;
    const mapWidth = tiles[0].length;
    const mapHeight = tiles.length;
    const nativeSettlements = state.nativeSettlements;
    const colonies = state.players.flatMap(p => p.colonies);
    this.tileMap = new TileMap(mapWidth, mapHeight, tiles.map(row => row.map(t => t.terrainType)));

    this.terrainRenderer.renderTileMap(tiles, nativeSettlements, colonies);

    // Disable context menu for right-click handling
    this.input.mouse?.disableContextMenu();

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const worldPoint = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      const { x, y } = this.terrainRenderer.worldToTile(worldPoint.x, worldPoint.y);

      if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) {
        return;
      }

      const state = useGameStore.getState();

      if (pointer.leftButtonDown()) {
        // Selection logic
        const unitAtTile = state.players
          .flatMap((p) => p.units)
          .find((u) => u.x === x && u.y === y);

        const colonyAtTile = state.players
          .flatMap((p) => p.colonies)
          .find((c) => c.x === x && c.y === y);

        const nativeSettlementAtTile = state.nativeSettlements.find((s) => s.x === x && s.y === y);

        if (unitAtTile) {
          console.log(`Selecting unit ${unitAtTile.id} at ${x}, ${y}`);
          useGameStore.getState().selectUnit(unitAtTile.id);
          this.events.emit('unitSelected', unitAtTile.id);
        } else if (colonyAtTile) {
          console.log(`Selecting colony ${colonyAtTile.id} at ${x}, ${y}`);
          useGameStore.getState().selectColony(colonyAtTile.id);
          this.events.emit('colonySelected', colonyAtTile.id);
        } else if (nativeSettlementAtTile) {
          const selectedUnitId = useGameStore.getState().selectedUnitId;
          if (selectedUnitId) {
            const selectedUnit = state.players
              .flatMap((p) => p.units)
              .find((u) => u.id === selectedUnitId);

            if (selectedUnit) {
              if (
                selectedUnit.type === UnitType.SOLDIER &&
                nativeSettlementAtTile.attitude === Attitude.HOSTILE
              ) {
                useGameStore.getState().attackNativeSettlement(nativeSettlementAtTile.id, selectedUnitId);
              } else if (
                selectedUnit.type === UnitType.COLONIST &&
                nativeSettlementAtTile.attitude !== Attitude.HOSTILE
              ) {
                useGameStore.getState().setNativeTradeModalOpen(true, nativeSettlementAtTile.id);
              }
            }
          }
        } else {
          useGameStore.getState().selectUnit(null);
          useGameStore.getState().selectColony(null);
          this.events.emit('unitSelected', null as any);
          this.events.emit('colonySelected', null as any);
        }
        this.terrainRenderer.updateSelectionHighlight(x, y);
      } else if (pointer.rightButtonDown()) {
        // Movement or Combat logic
        if (state.selectedUnitId) {
          const selectedUnit = state.players
            .flatMap((p) => p.units)
            .find((u) => u.id === state.selectedUnitId);

          if (selectedUnit) {
            // Check for combat targets
            const enemyUnitAtTile = state.players
              .filter((p) => p.id !== state.currentPlayerId)
              .flatMap((p) => p.units)
              .find((u) => u.x === x && u.y === y);

            const enemyColonyAtTile = state.players
              .filter((p) => p.id !== state.currentPlayerId)
              .flatMap((p) => p.colonies)
              .find((c) => c.x === x && c.y === y);

            const settlementAtTile = state.nativeSettlements.find((s) => s.x === x && s.y === y);

            if (selectedUnit.type === UnitType.SOLDIER && (enemyUnitAtTile || enemyColonyAtTile || (settlementAtTile && settlementAtTile.attitude === Attitude.HOSTILE))) {
              useGameStore.getState().resolveCombat(selectedUnit.id, x, y);
            } else if (state.selectedUnitId) {
              // Movement logic
              const isReachable = this.reachableTiles.some((t) => t.x === x && t.y === y);
              if (isReachable) {
                this.handleMove(state.selectedUnitId, x, y);
              } else {
                // Deselect on unreachable right-click
                useGameStore.getState().selectUnit(null);
                this.events.emit('unitSelected', null as any);
                this.terrainRenderer.updateSelectionHighlight(null, null);
              }
            }
          }
        }
      }
    });

    // Subscribe to store changes
    this.storeUnsubscribe = useGameStore.subscribe((state, prevState) => {
      if (!this.scene?.scene) return;
      if (!this.scene.isActive('WorldScene')) return;

      // Only re-render the map if it, native settlements, or colonies have changed
      const colonies = state.players.flatMap(p => p.colonies);
      const prevColonies = prevState.players.flatMap(p => p.colonies);
      if (
        state.map !== prevState.map ||
        state.nativeSettlements !== prevState.nativeSettlements ||
        colonies.length !== prevColonies.length ||
        !colonies.every((c, i) => c === prevColonies[i])
      ) {
        this.terrainRenderer.renderTileMap(state.map, state.nativeSettlements, colonies);
      }

      this.renderUnits();

      const selectedUnit = state.players
        .flatMap((p) => p.units)
        .find((u) => u.id === state.selectedUnitId);

      if (selectedUnit) {
        this.reachableTiles = MovementSystem.getReachableTiles(selectedUnit, state.map);
        this.terrainRenderer.updateReachableHighlights(this.reachableTiles);
      } else {
        this.reachableTiles = [];
        this.terrainRenderer.clearReachableHighlights();
      }
    });

    // Escape key for deselection
    this.input.keyboard?.on('keydown-ESC', () => {
      useGameStore.getState().selectUnit(null);
      this.events.emit('unitSelected', null as any);
      this.terrainRenderer.updateSelectionHighlight(null, null);
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const worldPoint = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      const { x, y } = this.terrainRenderer.worldToTile(worldPoint.x, worldPoint.y);

      if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
        const settlement = useGameStore.getState().nativeSettlements.find((s) => s.x === x && s.y === y);
        this.terrainRenderer.showTooltip(x, y, worldPoint.x, worldPoint.y, settlement?.name);
      } else {
        this.terrainRenderer.hideTooltip();
      }
    });

    this.input.on('pointerout', () => {
      this.terrainRenderer.hideTooltip();
    });

    this.cameras.main.setBounds(
      0,
      0,
      mapWidth * this.TILE_SIZE,
      mapHeight * this.TILE_SIZE,
    );

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.zoomKeys = {
        plus: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PLUS),
        minus: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.MINUS),
      };
    }

    this.gameLoadedUnsubscribe = eventBus.on('gameLoaded', () => {
      this.scene.restart();
    });

    this.cameraJumpUnsubscribe = eventBus.on('cameraJump', ({ x, y }) => {
      const { x: wx, y: wy } = this.terrainRenderer.tileToWorld(x, y);
      this.cameras.main.centerOn(wx, wy);
    });

    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      if (this.cameras && this.cameras.main) {
        this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
      }
    });

    this.renderUnits();
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

    // Animate movement first
    this.animateUnitMove(unit, fromX, fromY, toX, toY, () => {
      // Use gameStore.moveUnit() after animation completes
      useGameStore.getState().moveUnit(unitId, toX, toY);
      this.isAnimating = false;
      // Emit unitMoved event
      eventBus.emit('unitMoved', { id: unitId, fromX, fromY, toX, toY });
    });
  }

  private animateUnitMove(unit: Unit, fromX: number, fromY: number, toX: number, toY: number, onComplete: () => void) {
    const { x: startX, y: startY } = this.terrainRenderer.tileToWorld(fromX, fromY);
    const { x: endX, y: endY } = this.terrainRenderer.tileToWorld(toX, toY);

    // Hide original unit sprite before animation starts
    // We can find it by its starting position in the current sprites group.
    this.unitSprites.getChildren().forEach((child: any) => {
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

  private renderUnits() {
    if (!this.unitSprites || !this.selectionRings || !this.unitBadges) return;

    this.unitSprites.clear(true, true);
    this.selectionRings.clear(true, true);
    this.unitBadges.clear(true, true);

    const state = useGameStore.getState();
    const unitsByTile: Record<string, Unit[]> = {};

    state.players.forEach((player) => {
      player.units.forEach((unit) => {
        const key = `${unit.x}-${unit.y}`;
        if (!unitsByTile[key]) unitsByTile[key] = [];
        unitsByTile[key].push(unit);
      });
    });

    Object.entries(unitsByTile).forEach(([key, units]) => {
      const [tx, ty] = key.split('-').map(Number);
      const { x: worldX, y: worldY } = this.terrainRenderer.tileToWorld(tx, ty);

      units.forEach((unit, index) => {
        const offset = index * 4;
        const ux = worldX + this.TILE_SIZE / 2 - offset;
        const uy = worldY + this.TILE_SIZE / 2 - offset;

        const sprite = this.add.image(ux, uy, 'units', unit.type);
        sprite.setDepth(150 + index);
        this.unitSprites?.add(sprite);

        if (state.selectedUnitId === unit.id) {
          const ring = this.add.graphics();
          ring.lineStyle(2, 0xffff00, 1);
          ring.strokeCircle(ux, uy, (this.TILE_SIZE * 0.7) / 2 + 2);
          ring.setDepth(149);
          this.selectionRings?.add(ring);
        }

        // Add count badge only for the top unit if there are multiple
        if (index === units.length - 1 && units.length > 1) {
          const badgeX = ux + 8;
          const badgeY = uy - 8;
          const badgeBg = this.add.graphics();
          badgeBg.fillStyle(0x000000, 0.8);
          badgeBg.fillCircle(badgeX, badgeY, 8);
          badgeBg.setDepth(200);
          this.unitBadges.add(badgeBg);

          const badgeText = this.add.text(badgeX, badgeY, units.length.toString(), {
            fontSize: '10px',
            color: '#ffffff',
          }).setOrigin(0.5);
          badgeText.setDepth(201);
          this.unitBadges.add(badgeText);
        }
      });
    });
  }

  destroy() {
    if (this.storeUnsubscribe) {
      this.storeUnsubscribe();
    }
    if (this.gameLoadedUnsubscribe) {
      this.gameLoadedUnsubscribe();
    }
    if (this.cameraJumpUnsubscribe) {
      this.cameraJumpUnsubscribe();
    }
    this.terrainRenderer.destroy();
    this.unitSprites.destroy(true);
    this.selectionRings.destroy(true);
    this.unitBadges.destroy(true);
  }

  update() {
    const cam = this.cameras.main;
    const speed = 30;

    if (this.cursors?.left?.isDown) {
      cam.scrollX -= speed;
    } else if (this.cursors?.right?.isDown) {
      cam.scrollX += speed;
    }

    if (this.cursors?.up?.isDown) {
      cam.scrollY -= speed;
    } else if (this.cursors?.down?.isDown) {
      cam.scrollY += speed;
    }

    const zoomSpeed = 0.02;
    if (this.zoomKeys?.plus?.isDown) {
      cam.zoom += zoomSpeed;
    }
    if (this.zoomKeys?.minus?.isDown) {
      cam.zoom -= zoomSpeed;
    }

    cam.zoom = Phaser.Math.Clamp(cam.zoom, 0.5, 2.0);
  }
}
