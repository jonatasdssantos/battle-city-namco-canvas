import { createTileset } from '../../libs/wfc/index.ts'
import type { Direction, Tile, Tileset } from '../../libs/wfc/index.ts'

export type Material = 'brick' | 'steel'
export type Terrain = 'water' | 'trees' | 'ice'

/** How the renderer should paint one solved cell. */
export type CellArt =
  | { kind: 'empty' }
  | { kind: 'wall', material: Material, arms: Direction[] }
  | { kind: 'terrain', terrain: Terrain }

export type LevelTiles = { tileset: Tileset, art: Map<string, CellArt> }

const DIRECTIONS: Direction[] = ['up', 'right', 'down', 'left']

/** Straights and corners read best, so dead ends and crossroads stay rare. */
const ARM_WEIGHTS: Record<number, number> = { 1: 0.4, 2: 2, 3: 0.6, 4: 0.25 }

const MATERIAL_WEIGHTS: Record<Material, number> = { brick: 1, steel: 0.35 }

/** Fillers carry the same sockets as the empty tile, so they only differ by weight. */
const TERRAIN_WEIGHTS: Record<Terrain, number> = { water: 0.8, trees: 0.8, ice: 0.5 }

/** Walls carry ~22 weight between them, so this is what keeps the map from filling up. */
const EMPTY_WEIGHT = 16

/**
 * A wall tile connects to its neighbours through the material name on the edges it reaches,
 * so brick arms only ever meet brick arms and steel only meets steel. Every other edge is
 * `open`, which is also all an empty or terrain cell offers.
 */
export function createLevelTiles(): LevelTiles {
  const tiles: Tile[] = []
  const art = new Map<string, CellArt>()

  const openOnAllSides = (): Record<Direction, string> =>
    ({ up: 'open', right: 'open', down: 'open', left: 'open' })

  tiles.push({ id: 'empty', sockets: openOnAllSides(), weight: EMPTY_WEIGHT })
  art.set('empty', { kind: 'empty' })

  for (const terrain of Object.keys(TERRAIN_WEIGHTS) as Terrain[]) {
    tiles.push({ id: terrain, sockets: openOnAllSides(), weight: TERRAIN_WEIGHTS[terrain] })
    art.set(terrain, { kind: 'terrain', terrain })
  }

  for (const material of Object.keys(MATERIAL_WEIGHTS) as Material[]) {
    // One tile per non-empty subset of the four directions. The all-open subset is the empty tile.
    for (let subset = 1; subset < 16; subset++) {
      const arms = DIRECTIONS.filter((_, index) => subset & (1 << index))
      const id = `${material}-${arms.join('-')}`
      const sockets = {} as Record<Direction, string>

      for (const direction of DIRECTIONS) {
        sockets[direction] = arms.includes(direction) ? material : 'open'
      }

      tiles.push({
        id,
        sockets,
        weight: ARM_WEIGHTS[arms.length] * MATERIAL_WEIGHTS[material],
      })

      art.set(id, { kind: 'wall', material, arms })
    }
  }

  return { tileset: createTileset(tiles), art }
}
