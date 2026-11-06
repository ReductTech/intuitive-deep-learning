/** Project a complete A4 page onto a horizontal top face. The ink and the paper
 * share one homography, so rows recede with the edges instead of being clipped
 * inside an otherwise untransformed sticker. Coordinates are logical pixels. */
export function projectPaperPage(width: number, left: number, frontY: number,
  vanishingX: number, vanishingY: number) {
  const sourceHeight = width * Math.SQRT2;
  const depth = width * .37;
  const recession = depth / Math.max(depth + 1, frontY - vanishingY);
  const rearLeft = (vanishingX - left) * recession;
  const rearRight = width + (vanishingX - left - width) * recession;
  const scale = 1 - recession;
  const matrix = [
    scale, 0, 0, 0,
    -rearLeft / sourceHeight, depth / sourceHeight, 0, (scale - 1) / sourceHeight,
    0, 0, 1, 0,
    rearLeft, -depth, 0, 1,
  ];
  const showsLeftSide = rearLeft < 0;
  return {
    sourceHeight, depth, matrix, rearLeft, rearRight,
    transform: `matrix3d(${matrix.join(',')})`, showsLeftSide,
    sideWidth: showsLeftSide ? -rearLeft : Math.max(0, rearRight - width),
  };
}
