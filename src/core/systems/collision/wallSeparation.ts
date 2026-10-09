import type { Collidable } from "../../../components"

/** Pushes a collidable back out of a wall along its shallowest axis and stops it there. */
export function separateFromWall(collidableEntity: Collidable, wallEntity: Collidable) {
  const collidable = collidableEntity.position
  const wall = wallEntity.position
  const collidableSize = collidableEntity.dimensions
  const wallSize = wallEntity.dimensions

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

    if (collidableEntity.velocity) {
      collidableEntity.velocity.x = 0
    }
  } else {
    collidable.y += overlapTop < overlapBottom ? -overlapTop : overlapBottom

    if (collidableEntity.velocity) {
      collidableEntity.velocity.y = 0
    }
  }
}
