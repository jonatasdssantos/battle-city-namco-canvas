export function isInsideViewport(
  position: { x: number, y: number },
  dimensions: { width: number, height: number }
) {
  return position.x >= 0 &&
    position.y >= 0 &&
    position.x + dimensions.width <= window.innerWidth &&
    position.y + dimensions.height <= window.innerHeight
}
