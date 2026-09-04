# Power-up Wall-safe Position Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pure `PowerUpSystem.findAvailablePosition` method that returns a wall-free power-up position or `null`.

**Architecture:** The method reads entities tagged `wall`, builds their rectangle components, and adjusts a cloned candidate across the shallowest collision axis. It repeats bounded passes to resolve collisions introduced by earlier adjustments without mutating caller or ECS state.

**Tech Stack:** TypeScript 6, Vitest, existing ECS `World`

## Global Constraints

- Use strict AABB overlap semantics; touching edges is valid.
- Do not mutate the input position, dimensions, wall components, or world state.
- Allow `max(1, wallCount * 4)` complete adjustment passes.
- Match `separateFromWall` tie-breaking: equal axis penetration chooses vertical movement, and equal opposite-edge penetration chooses the positive direction.
- Return `null` when the bounded passes cannot produce a wall-free rectangle.
- Do not integrate the method into `App.initPowerupEntity` in this change.

---

### Task 1: Wall-safe power-up position finder

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `src/core/systems/PowerUpSystem.ts`
- Create: `src/core/systems/PowerUpSystem.test.ts`

**Interfaces:**
- Consumes: `World.getEntitiesByTag(tag)` and `World.getComponents(entityId)`
- Produces: `PowerUpSystem.findAvailablePosition(position, dimensions, world): { x: number, y: number } | null`

- [ ] **Step 1: Install the test runner and add the test script**

Run:

```bash
pnpm add -D vitest
```

Add this script to `package.json`:

```json
"test": "vitest run"
```

Expected: `vitest` is added to `devDependencies`, `pnpm-lock.yaml` is updated, and `pnpm test` is available.

- [ ] **Step 2: Write the failing behavior tests**

Create `src/core/systems/PowerUpSystem.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { World } from '../../libs/ecs/world'
import { PowerUpSystem } from './PowerUpSystem'

function addWall(
  world: World,
  position: { x: number, y: number },
  dimensions: { width: number, height: number }
) {
  const wallId = world.addEntity('wall', true, ['wall'])
  world.addComponent(wallId, 'position', position)
  world.addComponent(wallId, 'dimensions', dimensions)
  return wallId
}

describe('PowerUpSystem.findAvailablePosition', () => {
  it('returns an unchanged position as a new object when it is already free', () => {
    const world = new World()
    const position = { x: 20, y: 30 }

    const result = PowerUpSystem.findAvailablePosition(
      position,
      { width: 10, height: 10 },
      world
    )

    expect(result).toEqual(position)
    expect(result).not.toBe(position)
  })

  it('moves a horizontal overlap across the nearest wall edge', () => {
    const world = new World()
    addWall(world, { x: 10, y: 0 }, { width: 10, height: 100 })

    expect(PowerUpSystem.findAvailablePosition(
      { x: 8, y: 20 },
      { width: 5, height: 5 },
      world
    )).toEqual({ x: 5, y: 20 })
  })

  it('moves a vertical overlap across the nearest wall edge', () => {
    const world = new World()
    addWall(world, { x: 0, y: 10 }, { width: 100, height: 10 })

    expect(PowerUpSystem.findAvailablePosition(
      { x: 20, y: 8 },
      { width: 5, height: 5 },
      world
    )).toEqual({ x: 20, y: 5 })
  })

  it('rechecks walls after one adjustment introduces another overlap', () => {
    const world = new World()
    addWall(world, { x: 0, y: 0 }, { width: 10, height: 100 })
    addWall(world, { x: 12, y: 0 }, { width: 10, height: 2 })

    expect(PowerUpSystem.findAvailablePosition(
      { x: 8, y: 1 },
      { width: 4, height: 4 },
      world
    )).toEqual({ x: 10, y: 2 })
  })

  it('accepts a position that only touches a wall edge', () => {
    const world = new World()
    addWall(world, { x: 10, y: 10 }, { width: 10, height: 10 })

    expect(PowerUpSystem.findAvailablePosition(
      { x: 0, y: 10 },
      { width: 10, height: 10 },
      world
    )).toEqual({ x: 0, y: 10 })
  })

  it('does not mutate inputs or wall components', () => {
    const world = new World()
    const wallPosition = { x: 10, y: 0 }
    const wallDimensions = { width: 10, height: 100 }
    addWall(world, wallPosition, wallDimensions)
    const position = { x: 8, y: 20 }
    const dimensions = { width: 5, height: 5 }

    PowerUpSystem.findAvailablePosition(position, dimensions, world)

    expect(position).toEqual({ x: 8, y: 20 })
    expect(dimensions).toEqual({ width: 5, height: 5 })
    expect(wallPosition).toEqual({ x: 10, y: 0 })
    expect(wallDimensions).toEqual({ width: 10, height: 100 })
  })

  it('returns null when conflicting walls keep the candidate trapped', () => {
    const world = new World()
    addWall(world, { x: 0, y: 0 }, { width: 10, height: 100 })
    addWall(world, { x: 12, y: 0 }, { width: 10, height: 100 })

    expect(PowerUpSystem.findAvailablePosition(
      { x: 9, y: 20 },
      { width: 5, height: 5 },
      world
    )).toBeNull()
  })
})
```

