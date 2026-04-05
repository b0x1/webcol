import React from 'react';
import { Nation } from '../game/entities/types';
import flagsCoords from '../../public/flags.json';

interface FlagProps {
  nation: Nation;
  size?: number;
  className?: string;
}

export const Flag: React.FC<FlagProps> = ({ nation, size = 32, className = '' }) => {
  const coords = flagsCoords[nation as keyof typeof flagsCoords];

  if (!coords) return null;

  // Calculate total spritesheet size based on number of flags
  const count = Object.keys(flagsCoords).length;
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const totalWidth = cols * 64;
  const totalHeight = rows * 64;

  const scale = size / 64;

  return (
    <div
      className={`inline-block overflow-hidden shrink-0 ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundImage: 'url(/webcol/flags.avif)',
        backgroundPosition: `-${coords.x * scale}px -${coords.y * scale}px`,
        backgroundSize: `${totalWidth * scale}px ${totalHeight * scale}px`,
        imageRendering: 'pixelated',
      }}
      title={nation}
    />
  );
};
