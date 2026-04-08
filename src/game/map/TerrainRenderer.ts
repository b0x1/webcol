import Phaser from 'phaser';
import type { Tile } from '../entities/Tile';
import type { Settlement } from '../entities/Settlement';
import { TerrainType } from '../entities/types';

export class TerrainRenderer {
  private scene: Phaser.Scene;
  private tileSize: number;
  private tilemap: Phaser.Tilemaps.Tilemap | null = null;
  private terrainLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private resourceLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private selectionHighlight: Phaser.GameObjects.Graphics | null = null;
  private reachableHighlights: Phaser.GameObjects.Graphics | null = null;
  private hoverTooltip: Phaser.GameObjects.Text | null = null;
  private coastBorders: Phaser.GameObjects.Graphics | null = null;
  private npcSettlementGraphics: Phaser.GameObjects.Group | null = null;
  private playerSettlementGraphics: Phaser.GameObjects.Group | null = null;

  private terrainIndexMap = new Map<string, number>();
  private resourceIndexMap = new Map<string, number>();

  constructor(scene: Phaser.Scene, tileSize: number) {
    this.scene = scene;
    this.tileSize = tileSize;
  }

  private initializeIndexMaps() {
    const terrainManifest = this.scene.cache.json.get('terrain-manifest');
    const terrainKeys = Object.keys(terrainManifest).sort();
    terrainKeys.forEach((key, index) => {
      this.terrainIndexMap.set(key, index);
    });

    const resourceManifest = this.scene.cache.json.get('resources-manifest');
    const resourceKeys = Object.keys(resourceManifest).sort();
    resourceKeys.forEach((key, index) => {
      this.resourceIndexMap.set(key, index);
    });
  }

  public tileToWorld(tileX: number, tileY: number): { x: number; y: number } {
    return {
      x: tileX * this.tileSize,
      y: tileY * this.tileSize,
    };
  }

