import type { Direction, Tile, Tileset } from './types.ts'

const DIRECTIONS: Direction[] = ['up', 'right', 'down', 'left']

/** The edge a neighbour presents back to us when it sits in the given direction. */
const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  right: 'left',
  down: 'up',
  left: 'right',
}

export function createTileset(tiles: Tile[]): Tileset {
  if (tiles.length === 0) {
    throw new Error('createTileset needs at least one tile')
  }

  const ids = tiles.map(tile => tile.id)

  const duplicate = ids.find((id, index) => ids.indexOf(id) !== index)
  if (duplicate) {
    throw new Error(`createTileset received a duplicate tile id: ${duplicate}`)
  }

  const weights = tiles.map(tile => {
    const weight = tile.weight ?? 1

    if (!(weight > 0)) {
      throw new Error(`tile ${tile.id} has a non-positive weight: ${weight}`)
    }

    return weight
  })

  const allowed = {} as Record<Direction, number[][]>

  for (const direction of DIRECTIONS) {
    const facing = OPPOSITE[direction]

    allowed[direction] = tiles.map(tile =>
      tiles.reduce<number[]>((neighbours, candidate, index) => {
        if (tile.sockets[direction] === candidate.sockets[facing]) {
          neighbours.push(index)
        }

        return neighbours
      }, [])
    )
  }

  return { ids, weights, allowed }
}

export { DIRECTIONS }
