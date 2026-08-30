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
    if (!otherTags.includes('enemy')) return

    Emitter.emit('powerup.hit', { powerupId: powerupId.toString(), playerId: otherCollidableId.toString() })
  }
}
