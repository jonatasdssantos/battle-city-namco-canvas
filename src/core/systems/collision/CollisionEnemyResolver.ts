import type { Collidable } from "../../../components"

import { separateFromWall } from "./wallSeparation"

export class CollisionEnemyResolver {
  static resolve(enemy: Collidable, other: Collidable) {
    if (!other.wall) return

    separateFromWall(enemy, other)
  }
}
