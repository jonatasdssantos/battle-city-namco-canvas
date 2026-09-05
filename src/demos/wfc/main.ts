import { mulberry32, solve } from '../../libs/wfc/index.ts'
import { createLevelTiles } from './tileset.ts'
import { createRenderer } from './render.ts'

const COLUMNS = 10
const ROWS = 10

const $canvas = document.getElementById('canvas') as HTMLCanvasElement
const $seed = document.getElementById('seed') as HTMLInputElement
const $regenerate = document.getElementById('regenerate') as HTMLButtonElement
const $status = document.getElementById('status') as HTMLElement

const { tileset, art } = createLevelTiles()
const draw = await createRenderer($canvas, art)

function generate(seed: number) {
  const startedAt = performance.now()
  const result = solve(tileset, { width: COLUMNS, height: ROWS, random: mulberry32(seed) })
  const elapsed = Math.round(performance.now() - startedAt)

  if (!result.ok) {
    $status.textContent = `seed ${seed} found no solution: ${result.reason}`
    return
  }

  draw(result.tiles)

  $status.textContent =
    `seed ${seed} — ${COLUMNS}x${ROWS} cells from ${tileset.ids.length} tiles, solved in ${elapsed}ms`
}

function readSeed() {
  const seed = Number($seed.value)

  return Number.isFinite(seed) ? Math.trunc(seed) : 1
}

$regenerate.addEventListener('click', () => {
  $seed.value = String(Math.floor(Math.random() * 100_000))
  generate(readSeed())
})

$seed.addEventListener('change', () => generate(readSeed()))

// ?seed=123 makes a layout shareable, since the same seed always solves the same way.
const requested = new URLSearchParams(location.search).get('seed')

if (requested !== null && Number.isFinite(Number(requested))) {
  $seed.value = String(Math.trunc(Number(requested)))
}

generate(readSeed())
