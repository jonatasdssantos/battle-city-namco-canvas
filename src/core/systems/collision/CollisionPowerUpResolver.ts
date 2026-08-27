import type { EntityId } from "../../../libs/ecs/entity"
import type { World } from "../../../libs/ecs/world"

import type { CollidableComponents } from "./wallSeparation"

export class CollisionPowerUpResolver {
  static resolve(
    powerupId: EntityId,
    _powerupComponent: CollidableComponents,
    otherCollidableId: EntityId,
    _otherCollidableComponent: CollidableComponents,
    otherTags: string[] = [],
    world?: World
  ) {
    if (!otherTags.includes('wall')) return
    
  }
}
