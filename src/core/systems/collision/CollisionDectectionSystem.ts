import type { Collidable, GameWorld } from "../../../components"

import { CollisionPlayerResolver } from "./CollisionPlayerResolver"
import { CollisionEnemyResolver } from "./CollisionEnemyResolver"
import { CollisionProjectileResolver } from "./CollisionProjectileResolver"
import { CollisionPowerUpResolver } from "./CollisionPowerUpResolver"

export class CollisionDetectionSystem {

  static isColliding(collidable: Collidable, otherCollidable: Collidable) {
    const collidableX = collidable.position.x + collidable.dimensions.width
    const collidableY = collidable.position.y + collidable.dimensions.height
    
    const otherCollidableX = otherCollidable.position.x + otherCollidable.dimensions.width
    const otherCollidableY = otherCollidable.position.y + otherCollidable.dimensions.height
    
    return collidable.position.x < otherCollidableX &&
      collidableX > otherCollidable.position.x &&
      collidable.position.y < otherCollidableY &&
      collidableY > otherCollidable.position.y
  }

  execute(world: GameWorld) {
    const collidables = world.with('collidable', 'position', 'dimensions')

    for (const collidable of collidables) {
      for (const other of collidables) {
        // A resolver may have removed this collidable from the world
        if (!world.has(collidable)) break

        if (collidable === other) continue

        if (!CollisionDetectionSystem.isColliding(collidable, other)) continue

        if (collidable.player) {
          CollisionPlayerResolver.resolve(collidable, other)
        }

        if (collidable.enemy) {
          CollisionEnemyResolver.resolve(collidable, other)
        }

        if (collidable.projectile) {
          CollisionProjectileResolver.resolve(collidable, other, world)
        }

        if (collidable.powerup) {
          CollisionPowerUpResolver.resolve(collidable, other, world)
        }
      }
    }
  }
}
