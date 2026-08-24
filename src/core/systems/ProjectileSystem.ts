import type { World } from "../../libs/ecs/world"

import { isInsideViewport } from "../viewport"

export class ProjectileSystem {
  execute(world: World) {
    const projectiles = world.getEntitiesByTag('projectile')

    projectiles.forEach(projectile => {
      const projectileComponent = world.getComponents(projectile.id)
      
      const position = projectileComponent.position
      const direction = projectileComponent.direction
      const velocity = projectileComponent.velocity

      position.x += direction.x * velocity.x
      position.y += direction.y * velocity.y

      world.addComponent(projectile.id, 'position', position)

      if (!isInsideViewport(position, projectileComponent.dimensions)) {
        world.addComponent(projectile.id, 'expired', { value: true })
      }
    })
  }
}
