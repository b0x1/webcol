# AGENTS for Web Colonization

This file guides Jules on architecture expectations, coding standards, and
refactoring behaviour for this project. Read it fully before planning any task.

---

## Project overview

A browser-based remake of Sid Meier's Colonization built with:
- **Phaser 3** — game rendering, input, scenes, tweens
- **React 18** — all UI panels, modals, HUD overlays
- **Zustand** — shared state bridge between Phaser and React
- **TypeScript (strict)** — all code, no `any`
- **Vite** — build and dev server
- **Vitest** — unit tests

---

## Separation of concerns — the most important rule

The codebase is divided into four layers. Code must never cross layer
boundaries in the wrong direction.

```
┌──────────────────────────────────────────────┐
│  UI layer       src/ui/                      │
│  React components. Read from Zustand store.  │
│  Never import Phaser. Never contain logic.   │
├──────────────────────────────────────────────┤
│  Scene layer    src/scenes/                  │
│  Phaser scenes. Rendering and input only.    │
│  Never contain game rules or business logic. │
│  Communicate outward via EventBus only.      │
├──────────────────────────────────────────────┤
│  Systems layer  src/game/systems/            │
│  Pure TypeScript. All game rules live here.  │
│  No Phaser imports. No React imports.        │
│  No direct DOM access.                       │
├──────────────────────────────────────────────┤
│  Entity layer   src/game/entities/           │
│  Plain data classes and enums.               │
│  Zero dependencies — no imports from above.  │
└──────────────────────────────────────────────┘
```

**Phaser scenes must not contain game logic.** If a scene is doing anything
beyond rendering state and dispatching input events, extract that logic into
a system class and call it from there.

**React components must not contain game logic.** Components read from the
Zustand store and dispatch actions. Derived values and calculations belong in
the store or in a system, not inside a component.

**Systems must be framework-free.** A system class must be testable with
Vitest without starting Phaser or rendering React. If a system cannot be
unit-tested in isolation, it is entangled with the wrong layer.

---

## Refactoring — always look before adding

Before implementing any new feature, scan the files you are touching for:

- **Duplicated logic** — if similar logic exists elsewhere, extract a shared
  utility or base class rather than copying it
- **God classes** — if any class exceeds ~150 lines, check whether it has
  grown multiple responsibilities and split it
- **Inline magic values** — replace any raw numbers or strings that represent
  game constants with named constants in `src/game/constants.ts`
- **Bloated scenes** — if WorldScene.ts or any other scene file exceeds
  ~200 lines, extract rendering sub-systems into dedicated renderer classes
  under `src/game/map/` or `src/game/rendering/`
- **Untested paths** — if you touch a file that has no test coverage and the
  logic is non-trivial, add tests for the existing behaviour before modifying it

Always include refactoring in your plan step. State explicitly what you are
cleaning up and why.

---

## Architecture patterns to follow

### EventBus
Phaser scenes and React components communicate exclusively through the
EventBus at `src/game/state/EventBus.ts`. Scenes emit events; React
subscribes via `useEffect`. React dispatches store actions; scenes react
to store changes via subscriptions. Direct cross-layer function calls are
not permitted.

### Zustand store
The store holds only serialisable data. No Phaser objects, no React refs,
no class instances. Actions in the store perform input validation and
update state. Complex multi-step logic (e.g. resolving combat, running a
full AI turn) lives in a system class that the store action delegates to.

### System classes
Each system is a class with static or instance methods. Systems receive
only plain data as arguments and return plain data as results. They do not
read from the store directly — the caller reads state and passes it in.

```typescript
// Good
const result = CombatSystem.resolveCombat(attacker, defender, tile);
useGameStore.getState().applyResult(result);

// Bad — system reading store directly
class CombatSystem {
  resolve() {
    const state = useGameStore.getState(); // never do this
  }
}
```

### React components
Components are presentational or container, never both. A container
component connects to Zustand and passes props down. A presentational
component receives props and renders. Components never call game system
classes directly.

---

## TypeScript standards

- **No `any`** — use `unknown` with type guards if the shape is genuinely
  unknown, or define a proper interface
- **No non-null assertions (`!`)** — handle `null` and `undefined` explicitly
- **Enums over string literals** for domain values (GoodType, TerrainType, etc.)
- **Readonly** on data that should not be mutated after creation
- **Explicit return types** on all public methods and exported functions
- Every new file must have a corresponding `.test.ts` file if it contains
  logic (systems, store actions, utilities). Pure React components and Phaser
  scenes are exempt but utility functions within them are not.

---

## File structure rules

```
src/
  scenes/           Phaser scenes only
  game/
    entities/       Data classes and enums — zero deps
    systems/        Game logic — no framework deps
    map/            Map generation and rendering helpers
    state/          Zustand store + EventBus
    constants.ts    All magic numbers and config values
  ui/
    components/     Shared presentational React components
    [FeatureName]/  One folder per modal or screen
  assets/
    sprites/        Programmatic texture generators
    maps/           Tiled map files
    audio/          Sound assets
```

When adding a new feature, create a folder for it rather than adding files
to the root of an existing directory. Keep feature folders self-contained.

---

## What to do on every task

1. **Read the relevant files first** before writing any code. Understand what
   already exists before deciding what to add.
2. **State your refactoring plan** in the plan step — not just what you are
   adding but what you are cleaning up.
3. **Check for layer violations** in every file you touch. If you find one
   that predates this task, fix it.
4. **Extract constants** — any number or string that represents a game rule
   goes in `src/game/constants.ts`, not inline.
5. **Write or update tests** for every system method you add or modify.
6. **Keep commits focused** — one logical change per commit. Do not bundle
   a feature with unrelated refactoring in the same commit; make them
   separate commits with clear messages.

---

## What to avoid

- Do not add a new dependency without a clear justification in the plan.
  Prefer using what is already installed.
- Do not leave `TODO` or `FIXME` comments — either implement it now or
  create a separate task for it.
- Do not use `console.log` for debugging — use the EventBus to emit
  diagnostic events or remove debug output before committing.
- Do not generate placeholder or stub implementations and call them done.
  If a method cannot be fully implemented in this task, say so in the plan
  and leave it unimplemented with a thrown `NotImplementedError`.
