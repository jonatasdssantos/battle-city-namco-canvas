import type { World } from "../../libs/ecs/world";

import { isInsideViewport } from "../viewport";

const ENEMY_SPEED = 1.5

const MOVE_FRAMES = { min: 40, max: 100 }
const SHOOT_FRAMES = { min: 60, max: 150 }

const HEADINGS = [
  { x: 0, y: -1 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 }
]

export class EnemiesAISystem {

  static randomFrames({ min, max }: { min: number, max: number }) {
    return Math.floor(min + Math.random() * (max - min))
  }

  execute(world: World) {
    const enemies = world.getEntitiesByTag('enemy')

    enemies.forEach(enemy => {
      const components = world.getComponents(enemy.id)

      const { position, velocity, dimensions } = components

      const ai = components.ai ?? world.addComponent(enemy.id, 'ai', {
        moveTimer: 0,
        shootTimer: EnemiesAISystem.randomFrames(SHOOT_FRAMES)
      })

      ai.moveTimer -= 1
      ai.shootTimer -= 1

      // The wall resolver zeroes the velocity of whatever it pushes back out
      const isBlocked = velocity.x === 0 && velocity.y === 0
      const isLeavingViewport = !this.staysInsideViewport(position, dimensions, velocity)

      if (ai.moveTimer <= 0 || isBlocked || isLeavingViewport) {
        const heading = this.pickHeading(position, dimensions, isBlocked || isLeavingViewport ? velocity : null)

        world.addComponent(enemy.id, 'velocity', heading)
        world.addComponent(enemy.id, 'direction', heading)

        ai.moveTimer = EnemiesAISystem.randomFrames(MOVE_FRAMES)
      }

      if (ai.shootTimer <= 0) {
        world.addComponent(enemy.id, 'shooting', { requested: true })

        ai.shootTimer = EnemiesAISystem.randomFrames(SHOOT_FRAMES)
      }
    })
  }

  /** Headings that keep the enemy on screen, minus the one it is already stuck on. */
  pickHeading(
    position: { x: number, y: number },
    dimensions: { width: number, height: number },
    rejectedVelocity: { x: number, y: number } | null
  ) {
    const headings = HEADINGS
      .map(heading => ({ x: heading.x * ENEMY_SPEED, y: heading.y * ENEMY_SPEED }))
      .filter(heading => this.staysInsideViewport(position, dimensions, heading))
      .filter(heading => !rejectedVelocity || heading.x !== rejectedVelocity.x || heading.y !== rejectedVelocity.y)

    if (headings.length === 0) {
      return { x: 0, y: 0 }
    }

    return headings[Math.floor(Math.random() * headings.length)]
  }

  staysInsideViewport(
    position: { x: number, y: number },
    dimensions: { width: number, height: number },
    velocity: { x: number, y: number }
  ) {
    return isInsideViewport({ x: position.x + velocity.x, y: position.y + velocity.y }, dimensions)
  }
}
