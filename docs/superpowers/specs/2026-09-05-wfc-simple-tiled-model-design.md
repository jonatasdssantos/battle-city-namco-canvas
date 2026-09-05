# WFC Simple Tiled Model Design

## Goal

Provide a generic wave function collapse solver for the simple tiled model in `src/libs/wfc`. Callers describe a set of tiles through edge sockets and receive a solved grid of tile ids. The library knows nothing about this game, its renderer, or its ECS.

## Modules

`types.ts` declares `Direction`, `Tile`, `Tileset`, `SolveOptions` and `SolveResult`.

`tileset.ts` exposes `createTileset(tiles)`, which validates the tile list and compiles the socket labels into an adjacency table.

`solver.ts` exposes `solve(tileset, options)`, which runs the collapse loop.

`random.ts` exposes `mulberry32(seed)`, a seeded generator so a layout can be reproduced.

`index.ts` re-exports the public surface.

## Tiles and Adjacency

A tile is `{ id, sockets, weight? }`. `sockets` assigns one string label to each of `up`, `right`, `down` and `left`. `weight` defaults to `1` and biases the random choice during collapse.

Two tiles may sit side by side when the labels on their touching edges are equal: tile A's `right` matches tile B's `left`, and tile A's `down` matches tile B's `up`. Label equality is plain string comparison. There is no reversal, no symmetry classes and no rotation generation.

`createTileset` precomputes, for every tile and every direction, the list of tile indices allowed in that direction. It throws on an empty tile list, a duplicate tile id, or a non-positive weight.

## Solver

The wave is a single `Uint8Array` of `width * height * tileCount` flags, where a `1` means the tile is still possible in that cell. A parallel `Int32Array` holds the remaining option count per cell so the observation step does not rescan the flags.

An attempt starts by propagating over every cell. The untouched wave is not consistent on its own: a tile with no legal neighbour in some direction has to be ruled out before any cell is observed, and without this pass a single-tile tileset that cannot even sit beside itself would be reported as solved.

Each iteration then observes the uncollapsed cell with the fewest remaining options, breaking ties by uniform random choice among the tied cells. That cell collapses to a single tile picked by weighted random choice among its remaining options.

Propagation then runs from the collapsed cell over a stack. For each cell popped, every one of its four neighbours drops any option that no direction-appropriate option of the current cell allows. A neighbour that lost at least one option is pushed onto the stack. Propagation ends when the stack drains.

Solving ends when every cell holds exactly one option.

## Contradictions

A cell reduced to zero options is a contradiction. The solver discards the wave and restarts the whole grid rather than backtracking. `maxAttempts` bounds the restarts and defaults to `10`. When every attempt fails, `solve` returns `{ ok: false, reason }` describing the exhausted attempts. On success it returns `{ ok: true, tiles }`, where `tiles` is a `height`-long array of `width`-long arrays of tile ids, indexed `tiles[y][x]`.

Invalid dimensions, meaning a non-integer or non-positive `width` or `height`, throw rather than returning a failed result. A contradiction is an expected outcome of random search; a malformed request is a programming error.

## Randomness

`SolveOptions.random` is a `() => number` returning a value in `[0, 1)` and defaults to `Math.random`. Passing `mulberry32(seed)` makes a run reproducible. The solver never touches global random state directly.

## Demo

`wfc.html` is a standalone page, served alongside the game and listed in `vite.config.ts` so `vite build` emits both. It generates Battle City level layouts from `src/assets/sprite.png` and offers a seed box, a Regenerate button and a `?seed=` query parameter, since one seed always solves the same way. It lives in `src/demos/wfc`, split into the tileset, the renderer and the page wiring, and touches no game code.

A cell is 24 pixels: a three by three arrangement of the sheet's eight pixel wall unit. A wall tile paints its centre unit plus an arm toward each edge it reaches, so walls join across cell boundaries. Sockets are the material name on a reached edge and `open` elsewhere, giving one tile per non-empty subset of the four directions in each of brick and steel. Brick arms therefore only meet brick arms, and the two materials form separate structures in one map. Weights favour straights and corners over dead ends and crossroads, and the empty tile carries enough weight to keep the map from filling up.

Water, trees and ice are full-block tiles with `open` on all four edges, which makes them unconstrained decoration: interchangeable with the empty tile and placed by weight alone. This is a deliberate limit of equality-matched sockets. A terrain type whose edges only match themselves would force each neighbour to the same type until it filled the grid, and the sheet has no shoreline art to transition through.

The renderer lifts each texture into a `createPattern` from a 16 pixel slice of the sheet. Patterns anchor to the canvas origin rather than to the rectangle being filled, so neighbouring cells stay seamless. The canvas draws at one pixel per pixel and scales up through CSS with `image-rendering: pixelated`.

## Testing

No automated tests for this iteration, at the requester's direction. The library and the demo were verified by generating grids and checking that no pair of adjacent tiles disagreed on their shared sockets.
