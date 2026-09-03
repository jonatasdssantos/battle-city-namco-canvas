# Power-up Wall-safe Position Design

## Goal

Provide a pure function that checks whether a proposed power-up rectangle overlaps any wall and, when necessary, resolves each collision across its nearest wall edge until the position is free. The function is intended to run before the power-up entity is added to the world.

## API

Add a static method to `PowerUpSystem`:

```ts
static findAvailablePosition(
  position: { x: number, y: number },
  dimensions: { width: number, height: number },
  world: World
): { x: number, y: number } | null
```

The method must not mutate `position`, `dimensions`, wall components, or any world state.

## Collision and Adjustment

Walls are discovered through the `wall` entity tag. A wall participates only when it has both `position` and `dimensions` components.

Rectangles overlap using the project's existing strict AABB semantics. Merely touching a wall edge is valid and does not count as a collision.

For each overlap, calculate penetration from all four directions. Move the candidate rectangle across the nearest wall edge along the axis with the shallowest penetration. Match `separateFromWall` for deterministic ties: prefer the vertical axis when axis penetrations are equal, and the positive direction when opposite edges are equally near. Check all walls again after each pass because resolving one overlap can introduce another.

The search allows `max(1, wallCount * 4)` complete passes so conflicting wall geometry cannot cause an infinite loop. If no overlap-free candidate is found within that bound, return `null`. Otherwise, return a new position object.

## Integration

`initPowerupEntity` can call the method before creating the entity. It should use the returned position when successful and skip or retry spawning when the method returns `null`. Integrating that call is separate from the position-finding method unless explicitly requested.

## Testing

Automated tests should verify:

- An already-free position is returned unchanged as a new object.
- Horizontal overlap moves the candidate to the nearest horizontal edge.
- Vertical overlap moves the candidate to the nearest vertical edge.
- The method repeats checks when adjustment against one wall causes overlap with another.
- Touching a wall edge is accepted.
- Input objects and world components are not mutated.
- Conflicting geometry that cannot be resolved within the safety bound returns `null`.

