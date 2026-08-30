import type { EntityId } from "../../../libs/ecs/entity"
import type { World } from "../../../libs/ecs/world"

import type { CollidableComponents } from "./wallSeparation"

import { Emitter } from "../../app"

export class CollisionProjectileResolver {
  static removeProjectile(projectileId: EntityId, world?: World) {
    world?.removeComponent(projectileId.toString(), 'collidable')
    world?.removeEntity(projectileId.toString())
  }

  static removeCollidable(otherCollidableId: EntityId, world?: World) {
    world?.removeComponent(otherCollidableId.toString(), 'collidable')
    world?.removeEntity(otherCollidableId.toString())
  }

  static resolve(
    projectileId: EntityId,
    _projectileComponent: CollidableComponents,
    otherCollidableId: EntityId,
    _otherCollidableComponent: CollidableComponents,
    otherTags: string[] = [], 
    world?: World
  ) {
    //** Prevent projectile from colliding with its own owner */
    if (_projectileComponent.owner.value === otherCollidableId) return;

    if (otherTags.includes('enemy') && !_projectileComponent.owner.value.match(/enemy/i)) {
      this.removeProjectile(projectileId, world)

      Emitter.emit('enemy.hit', { enemyId: otherCollidableId.toString() })
      Emitter.emit('projectile.hit', { projectileId: projectileId.toString(), targetId: otherCollidableId.toString() })
    
      const enemyHealth = _otherCollidableComponent.health.value
      const projectileDamage = _projectileComponent.damage.value

      const newHealth = Math.max(enemyHealth - projectileDamage, 0)

      world?.addComponent(otherCollidableId.toString(), 'health', { value: newHealth })

      if (newHealth <= 0) {
        Emitter.emit('enemy.death', { enemyId: otherCollidableId.toString() })
        this.removeCollidable(otherCollidableId, world)
      }
    }

    if (otherTags.includes('player')) {
      Emitter.emit('player.hit', { playerId: otherCollidableId.toString() })
      Emitter.emit('player.death', { playerId: otherCollidableId.toString() })

      Emitter.emit('projectile.hit', { projectileId: projectileId.toString(), targetId: otherCollidableId.toString() })
    }

    if (otherTags.includes('wall')) {
      world?.removeComponent(projectileId.toString(), 'collidable')

      world?.removeEntity(projectileId.toString())

      Emitter.emit('projectile.hit', { projectileId: projectileId.toString(), targetId: otherCollidableId.toString() })
    }
  }
}
