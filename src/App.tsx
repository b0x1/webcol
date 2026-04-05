import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { useGameStore } from './game/state/gameStore';
import { useUIStore } from './game/state/uiStore';
import { WorldScene } from './scenes/WorldScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { HUD } from './ui/HUD';
import { UnitPanel } from './ui/UnitPanel';
import { SettlementPanel } from './ui/SettlementPanel';
import { MiniMap } from './ui/MiniMap';
import { SettlementScreen } from './ui/SettlementScreen/SettlementScreen';
import { EuropeScreen } from './ui/EuropeScreen/EuropeScreen';
import { NativeTradeModal } from './ui/NativeTradeModal/NativeTradeModal';
import { CombatResultToast } from './ui/CombatResultToast';
import { SaveLoadModal } from './ui/SaveLoadModal';
import { ReportsModal } from './ui/ReportsModal';
import { NotificationToast } from './ui/NotificationToast';
import { MainMenu } from './ui/MainMenu/MainMenu';
import { HowToPlayModal } from './ui/MainMenu/HowToPlayModal';
import { GameSetupModal } from './ui/MainMenu/GameSetupModal';
import { EndTurnConfirmationModal } from './ui/EndTurnConfirmationModal';

function App() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const {
    selectUnit,
    selectSettlement,
    endTurn,
    players,
    currentPlayerId
  } = useGameStore();
  const {
    showEndTurnConfirm,
    setShowEndTurnConfirm
  } = useUIStore();

  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const availableUnits = currentPlayer?.units.filter(u => u.movesRemaining > 0 && !u.isSkipping) || [];

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

    game.events.once('ready', () => {
      const worldScene = game.scene.getScene('WorldScene') as WorldScene;
      if (worldScene) {
        worldScene.events.on('unitSelected', (unitId: string | null) => {
          selectUnit(unitId);
        });
        worldScene.events.on('settlementSelected', (settlementId: string | null) => {
          selectSettlement(settlementId);
        });
      }
    });

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [selectUnit, selectSettlement]);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <div id="game-container" className="w-full h-full"></div>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <HUD />
        <UnitPanel />
        <SettlementPanel />
        <MiniMap />
        <SettlementScreen />
        <EuropeScreen />
        <NativeTradeModal />
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
            onCancel={() => setShowEndTurnConfirm(false)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
