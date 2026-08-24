import type { World } from "../../libs/ecs/world";

export class MovementSystem {
  execute(world: World) {
    const movables = world.getEntitiesByTag('movable')

    movables.forEach(movable => {
      // Projectiles integrate direction * velocity in the ProjectileSystem instead
      if (movable.tags.includes('projectile')) return

      const { position, velocity } = world.getComponents(movable.id)

      position.x += velocity.x
      position.y += velocity.y

      world.addComponent(movable.id, 'position', position)
    })
  }
}
