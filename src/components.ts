export interface Position {
  x: number
  y: number
}

export interface Velocity {
  x: number
  y: number
}

export type Direction = 'up' | 'down' | 'left' | 'right'

export interface Facing {
  direction: Direction
}

export interface Renderable {
  width: number
  height: number
  color: string
}

export interface PlayerControlled {
  speed: number
}

/** Every component type the game knows about. One entry per component. */
export interface Components {
  position: Position
  velocity: Velocity
  facing: Facing
  renderable: Renderable
  playerControlled: PlayerControlled
}
