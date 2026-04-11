/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument */
import type Phaser from 'phaser';
import type { TerrainRenderer } from './TerrainRenderer';
import type { CameraManager } from './CameraManager';
import { useGameStore } from '../state/gameStore';
import { useUIStore } from '../state/uiStore';
import { UnitType, Attitude } from '../entities/types';
import { isSame, type Position } from '../entities/Position';
import { CAMERA_CONSTANTS } from '../constants';

export class InputHandler {
  private pointerDownHandler: ((pointer: Phaser.Input.Pointer) => void) | null = null;
  private pointerMoveHandler: ((pointer: Phaser.Input.Pointer) => void) | null = null;
  private pointerOutHandler: (() => void) | null = null;
  private wheelHandler: ((pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => void) | null = null;
  private escapeHandler: (() => void) | null = null;
  private keydownHandler: ((event: KeyboardEvent) => void) | null = null;

  constructor(
    private scene: Phaser.Scene,
    private terrainRenderer: TerrainRenderer,
    private cameraManager: CameraManager
  ) {}

  setup(mapWidth: number, mapHeight: number, getReachableTiles: () => Position[], handleMove: (id: string, position: Position) => void): void {
    this.scene.input.mouse?.disableContextMenu();

    this.pointerDownHandler = (pointer: Phaser.Input.Pointer) => {
      const worldPoint = pointer.positionToCamera(this.scene.cameras.main) as Phaser.Math.Vector2;
      const pos = this.terrainRenderer.worldToTile(worldPoint);

      if (pos.x < 0 || pos.x >= mapWidth || pos.y < 0 || pos.y >= mapHeight) return;

      if (pointer.leftButtonDown()) {
        this.handleLeftClick(pos);
      } else if (pointer.rightButtonDown()) {
        this.handleRightClick(pos, getReachableTiles(), handleMove);
      }
    };
    this.scene.input.on('pointerdown', this.pointerDownHandler);

    this.pointerMoveHandler = (pointer: Phaser.Input.Pointer) => {
      const worldPoint = pointer.positionToCamera(this.scene.cameras.main) as Phaser.Math.Vector2;
      const pos = this.terrainRenderer.worldToTile(worldPoint);

      if (pos.x >= 0 && pos.x < mapWidth && pos.y >= 0 && pos.y < mapHeight) {
        const settlement = useGameStore.getState().players.flatMap(p => p.settlements).find((s) => isSame(s.position, pos));
        this.terrainRenderer.showTooltip(pos, worldPoint, settlement?.name);
      } else {
        this.terrainRenderer.hideTooltip();
      }
    };
    this.scene.input.on('pointermove', this.pointerMoveHandler);

    this.pointerOutHandler = () => {
      this.terrainRenderer.hideTooltip();
    };
    this.scene.input.on('pointerout', this.pointerOutHandler);

    this.wheelHandler = (_pointer, _gameObjects, _deltaX, deltaY) => {
      const zoomStep = deltaY < 0 ? CAMERA_CONSTANTS.ZOOM_STEP : -CAMERA_CONSTANTS.ZOOM_STEP;
      this.cameraManager.zoomBy(zoomStep);
    };
    this.scene.input.on('wheel', this.wheelHandler);

    this.escapeHandler = () => {
      useGameStore.getState().selectUnit(null);
      this.scene.events.emit('unitSelected', null as any);
      useGameStore.getState().selectTile(null);
      this.terrainRenderer.updateSelectionHighlight(null);
    };
    this.scene.input.keyboard?.on('keydown-ESC', this.escapeHandler);

    this.keydownHandler = (event: KeyboardEvent) => {
      this.cameraManager.handleKeyboardInput(event);
    };
    this.scene.input.keyboard?.on('keydown', this.keydownHandler);
  }

  destroy(): void {
    if (this.pointerDownHandler) {
      this.scene.input.off('pointerdown', this.pointerDownHandler);
    }
    if (this.pointerMoveHandler) {
      this.scene.input.off('pointermove', this.pointerMoveHandler);
    }
    if (this.pointerOutHandler) {
      this.scene.input.off('pointerout', this.pointerOutHandler);
    }
    if (this.wheelHandler) {
      this.scene.input.off('wheel', this.wheelHandler);
    }
    if (this.escapeHandler) {
      this.scene.input.keyboard?.off('keydown-ESC', this.escapeHandler);
    }
    if (this.keydownHandler) {
      this.scene.input.keyboard?.off('keydown', this.keydownHandler);
    }
  }

  private handleLeftClick(pos: Position) {
    const state = useGameStore.getState();
    const player = state.players.find(p => p.id === state.currentPlayerId);

    // Units on map + available units in own settlement
    const unitsAtTile = state.players.flatMap((p) => p.units).filter((u) => isSame(u.position, pos));
    const settlementAtTile = state.players.flatMap((p) => p.settlements).find((c) => isSame(c.position, pos));

    if (settlementAtTile && settlementAtTile.ownerId === player?.id) {
       const availableUnitsInSettlement = settlementAtTile.units.filter(u => !settlementAtTile.workforce.has(u.id));
       unitsAtTile.push(...availableUnitsInSettlement);
    }

    const tile = state.map[pos.y]?.[pos.x] ||  // eslint-disable-line @typescript-eslint/no-unnecessary-condition
      { position: pos, terrainType: 'UNKNOWN', movementCost: 1, hasResource: null };
    useGameStore.getState().selectTile(tile as any);

    if (settlementAtTile) {
      const isOwned = settlementAtTile.ownerId === state.currentPlayerId;
      if (unitsAtTile.length > 0 && isOwned) {
         useGameStore.getState().selectUnit(null);
         this.scene.events.emit('unitSelected', null as any);
      } else {
         useGameStore.getState().selectSettlement(settlementAtTile.id);
         this.scene.events.emit('settlementSelected', settlementAtTile.id);
      }
    } else if (unitsAtTile.length === 1) {
      const unit = unitsAtTile[0];
      useGameStore.getState().selectUnit(unit.id);
      this.scene.events.emit('unitSelected', unit.id);
    } else if (unitsAtTile.length > 1) {
      useGameStore.getState().selectUnit(null);
      this.scene.events.emit('unitSelected', null as any);
    } else {
      useGameStore.getState().selectUnit(null);
      useGameStore.getState().selectSettlement(null);
      this.scene.events.emit('unitSelected', null as any);
      this.scene.events.emit('settlementSelected', null as any);
    }
    this.terrainRenderer.updateSelectionHighlight(pos);
  }

  private handleRightClick(pos: Position, reachableTiles: Position[], handleMove: (id: string, position: Position) => void) {
    const state = useGameStore.getState();
    if (!state.selectedUnitId) return;

    const selectedUnit = state.players.flatMap((p) => p.units).find((u) => u.id === state.selectedUnitId);
    if (!selectedUnit) return;

    const foreignUnitAtTile = state.players
      .filter((p) => p.id !== state.currentPlayerId)
      .flatMap((p) => p.units)
      .find((u) => isSame(u.position, pos));

    const foreignSettlementAtTile = state.players
      .filter((p) => p.id !== state.currentPlayerId)
      .flatMap((p) => p.settlements)
      .find((c) => isSame(c.position, pos));

    if (selectedUnit.type === UnitType.SOLDIER && foreignUnitAtTile ) {
      useGameStore.getState().resolveCombat(selectedUnit.id, pos);
    } else if (selectedUnit.type === UnitType.SOLDIER && foreignSettlementAtTile ) {
      useGameStore.getState().attackSettlement(foreignSettlementAtTile.id, selectedUnit.id);
    } else if (selectedUnit.type === UnitType.COLONIST &&
        foreignSettlementAtTile &&
        foreignSettlementAtTile.attitude !== Attitude.HOSTILE) {
      useUIStore.getState().setNativeTradeModalOpen(true, foreignSettlementAtTile.id);
    } else {
      const isReachable = reachableTiles.some((t) => isSame(t, pos));
      if (isReachable) {
        handleMove(state.selectedUnitId, pos);
      } else {
        useGameStore.getState().selectUnit(null);
        this.scene.events.emit('unitSelected', null as any);
        this.terrainRenderer.updateSelectionHighlight(null);
      }
    }
  }
}
