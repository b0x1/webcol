import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { useGameStore } from './game/state/store';
import { WorldScene } from './scenes/WorldScene';

function App() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const { score, incrementScore } = useGameStore();

  useEffect(() => {
    if (gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: 'game-container',
      scene: [WorldScene],
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div className="App">
      <div id="game-container"></div>
      <div
        className="ui-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          padding: '20px',
          color: 'white',
          pointerEvents: 'none',
        }}
      >
        <h1>Web Colonization</h1>
        <p>Score from Zustand: {score}</p>
        <button onClick={incrementScore} style={{ pointerEvents: 'auto' }}>
          Increment Score
        </button>
      </div>
    </div>
  );
}

export default App;
