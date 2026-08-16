import type { World } from "../../libs/ecs/world";

import { PLAYER_ENTITY } from "../app";

export class MovementSystem {
  execute(world: World) {
    const player = world.getEntity(PLAYER_ENTITY)
    
    if (player) {
      const position = world.getComponent(player, 'position')
      const velocity = world.getComponent(player, 'velocity')
      
      position.x += velocity.x
      position.y += velocity.y

      world.addComponent(player, { position })
    }
  }
}