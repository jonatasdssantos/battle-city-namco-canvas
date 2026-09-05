import spriteUrl from '../../assets/sprite.png'
import type { Direction } from '../../libs/wfc/index.ts'
import type { CellArt, Material, Terrain } from './tileset.ts'

/** A cell is a 3x3 arrangement of the sheet's 8px wall unit. */
const UNIT = 8
export const CELL = UNIT * 3

/** Every terrain and wall texture on the sheet is a 16px square. */
const SHEET_TILE = 16

const SOURCES: Record<Material | Terrain, { x: number, y: number }> = {
  brick: { x: 256, y: 0 },
  steel: { x: 256, y: 16 },
  water: { x: 256, y: 32 },
  trees: { x: 272, y: 32 },
  ice: { x: 288, y: 32 },
}

const ARM_OFFSETS: Record<Direction, { x: number, y: number }> = {
  up: { x: UNIT, y: 0 },
  right: { x: UNIT * 2, y: UNIT },
  down: { x: UNIT, y: UNIT * 2 },
  left: { x: 0, y: UNIT },
}

export async function createRenderer(canvas: HTMLCanvasElement, art: Map<string, CellArt>) {
  const ctx = canvas.getContext('2d')

  if (!ctx) throw new Error('this browser gave us no 2d canvas context')

  const sprite = new Image()
  sprite.src = spriteUrl
  await sprite.decode()

  const patterns = {} as Record<Material | Terrain, CanvasPattern>

  for (const name of Object.keys(SOURCES) as (Material | Terrain)[]) {
    patterns[name] = slice(ctx, sprite, SOURCES[name])
  }

  return function draw(tiles: string[][]) {
    canvas.width = tiles[0].length * CELL
    canvas.height = tiles.length * CELL

    // Resizing resets the context, so the pixel-art settings go on afterwards.
    ctx.imageSmoothingEnabled = false
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    tiles.forEach((row, y) => {
      row.forEach((id, x) => {
        const cell = art.get(id)

        if (!cell || cell.kind === 'empty') return

        const originX = x * CELL
        const originY = y * CELL

        if (cell.kind === 'terrain') {
          ctx.fillStyle = patterns[cell.terrain]
          ctx.fillRect(originX, originY, CELL, CELL)
          return
        }

        ctx.fillStyle = patterns[cell.material]
        ctx.fillRect(originX + UNIT, originY + UNIT, UNIT, UNIT)

        for (const arm of cell.arms) {
          const offset = ARM_OFFSETS[arm]
          ctx.fillRect(originX + offset.x, originY + offset.y, UNIT, UNIT)
        }
      })
    })
  }
}

/**
 * Lifts one texture off the sheet into a repeating pattern. Patterns are anchored to the canvas
 * origin rather than to the rectangle being filled, so neighbouring cells stay seamless.
 */
function slice(
  ctx: CanvasRenderingContext2D,
  sprite: HTMLImageElement,
  source: { x: number, y: number }
) {
  const tile = document.createElement('canvas')
  tile.width = SHEET_TILE
  tile.height = SHEET_TILE

  const tileCtx = tile.getContext('2d')

  if (!tileCtx) throw new Error('this browser gave us no 2d canvas context')

  tileCtx.drawImage(
    sprite,
    source.x, source.y, SHEET_TILE, SHEET_TILE,
    0, 0, SHEET_TILE, SHEET_TILE
  )

  const pattern = ctx.createPattern(tile, 'repeat')

  if (!pattern) throw new Error('could not build a pattern from the sprite sheet')

  return pattern
}
