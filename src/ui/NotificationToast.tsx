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
    <div className="absolute bottom-5 left-5 bg-blue-600/90 text-white px-5 py-2.5 rounded shadow-lg z-[1500] font-bold transition-opacity duration-300">
      {message}
    </div>
  );
};
