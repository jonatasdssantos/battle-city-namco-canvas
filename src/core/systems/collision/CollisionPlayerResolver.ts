import type { EntityId } from "../../../libs/ecs/entity"
import type { World } from "../../../libs/ecs/world"

import { separateFromWall, type CollidableComponents } from "./wallSeparation"

export class CollisionPlayerResolver {
  static resolve(
    playerId: EntityId,
    playerComponent: CollidableComponents,
    otherCollidableId: EntityId,
    otherCollidableComponent: CollidableComponents,
    otherTags: string[] = [],
    world?: World
  ) {
    if (!otherTags.includes('wall')) return

    separateFromWall(playerComponent, otherCollidableComponent)
  }
}
