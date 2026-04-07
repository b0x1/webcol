type Callback = (...args: any[]) => void;

class EventBus {
  private listeners: Map<string, Callback[]> = new Map();

  on(event: string, callback: Callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: Callback) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      this.listeners.set(
        event,
        eventListeners.filter((cb) => cb !== callback)
      );
    }
  }

  emit(event: string, ...args: any[]) {
    this.listeners.get(event)?.forEach((callback) => callback(...args));
  }
}

export const eventBus = new EventBus();
