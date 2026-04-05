import React, { useRef, useEffect, useState } from 'react';
import { useGameStore } from '../game/state/gameStore';
import { TerrainType } from '../game/entities/types';
import { eventBus } from '../game/state/EventBus';

export const MiniMap: React.FC = () => {
  const isMainMenuOpen = useGameStore((state) => state.isMainMenuOpen);
  const map = useGameStore((state) => state.map);
  const players = useGameStore((state) => state.players);
  const currentPlayerId = useGameStore((state) => state.currentPlayerId);
  const selectNextUnit = useGameStore((state) => state.selectNextUnit);
  const endTurn = useGameStore((state) => state.endTurn);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    const unsubscribe = eventBus.on('viewportUpdated', (v) => {
      setViewport(v);
    });
    return () => unsubscribe();
  }, []);

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

  const mapHeight = map.length;
  const mapWidth = map[0]?.length || 1;

  const rectStyle = {
    left: `${(viewport.x / mapWidth) * 100}%`,
    top: `${(viewport.y / mapHeight) * 100}%`,
    width: `${(viewport.width / mapWidth) * 100}%`,
    height: `${(viewport.height / mapHeight) * 100}%`,
  };

  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const availableUnits = currentPlayer?.units.filter((u) => u.movesRemaining > 0 && !u.isSkipping) || [];
  const hasAvailableUnits = availableUnits.length > 0;

  return (
    <div className="absolute bottom-5 right-5 flex flex-col gap-2 pointer-events-none">
      <div
        className="relative w-[200px] h-[150px] bg-black/80 border-2 border-slate-600 text-white flex items-center justify-center pointer-events-auto overflow-hidden cursor-crosshair shadow-2xl rounded-sm hover:border-blue-500 transition-colors"
        onPointerDown={handlePointerAction}
        onPointerMove={handlePointerAction}
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
      <button
        onClick={() => (hasAvailableUnits ? selectNextUnit() : endTurn())}
        className={`w-full py-3 px-4 font-black uppercase tracking-widest text-sm rounded shadow-2xl transition-all transform active:scale-95 border-2 pointer-events-auto ${
          hasAvailableUnits
            ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400'
            : 'bg-red-700 hover:bg-red-600 text-white border-red-500'
        }`}
      >
        {hasAvailableUnits ? `Next Unit (${availableUnits.length})` : 'End Turn'}
      </button>
    </div>
  );
};
