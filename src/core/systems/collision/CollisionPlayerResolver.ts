import { separateFromWall, type CollidableComponents } from "./wallSeparation"

export class CollisionPlayerResolver {
  static resolve(
    playerComponent: CollidableComponents,
    otherCollidableComponent: CollidableComponents,
    otherTags: string[] = []
  ) {
    if (!otherTags.includes('wall')) return

    separateFromWall(playerComponent, otherCollidableComponent)
  }
}
