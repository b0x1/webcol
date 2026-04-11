import React, { useState, useEffect } from 'react';

interface SpriteProps {
  type: string;
  category: 'terrain' | 'resources' | 'other' | 'flags' | 'units';
  size?: number;
  className?: string;
}

const manifestCache: Record<string, any> = {};

export const Sprite: React.FC<SpriteProps> = ({ type, category, size = 64, className = '' }) => {
  const [manifest, setManifest] = useState(manifestCache[category]);

  useEffect(() => {
    if (manifestCache[category]) {
      setManifest(manifestCache[category]);
      return;
    }

    fetch(`/webcol/${category}.json`)
      .then((res) => res.json())
      .then((data) => {
        manifestCache[category] = data;
        setManifest(data);
      });
  }, [category]);

  const coords = manifest?.[type];

  if (!coords) {
    if (manifest) {
       console.warn(`Sprite type "${type}" not found in category "${category}"`);
    }
    return null;
  }

  // Dynamically calculate total sheet size if not already in cache
  const calculateSheetSize = (m: any) => {
    let maxX = 0;
    let maxY = 0;
    Object.values(m).forEach((v: any) => {
      maxX = Math.max(maxX, v.x + v.w);
      maxY = Math.max(maxY, v.y + v.h);
    });
    return { w: maxX, h: maxY };
  };

  const sheetSize = calculateSheetSize(manifest);
  const totalWidth = sheetSize.w;
  const totalHeight = sheetSize.h;

  const scale = size / 64;

  return (
    <div
      className={`absolute inset-0 overflow-hidden shrink-0 ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundImage: `url(/webcol/${category}.avif)`,
        backgroundPosition: `-${coords.x * scale}px -${coords.y * scale}px`,
        backgroundSize: `${totalWidth * scale}px ${totalHeight * scale}px`,
        imageRendering: 'pixelated',
      }}
      title={type}
    />
  );
};
