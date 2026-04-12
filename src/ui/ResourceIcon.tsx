import React from 'react';
import type { GoodType } from '../game/entities/types';
import { Sprite } from './Sprite';

interface ResourceIconProps {
  good: GoodType;
  size?: number;
  className?: string;
}

export const ResourceIcon: React.FC<ResourceIconProps> = ({ good, size = 32, className = '' }) => {
  return (
    <div className={`relative ${className}`} style={{ width: `${size}px`, height: `${size}px` }}>
      <Sprite type={good} category="resources" size={size} />
    </div>
  );
};
