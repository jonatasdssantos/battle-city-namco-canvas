import { describe, expect, it } from 'vitest'

import { World } from 'miniplex'
import type { Entity, GameWorld } from '../../components'
import { PowerUpSystem } from './PowerUpSystem'

function createWorld(): GameWorld {
  return new World<Entity>()
}

function addWall(
  world: GameWorld,
  position: { x: number, y: number },
  dimensions: { width: number, height: number }
) {
  return world.add({ wall: true, position, dimensions: { ...dimensions, depth: 0 } })
}

describe('PowerUpSystem.findAvailablePosition', () => {
  it('returns an unchanged position as a new object when it is already free', () => {
    const world = createWorld()
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
    const world = createWorld()
    addWall(world, { x: 10, y: 0 }, { width: 10, height: 100 })

    expect(PowerUpSystem.findAvailablePosition(
      { x: 8, y: 20 },
      { width: 5, height: 5 },
      world
    )).toEqual({ x: 5, y: 20 })
  })

  it('moves a vertical overlap across the nearest wall edge', () => {
    const world = createWorld()
    addWall(world, { x: 0, y: 10 }, { width: 100, height: 10 })

    expect(PowerUpSystem.findAvailablePosition(
      { x: 20, y: 8 },
      { width: 5, height: 5 },
      world
    )).toEqual({ x: 20, y: 5 })
  })

  it('rechecks walls after one adjustment introduces another overlap', () => {
    const world = createWorld()
    addWall(world, { x: 0, y: 0 }, { width: 10, height: 100 })
    addWall(world, { x: 12, y: 0 }, { width: 10, height: 2 })

    expect(PowerUpSystem.findAvailablePosition(
      { x: 8, y: 1 },
      { width: 4, height: 4 },
      world
    )).toEqual({ x: 10, y: 2 })
  })

  it('accepts a position that only touches a wall edge', () => {
    const world = createWorld()
    addWall(world, { x: 10, y: 10 }, { width: 10, height: 10 })

    expect(PowerUpSystem.findAvailablePosition(
      { x: 0, y: 10 },
      { width: 10, height: 10 },
      world
    )).toEqual({ x: 0, y: 10 })
  })

  it('does not mutate inputs or wall components', () => {
    const world = createWorld()
    const wall = addWall(world, { x: 10, y: 0 }, { width: 10, height: 100 })
    const position = { x: 8, y: 20 }
    const dimensions = { width: 5, height: 5 }

    const storedPositionBefore = { ...wall.position }
    const storedDimensionsBefore = { ...wall.dimensions }

    PowerUpSystem.findAvailablePosition(position, dimensions, world)

    expect(position).toEqual({ x: 8, y: 20 })
    expect(dimensions).toEqual({ width: 5, height: 5 })

    expect(wall.position).toEqual(storedPositionBefore)
    expect(wall.dimensions).toEqual(storedDimensionsBefore)
  })

  it('prefers vertical movement when axis penetrations are equal', () => {
    const world = createWorld()
    addWall(world, { x: 0, y: 0 }, { width: 20, height: 20 })

    expect(PowerUpSystem.findAvailablePosition(
      { x: 5, y: 5 },
      { width: 10, height: 10 },
      world
    )).toEqual({ x: 5, y: 20 })
  })

  it('prefers the positive direction when opposite-edge penetrations are equal', () => {
    const world = createWorld()
    addWall(world, { x: 10, y: 0 }, { width: 10, height: 100 })

    expect(PowerUpSystem.findAvailablePosition(
      { x: 13, y: 20 },
      { width: 4, height: 4 },
      world
    )).toEqual({ x: 20, y: 20 })
  })

  it('ignores wall-tagged entities with no components', () => {
    const world = createWorld()
    world.add({ wall: true })
    const position = { x: 5, y: 5 }

    const result = PowerUpSystem.findAvailablePosition(
      position,
      { width: 10, height: 10 },
      world
    )

    expect(result).toEqual(position)
    expect(result).not.toBe(position)
  })

  it('ignores wall-tagged entities with only position', () => {
    const world = createWorld()
    world.add({ wall: true, position: { x: 0, y: 0 } })
    const position = { x: 5, y: 5 }

    const result = PowerUpSystem.findAvailablePosition(
      position,
      { width: 10, height: 10 },
      world
    )

    expect(result).toEqual(position)
    expect(result).not.toBe(position)
  })

  it('returns null when conflicting walls keep the candidate trapped', () => {
    const world = createWorld()
    addWall(world, { x: 0, y: 0 }, { width: 10, height: 100 })
    addWall(world, { x: 12, y: 0 }, { width: 10, height: 100 })

    expect(PowerUpSystem.findAvailablePosition(
      { x: 9, y: 20 },
      { width: 5, height: 5 },
      world
    )).toBeNull()
  })
})
