# ECS Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a hand-rolled ECS core for the Battle City canvas game plus a vertical slice where the player drives a tank around the canvas.

**Architecture:** An entity is a plain object whose components are optional properties on a single `Components` registry interface; the `World` owns a flat array of entities and hands systems typed subsets through `query(...names)`. Systems are plain functions receiving `{ world, dt, input, ctx }`, and the game layer declares their execution order in one array.

**Tech Stack:** TypeScript 6, Vite 8, pnpm, Canvas 2D. No runtime dependencies, no test framework.

Spec: `docs/superpowers/specs/2026-08-15-ecs-architecture-design.md`

## Global Constraints

- Zero runtime dependencies. Do not add packages.
- `erasableSyntaxOnly` is on: no `enum`, no `namespace`, no constructor parameter properties. Use string unions and explicitly declared class fields.
- `verbatimModuleSyntax` is on: every type-only import must use `import type`.
- `noUnusedLocals` and `noUnusedParameters` are on: no placeholder bindings or unused imports.
- `allowImportingTsExtensions` is on: import local modules with their explicit `.ts` extension (e.g. `./ecs/world.ts`).
- No test framework. Every task verifies with `pnpm exec tsc`; tasks that change what's on screen also verify in the browser.
- Canvas is 640×480. The player tank is 32×32 and moves in four directions, one axis at a time — no diagonals.

## Working Tree Note

The repo has pre-existing uncommitted changes made by the user before this plan: `src/counter.ts` deleted, `src/main.ts` and `src/style.css` modified. Each task below stages only its own listed paths. Task 5 modifies `src/main.ts` and `src/style.css`, so committing them will also carry the user's pre-existing edits to those two files — mention this to the user in that task rather than reverting anything. Leave the `src/counter.ts` deletion unstaged; it is not part of this plan.

---

### Task 1: ECS core — component registry, entity types, world

**Files:**
- Create: `src/components.ts`
- Create: `src/ecs/entity.ts`
- Create: `src/ecs/world.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `src/components.ts`: `Position { x: number; y: number }`, `Velocity { x: number; y: number }`, `Direction = 'up' | 'down' | 'left' | 'right'`, `Facing { direction: Direction }`, `Renderable { width: number; height: number; color: string }`, `PlayerControlled { speed: number }`, and the registry `Components` with keys `position`, `velocity`, `facing`, `renderable`, `playerControlled`.
  - `src/ecs/entity.ts`: `EntityId = number`, `ComponentName = keyof Components`, `Entity`, `With<K extends ComponentName>`.
  - `src/ecs/world.ts`: `class World` with `entities: readonly Entity[]` getter, `spawn(components: Partial<Components>): Entity`, `destroy(entity: Entity): void`, `query<K extends ComponentName>(...names: K[]): With<K>[]`, `flush(): void`.

- [ ] **Step 1: Create the component registry**

Create `src/components.ts`:

```ts
export interface Position {
  x: number
  y: number
}

export interface Velocity {
  x: number
  y: number
}

export type Direction = 'up' | 'down' | 'left' | 'right'

export interface Facing {
  direction: Direction
}

export interface Renderable {
  width: number
  height: number
  color: string
}

export interface PlayerControlled {
  speed: number
}

/** Every component type the game knows about. One entry per component. */
export interface Components {
  position: Position
  velocity: Velocity
  facing: Facing
  renderable: Renderable
  playerControlled: PlayerControlled
}
```

- [ ] **Step 2: Create the entity types**

Create `src/ecs/entity.ts`:

```ts
import type { Components } from '../components.ts'

export type EntityId = number

export type ComponentName = keyof Components

export type Entity = { id: EntityId } & Partial<Components>

/** An entity where the listed components are guaranteed present. */
export type With<K extends ComponentName> = { id: EntityId } &
  Partial<Components> &
  Required<Pick<Components, K>>
```

- [ ] **Step 3: Create the world**

Create `src/ecs/world.ts`:

```ts
import type { Components } from '../components.ts'
import type { ComponentName, Entity, EntityId, With } from './entity.ts'

export class World {
  #entities: Entity[] = []
  #pendingDestroy = new Set<EntityId>()
  #nextId: EntityId = 1

  get entities(): readonly Entity[] {
    return this.#entities
  }

