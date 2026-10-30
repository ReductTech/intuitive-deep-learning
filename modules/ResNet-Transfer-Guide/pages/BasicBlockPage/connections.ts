export interface BlockNodeBounds { left: number; top: number; right: number; bottom: number; }
export interface BlockConnection { id: string; state: 'input' | 'residual' | 'shortcut' | 'sum' | 'output'; line: string; arrow: string; }
export interface BlockConnections { width: number; height: number; fork: { x: number; y: number }; routes: BlockConnection[]; }
type Point = { x: number; y: number };
const middleY = (box: BlockNodeBounds) => (box.top + box.bottom) / 2;
const number = (value: number) => Number(value.toFixed(2));
const point = (value: Point) => `${number(value.x)} ${number(value.y)}`;

// Round only the empty-gutter turns; every route ends at an actual node border.
function roundedRoute(points: Point[]) {
  let line = `M${point(points[0])}`;
  for (let index = 1; index < points.length - 1; index++) {
    const before = points[index - 1], corner = points[index], after = points[index + 1];
    const incoming = Math.hypot(corner.x - before.x, corner.y - before.y);
    const outgoing = Math.hypot(after.x - corner.x, after.y - corner.y);
    const radius = Math.min(10, incoming / 2, outgoing / 2);
    if (!radius) { line += `L${point(corner)}`; continue; }
    const entry = { x: corner.x + (before.x - corner.x) / incoming * radius, y: corner.y + (before.y - corner.y) / incoming * radius };
    const exit = { x: corner.x + (after.x - corner.x) / outgoing * radius, y: corner.y + (after.y - corner.y) / outgoing * radius };
    line += `L${point(entry)}Q${point(corner)} ${point(exit)}`;
  }
  return line + `L${point(points[points.length - 1])}`;
}
function route(id: string, state: BlockConnection['state'], points: Point[], withArrow = true): BlockConnection {
  const end = points[points.length - 1], previous = points[points.length - 2];
  const length = Math.hypot(end.x - previous.x, end.y - previous.y);
  const size = Math.min(7, length / 2), dx = length ? (end.x - previous.x) / length : 0, dy = length ? (end.y - previous.y) / length : 0;
  const wingA = { x: end.x - dx * size - dy * size * .55, y: end.y - dy * size + dx * size * .55 };
  const wingB = { x: end.x - dx * size + dy * size * .55, y: end.y - dy * size - dx * size * .55 };
  return { id, state, line: roundedRoute(points), arrow: withArrow && length ? `M${point(wingA)}L${point(end)}L${point(wingB)}` : '' };
}
export function buildBlockConnections(width: number, height: number, nodes: Record<'input' | 'branch' | 'shortcut' | 'sum' | 'relu' | 'output', BlockNodeBounds>): BlockConnections {
  const { input, branch, shortcut, sum, relu, output } = nodes;
  const fork = { x: (input.right + Math.min(branch.left, shortcut.left)) / 2, y: middleY(input) };
  const sumX = (sum.left + sum.right) / 2, sumY = middleY(sum);
  return { width, height, fork, routes: [
    route('input', 'input', [{ x: input.right, y: fork.y }, fork], false),
    route('residual-in', 'residual', [fork, { x: fork.x, y: middleY(branch) }, { x: branch.left, y: middleY(branch) }]),
    route('shortcut-in', 'shortcut', [fork, { x: fork.x, y: middleY(shortcut) }, { x: shortcut.left, y: middleY(shortcut) }]),
    route('residual-out', 'residual', [{ x: branch.right, y: middleY(branch) }, { x: sumX, y: middleY(branch) }, { x: sumX, y: sum.top }]),
    route('shortcut-out', 'shortcut', [{ x: shortcut.right, y: middleY(shortcut) }, { x: sumX, y: middleY(shortcut) }, { x: sumX, y: sum.bottom }]),
    route('sum', 'sum', [{ x: sum.right, y: sumY }, { x: relu.left, y: middleY(relu) }]),
    route('output', 'output', [{ x: relu.right, y: middleY(relu) }, { x: output.left, y: middleY(output) }]),
  ] };
}
