import React, { useRef, useEffect } from 'react';
import { useGameStore } from '../game/state/gameStore';
import { TerrainType } from '../game/entities/types';
import { eventBus } from '../game/state/EventBus';

export const MiniMap: React.FC = () => {
  const isMainMenuOpen = useGameStore((state) => state.isMainMenuOpen);
  const map = useGameStore((state) => state.map);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isMainMenuOpen && map.length > 0 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const height = map.length;
      const width = map[0].length;

      canvas.width = width;
      canvas.height = height;

      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const tile = map[y][x];
          let color = [0, 0, 0]; // Default black

          switch (tile.terrainType) {
            case TerrainType.OCEAN:
              color = [30, 144, 255]; // DodgerBlue
              break;
            case TerrainType.COAST:
              color = [135, 206, 250]; // LightSkyBlue
              break;
            case TerrainType.PLAINS:
              color = [34, 139, 34]; // ForestGreen
              break;
            case TerrainType.FOREST:
              color = [0, 100, 0]; // DarkGreen
              break;
            case TerrainType.HILLS:
              color = [139, 69, 19]; // SaddleBrown
              break;
            case TerrainType.MOUNTAINS:
              color = [105, 105, 105]; // DimGray
              break;
            case TerrainType.DESERT:
              color = [238, 232, 170]; // PaleGoldenRod
              break;
            case TerrainType.TUNDRA:
              color = [240, 255, 255]; // Azure
              break;
            case TerrainType.ARCTIC:
              color = [255, 255, 255]; // White
              break;
          }

          const index = (y * width + x) * 4;
          data[index] = color[0];
          data[index + 1] = color[1];
          data[index + 2] = color[2];
          data[index + 3] = 255; // Alpha
        }
      }

      ctx.putImageData(imageData, 0, 0);
    }
  }, [isMainMenuOpen, map]);

  if (isMainMenuOpen) return null;

  const handlePointerAction = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canvasRef.current || (e.buttons !== 1 && e.type !== 'pointerdown')) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * map[0].length);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * map.length);

    if (x >= 0 && x < map[0].length && y >= 0 && y < map.length) {
      eventBus.emit('cameraJump', { x, y });
    }
  };

  return (
    <div
      className="minimap"
      onPointerDown={handlePointerAction}
      onPointerMove={handlePointerAction}
      style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        width: '200px',
        height: '150px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        border: '2px solid #555',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
        overflow: 'hidden',
        cursor: 'crosshair',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
};