  spawn(components: Partial<Components>): Entity {
    const entity: Entity = { id: this.#nextId++, ...components }
    this.#entities.push(entity)
    return entity
  }

  destroy(entity: Entity): void {
    this.#pendingDestroy.add(entity.id)
  }

  query<K extends ComponentName>(...names: K[]): With<K>[] {
    const matches: With<K>[] = []

    for (const entity of this.#entities) {
      if (this.#pendingDestroy.has(entity.id)) continue
      if (names.some((name) => entity[name] === undefined)) continue
      matches.push(entity as With<K>)
    }

    return matches
  }

  // Removals are applied here, between frames, so a system can never delete an
  // entity another system is still iterating over.
  flush(): void {
    if (this.#pendingDestroy.size === 0) return
    this.#entities = this.#entities.filter((entity) => !this.#pendingDestroy.has(entity.id))
    this.#pendingDestroy.clear()
  }
}
```

- [ ] **Step 4: Verify it typechecks**

Run: `pnpm exec tsc`
Expected: no output, exit code 0. If `query`'s `entity as With<K>` is rejected, the cause is a typo in the type definitions — fix the definition, do not widen the cast to `as unknown as`.

- [ ] **Step 5: Commit**

```bash
git add src/components.ts src/ecs/entity.ts src/ecs/world.ts
git commit -m "Add ECS core: component registry, entity types, world"
```

---

### Task 2: Keyboard input and the system contract

**Files:**
- Create: `src/input.ts`
- Create: `src/ecs/system.ts`

**Interfaces:**
- Consumes: `World` from `src/ecs/world.ts`.
- Produces:
  - `src/input.ts`: `interface Input { isDown(...keys: string[]): boolean }` and `createInput(target?: Window): Input`. Keys are `KeyboardEvent.code` values (`'ArrowUp'`, `'KeyW'`, …).
  - `src/ecs/system.ts`: `interface SystemContext { world: World; dt: number; input: Input; ctx: CanvasRenderingContext2D }` and `type System = (context: SystemContext) => void`.

- [ ] **Step 1: Create the input module**

Create `src/input.ts`. It tracks pressed keys by `event.code` so the mapping is layout-independent, swallows arrow keys to stop the page scrolling, and clears state on blur so a key held while the tab loses focus does not stick down:

```ts
export interface Input {
  isDown(...keys: string[]): boolean
}

export function createInput(target: Window = window): Input {
  const pressed = new Set<string>()

  target.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.code.startsWith('Arrow')) event.preventDefault()
    pressed.add(event.code)
  })

  target.addEventListener('keyup', (event: KeyboardEvent) => {
    pressed.delete(event.code)
  })

  target.addEventListener('blur', () => {
    pressed.clear()
  })

  return {
    isDown: (...keys: string[]) => keys.some((key) => pressed.has(key)),
  }
}
```

- [ ] **Step 2: Create the system contract**

Create `src/ecs/system.ts`:

```ts
import type { Input } from '../input.ts'
import type { World } from './world.ts'

export interface SystemContext {
  world: World
  /** Seconds elapsed since the previous frame. */
  dt: number
  input: Input
  ctx: CanvasRenderingContext2D
}

export type System = (context: SystemContext) => void
```

- [ ] **Step 3: Verify it typechecks**

Run: `pnpm exec tsc`
Expected: no output, exit code 0.

- [ ] **Step 4: Commit**

```bash
git add src/input.ts src/ecs/system.ts
git commit -m "Add keyboard input tracking and system contract"
```

---

### Task 3: Player input and movement systems

**Files:**
- Create: `src/systems/player-input.ts`
- Create: `src/systems/movement.ts`

**Interfaces:**
- Consumes: `System` from `src/ecs/system.ts`; `Direction` from `src/components.ts`; `World.query` from `src/ecs/world.ts`.
- Produces: `playerInputSystem: System` and `movementSystem: System`.

- [ ] **Step 1: Create the player input system**

Create `src/systems/player-input.ts`. The first direction in the table whose keys are held wins, which is what makes movement single-axis — a diagonal key combination resolves to one direction instead of both:

```ts
import type { Direction } from '../components.ts'
import type { System } from '../ecs/system.ts'

interface DirectionBinding {
  direction: Direction
  keys: string[]
  x: number
  y: number
}

