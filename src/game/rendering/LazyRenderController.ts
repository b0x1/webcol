import type Phaser from 'phaser';
import { RENDER_CONSTANTS } from '../constants';

type EventTargetWithListeners = Pick<Window, 'addEventListener' | 'removeEventListener'>;

export class LazyRenderController {
  private idleTimeoutId: number | null = null;
  private readonly windowEvents: readonly (keyof WindowEventMap)[] = [
    'keydown',
    'keyup',
    'mousedown',
    'mousemove',
    'mouseup',
    'pointerdown',
    'pointermove',
    'pointerup',
    'resize',
    'touchend',
    'touchmove',
    'touchstart',
    'wheel',
  ];

  private readonly canvasEvents: readonly (keyof HTMLElementEventMap)[] = [
    'pointerdown',
    'pointermove',
    'pointerup',
    'wheel',
  ];

  private readonly handleInteraction = (): void => {
    this.requestRender();
  };

  private readonly handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      this.requestRender();
      return;
    }

    this.sleep();
  };

  constructor(private readonly game: Phaser.Game) {}

  bind(): void {
    this.windowEvents.forEach((eventName) => {
      window.addEventListener(eventName, this.handleInteraction, { passive: true });
    });

    const canvasTarget = this.getCanvasTarget();
    if (canvasTarget) {
      this.canvasEvents.forEach((eventName) => {
        canvasTarget.addEventListener(eventName, this.handleInteraction, { passive: true });
      });
    }

    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.requestRender();
  }

  destroy(): void {
    this.windowEvents.forEach((eventName) => {
      window.removeEventListener(eventName, this.handleInteraction);
    });

    const canvasTarget = this.getCanvasTarget();
    if (canvasTarget) {
      this.canvasEvents.forEach((eventName) => {
        canvasTarget.removeEventListener(eventName, this.handleInteraction);
      });
    }

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

    if (this.idleTimeoutId !== null) {
      window.clearTimeout(this.idleTimeoutId);
      this.idleTimeoutId = null;
    }
  }

  requestRender(): void {
    this.game.loop.wake();

    if (this.idleTimeoutId !== null) {
      window.clearTimeout(this.idleTimeoutId);
    }

    this.idleTimeoutId = window.setTimeout(() => {
      this.sleep();
    }, RENDER_CONSTANTS.LAZY_RENDER_IDLE_MS);
  }

  private sleep(): void {
    if (this.idleTimeoutId !== null) {
      window.clearTimeout(this.idleTimeoutId);
      this.idleTimeoutId = null;
    }

    this.game.loop.sleep();
  }

  private getCanvasTarget(): EventTargetWithListeners | null {
    return this.game.canvas;
  }
}
