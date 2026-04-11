
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import Phaser from 'phaser';
import type { TerrainRenderer } from './TerrainRenderer';
import { eventBus } from '../state/EventBus';
import type { Position } from '../entities/Position';

export class CameraManager {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private zoomKeys: {
    plus: Phaser.Input.Keyboard.Key;
    minus: Phaser.Input.Keyboard.Key;
  };
  private readonly scrollSpeed = 30;
  private readonly zoomSpeed = 0.02;

  constructor(private scene: Phaser.Scene, private terrainRenderer: TerrainRenderer, private tileSize: number) {
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.zoomKeys = {
      plus: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.PLUS),
      minus: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.MINUS),
    };
  }

  setup(mapWidth: number, mapHeight: number): void {
    this.scene.cameras.main.setBounds(
      0,
      0,
      mapWidth * this.tileSize,
      mapHeight * this.tileSize
    );
  }

  update(): void {
    const cam = this.scene.cameras.main;

    if (this.cursors.left.isDown) cam.scrollX -= this.scrollSpeed;
    else if (this.cursors.right.isDown) cam.scrollX += this.scrollSpeed;

    if (this.cursors.up.isDown) cam.scrollY -= this.scrollSpeed;
    else if (this.cursors.down.isDown) cam.scrollY += this.scrollSpeed;

    if (this.zoomKeys.plus.isDown) cam.zoom += this.zoomSpeed;
    if (this.zoomKeys.minus.isDown) cam.zoom -= this.zoomSpeed;

    cam.zoom = Phaser.Math.Clamp(cam.zoom, 0.5, 2.0);

    if (cam.dirty) {
      this.emitViewportUpdate();
    }
  }

  centerOn(pos: Position): void {
    const { x: wx, y: wy } = this.terrainRenderer.tileToWorld(pos);
    this.scene.cameras.main.centerOn(wx, wy);
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
}
