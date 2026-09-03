import type { EntityId } from "../../../libs/ecs/entity"
import type { World } from "../../../libs/ecs/world"
import type { CollidableComponents } from "./wallSeparation"

import { Emitter } from "../../app"

export class CollisionPowerUpResolver {
  static resolve(
    powerupId: EntityId,
    _powerupComponent: CollidableComponents,
    otherCollidableId: EntityId,
    _otherCollidableComponent: CollidableComponents,
    otherTags: string[] = [],
    world?: World
  ) {
    if (!otherTags.includes('player')) return

    // Add the powerup to the player
    world?.addComponent(otherCollidableId.toString(), 'powerups', { value: [..._otherCollidableComponent.powerups.value, { type: _powerupComponent.type.value }] })

    // Remove the powerup from the world
    world?.removeComponent(powerupId.toString())
    world?.removeEntity(powerupId.toString())   

    Emitter.emit('powerup.hit', { powerupId: powerupId.toString(), playerId: otherCollidableId.toString() })
  }
}
