/** Valid 3×3 convolutions, stride 1, no dilation or padding. */
export type ConvDepth = 1 | 2 | 3;
export interface Cell { row: number; column: number; }
export interface Region extends Cell { size: number; }
export interface MapRect { left: number; top: number; width: number; height: number; }
export const INPUT_SIZE = 7;

export function layerSize(depth: 0 | ConvDepth): number { return INPUT_SIZE - depth * 2; }
export function centerCell(depth: ConvDepth): Cell {
  const center = Math.floor(layerSize(depth) / 2);
  return { row: center, column: center };
}
export function containsCell(cell: Cell, region: Region): boolean {
  return cell.row >= region.row && cell.row < region.row + region.size
    && cell.column >= region.column && cell.column < region.column + region.size;
}
export function traceReceptiveField(depth: ConvDepth, cell: Cell): { previous: Region; input: Region } {
  const size = layerSize(depth);
  if (!Number.isInteger(cell.row) || !Number.isInteger(cell.column)
    || cell.row < 0 || cell.column < 0 || cell.row >= size || cell.column >= size) {
    throw new RangeError('Output position is outside the valid convolution grid.');
  }
  return { previous: { ...cell, size: 3 }, input: { ...cell, size: depth * 2 + 1 } };
}

export function gridRegionRect(box: MapRect, count: number, gap: number, region: Region): MapRect {
  const stepX = (box.width + gap) / count, stepY = (box.height + gap) / count;
  return {
    left: box.left + region.column * stepX, top: box.top + region.row * stepY,
    width: region.size * stepX - gap, height: region.size * stepY - gap,
  };
}

/** Geometry follows the restored, differently sized grids, including their real gaps. */
export function dependencyPolygons(boxes: readonly [MapRect, MapRect, MapRect], depth: ConvDepth, cell: Cell): [string, string] {
  const trace = traceReceptiveField(depth, cell);
  const input = gridRegionRect(boxes[0], 7, 0, trace.input);
  const previous = gridRegionRect(boxes[1], layerSize((depth - 1) as 0 | 1 | 2), 4, trace.previous);
  const output = gridRegionRect(boxes[2], layerSize(depth), 4, { ...cell, size: 1 });
  const polygon = (a: MapRect, b: MapRect) => [
    [a.left + a.width, a.top], [b.left, b.top],
    [b.left, b.top + b.height], [a.left + a.width, a.top + a.height],
  ].map(point => point.join(',')).join(' ');
  return [polygon(input, previous), polygon(previous, output)];
}