const BINDINGS: DirectionBinding[] = [
  { direction: 'up', keys: ['ArrowUp', 'KeyW'], x: 0, y: -1 },
  { direction: 'down', keys: ['ArrowDown', 'KeyS'], x: 0, y: 1 },
  { direction: 'left', keys: ['ArrowLeft', 'KeyA'], x: -1, y: 0 },
  { direction: 'right', keys: ['ArrowRight', 'KeyD'], x: 1, y: 0 },
]

export const playerInputSystem: System = ({ world, input }) => {
  for (const entity of world.query('playerControlled', 'velocity', 'facing')) {
    const binding = BINDINGS.find((candidate) => input.isDown(...candidate.keys))

    if (!binding) {
      entity.velocity.x = 0
      entity.velocity.y = 0
      continue
    }

    const { speed } = entity.playerControlled
    entity.facing.direction = binding.direction
    entity.velocity.x = binding.x * speed
    entity.velocity.y = binding.y * speed
  }
}
```

- [ ] **Step 2: Create the movement system**

Create `src/systems/movement.ts`. Bounds come from the canvas the context is drawing to, so no extra context field is needed:

```ts
import type { System } from '../ecs/system.ts'

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export const movementSystem: System = ({ world, dt, ctx }) => {
  for (const entity of world.query('position', 'velocity')) {
    const width = entity.renderable?.width ?? 0
    const height = entity.renderable?.height ?? 0

    entity.position.x = clamp(
      entity.position.x + entity.velocity.x * dt,
      0,
      ctx.canvas.width - width,
    )
    entity.position.y = clamp(
      entity.position.y + entity.velocity.y * dt,
      0,
      ctx.canvas.height - height,
    )
  }
}
```

- [ ] **Step 3: Verify it typechecks**

Run: `pnpm exec tsc`
Expected: no output, exit code 0. In particular `entity.facing.direction` and `entity.velocity.x` must need no `!` — if TypeScript complains they may be undefined, `With<K>` in Task 1 is wrong.

- [ ] **Step 4: Commit**

```bash
git add src/systems/player-input.ts src/systems/movement.ts
git commit -m "Add player input and movement systems"
```

---

### Task 4: Render system

**Files:**
- Create: `src/systems/render.ts`

**Interfaces:**
- Consumes: `System` from `src/ecs/system.ts`. Nothing else — the direction values
  are matched as string literals, so do not import `Direction` here or
  `noUnusedLocals` will fail the build.
- Produces: `renderSystem: System`.

- [ ] **Step 1: Create the render system**

Create `src/systems/render.ts`. The barrel is drawn inside the body so it can never be clipped by the bounds clamping in `movementSystem`:

```ts
import type { System } from '../ecs/system.ts'

const BACKGROUND = '#101010'
const BARREL_COLOR = '#e8f5d0'
const BARREL_LENGTH = 12
const BARREL_WIDTH = 6

