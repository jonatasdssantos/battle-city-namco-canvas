export type CollidableComponents = {
  position: { x: number, y: number }
  velocity?: { x: number, y: number }
  dimensions: { width: number, height: number }
}

export class CollisionPlayerResolver {
  static resolve(
    playerComponent: CollidableComponents,
    otherCollidableComponent: CollidableComponents,
    otherTags: string[] = []
  ) {
    if (!otherTags.includes('wall')) return

    const player = playerComponent.position
    const wall = otherCollidableComponent.position
    const playerSize = playerComponent.dimensions
    const wallSize = otherCollidableComponent.dimensions

    const playerRight = player.x + playerSize.width
    const playerBottom = player.y + playerSize.height
    const wallRight = wall.x + wallSize.width
    const wallBottom = wall.y + wallSize.height

    const overlapLeft = playerRight - wall.x
    const overlapRight = wallRight - player.x
    const overlapTop = playerBottom - wall.y
    const overlapBottom = wallBottom - player.y

    const minOverlapX = Math.min(overlapLeft, overlapRight)
    const minOverlapY = Math.min(overlapTop, overlapBottom)

    if (minOverlapX < minOverlapY) {
      player.x += overlapLeft < overlapRight ? -overlapLeft : overlapRight

      if (playerComponent.velocity) {
        playerComponent.velocity.x = 0
      }
    } else {
      player.y += overlapTop < overlapBottom ? -overlapTop : overlapBottom

      if (playerComponent.velocity) {
        playerComponent.velocity.y = 0
      }
    }
  }
}