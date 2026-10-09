import type { Collidable, GameWorld } from "../../../components"

import { Emitter } from "../../app"

export class CollisionPowerUpResolver {
  static resolve(powerup: Collidable, other: Collidable, world: GameWorld) {
    if (!other.player) return

    // Add the powerup to the player
    if (powerup.powerupType) {
      other.powerups = [...(other.powerups ?? []), { type: powerup.powerupType }]
    }

    // Remove the powerup from the world
    world.remove(powerup)

    Emitter.emit('powerup.hit', { powerup, player: other })
  }
}
