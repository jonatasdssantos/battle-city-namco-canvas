import type { With, World } from 'miniplex'

export interface Vector {
  x: number
  y: number
}

export interface Dimensions {
  width: number
  height: number
  depth: number
}

export type EnemyLevel = '1' | '2' | '3'

export type PowerUpType = 'health' | 'speed' | 'shield'

export interface EnemyAI {
  moveTimer: number
  shootTimer: number
}

/** Every component the game knows about. Tags are `true`-valued components. */
export type Entity = {
  // Tags
  player?: true
  enemy?: true
  wall?: true
  projectile?: true
  powerup?: true
  movable?: true
  static?: true
  collidable?: true
  shootRequested?: true

  // Spatial
  position?: Vector
  velocity?: Vector
  direction?: Vector
  dimensions?: Dimensions
  bbox?: Dimensions

  // Gameplay
  health?: number
  score?: number
  powerups?: { type: PowerUpType }[]
  level?: EnemyLevel
  special?: boolean
  ai?: EnemyAI
  damage?: number
  owner?: Entity | null

  // Power-ups
  powerupType?: PowerUpType
  durationOnMap?: number
  expired?: boolean
  pickedUp?: boolean
  activated?: boolean

  // Rendering
  sprite?: HTMLElement
}

export type GameWorld = World<Entity>

export type Collidable = With<Entity, 'position' | 'dimensions'>
