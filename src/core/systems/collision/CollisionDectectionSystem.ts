//** Todo: Implement collision detection for player and enemies */

import { World } from "../../../libs/ecs/world"

import { CollisionPlayerResolver } from "./CollisionPlayerResolver"
import { CollisionEnemyResolver } from "./CollisionEnemyResolver"
import { CollisionProjectileResolver } from "./CollisionProjectileResolver"
import { CollisionPowerUpResolver } from "./CollisionPowerUpResolver"
import type { CollidableComponents } from "./wallSeparation"
import type { EntityId } from "../../../libs/ecs/entity"

export class CollisionDetectionSystem {

  static isColliding(collidable: { position: { x: number, y: number }, dimensions: { width: number, height: number } }, otherCollidable: { position: { x: number, y: number }, dimensions: { width: number, height: number } }) {
    const collidableX = collidable.position.x + collidable.dimensions.width
    const collidableY = collidable.position.y + collidable.dimensions.height
    
    const otherCollidableX = otherCollidable.position.x + otherCollidable.dimensions.width
    const otherCollidableY = otherCollidable.position.y + otherCollidable.dimensions.height
    
    return collidable.position.x < otherCollidableX &&
      collidableX > otherCollidable.position.x &&
      collidable.position.y < otherCollidableY &&
      collidableY > otherCollidable.position.y
  }

  execute(world: World) {
    const collidables = world.getEntitiesByTag('collidable')

    collidables.forEach(collidable => {
      const collidableComponent = world.getComponents(collidable.id)

      collidables.forEach(otherCollidable => {
        if (collidable.id === otherCollidable.id) return

        const otherCollidableComponent = world.getComponents(otherCollidable.id)

        if (!otherCollidableComponent || !collidableComponent) return

        const collidablePosition = { x: collidableComponent.position.x, y: collidableComponent.position.y }
        const collidableDimensions = { width: collidableComponent.dimensions.width, height: collidableComponent.dimensions.height }

        const otherCollidablePosition = { x: otherCollidableComponent.position.x, y: otherCollidableComponent.position.y }
        const otherCollidableDimensions = { width: otherCollidableComponent.dimensions.width, height: otherCollidableComponent.dimensions.height }

        const isColliding = CollisionDetectionSystem.isColliding(
          {
            position: collidablePosition, 
            dimensions: collidableDimensions }, 
          { 
            position: otherCollidablePosition, 
            dimensions: otherCollidableDimensions 
          }
        )

        if (isColliding) {
          if (collidable.tags.includes('player')) {
            CollisionPlayerResolver.resolve(
              collidable.id as unknown as EntityId,
              collidableComponent as CollidableComponents,
              otherCollidable.id as unknown as EntityId,
              otherCollidableComponent as CollidableComponents,
              otherCollidable.tags,
              world
            )
          }

          if (collidable.tags.includes('enemy')) {
            CollisionEnemyResolver.resolve(
              collidable.id as unknown as EntityId,
              collidableComponent as CollidableComponents,
              otherCollidable.id as unknown as EntityId,
              otherCollidableComponent as CollidableComponents,
              otherCollidable.tags,
              world
            )
          }

          if (collidable.tags.includes('projectile')) {
            CollisionProjectileResolver.resolve(
              collidable.id as unknown as EntityId,
              collidableComponent as CollidableComponents,
              otherCollidable.id as unknown as EntityId,
              otherCollidableComponent as CollidableComponents,
              otherCollidable.tags,
              world
            )
          }

          if (collidable.tags.includes('powerup')) {
            CollisionPowerUpResolver.resolve(
              collidable.id as unknown as EntityId,
              collidableComponent as CollidableComponents,
              otherCollidable.id as unknown as EntityId,
              otherCollidableComponent as CollidableComponents,
              otherCollidable.tags,
              world
            )
          }
        }
      })
    })
  }
}