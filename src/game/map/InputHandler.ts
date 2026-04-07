import Phaser from 'phaser';
import type { TerrainRenderer } from './TerrainRenderer';
import { useGameStore } from '../state/gameStore';
import { useUIStore } from '../state/uiStore';
import { UnitType, Attitude } from '../entities/types';

export class InputHandler {
  constructor(private scene: Phaser.Scene, private terrainRenderer: TerrainRenderer) {}

  setup(mapWidth: number, mapHeight: number, getReachableTiles: () => { x: number; y: number }[], handleMove: (id: string, x: number, y: number) => void) {
    this.scene.input.mouse?.disableContextMenu();

    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const worldPoint = pointer.positionToCamera(this.scene.cameras.main) as Phaser.Math.Vector2;
      const { x, y } = this.terrainRenderer.worldToTile(worldPoint.x, worldPoint.y);

      if (x < 0 || x >= mapWidth || y < 0 || y >= mapHeight) return;

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
        const settlement = useGameStore.getState().players.flatMap(p => p.settlements).find((s) => s.x === x && s.y === y);
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
      useGameStore.getState().selectTile(null);
      this.terrainRenderer.updateSelectionHighlight(null, null);
    });
  }

  private handleLeftClick(x: number, y: number) {
    const state = useGameStore.getState();
    const player = state.players.find(p => p.id === state.currentPlayerId);

    // Units on map + available units in own settlement
    const unitsAtTile = state.players.flatMap((p) => p.units).filter((u) => u.x === x && u.y === y);
    const settlementAtTile = state.players.flatMap((p) => p.settlements).find((c) => c.x === x && c.y === y);

    if (settlementAtTile && player && settlementAtTile.ownerId === player.id) {
       const availableUnitsInSettlement = settlementAtTile.units.filter(u => !settlementAtTile.workforce.has(u.id));
       unitsAtTile.push(...availableUnitsInSettlement);
    }

    const tile = state.map[y]?.[x] || { x, y, terrainType: 'UNKNOWN', movementCost: 1, hasResource: null };
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
    this.terrainRenderer.updateSelectionHighlight(x, y);
  }

  private handleRightClick(x: number, y: number, reachableTiles: { x: number; y: number }[], handleMove: (id: string, x: number, y: number) => void) {
    const state = useGameStore.getState();
    if (!state.selectedUnitId) return;

    const selectedUnit = state.players.flatMap((p) => p.units).find((u) => u.id === state.selectedUnitId);
    if (!selectedUnit) return;

    const foreignUnitAtTile = state.players
      .filter((p) => p.id !== state.currentPlayerId)
      .flatMap((p) => p.units)
      .find((u) => u.x === x && u.y === y);

    const foreignSettlementAtTile = state.players
      .filter((p) => p.id !== state.currentPlayerId)
      .flatMap((p) => p.settlements)
      .find((c) => c.x === x && c.y === y);

    if (selectedUnit.type === UnitType.SOLDIER && foreignUnitAtTile ) {
      useGameStore.getState().resolveCombat(selectedUnit.id, x, y);
    } else if (selectedUnit.type === UnitType.SOLDIER && foreignSettlementAtTile ) {
      useGameStore.getState().attackSettlement(foreignSettlementAtTile.id, selectedUnit.id);
    } else if (selectedUnit.type === UnitType.COLONIST &&
        foreignSettlementAtTile &&
        foreignSettlementAtTile.attitude !== Attitude.HOSTILE) {
      useUIStore.getState().setNativeTradeModalOpen(true, foreignSettlementAtTile.id);
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