export const renderSystem: System = ({ world, ctx }) => {
  ctx.fillStyle = BACKGROUND
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  for (const entity of world.query('position', 'renderable')) {
    const { x, y } = entity.position
    const { width, height, color } = entity.renderable

    ctx.fillStyle = color
    ctx.fillRect(x, y, width, height)

    const direction = entity.facing?.direction
    if (!direction) continue

    const centerX = x + width / 2
    const centerY = y + height / 2

    ctx.fillStyle = BARREL_COLOR
    switch (direction) {
      case 'up':
        ctx.fillRect(centerX - BARREL_WIDTH / 2, y, BARREL_WIDTH, BARREL_LENGTH)
        break
      case 'down':
        ctx.fillRect(
          centerX - BARREL_WIDTH / 2,
          y + height - BARREL_LENGTH,
          BARREL_WIDTH,
          BARREL_LENGTH,
        )
        break
      case 'left':
        ctx.fillRect(x, centerY - BARREL_WIDTH / 2, BARREL_LENGTH, BARREL_WIDTH)
        break
      case 'right':
        ctx.fillRect(
          x + width - BARREL_LENGTH,
          centerY - BARREL_WIDTH / 2,
          BARREL_LENGTH,
          BARREL_WIDTH,
        )
        break
    }
  }
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `pnpm exec tsc`
Expected: no output, exit code 0.

- [ ] **Step 3: Commit**

```bash
git add src/systems/render.ts
git commit -m "Add render system"
```

---

### Task 5: Game bootstrap, canvas markup, and browser verification

**Files:**
- Create: `src/game.ts`
- Modify: `src/main.ts` (currently only `import './style.css'`)
- Modify: `index.html:10` (replace `<div id="app"></div>`)
- Modify: `src/style.css` (append canvas layout rules)

**Interfaces:**
- Consumes: `World` from `src/ecs/world.ts`; `createInput` from `src/input.ts`; `System` from `src/ecs/system.ts`; `playerInputSystem`, `movementSystem`, `renderSystem` from `src/systems/`.
- Produces: `startGame(canvas: HTMLCanvasElement): void`.

- [ ] **Step 1: Create the game bootstrap and loop**

Create `src/game.ts`:

```ts
import { World } from './ecs/world.ts'
import type { System } from './ecs/system.ts'
import { createInput } from './input.ts'
import { movementSystem } from './systems/movement.ts'
import { playerInputSystem } from './systems/player-input.ts'
import { renderSystem } from './systems/render.ts'

// A backgrounded tab resumes with a huge gap; cap it so nothing teleports.
const MAX_DT = 0.1
const TANK_SIZE = 32
const TANK_SPEED = 120

export function startGame(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context is unavailable.')

  const world = new World()
  const input = createInput()

  world.spawn({
    position: {
      x: (canvas.width - TANK_SIZE) / 2,
      y: (canvas.height - TANK_SIZE) / 2,
    },
    velocity: { x: 0, y: 0 },
    facing: { direction: 'up' },
    renderable: { width: TANK_SIZE, height: TANK_SIZE, color: '#7ac74f' },
    playerControlled: { speed: TANK_SPEED },
  })

  // The one place frame order is decided.
  const systems: System[] = [playerInputSystem, movementSystem, renderSystem]

  let previous = performance.now()

  const frame = (now: number) => {
    const dt = Math.min((now - previous) / 1000, MAX_DT)
    previous = now

    const context = { world, dt, input, ctx }
    for (const system of systems) system(context)
    world.flush()

    requestAnimationFrame(frame)
  }

  requestAnimationFrame(frame)
}
```

- [ ] **Step 2: Replace the placeholder div with the canvas**

In `index.html`, replace this line:

```html
    <div id="app"></div>
```

with:

```html
    <canvas id="game" width="640" height="480"></canvas>
```

- [ ] **Step 3: Wire up the entry point**

Replace the contents of `src/main.ts` with:

```ts
import './style.css'
import { startGame } from './game.ts'

const canvas = document.querySelector<HTMLCanvasElement>('#game')
if (!canvas) throw new Error('Canvas element #game was not found in the document.')

startGame(canvas)
```

- [ ] **Step 4: Center the canvas on the page**

Append to `src/style.css`:

```css
body {
  display: grid;
  place-items: center;
  min-height: 100vh;
  background: #1c1c1c;
}

#game {
  border: 2px solid #6b6b6b;
  image-rendering: pixelated;
}
```

- [ ] **Step 5: Verify it typechecks**

Run: `pnpm exec tsc`
Expected: no output, exit code 0.

- [ ] **Step 6: Verify in the browser**

Run: `pnpm dev` and open the printed URL.
Expected: a 640×480 dark canvas centered on the page with a green 32×32 tank in the middle, its light barrel pointing up. Check each item:
1. Arrow keys move the tank up, down, left, and right; WASD does the same.
2. The barrel points the way the tank last moved.
3. Holding two direction keys moves along one axis only — never diagonally.
4. The tank stops flush against each of the four canvas edges and does not leave the canvas.
5. Releasing all keys stops the tank immediately.
6. Arrow keys do not scroll the page.
7. The browser console has no errors or warnings.

Stop the dev server when done.

- [ ] **Step 7: Verify the production build**

Run: `pnpm build`
Expected: `tsc` passes and Vite reports a successful build with no errors.

- [ ] **Step 8: Commit**

Note for the implementer: `src/main.ts` and `src/style.css` already had uncommitted user edits before this plan started, so this commit includes them. Tell the user that in your report rather than trying to separate them.

```bash
git add src/game.ts src/main.ts src/style.css index.html
git commit -m "Add game bootstrap and movable tank vertical slice"
```

---

## Done when

- `pnpm build` passes.
- The browser checklist in Task 5 Step 6 passes end to end.
- `src/ecs/` contains only `entity.ts`, `world.ts`, and `system.ts`, and no file in the project imports a runtime dependency that is not in `package.json`.
