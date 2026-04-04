import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { useGameStore } from './game/state/gameStore';
import { WorldScene } from './scenes/WorldScene';
import { HUD } from './ui/HUD';
import { UnitPanel } from './ui/UnitPanel';
import { ColonyPanel } from './ui/ColonyPanel';
import { MiniMap } from './ui/MiniMap';
import { ColonyScreen } from './ui/ColonyScreen/ColonyScreen';
import { EuropeScreen } from './ui/EuropeScreen/EuropeScreen';
import { NativeTradeModal } from './ui/NativeTradeModal/NativeTradeModal';
import { CombatResultToast } from './ui/CombatResultToast';
import { SaveLoadModal } from './ui/SaveLoadModal';
import { NotificationToast } from './ui/NotificationToast';

function App() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const selectUnit = useGameStore((state) => state.selectUnit);
  const selectColony = useGameStore((state) => state.selectColony);

  useEffect(() => {
    if (gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: 'game-container',
      scene: [WorldScene],
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    game.events.once('ready', () => {
      const worldScene = game.scene.getScene('WorldScene') as WorldScene;
      if (worldScene) {
        worldScene.events.on('unitSelected', (unitId: string | null) => {
          selectUnit(unitId);
        });
        worldScene.events.on('colonySelected', (colonyId: string | null) => {
          selectColony(colonyId);
        });
      }
    });

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [selectUnit, selectColony]);

  return (
    <div className="App" style={{ position: 'relative', width: '800px', height: '600px' }}>
      <div id="game-container"></div>
      <div
        className="ui-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        <HUD />
        <UnitPanel />
        <ColonyPanel />
        <MiniMap />
        <ColonyScreen />
        <EuropeScreen />
        <NativeTradeModal />
        <CombatResultToast />
        <SaveLoadModal />
        <NotificationToast />
      </div>
    </div>
  );
}

export default App;
