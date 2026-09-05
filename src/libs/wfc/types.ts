export type Direction = 'up' | 'right' | 'down' | 'left'

/** A tile declares one socket label per edge. Tiles connect when touching labels are equal. */
export type Tile = {
  id: string
  sockets: Record<Direction, string>
  /** Bias for the weighted random choice during collapse. Defaults to 1. */
  weight?: number
}

export type Tileset = {
  ids: string[]
  weights: number[]
  /** allowed[direction][tileIndex] lists the tiles that may sit in that direction. */
  allowed: Record<Direction, number[][]>
}

export type SolveOptions = {
  width: number
  height: number
  /** Returns a number in [0, 1). Defaults to Math.random. */
  random?: () => number
  /** Grid restarts allowed after a contradiction. Defaults to 10. */
  maxAttempts?: number
}

export type SolveResult =
  | { ok: true, tiles: string[][] }
  | { ok: false, reason: string }
