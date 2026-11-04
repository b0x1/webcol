# Architecture — webcol

Browser turn-based strategy game. Colonisation genre. See AGENTS.md for rules. See SKILLS.md for patterns.

---

## Stack

| Concern                         | Library           |
|---------------------------------|-------------------|
| Game render, input, scenes      | Phaser            |
| UI panels, modals, HUD          | React             |
| React optimisation              | React Compiler    |
| Phaser ↔ React state bridge     | Zustand           |
| Language                        | TypeScript strict |
| Styling                         | Tailwind CSS      |
| Build and dev server            | Vite              |
| Unit tests                      | Vitest            |
| Noise generation                | simplex-noise     |

---

## Runtime split

Game now has two architecture runtimes even when both run inside one browser tab.

```
┌──────────────────────────────────────────────┐
│ Client runtime      src/client/              │
│ React, Phaser scenes, EventBus, client store │
│ Sends commands. Renders latest server state. │
├──────────────────────────────────────────────┤
│ Server runtime      src/server/              │
│ Authoritative game simulation and commands   │
│ Owns all game-changing state transitions     │
├──────────────────────────────────────────────┤
│ Shared domain       src/shared/              │
│ Protocol, entities, and rule systems         │
│ No browser or framework dependency           │
└──────────────────────────────────────────────┘
```

---

## Layers

Depend only downward. No upward import.

```
┌──────────────────────────────────────────────┐
│  UI layer           src/client/ui/           │
│  React + Tailwind. Read Zustand store.       │
│  No Phaser. No logic.                        │
├──────────────────────────────────────────────┤
│  Scene layer        src/client/scenes/       │
│  Phaser scenes. Render and input only.       │
│  No game rules. Talk via EventBus only.      │
├──────────────────────────────────────────────┤
│  Systems layer      src/shared/game/systems/ │
│  All game rules. Pure TypeScript.            │
│  No Phaser. No React. No DOM.                │
│  Must be unit-testable alone.                │
├──────────────────────────────────────────────┤
│  Entity layer       src/shared/game/entities/│
│  Plain data interfaces and enums.            │
│  Zero dependencies.                          │
└──────────────────────────────────────────────┘
```

### Cross-layer talk

No direct calls between scenes and React. Two channels only:

- **EventBus** `src/client/game/state/EventBus.ts` — scene emit typed event, React subscribe in `useEffect`. All events in central `EventMap`.
- **Client store** `src/client/game/gameStore.ts` — React read and dispatch client actions, scene subscribe via `subscribe()`.

## Client/server talk

Client and server talk by typed protocol only:

- **Command** `src/shared/game/protocol.ts` — client intent like `moveUnit`, `endTurn`, `buyBuilding`
- **State message** `src/shared/game/protocol.ts` — authoritative state snapshot plus side effects
- **Transport** `src/client/game/LocalGameTransport.ts` — in-browser loopback now, network transport later
- **Server** `src/server/game/LocalGameServer.ts` — only place allowed to accept or reject game-changing commands

---

## File structure

```
public/
  assets/
    sprites/        Compiled sprite sheets (build:sprites output)
    maps/           Tiled map JSON
    audio/          Sound and music

src/
  client/
    scenes/            Phaser scenes only
    ui/                React UI only
    game/
      LocalGameTransport.ts Local client/server bridge
      gameStore.ts          Client read-model store + command dispatch
      map/                  Client map rendering, camera, input
      rendering/            Client render scheduling glue
      state/                EventBus, UI store, selectors, save manager
      utils/                Client-only helpers like SpriteLoader
  server/
    game/
      LocalGameServer.ts    Authoritative command handling
      utils.ts              Server random/id helpers
  shared/
    game/
      AuthoritativeGameState.ts
      constants.ts          Shared config values
      entities/            Data interfaces and enums — zero deps
      map/                 Shared map generation
      protocol.ts          Command + message contracts
      rules/               Shared rule tables
      systems/             Game rule classes — no framework deps
      utils/               Shared pure helpers

data/
    sprites/        single SVG sprites - to generate sprite sheets

scripts/
  build-sprites.js  Prebuild: generate sprite sheets → public/assets/sprites/
```

---

## Build order

```
build:sprites   Sharp generate sprite sheets → public/assets/sprites/
tsc -b          TypeScript check
vite build      Bundle → dist/
```

`prebuild` hook run `build:sprites` before every production build.
CI run sprite build explicit first so tests can use generated assets.

---

## State ownership

| Data                              | Owner             |
|-----------------------------------|-------------------|
| Map, units, settlements           | Server runtime    |
| Turn state, resources, diplomacy  | Server runtime    |
| Client selection + combat toast   | Client store      |
| Phaser sprites and tweens         | Phaser scene only |
| Component local UI state          | React useState    |
| Cross-layer events                | EventBus          |

Authoritative state hold serialisable plain objects only. No Phaser instance. No React ref. No class instance.
Client store mirrors the latest authoritative snapshot and may add client-only view state.

## Import policy

Use path aliases for runtime clarity:

- `@client/*` -> `src/client/*`
- `@server/*` -> `src/server/*`
- `@shared/*` -> `src/shared/*`

Rules:

- Client may import from `@client/*` and `@shared/*`, never from `@server/*`.
- Server may import from `@server/*` and `@shared/*`, never from `@client/*`.
- Shared may import only from `@shared/*` or same-folder relatives.
