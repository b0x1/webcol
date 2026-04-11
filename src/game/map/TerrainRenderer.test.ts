import { describe, it, expect, vi } from 'vitest';
import { TerrainRenderer } from './TerrainRenderer';

// Mock Phaser completely for this test file
vi.mock('phaser', () => ({
  default: {
    GameObjects: {
    },
    Tilemaps: {
    },
  },
}));

describe('TerrainRenderer', () => {
  // Use a partial mock for scene to avoid Phaser initialization in Node.js
  const mockScene = {} as any;
  const tileSize = 64;
  const renderer = new TerrainRenderer(mockScene, tileSize);

  describe('tileToWorld', () => {
    it('should correctly convert tile coordinates to world coordinates', () => {
      expect(renderer.tileToWorld({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
      expect(renderer.tileToWorld({ x: 1, y: 1 })).toEqual({ x: 64, y: 64 });
      expect(renderer.tileToWorld({ x: 5, y: 10 })).toEqual({ x: 320, y: 640 });
    });
  });

  describe('worldToTile', () => {
    it('should correctly convert world coordinates to tile coordinates', () => {
      expect(renderer.worldToTile({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
      expect(renderer.worldToTile({ x: 63, y: 63 })).toEqual({ x: 0, y: 0 });
      expect(renderer.worldToTile({ x: 64, y: 64 })).toEqual({ x: 1, y: 1 });
      expect(renderer.worldToTile({ x: 325, y: 645 })).toEqual({ x: 5, y: 10 });
    });
  });
});
