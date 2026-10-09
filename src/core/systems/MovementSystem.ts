import type { GameWorld } from "../../components";

export class MovementSystem {
  execute(world: GameWorld) {
    // Projectiles integrate direction * velocity in the ProjectileSystem instead
    const movables = world.with('movable', 'position', 'velocity').without('projectile')

    for (const { position, velocity } of movables) {
      position.x += velocity.x
      position.y += velocity.y
    }
  }
}
