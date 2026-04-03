import Phaser from 'phaser';
import { TerrainGenerator } from '../game/map/TerrainGenerator';
import { TileMap } from '../game/map/TileMap';
import { TerrainType, ResourceType } from '../game/entities/types';
import { TerrainRenderer } from '../game/map/TerrainRenderer';
import { generateTerrainTextures, generateUnitTextures } from '../assets/sprites/terrain';
import { Tile } from '../game/entities/Tile';
import { useGameStore } from '../game/state/gameStore';
import { Unit } from '../game/entities/Unit';
import { Player } from '../game/entities/Player';
import { UnitType } from '../game/entities/types';
import { MovementSystem } from '../game/systems/MovementSystem';
import { eventBus } from '../game/state/EventBus';

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

  private readonly TILE_SIZE = 32;
  private readonly MAP_WIDTH = 80;
  private readonly MAP_HEIGHT = 60;

  constructor() {
    super('WorldScene');
  }

  preload() {
    generateTerrainTextures(this, this.TILE_SIZE);
    generateUnitTextures(this, this.TILE_SIZE);
  }

  private reachableTiles: { x: number; y: number; cost: number }[] = [];

  create() {
    this.terrainRenderer = new TerrainRenderer(this as any, this.TILE_SIZE);

    this.unitSprites = this.add.group();
    this.selectionRings = this.add.group();
    this.unitBadges = this.add.group();

    const generator = new TerrainGenerator(this.MAP_WIDTH, this.MAP_HEIGHT);
    const terrainData = generator.generate();
    this.tileMap = new TileMap(this.MAP_WIDTH, this.MAP_HEIGHT, terrainData);

    const tiles: Tile[][] = terrainData.map((row, y) =>
      row.map((type, x) => {
        let cost = 1;
        if (type === TerrainType.FOREST || type === TerrainType.HILLS) {
          cost = 2;
        }
        const tile = new Tile(`${x}-${y}`, x, y, type, cost);
        if (type === TerrainType.OCEAN && Math.random() < 0.05) {
          tile.hasResource = ResourceType.FISH;
        } else if (type === TerrainType.FOREST && Math.random() < 0.1) {
          tile.hasResource = ResourceType.FOREST;
        } else if (type === TerrainType.PLAINS && Math.random() < 0.05) {
          tile.hasResource = ResourceType.ORE_DEPOSIT;
        } else if (type === TerrainType.PLAINS && Math.random() < 0.05) {
          tile.hasResource = ResourceType.FERTILE_LAND;
        }
        return tile;
      })
    );

    this.terrainRenderer.renderTileMap(tiles);

    // Initialize game state if map is empty
    if (useGameStore.getState().map.length === 0) {
      const humanPlayer = new Player('player-1', 'Human Player', true, 100);

      const startX = 40;
      const startY = 30;
      humanPlayer.units = [
        new Unit('u1', 'player-1', UnitType.COLONIST, startX, startY, 3),
        new Unit('u2', 'player-1', UnitType.COLONIST, startX, startY, 3),
        new Unit('u3', 'player-1', UnitType.SOLDIER, startX + 1, startY, 3),
        new Unit('u4', 'player-1', UnitType.PIONEER, startX, startY + 1, 3),
      ];

      let shipX = startX;
      let shipY = startY;
      for (let y = Math.max(0, startY - 5); y < Math.min(this.MAP_HEIGHT, startY + 5); y++) {
        for (let x = Math.max(0, startX - 5); x < Math.min(this.MAP_WIDTH, startX + 5); x++) {
          if (tiles[y][x].terrainType === TerrainType.OCEAN) {
            shipX = x;
            shipY = y;
            break;
          }
        }
        if (shipX !== startX) break;
      }
      humanPlayer.units.push(new Unit('u5', 'player-1', UnitType.SHIP, shipX, shipY, 6));

      useGameStore.setState({
        map: tiles,
        players: [humanPlayer],
        currentPlayerId: 'player-1',
      });
    }

    // Disable context menu for right-click handling
    this.input.mouse?.disableContextMenu();

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const worldPoint = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      const { x, y } = this.terrainRenderer.worldToTile(worldPoint.x, worldPoint.y);

      if (x < 0 || x >= this.MAP_WIDTH || y < 0 || y >= this.MAP_HEIGHT) {
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

        if (unitAtTile) {
          console.log(`Selecting unit ${unitAtTile.id} at ${x}, ${y}`);
          useGameStore.getState().selectUnit(unitAtTile.id);
          this.events.emit('unitSelected', unitAtTile.id);
        } else if (colonyAtTile) {
          console.log(`Selecting colony ${colonyAtTile.id} at ${x}, ${y}`);
          useGameStore.getState().selectColony(colonyAtTile.id);
          this.events.emit('colonySelected', colonyAtTile.id);
        } else {
          useGameStore.getState().selectUnit(null);
          useGameStore.getState().selectColony(null);
          this.events.emit('unitSelected', null);
          this.events.emit('colonySelected', null);
        }
        this.terrainRenderer.updateSelectionHighlight(x, y);
      } else if (pointer.rightButtonDown()) {
        // Movement logic
        if (state.selectedUnitId) {
          const isReachable = this.reachableTiles.some((t) => t.x === x && t.y === y);
          if (isReachable) {
            this.handleMove(state.selectedUnitId, x, y);
          } else {
            // Deselect on unreachable right-click
            useGameStore.getState().selectUnit(null);
            this.events.emit('unitSelected', null);
            this.terrainRenderer.updateSelectionHighlight(null, null);
          }
        }
      }
    });

    // Subscribe to store changes
    this.storeUnsubscribe = useGameStore.subscribe((state) => {
      if (!this.scene?.scene) return;
      if (!this.scene.isActive('WorldScene')) return;
      this.renderUnits();

      const selectedUnit = state.players
        .flatMap((p) => p.units)
        .find((u) => u.id === state.selectedUnitId);

      if (selectedUnit) {
        this.reachableTiles = MovementSystem.getReachableTiles(selectedUnit, tiles);
        this.terrainRenderer.updateReachableHighlights(this.reachableTiles);
      } else {
        this.reachableTiles = [];
        this.terrainRenderer.clearReachableHighlights();
      }
    });

    // Escape key for deselection
    this.input.keyboard?.on('keydown-ESC', () => {
      useGameStore.getState().selectUnit(null);
      this.events.emit('unitSelected', null);
      this.terrainRenderer.updateSelectionHighlight(null, null);
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const worldPoint = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      const { x, y } = this.terrainRenderer.worldToTile(worldPoint.x, worldPoint.y);

      if (x >= 0 && x < this.MAP_WIDTH && y >= 0 && y < this.MAP_HEIGHT) {
        this.terrainRenderer.showTooltip(x, y, worldPoint.x, worldPoint.y);
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
      this.MAP_WIDTH * this.TILE_SIZE,
      this.MAP_HEIGHT * this.TILE_SIZE,
    );

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.zoomKeys = {
        plus: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PLUS),
        minus: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.MINUS),
      };
    }
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
        child.texture.key === `unit-${unit.type}` &&
        child.x === startX + this.TILE_SIZE / 2 &&
        child.y === startY + this.TILE_SIZE / 2
      ) {
        child.setVisible(false);
      }
    });

    const tempSprite = this.add.image(
      startX + this.TILE_SIZE / 2,
      startY + this.TILE_SIZE / 2,
      `unit-${unit.type}`
    );
    tempSprite.setDepth(300);

    this.tweens.add({
      targets: tempSprite,
      x: endX + this.TILE_SIZE / 2,
      y: endY + this.TILE_SIZE / 2,
      duration: 200,
      onComplete: () => {
        tempSprite.destroy();
        onComplete();
      },
    });
  }

  private renderUnits() {
    if (!this.unitSprites?.children || !this.selectionRings?.children || !this.unitBadges?.children) return;

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

        const sprite = this.add.image(ux, uy, `unit-${unit.type}`);
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
  }

  update() {
    const cam = this.cameras.main;
    const speed = 10;

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
