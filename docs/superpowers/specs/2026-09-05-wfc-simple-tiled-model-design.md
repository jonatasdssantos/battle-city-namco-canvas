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

Each iteration observes the uncollapsed cell with the fewest remaining options, breaking ties by uniform random choice among the tied cells. That cell collapses to a single tile picked by weighted random choice among its remaining options.

Propagation then runs from the collapsed cell over a stack. For each cell popped, every one of its four neighbours drops any option that no direction-appropriate option of the current cell allows. A neighbour that lost at least one option is pushed onto the stack. Propagation ends when the stack drains.

Solving ends when every cell holds exactly one option.

## Contradictions

A cell reduced to zero options is a contradiction. The solver discards the wave and restarts the whole grid rather than backtracking. `maxAttempts` bounds the restarts and defaults to `10`. When every attempt fails, `solve` returns `{ ok: false, reason }` describing the exhausted attempts. On success it returns `{ ok: true, tiles }`, where `tiles` is a `height`-long array of `width`-long arrays of tile ids, indexed `tiles[y][x]`.

Invalid dimensions, meaning a non-integer or non-positive `width` or `height`, throw rather than returning a failed result. A contradiction is an expected outcome of random search; a malformed request is a programming error.

## Randomness

`SolveOptions.random` is a `() => number` returning a value in `[0, 1)` and defaults to `Math.random`. Passing `mulberry32(seed)` makes a run reproducible. The solver never touches global random state directly.

## Testing

No automated tests for this iteration, at the requester's direction.
