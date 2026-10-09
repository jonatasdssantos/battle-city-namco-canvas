import type { GameWorld } from "../../components"

import { isInsideViewport } from "../viewport"

export class ProjectileSystem {
  execute(world: GameWorld) {
    const projectiles = world.with('projectile', 'position', 'direction', 'velocity', 'dimensions')

    for (const projectile of projectiles) {
      const { position, direction, velocity, dimensions } = projectile

      position.x += direction.x * velocity.x
      position.y += direction.y * velocity.y

      if (!isInsideViewport(position, dimensions)) {
        world.remove(projectile)
      }
    }
  }
}
