import React from 'react';
import type { Nation } from '../game/entities/types';
import { Sprite } from './Sprite';

interface FlagProps {
  nation: Nation;
  size?: number | undefined;
  className?: string | undefined;
}

export const Flag: React.FC<FlagProps> = ({ nation, size = 32, className = '' }) => {
  return (
    <div className={`inline-block shrink-0 relative ${className}`} style={{ width: `${size}px`, height: `${size}px` }}>
      <Sprite type={nation} category="flags" size={size} />
    </div>
  );
};
