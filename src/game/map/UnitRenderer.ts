import type Phaser from 'phaser';
import type { Unit } from '../entities/Unit';
import type { Player } from '../entities/Player';
import type { TerrainRenderer } from './TerrainRenderer';
import { toKey } from '../entities/Position';

export class UnitRenderer {
  public unitSprites: Phaser.GameObjects.Group;
  public selectionRings: Phaser.GameObjects.Group;
  public unitBadges: Phaser.GameObjects.Group;

  constructor(private scene: Phaser.Scene, private terrainRenderer: TerrainRenderer, private tileSize: number) {
    this.unitSprites = scene.add.group();
    this.selectionRings = scene.add.group();
    this.unitBadges = scene.add.group();
  }

  render(players: Player[], selectedUnitId: string | null): void {
    this.unitSprites.clear(true, true);
    this.selectionRings.clear(true, true);
    this.unitBadges.clear(true, true);

    const unitsByTile: Record<string, Unit[]> = {};

    // Optimization: Pre-calculate settlement positions per player for O(1) lookup
    const playerSettlementPositions = new Map<string, Set<string>>();
    players.forEach(p => {
      const set = new Set<string>();
      p.settlements.forEach(s => set.add(toKey(s.position)));
      playerSettlementPositions.set(p.id, set);
    });

    players.forEach((player) => {
      const mySettlements = playerSettlementPositions.get(player.id);
      player.units.forEach((unit) => {
        // Skip rendering units that are in a settlement (except if currently selected, though gameStore logic handles that too)
        const key = toKey(unit.position);
        const inSettlement = mySettlements?.has(key) ?? false;
        if (inSettlement && selectedUnitId !== unit.id) return;

        let list = unitsByTile[key];
        if (!list) {
          list = [];
          unitsByTile[key] = list;
        }
        list.push(unit);
      });
    });

    Object.entries(unitsByTile).forEach(([key, units]) => {
      const parts = key.split(',');
      const tx = Number(parts[0]);
      const ty = Number(parts[1]);
      if (isNaN(tx) || isNaN(ty)) return;

      const { x: worldX, y: worldY } = this.terrainRenderer.tileToWorld({ x: tx, y: ty });

      units.forEach((unit, index) => {
        const offset = index * 4;
        const ux = worldX + this.tileSize / 2 - offset;
        const uy = worldY + this.tileSize / 2 - offset;

        const sprite = this.scene.add.image(ux, uy, 'units', unit.type);
        sprite.setDepth(150 + index);
        this.unitSprites.add(sprite);

        if (selectedUnitId === unit.id) {
          const ring = this.scene.add.graphics();
          ring.lineStyle(2, 0xffff00, 1);
          ring.strokeCircle(ux, uy, (this.tileSize * 0.7) / 2 + 2);
          ring.setDepth(149);
          this.selectionRings.add(ring);
        }

        if (index === units.length - 1 && units.length > 1) {
          const badgeX = ux + 8;
          const badgeY = uy - 8;
          const badgeBg = this.scene.add.graphics();
          badgeBg.fillStyle(0x000000, 0.8);
          badgeBg.fillCircle(badgeX, badgeY, 8);
          badgeBg.setDepth(200);
          this.unitBadges.add(badgeBg);

          const badgeText = this.scene.add.text(badgeX, badgeY, units.length.toString(), {
            fontSize: '10px',
            color: '#ffffff',
          }).setOrigin(0.5);
          badgeText.setDepth(201);
          this.unitBadges.add(badgeText);
        }
      });
    });
  }

  destroy(): void {
    this.unitSprites.destroy(true);
    this.selectionRings.destroy(true);
    this.unitBadges.destroy(true);
  }
}
