import type Phaser from 'phaser';
import type { TerrainRenderer } from './TerrainRenderer';
import type { CameraManager } from './CameraManager';
import { eventBus } from '../state/EventBus';
import { useGameStore } from '../state/gameStore';
import { UnitType, Attitude } from '../entities/types';
import { isSame, type Position } from '../entities/Position';
import { TraversalUtils } from '../utils/TraversalUtils';
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
        const settlement = TraversalUtils.findSettlementAt(useGameStore.getState().players, pos);
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
      eventBus.emit('unitSelected', null);
      eventBus.emit('settlementSelected', null);
      eventBus.emit('tileSelected', null);
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
    const players = state.players;
    const player = TraversalUtils.findPlayerById(players, state.currentPlayerId);

    // Units on map + available units in own settlement
    const unitsAtTile = TraversalUtils.findUnitsAt(players, pos);
    const settlementAtTile = TraversalUtils.findSettlementAt(players, pos);

    if (settlementAtTile && settlementAtTile.ownerId === player?.id) {
       const availableUnitsInSettlement = settlementAtTile.units.filter((u) =>
         TraversalUtils.isUnitAvailable(u, settlementAtTile.position)
       );
       unitsAtTile.push(...availableUnitsInSettlement);
    }

    eventBus.emit('tileSelected', pos);

    if (settlementAtTile) {
      const isOwned = settlementAtTile.ownerId === state.currentPlayerId;
      if (unitsAtTile.length > 0 && isOwned) {
         eventBus.emit('unitSelected', null);
         eventBus.emit('settlementSelected', null);
      } else {
         eventBus.emit('unitSelected', null);
         eventBus.emit('settlementSelected', settlementAtTile.id);
      }
    } else if (unitsAtTile.length === 1) {
      const unit = unitsAtTile[0];
      if (unit) {
        eventBus.emit('settlementSelected', null);
        eventBus.emit('unitSelected', unit.id);
      }
    } else if (unitsAtTile.length > 1) {
      eventBus.emit('settlementSelected', null);
      eventBus.emit('unitSelected', null);
    } else {
      eventBus.emit('unitSelected', null);
      eventBus.emit('settlementSelected', null);
    }
    this.terrainRenderer.updateSelectionHighlight(pos);
  }

  private handleRightClick(pos: Position, reachableTiles: Position[], handleMove: (id: string, position: Position) => void) {
    const state = useGameStore.getState();
    if (!state.selectedUnitId) return;

    const selectedUnit = TraversalUtils.findUnitById(state.players, state.selectedUnitId);
    if (!selectedUnit) return;

    const otherPlayers = state.players.filter((p) => p.id !== state.currentPlayerId);
    const foreignUnitAtTile = TraversalUtils.findUnitsAt(otherPlayers, pos)[0];
    const foreignSettlementAtTile = TraversalUtils.findSettlementAt(otherPlayers, pos);

    if (selectedUnit.type === UnitType.SOLDIER && foreignUnitAtTile ) {
      eventBus.emit('combatRequested', pos);
    } else if (selectedUnit.type === UnitType.SOLDIER && foreignSettlementAtTile ) {
      eventBus.emit('combatRequested', foreignSettlementAtTile.position);
    } else if (selectedUnit.type === UnitType.COLONIST &&
        foreignSettlementAtTile &&
        foreignSettlementAtTile.attitude !== Attitude.HOSTILE) {
      eventBus.emit('nativeTradeRequested', foreignSettlementAtTile.id);
    } else {
      const isReachable = reachableTiles.some((t) => isSame(t, pos));
      if (isReachable) {
        handleMove(state.selectedUnitId, pos);
      } else {
        eventBus.emit('unitSelected', null);
        this.terrainRenderer.updateSelectionHighlight(null);
      }
    }
  }
}
