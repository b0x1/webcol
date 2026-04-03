import Phaser from 'phaser';
import { TerrainGenerator } from '../game/map/TerrainGenerator';
import { TileMap } from '../game/map/TileMap';
import { TerrainType, ResourceType } from '../game/entities/types';
import { TerrainRenderer } from '../game/map/TerrainRenderer';
import { generateTerrainTextures } from '../assets/sprites/terrain';
import { Tile } from '../game/entities/Tile';

export class WorldScene extends Phaser.Scene {
  public tileMap!: TileMap;
  private terrainRenderer!: TerrainRenderer;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private zoomKeys!: {
    plus: Phaser.Input.Keyboard.Key;
    minus: Phaser.Input.Keyboard.Key;
    plusEqual: Phaser.Input.Keyboard.Key;
    minusKey: Phaser.Input.Keyboard.Key;
  };

  private readonly TILE_SIZE = 32;
  private readonly MAP_WIDTH = 80;
  private readonly MAP_HEIGHT = 60;

  constructor() {
    super('WorldScene');
  }

  preload() {
    generateTerrainTextures(this, this.TILE_SIZE);
  }

  create() {
    this.terrainRenderer = new TerrainRenderer(this as any, this.TILE_SIZE);

    const generator = new TerrainGenerator(this.MAP_WIDTH, this.MAP_HEIGHT);
    const terrainData = generator.generate();
    this.tileMap = new TileMap(this.MAP_WIDTH, this.MAP_HEIGHT, terrainData);

    const tiles: Tile[][] = terrainData.map((row, y) =>
      row.map((type, x) => {
        const tile = new Tile(`${x}-${y}`, x, y, type, 1);
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

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const worldPoint = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      const { x, y } = this.terrainRenderer.worldToTile(worldPoint.x, worldPoint.y);

      if (x >= 0 && x < this.MAP_WIDTH && y >= 0 && y < this.MAP_HEIGHT) {
        console.log(`Clicked at ${x}, ${y}`);
        this.terrainRenderer.updateSelectionHighlight(x, y);
      }

      this.events.emit('unitSelected', null);
      this.events.emit('colonySelected', null);
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
        plusEqual: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.EQUALS),
        minusKey: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DASH),
      };
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
    if (this.zoomKeys?.plus?.isDown || this.zoomKeys?.plusEqual?.isDown) {
      cam.zoom += zoomSpeed;
    }
    if (this.zoomKeys?.minus?.isDown || this.zoomKeys?.minusKey?.isDown) {
      cam.zoom -= zoomSpeed;
    }

    cam.zoom = Phaser.Math.Clamp(cam.zoom, 0.5, 2.0);
  }
}
