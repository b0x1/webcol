import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { useGameStore, selectAvailableUnits } from './game/state/gameStore';
import { useUIStore } from './game/state/uiStore';
import { eventBus } from './game/state/EventBus';
import type { Tile } from './game/entities/Tile';
import { WorldScene } from './scenes/WorldScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { HUD } from './ui/HUD';
import { UnitPanel } from './ui/UnitPanel';
import { FieldPanel } from './ui/FieldPanel';
import { MiniMap } from './ui/MiniMap';
import { SettlementScreen } from './ui/SettlementScreen/SettlementScreen';
import { EuropeScreen } from './ui/EuropeScreen/EuropeScreen';
import { ForeignInteractionModal } from './ui/ForeignInteractionModal/ForeignInteractionModal';
import { ForeignSettlementModal } from './ui/ForeignSettlementModal';
import { CombatResultToast } from './ui/CombatResultToast';
import { SaveLoadModal } from './ui/SaveLoadModal';
import { ReportsModal } from './ui/ReportsModal';
import { NotificationToast } from './ui/NotificationToast';
import { MainMenu } from './ui/MainMenu/MainMenu';
import { HowToPlayModal } from './ui/MainMenu/HowToPlayModal';
import { GameSetupModal } from './ui/MainMenu/GameSetupModal';
import { EndTurnConfirmationModal } from './ui/EndTurnConfirmationModal';
import { LazyRenderController } from './game/rendering/LazyRenderController';

function App(): React.ReactElement {
  const gameRef = useRef<Phaser.Game | null>(null);
  const lazyRenderControllerRef = useRef<LazyRenderController | null>(null);
  const { selectUnit, selectSettlement, endTurn } = useGameStore();
  const {
    showEndTurnConfirm,
    setShowEndTurnConfirm
  } = useUIStore();

  const availableUnits = useGameStore(selectAvailableUnits);

  useEffect(() => {
    if (gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: 'game-container',
      scene: [MainMenuScene, WorldScene],
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;
    const lazyRenderController = new LazyRenderController(game);
    lazyRenderController.bind();
    lazyRenderControllerRef.current = lazyRenderController;
    const unsubscribeRender = useGameStore.subscribe(() => {
      lazyRenderController.requestRender();
    });

    return () => {
      unsubscribeRender();
      lazyRenderControllerRef.current?.destroy();
      lazyRenderControllerRef.current = null;
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const unsubscribeUnitSelected = eventBus.on('unitSelected', (unitId) => {
      selectUnit(unitId);
    });
    const unsubscribeSettlementSelected = eventBus.on('settlementSelected', (settlementId) => {
      selectSettlement(settlementId);
    });
    const unsubscribeTileSelected = eventBus.on('tileSelected', (position) => {
      const tile: Tile | null = position
        ? useGameStore.getState().map[position.y]?.[position.x] ?? null
        : null;
      useGameStore.getState().selectTile(tile);
    });
    const unsubscribeCombatRequested = eventBus.on('combatRequested', (target) => {
      const selectedUnitId = useGameStore.getState().selectedUnitId;
      if (!selectedUnitId) {
        return;
      }

      useGameStore.getState().resolveCombat(selectedUnitId, target);
    });
    const unsubscribeTradeRequested = eventBus.on('nativeTradeRequested', (settlementId) => {
      useUIStore.getState().setNativeTradeModalOpen(true, settlementId);
    });

    return () => {
      unsubscribeUnitSelected();
      unsubscribeSettlementSelected();
      unsubscribeTileSelected();
      unsubscribeCombatRequested();
      unsubscribeTradeRequested();
    };
  }, [selectSettlement, selectUnit]);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <div id="game-container" className="w-full h-full"></div>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <HUD />
        <FieldPanel />
        <UnitPanel />
        <MiniMap />
        <SettlementScreen />
        <ForeignSettlementModal />
        <EuropeScreen />
        <ForeignInteractionModal />
        <CombatResultToast />
        <SaveLoadModal />
        <ReportsModal />
        <NotificationToast />
        <MainMenu />
        <HowToPlayModal />
        <GameSetupModal />

        {showEndTurnConfirm && (
          <EndTurnConfirmationModal
            remainingUnits={availableUnits.length}
            onConfirm={() => {
              setShowEndTurnConfirm(false);
              endTurn();
            }}
            onCancel={() => { setShowEndTurnConfirm(false); }}
          />
        )}
      </div>
    </div>
  );
}

export default App;
