import type Phaser from 'phaser';
import type { Unit } from '@shared/game/entities/Unit';
import type { Player } from '@shared/game/entities/Player';
import type { TerrainRenderer } from './TerrainRenderer';

interface DrawnUnit {
  readonly unit: Unit;
  readonly x: number;
  readonly y: number;
  readonly depth: number;
  readonly stackCount: number;
  readonly stackIndex: number;
}

export class UnitRenderer {
  public unitSprites: Phaser.GameObjects.Group;
  public selectionRings: Phaser.GameObjects.Group;
  public unitBadges: Phaser.GameObjects.Group;
  private spritesByUnitId = new Map<string, Phaser.GameObjects.Image>();

  constructor(private scene: Phaser.Scene, private terrainRenderer: TerrainRenderer, private tileSize: number) {
    this.unitSprites = scene.add.group();
    this.selectionRings = scene.add.group();
    this.unitBadges = scene.add.group();
  }

  render(players: Player[], selectedUnitId: string | null): void {
    const visible = this.collectVisible(players, selectedUnitId);
    const seen = new Set<string>();

    visible.forEach((entry) => {
      seen.add(entry.unit.id);
      const existing = this.spritesByUnitId.get(entry.unit.id);
      if (existing) {
        existing.setPosition(entry.x, entry.y);
        existing.setTexture('units', entry.unit.type);
        existing.setDepth(entry.depth);
        return;
      }

      const sprite = this.scene.add.image(entry.x, entry.y, 'units', entry.unit.type);
      sprite.setDepth(entry.depth);
      this.unitSprites.add(sprite);
      this.spritesByUnitId.set(entry.unit.id, sprite);
    });

    for (const [id, sprite] of this.spritesByUnitId) {
      if (seen.has(id)) {
        continue;
      }
      sprite.destroy();
      this.spritesByUnitId.delete(id);
    }

    this.selectionRings.clear(true, true);
    this.unitBadges.clear(true, true);
    this.drawMarkers(visible, selectedUnitId);
  }

  destroy(): void {
    this.spritesByUnitId.clear();
    this.unitSprites.destroy(true);
    this.selectionRings.destroy(true);
    this.unitBadges.destroy(true);
  }

  private collectVisible(players: Player[], selectedUnitId: string | null): DrawnUnit[] {
    const unitsByTile = new Map<number, Unit[]>();
    const playerSettlementPositions = new Map<string, Set<number>>();
    players.forEach((player) => {
      const set = new Set<number>();
      player.settlements.forEach((settlement) => set.add((settlement.position.y << 16) | settlement.position.x));
      playerSettlementPositions.set(player.id, set);
    });

    players.forEach((player) => {
      const mySettlements = playerSettlementPositions.get(player.id);
      player.units.forEach((unit) => {
        const key = (unit.position.y << 16) | unit.position.x;
        const inSettlement = mySettlements?.has(key) ?? false;
        if (inSettlement && selectedUnitId !== unit.id) {
          return;
        }

        const list = unitsByTile.get(key) ?? [];
        list.push(unit);
        unitsByTile.set(key, list);
      });
    });

    const visible: DrawnUnit[] = [];
    unitsByTile.forEach((units, key) => {
      const tx = key & 0xffff;
      const ty = key >>> 16;
      const { x: worldX, y: worldY } = this.terrainRenderer.tileToWorld({ x: tx, y: ty });
      units.forEach((unit, index) => {
        const offset = index * 4;
        visible.push({
          unit,
          x: worldX + this.tileSize / 2 - offset,
          y: worldY + this.tileSize / 2 - offset,
          depth: 150 + index,
          stackCount: units.length,
          stackIndex: index,
        });
      });
    });
    return visible;
  }

  private drawMarkers(visible: readonly DrawnUnit[], selectedUnitId: string | null): void {
    visible.forEach((entry) => {
      if (selectedUnitId === entry.unit.id) {
        const ring = this.scene.add.graphics();
        ring.lineStyle(2, 0xffff00, 1);
        ring.strokeCircle(entry.x, entry.y, (this.tileSize * 0.7) / 2 + 2);
        ring.setDepth(149);
        this.selectionRings.add(ring);
      }

      if (entry.stackIndex === entry.stackCount - 1 && entry.stackCount > 1) {
        const badgeX = entry.x + 8;
        const badgeY = entry.y - 8;
        const badgeBg = this.scene.add.graphics();
        badgeBg.fillStyle(0x000000, 0.8);
        badgeBg.fillCircle(badgeX, badgeY, 8);
        badgeBg.setDepth(200);
        this.unitBadges.add(badgeBg);

        const badgeText = this.scene.add.text(badgeX, badgeY, entry.stackCount.toString(), {
          fontSize: '10px',
          color: '#ffffff',
        }).setOrigin(0.5);
        badgeText.setDepth(201);
        this.unitBadges.add(badgeText);
      }
    });
  }
}
