import type { EntityId } from "../../../libs/ecs/entity"
import type { World } from "../../../libs/ecs/world"

import { separateFromWall, type CollidableComponents } from "./wallSeparation"

export class CollisionEnemyResolver {
  static resolve(
    enemyId: EntityId,
    enemyComponent: CollidableComponents,
    otherCollidableId: EntityId,
    otherCollidableComponent: CollidableComponents,
    otherTags: string[] = [],
    world?: World
  ) {
    if (!otherTags.includes('wall')) return

    separateFromWall(enemyComponent, otherCollidableComponent)
  }
}
