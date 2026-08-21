//** Todo: Implement collision detection for player and enemies */

import { World } from "../../../libs/ecs/world"

export class CollisionDetectionSystem {

  static isColliding(collidable: { position: { x: number, y: number }, dimensions: { width: number, height: number } }, otherCollidable: { position: { x: number, y: number }, dimensions: { width: number, height: number } }) {
    return collidable.position.x < otherCollidable.position.x + otherCollidable.dimensions.width &&
      collidable.position.x + collidable.dimensions.width > otherCollidable.position.x &&
      collidable.position.y < otherCollidable.position.y + otherCollidable.dimensions.height &&
      collidable.position.y + collidable.dimensions.height > otherCollidable.position.y
  }

  execute(world: World) {
    const collidables = world.getEntitiesByTag('collidable')

    collidables.forEach(collidable => {
      const collidableComponent = world.getComponents(collidable.id)

      collidables.forEach(otherCollidable => {
        if (collidable.id === otherCollidable.id) return

        const otherCollidableComponent = world.getComponents(otherCollidable.id)

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
          console.log('Collision detected')
        }
      })
    })
  }
}