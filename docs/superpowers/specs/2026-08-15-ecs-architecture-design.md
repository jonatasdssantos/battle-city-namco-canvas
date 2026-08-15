# ECS Architecture — Design

Date: 2026-08-15
Project: battle-city-namco-canvas

## Goal

Build a small, hand-rolled ECS (Entity Component System) core for the Battle City
canvas game, plus a vertical slice that proves it works: a tank the player moves
around the canvas with the keyboard.

The core must stay small enough to read in one sitting. It is the foundation for
later game systems (bullets, collision, tilemap, enemy AI), but none of those are
in scope here.

## Decisions

| Decision | Choice |
| --- | --- |
| Scope | ECS core + movable-tank vertical slice |
| Dependencies | None; hand-rolled |
| Data layout | Entity-as-object with typed queries |
| Tests | No test framework; manual browser verification + `tsc` |

Rejected alternatives:

- **Component stores keyed by type** (`Map<EntityId, Component>` per component,
  numeric entity ids). More canonical and queries scale with matches instead of
  total entities, but every access reads `positions.get(id)!` and typed
  multi-component queries need generic plumbing. No practical gain at a few dozen
  entities.
- **Archetypes with bitmasks and typed arrays.** The right answer at tens of
  thousands of entities. Here the cache-friendly layout and bitmask matching would
  dominate the codebase and add friction to every new component.

Because systems only reach the world through `query`, switching to either layout
later would not change system code.

## Architecture

### Core: `src/ecs/`

**`entity.ts`** — derives the entity types from the `Components` registry defined in
the game layer (`src/components.ts`):

```ts
import type { Components } from '../components.ts'

export type EntityId = number

export type Entity = { id: EntityId } & Partial<Components>

export type With<K extends keyof Components> =
  { id: EntityId } & Partial<Components> & Required<Pick<Components, K>>
```

Adding a component type is one line in the `Components` interface.
`With<'position' | 'velocity'>` is an entity where those two are required, so
systems access `e.position.x` without non-null assertions.

The core importing the game's registry means this ECS is specific to this game
rather than a reusable package. The alternative — making `World`, `Entity` and
`With` generic over a component map — would thread a `<Components>` parameter
through every system signature for a genericity nothing here needs. One concrete
registry, imported directly, is the simpler trade.

**`world.ts`** — a `World` class owning a flat array of entities and a next-id
counter. Fields are declared explicitly (no constructor parameter properties; see
Constraints).

- `spawn(components: Partial<Components>): Entity` — assigns the next id, pushes,
  returns the entity.
- `destroy(entity: Entity): void` — adds the id to a pending-removal set. Calling
  it on an already-pending or unknown entity is a no-op.
- `query<K extends keyof Components>(...keys: K[]): With<K>[]` — returns entities
  that have every key and are not pending removal.
- `flush(): void` — removes pending entities from the array and clears the set.

Destruction is deferred so a system can never remove an entity that another system
is mid-iteration over. Queries allocate a fresh array per call; at this entity
count that is not worth caching.

**`system.ts`** — a system is a plain function, not a class:

```ts
export interface SystemContext {
  world: World
  dt: number
  input: Input
  ctx: CanvasRenderingContext2D
}

export type System = (context: SystemContext) => void
```

No base class, no registration decorators. The game layer owns the ordered array.

### Game layer: `src/`

- **`components.ts`** — component shapes (`Position`, `Velocity`, `Renderable`,
  `PlayerControlled`, `Facing`) and the `Components` registry interface that maps
  each component name to its shape.
- **`input.ts`** — attaches `keydown`/`keyup` listeners to the window and exposes
  the set of currently pressed keys. Input is a single global source, so it travels
  through the system context rather than living in a component.
- **`systems/player-input.ts`** — translates pressed keys into the player's velocity
  and facing. Named for the player to keep it distinct from `input.ts`, which owns
  the raw keyboard state.
- **`systems/movement.ts`** — integrates `position += velocity * dt` and clamps to
  the canvas bounds.
- **`systems/render.ts`** — clears the canvas, then draws every entity with
  `position` and `renderable`.
- **`game.ts`** — resolves the canvas and 2D context, creates the world, spawns the
  player, declares the ordered system array, and runs the frame loop.
- **`main.ts`** — imports the stylesheet and starts the game.

## Frame flow

`requestAnimationFrame` produces `dt` in seconds, clamped to a 100 ms ceiling so a
backgrounded tab does not resume with a step large enough to move entities through
obstacles. Each frame then runs the systems in array order — input, movement,
render — and calls `world.flush()` last.

Execution order lives in exactly one place: the system array in `game.ts`.

## Vertical slice

A 640×480 canvas on a dark background holding one player tank:

- 32×32 green rect plus a short barrel line drawn toward its facing direction.
- Arrow keys and WASD move it in four directions, one axis at a time (no
  diagonals), matching the original game's movement.
- Movement is clamped to the canvas edges.

## Error handling

Bootstrap throws an explanatory error if the canvas element or its 2D context
cannot be obtained — a missing canvas is a programming error, not a runtime
condition to recover from. Systems do not catch errors, so bugs surface in the
console instead of being silently swallowed. `destroy` on an unknown entity is a
no-op.

## Constraints from the existing `tsconfig.json`

- `erasableSyntaxOnly` forbids `enum` and constructor parameter properties.
  Directions are a string union; `World` declares its fields explicitly.
- `verbatimModuleSyntax` requires `import type` for type-only imports.
- `noUnusedLocals` and `noUnusedParameters` are on, so no placeholder bindings.

## Verification

No test framework, by choice. Verification is:

1. `pnpm dev` — tank renders, moves in all four directions, stops at every edge,
   console is clean.
2. `pnpm build` — `tsc` passes with no errors.

## Out of scope

Bullets, collision, tilemap and walls, enemy AI, spawners, powerups, score, sound,
sprite atlas rendering, multiple levels.
