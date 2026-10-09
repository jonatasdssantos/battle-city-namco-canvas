import type { Collidable, Entity, GameWorld } from "../../../components"

import { Emitter } from "../../app"

export class CollisionProjectileResolver {
  static reduceEntityHealth(entity: Entity, damage: number) {
    entity.health = Math.max((entity.health ?? 0) - damage, 0)

    return entity.health
  }

  static resolve(projectile: Collidable, other: Collidable, world: GameWorld) {
    //** Prevent projectile from colliding with its own owner */
    if (projectile.owner === other) return

    const damage = projectile.damage ?? 0

    if (other.enemy && !projectile.owner?.enemy) {
      world.remove(projectile)

      Emitter.emit('enemy.hit', { enemy: other })
      Emitter.emit('projectile.hit', { projectile, target: other })

      if (this.reduceEntityHealth(other, damage) <= 0) {
        Emitter.emit('enemy.death', { enemy: other })
        world.remove(other)
      }
    }

    if (other.player) {
      world.remove(projectile)

      Emitter.emit('player.hit', { player: other })
      Emitter.emit('projectile.hit', { projectile, target: other })

      if (this.reduceEntityHealth(other, damage) <= 0) {
        Emitter.emit('player.death', { player: other })
        world.remove(other)
      }
    }

    if (other.wall) {
      world.remove(projectile)

      Emitter.emit('projectile.hit', { projectile, target: other })
    }
  }
}
