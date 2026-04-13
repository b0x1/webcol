import * as Phaser from 'phaser';
import type { TerrainRenderer } from './TerrainRenderer';
import { eventBus } from '../state/EventBus';
import type { Position } from '../entities/Position';
import { CAMERA_CONSTANTS } from '../constants';

export class CameraManager {
  private mapWidthPx = 0;
  private mapHeightPx = 0;

  constructor(private scene: Phaser.Scene, private terrainRenderer: TerrainRenderer, private tileSize: number) {}

  setup(mapWidth: number, mapHeight: number): void {
    this.mapWidthPx = mapWidth * this.tileSize;
    this.mapHeightPx = mapHeight * this.tileSize;
    this.scene.cameras.main.setBounds(
      0,
      0,
      this.mapWidthPx,
      this.mapHeightPx
    );
  }

  panBy(deltaX: number, deltaY: number): boolean {
    const cam = this.scene.cameras.main;
    const nextScrollX = this.clampScrollX(cam.scrollX + deltaX);
    const nextScrollY = this.clampScrollY(cam.scrollY + deltaY);

    if (nextScrollX === cam.scrollX && nextScrollY === cam.scrollY) {
      return false;
    }

    cam.setScroll(nextScrollX, nextScrollY);
    this.emitViewportUpdate();
    return true;
  }

  zoomBy(deltaZoom: number): boolean {
    const cam = this.scene.cameras.main;
    const prevZoom = cam.zoom;
    const nextZoom = Phaser.Math.Clamp(
      prevZoom + deltaZoom,
      CAMERA_CONSTANTS.MIN_ZOOM,
      CAMERA_CONSTANTS.MAX_ZOOM
    );

    if (nextZoom === prevZoom) {
      return false;
    }

    const centerX = cam.scrollX + cam.width / prevZoom / 2;
    const centerY = cam.scrollY + cam.height / prevZoom / 2;

    cam.setZoom(nextZoom);
    cam.setScroll(
      this.clampScrollX(centerX - cam.width / nextZoom / 2),
      this.clampScrollY(centerY - cam.height / nextZoom / 2)
    );
    this.emitViewportUpdate();
    return true;
  }

  centerOn(pos: Position): void {
    const { x: wx, y: wy } = this.terrainRenderer.tileToWorld(pos);
    this.scene.cameras.main.centerOn(wx, wy);
    this.scene.cameras.main.setScroll(
      this.clampScrollX(this.scene.cameras.main.scrollX),
      this.clampScrollY(this.scene.cameras.main.scrollY)
    );
    this.emitViewportUpdate();
  }

  handleKeyboardInput(event: KeyboardEvent): boolean {
    switch (event.code) {
      case 'ArrowLeft':
        event.preventDefault();
        return this.panBy(-CAMERA_CONSTANTS.PAN_STEP, 0);
      case 'ArrowRight':
        event.preventDefault();
        return this.panBy(CAMERA_CONSTANTS.PAN_STEP, 0);
      case 'ArrowUp':
        event.preventDefault();
        return this.panBy(0, -CAMERA_CONSTANTS.PAN_STEP);
      case 'ArrowDown':
        event.preventDefault();
        return this.panBy(0, CAMERA_CONSTANTS.PAN_STEP);
      case 'Equal':
      case 'NumpadAdd':
        event.preventDefault();
        return this.zoomBy(CAMERA_CONSTANTS.ZOOM_STEP);
      case 'Minus':
      case 'NumpadSubtract':
        event.preventDefault();
        return this.zoomBy(-CAMERA_CONSTANTS.ZOOM_STEP);
      default:
        return false;
    }
  }

  emitViewportUpdate(): void {
    const cam = this.scene.cameras.main;
    eventBus.emit('viewportUpdated', {
      x: cam.scrollX / this.tileSize,
      y: cam.scrollY / this.tileSize,
      width: cam.width / (this.tileSize * cam.zoom),
      height: cam.height / (this.tileSize * cam.zoom),
    });
  }

  private clampScrollX(scrollX: number): number {
    const maxScrollX = Math.max(0, this.mapWidthPx - this.scene.cameras.main.width / this.scene.cameras.main.zoom);
    return Phaser.Math.Clamp(scrollX, 0, maxScrollX);
  }

  private clampScrollY(scrollY: number): number {
    const maxScrollY = Math.max(0, this.mapHeightPx - this.scene.cameras.main.height / this.scene.cameras.main.zoom);
    return Phaser.Math.Clamp(scrollY, 0, maxScrollY);
  }
}
