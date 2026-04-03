import Phaser from 'phaser';
import { TerrainGenerator } from '../game/map/TerrainGenerator';
import { TileMap } from '../game/map/TileMap';
import { TerrainType } from '../game/map/TerrainType';

export class WorldScene extends Phaser.Scene {
  public tileMap!: TileMap;
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
    // Generate placeholder tileset with solid colors
    const graphics = this.make.graphics({ x: 0, y: 0 });

    const terrainColors: Record<TerrainType, number> = {
      [TerrainType.OCEAN]: 0x00008b, // Dark blue
      [TerrainType.COAST]: 0x1e90ff, // Dodger blue
      [TerrainType.PLAINS]: 0x228b22, // Forest green
      [TerrainType.FOREST]: 0x006400, // Dark green
      [TerrainType.HILLS]: 0x8b4513, // Saddle brown
      [TerrainType.MOUNTAINS]: 0x808080, // Grey
    };

    // Draw each color on a 32x32 area in the graphics object
    Object.entries(terrainColors).forEach(([type, color]) => {
      const terrainType = Number(type) as TerrainType;
      graphics.fillStyle(color, 1);
      graphics.fillRect(
        terrainType * this.TILE_SIZE,
        0,
        this.TILE_SIZE,
        this.TILE_SIZE,
      );
    });

    graphics.generateTexture('tiles', this.TILE_SIZE * 6, this.TILE_SIZE);
  }

  create() {
    // Generate terrain data
    const generator = new TerrainGenerator(this.MAP_WIDTH, this.MAP_HEIGHT);
    const terrainData = generator.generate();
    this.tileMap = new TileMap(this.MAP_WIDTH, this.MAP_HEIGHT, terrainData);

    // Create Phaser tilemap
    const map = this.make.tilemap({
      data: terrainData,
      tileWidth: this.TILE_SIZE,
      tileHeight: this.TILE_SIZE,
    });

    const tileset = map.addTilesetImage(
      'tiles',
      undefined,
      this.TILE_SIZE,
      this.TILE_SIZE,
      0,
      0,
    );

    if (tileset) {
      map.createLayer(0, tileset, 0, 0);
    }

    // Example interaction to emit events
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // For now, simple logic to alternate between selecting a unit and a colony
      // in a real game, this would be based on what's at the pointer position
      const worldPoint = pointer.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;
      const x = Math.floor(worldPoint.x / this.TILE_SIZE);
      const y = Math.floor(worldPoint.y / this.TILE_SIZE);

      console.log(`Clicked at ${x}, ${y}`);

      // Emit events that React UI will listen to
      // These are placeholders for real selection logic
      this.events.emit('unitSelected', null);
      this.events.emit('colonySelected', null);
    });

    // Set camera bounds
    this.cameras.main.setBounds(
      0,
      0,
      this.MAP_WIDTH * this.TILE_SIZE,
      this.MAP_HEIGHT * this.TILE_SIZE,
    );

    // Setup input
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.zoomKeys = {
        plus: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.PLUS),
        minus: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.MINUS),
      };
    }
  }

  update() {
    const cam = this.cameras.main;
    const speed = 10;

    // Pan with arrow keys
    if (this.cursors.left.isDown) {
      cam.scrollX -= speed;
    } else if (this.cursors.right.isDown) {
      cam.scrollX += speed;
    }

    if (this.cursors.up.isDown) {
      cam.scrollY -= speed;
    } else if (this.cursors.down.isDown) {
      cam.scrollY += speed;
    }

    // Zoom with +/-
    const zoomSpeed = 0.02;
    if (this.zoomKeys.plus.isDown || this.input.keyboard?.addKey(187).isDown) {
      // 187 is '=' which is '+' on many keyboards
      cam.zoom += zoomSpeed;
    }
    if (this.zoomKeys.minus.isDown || this.input.keyboard?.addKey(189).isDown) {
      // 189 is '-'
      cam.zoom -= zoomSpeed;
    }

    // Constrain zoom
    cam.zoom = Phaser.Math.Clamp(cam.zoom, 0.5, 2.0);
  }
}
