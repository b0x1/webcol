# Web Colonization

An open-source turn-based strategy game inspired by the classic
genre-defining work of art Sid Meier's Colonization,
implemetend by a meat blob prompting [Claude](https://claude.ai) to prompt
[Jules](https://jules.google.com/).

## Tech Stack

- **Vite + TypeScript**: Build system and strict type-safe development.
- **Phaser 3**: High-performance HTML5 game engine.
- **React 18**: Dynamic UI overlays and menus.
- **Zustand**: Shared state management between React and Phaser.
- **ESLint + Prettier**: Code quality and consistent formatting.

## Project Structure

```
src/
  assets/        # Sprites, maps, and audio
  game/          # Core game logic
    entities/    # Game objects (Colony, Unit, Ship, Tile)
    map/         # TileMap and TerrainGenerator
    state/       # Zustand store for shared game state
    systems/     # Game engines (TurnEngine, TradeSystem, CombatSystem)
  scenes/        # Phaser scenes
  ui/            # React UI components
  App.tsx        # Main game component with Phaser container
  main.tsx       # Application entry point
```

## Getting Started

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Start development server:**
    ```bash
    npm run dev
    ```

3.  **Build for production:**
    ```bash
    npm run build
    ```
