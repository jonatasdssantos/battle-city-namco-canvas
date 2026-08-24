import { separateFromWall, type CollidableComponents } from "./wallSeparation"

export class CollisionEnemyResolver {
  static resolve(
    enemyComponent: CollidableComponents,
    otherCollidableComponent: CollidableComponents,
    otherTags: string[] = []
  ) {
    if (!otherTags.includes('wall')) return

    separateFromWall(enemyComponent, otherCollidableComponent)
  }
}
