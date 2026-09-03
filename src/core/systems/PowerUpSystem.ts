import type { World } from "../../libs/ecs/world"
import { Emitter } from "../app"

export class PowerUpSystem {

  static removePowerup(powerupId: string, world: World) {
    world.removeComponent(powerupId, 'powerup')
    world.removeEntity(powerupId)
  }

  static handlePowerupExpiration(powerupId: string, world: World) {
    world?.addComponent(powerupId.toString(), 'expired', { value: true })
    this.removePowerup(powerupId, world)

    Emitter.emit('powerup.expired', { powerupId: powerupId.toString() })
  }

  execute(world: World) {
    // WIP: Loop powerup entities and handle their expiration
    // WIP: Loop player entities and handle their powerups
  }
}