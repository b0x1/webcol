import type { Position } from '../entities/Position';

export interface UnitMovementEvent {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export interface ViewportUpdatedEvent {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EventMap {
  gameStarted: undefined;
  returnToMainMenu: undefined;
  gameLoaded: undefined;
  cameraJump: Position;
  unitMoved: UnitMovementEvent;
  viewportUpdated: ViewportUpdatedEvent;
  notification: string;
}

type EventKey = keyof EventMap;
type EventCallback<K extends EventKey> = (
  payload: EventMap[K]
) => void;

class EventBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private listeners = new Map<EventKey, EventCallback<any>[]>();

  on<K extends EventKey>(event: K, callback: EventCallback<K>) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
    return () => { this.off(event, callback); };
  }

  off<K extends EventKey>(event: K, callback: EventCallback<K>) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      this.listeners.set(
        event,
        eventListeners.filter((cb) => cb !== callback)
      );
    }
  }

  emit<K extends EventKey>(
    event: K,
    ...args: EventMap[K] extends undefined ? [] : [EventMap[K]]
  ) {
    const payload = args[0];
    this.listeners.get(event)?.forEach((callback) => {
      callback(payload);
    });
  }
}

export const eventBus = new EventBus();