  public worldToTile(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: Math.floor(worldX / this.tileSize),
      y: Math.floor(worldY / this.tileSize),
    };
  }

  public renderTileMap(
    tiles: Tile[][],
    _npcSettlements: Settlement[] = [], // Deprecated
    playerSettlements: Settlement[] = [],
  ) {
    const height = tiles.length;
    const width = tiles[0]?.length || 0;

    if (!this.tilemap || this.tilemap.width !== width || this.tilemap.height !== height) {
      this.destroyTilemap();
      this.initializeIndexMaps();

      this.tilemap = this.scene.make.tilemap({
        tileWidth: this.tileSize,
        tileHeight: this.tileSize,
        width: width,
        height: height,
      });

      const terrainTileset = this.tilemap.addTilesetImage('terrain', 'terrain', this.tileSize, this.tileSize, 0, 0);
      const resourceTileset = this.tilemap.addTilesetImage('resources', 'resources', this.tileSize, this.tileSize, 0, 0);

      if (terrainTileset) {
        this.terrainLayer = this.tilemap.createBlankLayer('terrain', terrainTileset);
        this.terrainLayer?.setDepth(0);
      }
      if (resourceTileset) {
        this.resourceLayer = this.tilemap.createBlankLayer('resources', resourceTileset);
        this.resourceLayer?.setDepth(2);
      }
    }

    if (this.coastBorders) {
      this.coastBorders.destroy();
    }
    this.coastBorders = this.scene.add.graphics();
    this.coastBorders.lineStyle(2, 0x1a6b8a, 0.8);
    this.coastBorders.setDepth(1);

    tiles.forEach((row, y) => {
      row.forEach((tile, x) => {
        const terrainIndex = this.terrainIndexMap.get(tile.terrainType);
        if (terrainIndex !== undefined && this.terrainLayer) {
          this.terrainLayer.putTileAt(terrainIndex, x, y);
        }

        if (tile.hasResource) {
          const resourceIndex = this.resourceIndexMap.get(tile.hasResource);
          if (resourceIndex !== undefined && this.resourceLayer) {
            this.resourceLayer.putTileAt(resourceIndex, x, y);
          }
        } else {
          this.resourceLayer?.removeTileAt(x, y);
        }

        if (tile.terrainType === TerrainType.COAST) {
          const { x: worldX, y: worldY } = this.tileToWorld(x, y);
          this.drawCoastBorders(tiles, x, y, worldX, worldY);
        }
      });
    });

    this.renderPlayerSettlements(playerSettlements);
  }

  private renderPlayerSettlements(playerSettlements: Settlement[]) {
    if (this.playerSettlementGraphics) {
      this.playerSettlementGraphics.destroy(true, true);
    }
    this.playerSettlementGraphics = this.scene.add.group();

    playerSettlements.forEach((settlement) => {
      const { x: worldX, y: worldY } = this.tileToWorld(settlement.position.x, settlement.position.y);
      const frame = `settlement_${settlement.organization.toLowerCase()}`;
      const sprite = this.scene.add.image(worldX, worldY, 'other', frame)
        .setOrigin(0, 0)
        .setDepth(3);
      this.playerSettlementGraphics?.add(sprite);
    });
  }

  private drawCoastBorders(tiles: Tile[][], x: number, y: number, worldX: number, worldY: number) {
    if (!this.coastBorders) return;

    const checkOcean = (tx: number, ty: number) => {
      if (ty < 0 || ty >= tiles.length || tx < 0 || tx >= tiles[ty].length) {
        return false;
      }
      return tiles[ty][tx].terrainType === TerrainType.OCEAN;
    };

    // North
    if (checkOcean(x, y - 1)) {
      this.coastBorders.lineBetween(worldX, worldY, worldX + this.tileSize, worldY);
    }
    // South
    if (checkOcean(x, y + 1)) {
      this.coastBorders.lineBetween(worldX, worldY + this.tileSize, worldX + this.tileSize, worldY + this.tileSize);
    }
    // West
    if (checkOcean(x - 1, y)) {
      this.coastBorders.lineBetween(worldX, worldY, worldX, worldY + this.tileSize);
    }
    // East
    if (checkOcean(x + 1, y)) {
      this.coastBorders.lineBetween(worldX + this.tileSize, worldY, worldX + this.tileSize, worldY + this.tileSize);
    }
  }

  public updateReachableHighlights(reachableTiles: { x: number; y: number }[]) {
    if (this.reachableHighlights) {
      this.reachableHighlights.destroy();
      this.reachableHighlights = null;
    }
    this.reachableHighlights = this.scene.add.graphics();
    this.reachableHighlights.fillStyle(0x00ff00, 0.3);
    this.reachableHighlights.setDepth(5);

    reachableTiles.forEach((tile) => {
      const { x: worldX, y: worldY } = this.tileToWorld(tile.x, tile.y);
      this.reachableHighlights?.fillRect(worldX, worldY, this.tileSize, this.tileSize);
    });
  }

  public clearReachableHighlights() {
    if (this.reachableHighlights) {
      this.reachableHighlights.destroy();
      this.reachableHighlights = null;
    }
  }

  public updateSelectionHighlight(tileX: number | null, tileY: number | null) {
    if (this.selectionHighlight) {
      this.selectionHighlight.destroy();
      this.selectionHighlight = null;
    }

    if (tileX !== null && tileY !== null) {
      const { x: worldX, y: worldY } = this.tileToWorld(tileX, tileY);
      this.selectionHighlight = this.scene.add.graphics();
      this.selectionHighlight.lineStyle(2, 0xffffff, 1);
      this.selectionHighlight.strokeRect(worldX, worldY, this.tileSize, this.tileSize);
      this.selectionHighlight.setDepth(10);
    }
  }

  public showTooltip(
    tileX: number,
    tileY: number,
    worldX: number,
    worldY: number,
    settlementName?: string
  ) {
    this.hideTooltip();

    const text = settlementName ? `${settlementName} (${tileX}, ${tileY})` : `(${tileX}, ${tileY})`;

    this.hoverTooltip = this.scene.add
      .text(worldX + 10, worldY + 10, text, {
        fontSize: '12px',
        backgroundColor: '#000000',
        padding: { x: 4, y: 2 },
      })
      .setDepth(100);
  }

  public hideTooltip() {
    if (this.hoverTooltip) {
      this.hoverTooltip.destroy();
      this.hoverTooltip = null;
    }
  }

  public destroyTilemap() {
    if (this.tilemap) {
      this.tilemap.destroy();
      this.tilemap = null;
      this.terrainLayer = null;
      this.resourceLayer = null;
    }
  }

  public destroy() {
    this.destroyTilemap();
    if (this.selectionHighlight) this.selectionHighlight.destroy();
    if (this.reachableHighlights) this.reachableHighlights.destroy();
    if (this.hoverTooltip) this.hoverTooltip.destroy();
    if (this.coastBorders) this.coastBorders.destroy();
    if (this.npcSettlementGraphics) this.npcSettlementGraphics.destroy(true, true);
    if (this.playerSettlementGraphics) this.playerSettlementGraphics.destroy(true, true);
  }
}
