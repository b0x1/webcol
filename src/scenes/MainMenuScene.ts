import Phaser from 'phaser';
import { TerrainGenerator } from '../game/map/TerrainGenerator';
import { TerrainRenderer } from '../game/map/TerrainRenderer';
import { TerrainType } from '../game/entities/types';
import type { Tile } from '../game/entities/Tile';
import { MAP_CONSTANTS } from '../game/constants';
import { SpriteLoader } from '../game/utils/SpriteLoader';
import { eventBus } from '../game/state/EventBus';

export class MainMenuScene extends Phaser.Scene {
  private terrainRenderer!: TerrainRenderer;

  constructor() {
    super('MainMenuScene');
  }

  preload() {
    // Load AVIF spritesheets via SpriteLoader
    SpriteLoader.preload(this, 'terrain', 'terrain.avif', 'terrain.json');
    SpriteLoader.preload(this, 'resources', 'resources.avif', 'resources.json');
    SpriteLoader.preload(this, 'other', 'other.avif', 'other.json');
  }

  create() {
    // Register frames from manifests via SpriteLoader
    ['terrain', 'resources', 'other'].forEach((key) => {
      SpriteLoader.register(this, key);
    });
    const width = Math.ceil(this.cameras.main.width / MAP_CONSTANTS.TILE_SIZE) + 1;
    const height = Math.ceil(this.cameras.main.height / MAP_CONSTANTS.TILE_SIZE) + 1;

    this.terrainRenderer = new TerrainRenderer(this as any, MAP_CONSTANTS.TILE_SIZE);

    const generator = new TerrainGenerator(width, height, `menu-bg-${Date.now()}`);
    const terrainData = generator.generate();

    const tiles: Tile[][] = terrainData.map((row, y) =>
      row.map((type, x) => {
        let cost = 1;
        if (type === TerrainType.FOREST || type === TerrainType.HILLS) {
          cost = 2;
        }
        return {
          id: `${x}-${y}`,
          x,
          y,
          terrainType: type,
          movementCost: cost,
          hasResource: null,
        };
      })
    );

    this.terrainRenderer.renderTileMap(tiles, []);

    // Dark overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
    overlay.setDepth(100);

    // Title removed - handled by React UI MainMenu.tsx

    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      if (this.cameras && this.cameras.main) {
        this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
      }
      overlay.clear();
      overlay.fillStyle(0x000000, 0.6);
      overlay.fillRect(0, 0, gameSize.width, gameSize.height);
    });

    // Event listeners for scene transitions
    eventBus.on('gameStarted', () => {
      this.scene.start('WorldScene');
    });

    eventBus.on('returnToMainMenu', () => {
      this.scene.start('MainMenuScene');
    });
  }
}
