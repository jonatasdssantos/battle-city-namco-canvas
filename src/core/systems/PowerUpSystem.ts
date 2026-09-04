import type { World } from "../../libs/ecs/world"
import { Emitter } from "../app"

type Position = { x: number, y: number }
type Dimensions = { width: number, height: number }
type Rectangle = { position: Position, dimensions: Dimensions }

export class PowerUpSystem {

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

  static removePowerup(powerupId: string, world: World) {
    world.removeComponent(powerupId.toString())
    world.removeEntity(powerupId)
  }

  static handlePowerupExpiration(powerupId: string, world: World) {
    PowerUpSystem.removePowerup(powerupId, world)

    Emitter.emit('powerup.expired', { powerupId: powerupId.toString() })
  }

  execute(world: World) {
    // WIP: Loop powerup entities and handle their expiration
    // WIP: Loop player entities and handle their powerups
    const powerups = world.getEntitiesByTag('powerup')

    powerups.forEach(powerup => {
      const powerupComponent = world.getComponents(powerup.id)

      const { type, durationOnMap, expired, pickedUp, owner } = powerupComponent

      //** Compute the duration on map */
      if (!pickedUp.value) {
        const dur = Math.max(durationOnMap.value - 0.05, 0)

        world.addComponent(powerup.id.toString(), 'durationOnMap', { value: dur })
      }

      //** Handle the powerup expiration */
      if (durationOnMap.value <= 0 && !pickedUp.value) {
        PowerUpSystem.handlePowerupExpiration(powerup.id.toString(), world)
      }
    })
  }
}