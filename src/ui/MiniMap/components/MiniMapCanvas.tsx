import React, { useRef, useEffect } from 'react';
import { TerrainType } from '../../../game/entities/types';
import type { Tile } from '../../../game/entities/Tile';

interface Props {
  map: Tile[][];
  viewport: { x: number; y: number; width: number; height: number };
  onMapClick: (e: React.PointerEvent<HTMLDivElement>) => void;
}

export const MiniMapCanvas: React.FC<Props> = ({ map, viewport, onMapClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (map.length > 0 && canvasRef.current) {
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
          let color = [0, 0, 0];

          switch (tile.terrainType) {
            case TerrainType.OCEAN: color = [30, 144, 255]; break;
            case TerrainType.COAST: color = [135, 206, 250]; break;
            case TerrainType.PLAINS: color = [34, 139, 34]; break;
            case TerrainType.FOREST: color = [0, 100, 0]; break;
            case TerrainType.HILLS: color = [139, 69, 19]; break;
            case TerrainType.MOUNTAINS: color = [105, 105, 105]; break;
            case TerrainType.DESERT: color = [238, 232, 170]; break;
            case TerrainType.TUNDRA: color = [240, 255, 255]; break;
            case TerrainType.ARCTIC: color = [255, 255, 255]; break;
          }

          const index = (y * width + x) * 4;
          data[index] = color[0];
          data[index + 1] = color[1];
          data[index + 2] = color[2];
          data[index + 3] = 255;
        }
      }
      ctx.putImageData(imageData, 0, 0);
    }
  }, [map]);

  const mapHeight = map.length;
  const mapWidth = map[0] ? map[0].length : 1;

  const rectStyle = {
    left: `${(viewport.x / mapWidth) * 100}%`,
    top: `${(viewport.y / mapHeight) * 100}%`,
    width: `${(viewport.width / mapWidth) * 100}%`,
    height: `${(viewport.height / mapHeight) * 100}%`,
  };

  return (
    <div
      className="relative w-[200px] h-[150px] bg-black/80 border-2 border-slate-600 text-white flex items-center justify-center pointer-events-auto overflow-hidden cursor-crosshair shadow-2xl rounded-sm hover:border-blue-500 transition-colors"
      onPointerDown={onMapClick}
      onPointerMove={onMapClick}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full [image-rendering:pixelated]"
      />
      <div
        className="absolute border border-white bg-white/10 pointer-events-none transition-[left,top,width,height] duration-75"
        style={rectStyle}
      />
    </div>
  );
};
