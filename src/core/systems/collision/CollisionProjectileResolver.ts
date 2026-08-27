import type { EntityId } from "../../../libs/ecs/entity"
import type { World } from "../../../libs/ecs/world"

import type { CollidableComponents } from "./wallSeparation"

import { Emitter } from "../../app"

export class CollisionProjectileResolver {
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
      world?.removeComponent(projectileId.toString(), 'collidable')
      world?.removeComponent(otherCollidableId.toString(), 'collidable')

      world?.removeEntity(projectileId.toString())
      world?.removeEntity(otherCollidableId.toString())

      Emitter.emit('enemy.death', { enemyId: otherCollidableId.toString() })
      Emitter.emit('projectile.hit', { projectileId: projectileId.toString(), targetId: otherCollidableId.toString() })
    }

    if (otherTags.includes('player')) {
      // world?.removeEntity(_projectileComponent.entityId)
    }

    if (otherTags.includes('wall')) {
      // world?.removeEntity(_projectileComponent.entityId)
    }
  }
}
