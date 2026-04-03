import Phaser from 'phaser';
import { TerrainType, ResourceType, UnitType } from '../../game/entities/types';

export const TERRAIN_COLORS: Record<TerrainType, number> = {
  [TerrainType.OCEAN]: 0x1a6b8a,
  [TerrainType.COAST]: 0xd4a843,
  [TerrainType.PLAINS]: 0x7ab648,
  [TerrainType.FOREST]: 0x2d6e2d,
  [TerrainType.HILLS]: 0x8b6914,
  [TerrainType.MOUNTAINS]: 0x555555,
  [TerrainType.GRASSLAND]: 0x91b34a,
  [TerrainType.PRAIRIE]: 0xc4a348,
  [TerrainType.TUNDRA]: 0x99a6a6,
  [TerrainType.ARCTIC]: 0xfffffff,
  [TerrainType.DESERT]: 0xd1b46b,
  [TerrainType.SWAMP]: 0x4a5e35,
  [TerrainType.MARSH]: 0x6a8759,
};

export const RESOURCE_COLORS: Record<ResourceType, number> = {
  [ResourceType.FOREST]: 0x228b22,
  [ResourceType.ORE_DEPOSIT]: 0x808080,
  [ResourceType.FISH]: 0x0000ff,
  [ResourceType.FERTILE_LAND]: 0xffff00,
};

export function generateTerrainTextures(scene: Phaser.Scene, tileSize: number) {
  const graphics = scene.make.graphics({ x: 0, y: 0 });

  // Generate Terrain Textures
  Object.entries(TERRAIN_COLORS).forEach(([type, color]) => {
    graphics.clear();
    graphics.fillStyle(color, 1);
    graphics.fillRect(0, 0, tileSize, tileSize);

    // Add specific details per terrain type
    if (type === TerrainType.OCEAN) {
      graphics.lineStyle(2, 0xffffff, 0.2);
      graphics.beginPath();
      graphics.moveTo(5, 10);
      graphics.lineTo(15, 10);
      graphics.moveTo(10, 20);
      graphics.lineTo(25, 20);
      graphics.strokePath();
    } else if (type === TerrainType.FOREST) {
      graphics.fillStyle(0x1a4d1a, 1);
      for (let i = 0; i < 3; i++) {
        const tx = 5 + i * 10;
        const ty = 10 + (i % 2) * 5;
        graphics.fillTriangle(tx, ty + 15, tx + 5, ty, tx + 10, ty + 15);
      }
    } else if (type === TerrainType.HILLS) {
      graphics.lineStyle(2, 0x000000, 0.2);
      graphics.beginPath();
      graphics.moveTo(5, 25);
      graphics.arc(21.5, 15, 12.5, 3.93, 0.64);
      graphics.strokePath();
    } else if (type === TerrainType.MOUNTAINS) {
      graphics.fillStyle(0x333333, 1);
      graphics.fillTriangle(5, 28, 16, 5, 27, 28);
      graphics.fillTriangle(15, 28, 22, 12, 30, 28);
    }

    graphics.generateTexture(`terrain-${type}`, tileSize, tileSize);
  });

  // Generate Resource Textures
  Object.entries(RESOURCE_COLORS).forEach(([type, color]) => {
    graphics.clear();
    const size = 12;
    const center = tileSize / 2;

    if (type === ResourceType.FOREST) {
      graphics.fillStyle(color, 1);
      graphics.fillCircle(center, center, size / 2);
    } else if (type === ResourceType.ORE_DEPOSIT) {
      graphics.fillStyle(color, 1);
      graphics.beginPath();
      graphics.moveTo(center, center - size / 2);
      graphics.lineTo(center + size / 2, center);
      graphics.lineTo(center, center + size / 2);
      graphics.lineTo(center - size / 2, center);
      graphics.closePath();
      graphics.fillPath();
    } else if (type === ResourceType.FISH) {
      graphics.fillStyle(color, 1);
      graphics.fillCircle(center, center, size / 3);
    } else if (type === ResourceType.FERTILE_LAND) {
      graphics.fillStyle(color, 1);
      const spikes = 5;
      const outerRadius = size / 2;
      const innerRadius = size / 4;
      let rot = (Math.PI / 2) * 3;
      let x = center;
      let y = center;
      const step = Math.PI / spikes;

      graphics.beginPath();
      graphics.moveTo(center, center - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = center + Math.cos(rot) * outerRadius;
        y = center + Math.sin(rot) * outerRadius;
        graphics.lineTo(x, y);
        rot += step;

        x = center + Math.cos(rot) * innerRadius;
        y = center + Math.sin(rot) * innerRadius;
        graphics.lineTo(x, y);
        rot += step;
      }
      graphics.lineTo(center, center - outerRadius);
      graphics.closePath();
      graphics.fillPath();
    }

    graphics.generateTexture(`resource-${type}`, tileSize, tileSize);
  });

  graphics.destroy();
}

export function generateUnitTextures(scene: Phaser.Scene, tileSize: number) {
  const graphics = scene.make.graphics({ x: 0, y: 0 });

  const units = [
    { type: UnitType.COLONIST, color: 0xffffff, label: 'C', shape: 'circle' },
    { type: UnitType.SOLDIER, color: 0xff0000, label: 'S', shape: 'circle' },
    { type: UnitType.PIONEER, color: 0x8b4513, label: 'P', shape: 'circle' },
    { type: UnitType.SHIP, color: 0x0000ff, label: 'Sh', shape: 'square' },
  ];

  units.forEach((unit) => {
    graphics.clear();
    const center = tileSize / 2;
    const size = tileSize * 0.7;

    if (unit.shape === 'circle') {
      graphics.fillStyle(unit.color, 1);
      graphics.lineStyle(1, 0x000000, 1);
      graphics.fillCircle(center, center, size / 2);
      graphics.strokeCircle(center, center, size / 2);
    } else {
      graphics.fillStyle(unit.color, 1);
      graphics.lineStyle(1, 0x000000, 1);
      graphics.fillRect(center - size / 2, center - size / 2, size, size);
      graphics.strokeRect(center - size / 2, center - size / 2, size, size);
    }

    // Generate the base texture
    graphics.generateTexture(`unit-${unit.type}-base`, tileSize, tileSize);

    // Create a final texture with text
    const baseImage = scene.make.image({ x: center, y: center, key: `unit-${unit.type}-base` });
    const rt = scene.add.renderTexture(0, 0, tileSize, tileSize);
    rt.draw(baseImage);

    const text = scene.make.text({
      x: center,
      y: center,
      text: unit.label,
      style: {
        fontSize: unit.label.length > 1 ? '10px' : '14px',
        color: unit.color === 0xffffff ? '#000000' : '#ffffff',
        fontStyle: 'bold',
      }
    }).setOrigin(0.5);

    rt.draw(text);
    rt.saveTexture(`unit-${unit.type}`);

    // Clean up temporary objects
    rt.destroy();
    text.destroy();
    baseImage.destroy();
  });

  graphics.destroy();
}
