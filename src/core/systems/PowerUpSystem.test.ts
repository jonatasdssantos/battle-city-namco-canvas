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
    const wallId = addWall(world, wallPosition, wallDimensions)
    const position = { x: 8, y: 20 }
    const dimensions = { width: 5, height: 5 }

    const wallBefore = world.getComponents(wallId)!
    const storedPositionBefore = { ...wallBefore.position }
    const storedDimensionsBefore = { ...wallBefore.dimensions }

    PowerUpSystem.findAvailablePosition(position, dimensions, world)

    expect(position).toEqual({ x: 8, y: 20 })
    expect(dimensions).toEqual({ width: 5, height: 5 })

    const wallAfter = world.getComponents(wallId)!
    expect(wallAfter.position).toEqual(storedPositionBefore)
    expect(wallAfter.dimensions).toEqual(storedDimensionsBefore)
  })

  it('prefers vertical movement when axis penetrations are equal', () => {
    const world = new World()
    addWall(world, { x: 0, y: 0 }, { width: 20, height: 20 })

    expect(PowerUpSystem.findAvailablePosition(
      { x: 5, y: 5 },
      { width: 10, height: 10 },
      world
    )).toEqual({ x: 5, y: 20 })
  })

  it('prefers the positive direction when opposite-edge penetrations are equal', () => {
    const world = new World()
    addWall(world, { x: 10, y: 0 }, { width: 10, height: 100 })

    expect(PowerUpSystem.findAvailablePosition(
      { x: 13, y: 20 },
      { width: 4, height: 4 },
      world
    )).toEqual({ x: 20, y: 20 })
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
