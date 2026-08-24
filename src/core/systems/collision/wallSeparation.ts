export type CollidableComponents = {
  position: { x: number, y: number }
  velocity?: { x: number, y: number }
  dimensions: { width: number, height: number }
}

/** Pushes a collidable back out of a wall along its shallowest axis and stops it there. */
export function separateFromWall(collidableComponent: CollidableComponents, wallComponent: CollidableComponents) {
  const collidable = collidableComponent.position
  const wall = wallComponent.position
  const collidableSize = collidableComponent.dimensions
  const wallSize = wallComponent.dimensions

  const collidableRight = collidable.x + collidableSize.width
  const collidableBottom = collidable.y + collidableSize.height
  const wallRight = wall.x + wallSize.width
  const wallBottom = wall.y + wallSize.height

  const overlapLeft = collidableRight - wall.x
  const overlapRight = wallRight - collidable.x
  const overlapTop = collidableBottom - wall.y
  const overlapBottom = wallBottom - collidable.y

  const minOverlapX = Math.min(overlapLeft, overlapRight)
  const minOverlapY = Math.min(overlapTop, overlapBottom)

  if (minOverlapX < minOverlapY) {
    collidable.x += overlapLeft < overlapRight ? -overlapLeft : overlapRight

    if (collidableComponent.velocity) {
      collidableComponent.velocity.x = 0
    }
  } else {
    collidable.y += overlapTop < overlapBottom ? -overlapTop : overlapBottom

    if (collidableComponent.velocity) {
      collidableComponent.velocity.y = 0
    }
  }
}
