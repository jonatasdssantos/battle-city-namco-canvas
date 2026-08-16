import type { World } from "../../libs/ecs/world";

import { PLAYER_ENTITY } from "../app";

export class MovementSystem {
  execute(world: World) {
    const playerComponents = world.getComponents(PLAYER_ENTITY)

    playerComponents.position.x += playerComponents.velocity.x
    playerComponents.position.y += playerComponents.velocity.y

    world.addComponent(PLAYER_ENTITY, 'position', { x: playerComponents.position.x, y: playerComponents.position.y })
  }
}