- [ ] **Step 3: Run the focused test and verify RED**

Run:

```bash
pnpm test -- src/core/systems/PowerUpSystem.test.ts
```

Expected: FAIL because `PowerUpSystem.findAvailablePosition` does not exist.

- [ ] **Step 4: Implement the minimal position finder**

Add these types above `PowerUpSystem` in `src/core/systems/PowerUpSystem.ts`:

```ts
type Position = { x: number, y: number }
type Dimensions = { width: number, height: number }
type Rectangle = { position: Position, dimensions: Dimensions }
```

Add this method to `PowerUpSystem`:

```ts
static findAvailablePosition(
  position: Position,
  dimensions: Dimensions,
  world: World
): Position | null {
  const walls = world.getEntitiesByTag('wall')
    .map(({ id }) => world.getComponents(id))
    .filter((components): components is Rectangle =>
      components !== null &&
      components.position !== undefined &&
      components.dimensions !== undefined
    )
  const candidate = { ...position }
  const maxPasses = Math.max(1, walls.length * 4)

  const isColliding = (wall: Rectangle) =>
    candidate.x < wall.position.x + wall.dimensions.width &&
    candidate.x + dimensions.width > wall.position.x &&
    candidate.y < wall.position.y + wall.dimensions.height &&
    candidate.y + dimensions.height > wall.position.y

  for (let pass = 0; pass < maxPasses; pass += 1) {
    let adjusted = false

    for (const wall of walls) {
      if (!isColliding(wall)) continue

      const overlapLeft = candidate.x + dimensions.width - wall.position.x
      const overlapRight = wall.position.x + wall.dimensions.width - candidate.x
      const overlapTop = candidate.y + dimensions.height - wall.position.y
      const overlapBottom = wall.position.y + wall.dimensions.height - candidate.y
      const minOverlapX = Math.min(overlapLeft, overlapRight)
      const minOverlapY = Math.min(overlapTop, overlapBottom)

      if (minOverlapX < minOverlapY) {
        candidate.x += overlapLeft < overlapRight ? -overlapLeft : overlapRight
      } else {
        candidate.y += overlapTop < overlapBottom ? -overlapTop : overlapBottom
      }

      adjusted = true
    }

    if (!adjusted) return candidate
  }

  return walls.some(isColliding) ? null : candidate
}
```

- [ ] **Step 5: Run the focused tests and verify GREEN**

Run:

```bash
pnpm test -- src/core/systems/PowerUpSystem.test.ts
```

Expected: all seven tests PASS with no warnings or errors.

- [ ] **Step 6: Run full verification**

Run:

```bash
pnpm test
pnpm build
```

Expected: all tests PASS and the TypeScript/Vite production build succeeds.

- [ ] **Step 7: Commit the implementation without absorbing unrelated work**

Run:

```bash
git add package.json pnpm-lock.yaml src/core/systems/PowerUpSystem.ts src/core/systems/PowerUpSystem.test.ts
git commit -m "feat: find wall-safe powerup positions"
```

Before committing, inspect the staged diff and confirm the pre-existing `handlePowerupSpawning` edit is not unintentionally attributed to this implementation. If it cannot be separated safely, leave the implementation uncommitted and report that constraint.
