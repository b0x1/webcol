import { Tile } from '../entities/Tile';
import { NativeSettlement } from '../entities/NativeSettlement';
import { TerrainType } from '../entities/types';

export interface SceneLike {
  add: {
    image: (x: number, y: number, key: string, frame?: string) => { setOrigin: (x: number, y: number) => any; setDepth: (depth: number) => any };
    graphics: () => any;
    text: (x: number, y: number, text: string, style: any) => { setDepth: (depth: number) => any };
    group: () => any;
  };
}

export class TerrainRenderer {
  private scene: SceneLike;
  private tileSize: number;
  private selectionHighlight: any = null;
  private reachableHighlights: any = null;
  private hoverTooltip: any = null;
  private coastBorders: any = null;
  private nativeSettlementGraphics: any = null;

  constructor(scene: SceneLike, tileSize: number) {
    this.scene = scene;
    this.tileSize = tileSize;
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

  public renderTileMap(tiles: Tile[][], nativeSettlements: NativeSettlement[] = []) {
    if (this.coastBorders) {
      this.coastBorders.destroy();
    }
    this.coastBorders = this.scene.add.graphics();
    this.coastBorders.lineStyle(2, 0x1a6b8a, 0.8);
    this.coastBorders.setDepth(1);

    tiles.forEach((row, y) => {
      row.forEach((tile, x) => {
        const { x: worldX, y: worldY } = this.tileToWorld(x, y);

        // Base Terrain
        this.scene.add.image(worldX, worldY, 'terrain', tile.terrainType)
          .setOrigin(0, 0)
          .setDepth(0);

        // COAST Adjacency Borders
        if (tile.terrainType === TerrainType.COAST) {
          this.drawCoastBorders(tiles, x, y, worldX, worldY);
        }

        // Resource Overlay
        if (tile.hasResource) {
          this.scene.add.image(worldX, worldY, 'resources', tile.hasResource)
            .setOrigin(0, 0)
            .setDepth(2);
        }
      });
    });

    // Native Settlements
    if (this.nativeSettlementGraphics) {
      this.nativeSettlementGraphics.destroy();
    }
    this.nativeSettlementGraphics = this.scene.add.group();

    nativeSettlements.forEach((settlement) => {
      const { x: worldX, y: worldY } = this.tileToWorld(settlement.x, settlement.y);
      const sprite = this.scene.add.image(worldX, worldY, 'other', 'native_settlement')
        .setOrigin(0, 0)
        .setDepth(3);
      this.nativeSettlementGraphics.add(sprite);
    });
  }

  private drawCoastBorders(tiles: Tile[][], x: number, y: number, worldX: number, worldY: number) {
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
    if (!this.scene || !this.scene.add || !this.scene.add.graphics) return;
    this.reachableHighlights = this.scene.add.graphics();
    this.reachableHighlights.fillStyle(0x00ff00, 0.3);
    this.reachableHighlights.setDepth(5);

    reachableTiles.forEach((tile) => {
      const { x: worldX, y: worldY } = this.tileToWorld(tile.x, tile.y);
      this.reachableHighlights.fillRect(worldX, worldY, this.tileSize, this.tileSize);
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
      if (!this.scene || !this.scene.add || !this.scene.add.graphics) return;
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
}
