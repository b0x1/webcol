import React, { useState, useEffect } from 'react';
import { eventBus } from '../game/state/EventBus';

export const NotificationToast: React.FC = () => {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = eventBus.on('notification', (msg: string) => {
      setMessage(msg);
      setTimeout(() => setMessage(null), 3000);
    });
    return unsubscribe;
  }, []);

  if (!message) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        backgroundColor: 'rgba(52, 152, 219, 0.9)',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        zIndex: 1500,
        fontWeight: 'bold',
        transition: 'opacity 0.3s ease-in-out',
      }}
    >
      {message}
    </div>
  );
};
