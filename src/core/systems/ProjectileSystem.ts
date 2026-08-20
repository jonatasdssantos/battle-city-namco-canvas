import type { World } from "../../libs/ecs/world"

export class ProjectileSystem {
  execute(world: World) {
    const projectiles = world.getComponents('projectile', false)

    // TODO: Get a list of all projectile entities and update their position

    // console.log(projectiles)
    // projectiles.forEach(projectile => {
    //   projectile.position.x += projectile.velocity.x
    //   projectile.position.y += projectile.velocity.y

    //   world.addComponent(projectile.id, 'position', { x: projectile.position.x, y: projectile.position.y })
    // })
  }
}