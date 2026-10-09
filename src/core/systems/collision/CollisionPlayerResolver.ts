import type { Collidable } from "../../../components"

import { separateFromWall } from "./wallSeparation"

export class CollisionPlayerResolver {
  static resolve(player: Collidable, other: Collidable) {
    if (!other.wall) return

    separateFromWall(player, other)
  }
}
