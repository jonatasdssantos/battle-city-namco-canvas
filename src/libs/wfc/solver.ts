import { DIRECTIONS } from './tileset.ts'
import type { Direction, SolveOptions, SolveResult, Tileset } from './types.ts'

const OFFSETS: Record<Direction, { x: number, y: number }> = {
  up: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
}

export function solve(tileset: Tileset, options: SolveOptions): SolveResult {
  const { width, height } = options
  const random = options.random ?? Math.random
  const maxAttempts = options.maxAttempts ?? 10

  assertDimension('width', width)
  assertDimension('height', height)

  const tileCount = tileset.ids.length
  const cellCount = width * height

  /** wave[cell * tileCount + tile] is 1 while that tile remains possible in that cell. */
  const wave = new Uint8Array(cellCount * tileCount)
  const counts = new Int32Array(cellCount)
  const stack: number[] = []
  const support = new Uint8Array(tileCount)

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    wave.fill(1)
    counts.fill(tileCount)
    stack.length = 0

    if (collapseGrid()) {
      return { ok: true, tiles: readTiles() }
    }
  }

  return {
    ok: false,
    reason: `no solution after ${maxAttempts} attempt(s); the tileset may be too constrained for a ${width}x${height} grid`,
  }

  /** Observes and propagates until the grid is fully collapsed. Returns false on a contradiction. */
  function collapseGrid() {
    // The untouched wave is not consistent on its own: a tile with no legal neighbour in some
    // direction has to be ruled out before any cell is observed.
    for (let cell = 0; cell < cellCount; cell++) stack.push(cell)

    if (!drain()) return false

    for (;;) {
      const cell = observe()

      if (cell === -1) return true

      collapse(cell)

      stack.push(cell)

      if (!drain()) return false
    }
  }

  /** The uncollapsed cell with the fewest options, or -1 when every cell is collapsed. */
  function observe() {
    let chosen = -1
    let fewest = Infinity
    let ties = 0

    for (let cell = 0; cell < cellCount; cell++) {
      const count = counts[cell]

      if (count <= 1) continue

      if (count < fewest) {
        fewest = count
        ties = 1
        chosen = cell
      } else if (count === fewest) {
        ties++
        if (random() < 1 / ties) chosen = cell
      }
    }

    return chosen
  }

  /** Reduces a cell to a single tile, chosen at random in proportion to tile weights. */
  function collapse(cell: number) {
    const base = cell * tileCount
    let total = 0

    for (let tile = 0; tile < tileCount; tile++) {
      if (wave[base + tile]) total += tileset.weights[tile]
    }

    let remaining = random() * total
    let picked = -1

    for (let tile = 0; tile < tileCount; tile++) {
      if (!wave[base + tile]) continue

      remaining -= tileset.weights[tile]
      if (remaining <= 0) {
        picked = tile
        break
      }
    }

    // Floating point drift can leave `remaining` just above zero on the last option.
    if (picked === -1) picked = lastOption(cell)

    wave.fill(0, base, base + tileCount)
    wave[base + picked] = 1
    counts[cell] = 1
  }

  /**
   * Empties the stack, removing options that lost support and queueing every cell that shrank.
   * Returns false as soon as a cell runs out of options.
   */
  function drain() {
    while (stack.length > 0) {
      const cell = stack.pop()!
      const x = cell % width
      const y = (cell - x) / width

      for (const direction of DIRECTIONS) {
        const offset = OFFSETS[direction]
        const neighbourX = x + offset.x
        const neighbourY = y + offset.y

        if (neighbourX < 0 || neighbourX >= width) continue
        if (neighbourY < 0 || neighbourY >= height) continue

        collectSupport(cell, direction)

        if (!constrain(neighbourY * width + neighbourX)) return false
      }
    }

    return true
  }

  /** Marks in `support` every tile that at least one option of `cell` allows in `direction`. */
  function collectSupport(cell: number, direction: Direction) {
    const base = cell * tileCount
    const allowed = tileset.allowed[direction]

    support.fill(0)

    for (let tile = 0; tile < tileCount; tile++) {
      if (!wave[base + tile]) continue

      for (const candidate of allowed[tile]) {
        support[candidate] = 1
      }
    }
  }

  /** Intersects a cell with `support`, queueing it when it shrank. */
  function constrain(cell: number) {
    const base = cell * tileCount
    let removed = 0

    for (let tile = 0; tile < tileCount; tile++) {
      if (!wave[base + tile] || support[tile]) continue

      wave[base + tile] = 0
      removed++
    }

    if (removed === 0) return true

    counts[cell] -= removed

    if (counts[cell] === 0) return false

    stack.push(cell)

    return true
  }

  function lastOption(cell: number) {
    const base = cell * tileCount

    for (let tile = tileCount - 1; tile >= 0; tile--) {
      if (wave[base + tile]) return tile
    }

    throw new Error(`cell ${cell} has no options left`)
  }

  function readTiles() {
    const tiles: string[][] = []

    for (let y = 0; y < height; y++) {
      const row: string[] = []

      for (let x = 0; x < width; x++) {
        row.push(tileset.ids[lastOption(y * width + x)])
      }

      tiles.push(row)
    }

    return tiles
  }
}

function assertDimension(name: string, value: number) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`solve needs a positive integer ${name}, received ${value}`)
  }
}
