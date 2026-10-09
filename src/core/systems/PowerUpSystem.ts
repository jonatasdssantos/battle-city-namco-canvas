import type { Entity, GameWorld } from "../../components"
import { Emitter } from "../app"

type Position = { x: number, y: number }
type Dimensions = { width: number, height: number }

export class PowerUpSystem {

  static findAvailablePosition(
    position: Position,
    dimensions: Dimensions,
    world: GameWorld
  ): Position | null {
    const walls = world.with('wall', 'position', 'dimensions').entities
    const candidate = { ...position }
    const maxPasses = Math.max(1, walls.length * 4)

    const isColliding = (wall: (typeof walls)[number]) =>
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

  static handlePowerupExpiration(powerup: Entity, world: GameWorld) {
    world.remove(powerup)

    Emitter.emit('powerup.expired', { powerup })
  }

  execute(world: GameWorld) {
    // WIP: Loop player entities and handle their powerups
    const powerups = world.with('powerup', 'durationOnMap')

    for (const powerup of powerups) {
      if (powerup.pickedUp) continue

      //** Compute the duration on map */
      powerup.durationOnMap = Math.max(powerup.durationOnMap - 0.05, 0)

      //** Handle the powerup expiration */
      if (powerup.durationOnMap <= 0) {
        PowerUpSystem.handlePowerupExpiration(powerup, world)
      }
    }
  }
}
