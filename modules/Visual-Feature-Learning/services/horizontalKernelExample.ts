export const horizontalKernel = [-1, 0, 1, -2, 0, 2, -1, 0, 1];

// Paired handwritten grayscale 1 and 7, sharing a long descending stroke.
// The vertical Sobel kernel emphasizes this common stroke.
type Point = [number, number];
function curve(points: Point[]): Point[] {
  return Array.from({ length: 81 }, (_, i) => {
    const t = i / 80, u = 1 - t;
    return [0, 1].map(axis => u ** 3 * points[0][axis] + 3 * u * u * t * points[1][axis] + 3 * u * t * t * points[2][axis] + t ** 3 * points[3][axis]) as Point;
  });
}
export function exampleDigit(digit: 1 | 7, _shape: number): number[] {
  const stem = curve([[19, 5], [17, 11], [12, 19], [10, 24]]);
  const top = digit === 7
    ? curve([[5, 5], [10, 5.8], [15, 4.4], [19, 5]])
    : curve([[14, 8], [16, 7], [17.5, 5.5], [19, 5]]);
  const points = [...stem, ...top];
  return Array.from({ length: 784 }, (_, i) => {
    const x = i % 28 + .5, y = Math.floor(i / 28) + .5;
    const distance = Math.min(...points.map(([px, py]) => (px - x) ** 2 + (py - y) ** 2));
    const width = 1.05 + .08 * Math.sin(y * .4);
    return Math.exp(-distance / (2 * width * width));
  });
}

export function horizontalResponse(pixels: number[]): number[] {
  return Array.from({ length: 676 }, (_, i) => {
    const x = i % 26, y = Math.floor(i / 26);
    return Math.abs(horizontalKernel.reduce((sum, weight, k) => sum + weight * pixels[(y + Math.floor(k / 3)) * 28 + x + k % 3], 0));
  });
}
