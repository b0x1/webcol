import React from 'react';

export const MiniMap: React.FC = () => {
  return (
    <div
      className="minimap"
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
      }}
    >
      MiniMap Placeholder
    </div>
  );
};
