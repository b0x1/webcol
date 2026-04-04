import { describe, it, expect } from 'vitest';
import { TerrainRenderer } from '../TerrainRenderer';

describe('TerrainRenderer', () => {
  // Use a partial mock for scene to avoid Phaser initialization in Node.js
  const mockScene = {} as any;
  const tileSize = 64;
  const renderer = new TerrainRenderer(mockScene, tileSize);

  describe('tileToWorld', () => {
    it('should correctly convert tile coordinates to world coordinates', () => {
      expect(renderer.tileToWorld(0, 0)).toEqual({ x: 0, y: 0 });
      expect(renderer.tileToWorld(1, 1)).toEqual({ x: 64, y: 64 });
      expect(renderer.tileToWorld(5, 10)).toEqual({ x: 320, y: 640 });
    });
  });

  describe('worldToTile', () => {
    it('should correctly convert world coordinates to tile coordinates', () => {
      expect(renderer.worldToTile(0, 0)).toEqual({ x: 0, y: 0 });
      expect(renderer.worldToTile(63, 63)).toEqual({ x: 0, y: 0 });
      expect(renderer.worldToTile(64, 64)).toEqual({ x: 1, y: 1 });
      expect(renderer.worldToTile(325, 645)).toEqual({ x: 5, y: 10 });
    });
  });
});
