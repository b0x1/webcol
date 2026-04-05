import Phaser from 'phaser';
import type { TerrainRenderer } from './TerrainRenderer';
import { useGameStore } from '../state/gameStore';
import { useUIStore } from '../state/uiStore';
import { UnitType, Attitude } from '../entities/types';
import type { Unit } from '../entities/Unit';

export class InputHandler {
  constructor(private scene: Phaser.Scene, private terrainRenderer: TerrainRenderer) {}

  setup(mapWidth: number, mapHeight: number, getReachableTiles: () => { x: number; y: number }[], handleMove: (id: string, x: number, y: number) => void) {
    this.scene.input.mouse?.disableContextMenu();

    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const worldPoint = pointer.positionToCamera(this.scene.cameras.main) as Phaser.Math.Vector2;
      const { x, y } = this.terrainRenderer.worldToTile(worldPoint.x, worldPoint.y);

      if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) return;

      const state = useGameStore.getState();

      if (pointer.leftButtonDown()) {
        this.handleLeftClick(x, y);
      } else if (pointer.rightButtonDown()) {
        this.handleRightClick(x, y, getReachableTiles(), handleMove);
      }
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const worldPoint = pointer.positionToCamera(this.scene.cameras.main) as Phaser.Math.Vector2;
      const { x, y } = this.terrainRenderer.worldToTile(worldPoint.x, worldPoint.y);

      if (x >= 0 && x < mapWidth && y >= 0 && y < mapHeight) {
        const settlement = useGameStore.getState().npcSettlements.find((s) => s.x === x && s.y === y);
        this.terrainRenderer.showTooltip(x, y, worldPoint.x, worldPoint.y, settlement?.name);
      } else {
        this.terrainRenderer.hideTooltip();
      }
    });

    this.scene.input.on('pointerout', () => {
      this.terrainRenderer.hideTooltip();
    });

    this.scene.input.keyboard?.on('keydown-ESC', () => {
      useGameStore.getState().selectUnit(null);
      this.scene.events.emit('unitSelected', null as any);
      this.terrainRenderer.updateSelectionHighlight(null, null);
    });
  }

  private handleLeftClick(x: number, y: number) {
    const state = useGameStore.getState();
    const unitAtTile = state.players.flatMap((p) => p.units).find((u) => u.x === x && u.y === y);
    const settlementAtTile = state.players.flatMap((p) => p.settlements).find((c) => c.x === x && c.y === y);
    const npcSettlementAtTile = state.npcSettlements.find((s) => s.x === x && s.y === y);

    if (unitAtTile) {
      useGameStore.getState().selectUnit(unitAtTile.id);
      this.scene.events.emit('unitSelected', unitAtTile.id);
    } else if (settlementAtTile) {
      useGameStore.getState().selectSettlement(settlementAtTile.id);
      this.scene.events.emit('settlementSelected', settlementAtTile.id);
    } else if (npcSettlementAtTile) {
      const selectedUnitId = useGameStore.getState().selectedUnitId;
      if (selectedUnitId) {
        const selectedUnit = state.players.flatMap((p) => p.units).find((u) => u.id === selectedUnitId);
        if (selectedUnit) {
          if (selectedUnit.type === UnitType.SOLDIER && npcSettlementAtTile.attitude === Attitude.HOSTILE) {
            useGameStore.getState().attackSettlement(npcSettlementAtTile.id, selectedUnitId);
          } else if (selectedUnit.type === UnitType.COLONIST && npcSettlementAtTile.attitude !== Attitude.HOSTILE) {
            useUIStore.getState().setNativeTradeModalOpen(true, npcSettlementAtTile.id);
          }
        }
      }
    } else {
      useGameStore.getState().selectUnit(null);
      useGameStore.getState().selectSettlement(null);
      this.scene.events.emit('unitSelected', null as any);
      this.scene.events.emit('settlementSelected', null as any);
    }
    this.terrainRenderer.updateSelectionHighlight(x, y);
  }

  private handleRightClick(x: number, y: number, reachableTiles: { x: number; y: number }[], handleMove: (id: string, x: number, y: number) => void) {
    const state = useGameStore.getState();
    if (!state.selectedUnitId) return;

    const selectedUnit = state.players.flatMap((p) => p.units).find((u) => u.id === state.selectedUnitId);
    if (!selectedUnit) return;

    const enemyUnitAtTile = state.players
      .filter((p) => p.id !== state.currentPlayerId)
      .flatMap((p) => p.units)
      .find((u) => u.x === x && u.y === y);

    const enemySettlementAtTile = state.players
      .filter((p) => p.id !== state.currentPlayerId)
      .flatMap((p) => p.settlements)
      .find((c) => c.x === x && c.y === y);

    const npcSettlementAtTile = state.npcSettlements.find((s) => s.x === x && s.y === y);

    if (selectedUnit.type === UnitType.SOLDIER && (enemyUnitAtTile || enemySettlementAtTile || (npcSettlementAtTile && npcSettlementAtTile.attitude === Attitude.HOSTILE))) {
      useGameStore.getState().resolveCombat(selectedUnit.id, x, y);
    } else {
      const isReachable = reachableTiles.some((t) => t.x === x && t.y === y);
      if (isReachable) {
        handleMove(state.selectedUnitId, x, y);
      } else {
        useGameStore.getState().selectUnit(null);
        this.scene.events.emit('unitSelected', null as any);
        this.terrainRenderer.updateSelectionHighlight(null, null);
      }
    }
  }
}
