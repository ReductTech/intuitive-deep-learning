export interface MapPoint { id: string; x: number; y: number; }
export interface Position { x: number; y: number; }
// CSS thumbnails are 90 units wide in the same 1000 × 400 logical map.
export const thumbnailUnits = 90;
const clearance = thumbnailUnits / 2 + 8;
const position = (point: MapPoint): Position => ({ x: point.x * 10, y: point.y * 4 });

export function mapDistance(a: MapPoint, b: MapPoint) {
  const first = position(a), second = position(b);
  return Math.hypot(first.x - second.x, first.y - second.y);
}

// Test the open interior: a segment may touch an inflated rectangle's boundary,
// but it may never pass through a thumbnail or the reserved outline clearance.
function crosses(a: Position, b: Position, center: Position) {
  let low = 0, high = 1;
  for (const axis of ['x', 'y'] as const) {
    const delta = b[axis] - a[axis], min = center[axis] - clearance + .001, max = center[axis] + clearance - .001;
    if (Math.abs(delta) < 1e-8) { if (a[axis] <= min || a[axis] >= max) return false; }
    else { const first = (min - a[axis]) / delta, second = (max - a[axis]) / delta; low = Math.max(low, Math.min(first, second)); high = Math.min(high, Math.max(first, second)); if (low > high) return false; }
  }
  return high > 0 && low < 1 && low <= high;
}

export function routeLink(a: MapPoint, b: MapPoint, points: readonly MapPoint[]): Position[] {
  const start = position(a), end = position(b), obstacles = points.map(position);
  // Use outward-facing ports for near-horizontal/vertical neighbors. This leaves
  // a visible, calm arc instead of a tiny stub squeezed between enlarged photos.
  const dx = Math.abs(end.x - start.x), dy = Math.abs(end.y - start.y);
  const preferred = dx >= dy * 1.4 ? (start.y + end.y < 400 ? 2 : 3) : dy >= dx * 1.4 ? (start.x + end.x < 1000 ? 0 : 1) : null;
  const ports = (center: Position) => [{ x: center.x - clearance, y: center.y }, { x: center.x + clearance, y: center.y }, { x: center.x, y: center.y - clearance }, { x: center.x, y: center.y + clearance }];
  const nodes = [...ports(start), ...ports(end), ...obstacles.flatMap(center => [-1, 1].flatMap(dx => [-1, 1].map(dy => ({ x: center.x + dx * clearance, y: center.y + dy * clearance }))))];
  const distance = nodes.map((_, index) => index < 4 && (preferred === null || index === preferred) ? 0 : Infinity), previous = nodes.map(() => -1), visited = new Set<number>();
  while (visited.size < nodes.length) {
    let current = -1;
    for (let index = 0; index < nodes.length; index++) if (!visited.has(index) && (current < 0 || distance[index] < distance[current])) current = index;
    if (current < 0 || !Number.isFinite(distance[current])) break;
    if (current >= 4 && current < 8 && (preferred === null || current === preferred + 4)) {
      const route: Position[] = [];
      for (let index = current; index >= 0; index = previous[index]) route.unshift(nodes[index]);
      return route;
    }
    visited.add(current);
    for (let index = 0; index < nodes.length; index++) {
      if (visited.has(index) || obstacles.some(center => crosses(nodes[current], nodes[index], center))) continue;
      const next = distance[current] + Math.hypot(nodes[current].x - nodes[index].x, nodes[current].y - nodes[index].y);
      if (next < distance[index]) { distance[index] = next; previous[index] = current; }
    }
  }
  return [];
}

// Round the route within its reserved 8-unit clearance. A slight bow on a direct
// link and short quadratic corner joins avoid hard kinks without crossing photos.
export function smoothLink(route: Position[]): string {
  if (route.length < 2) return '';
  const first = route[0], last = route[route.length - 1];
  let path = `M ${first.x} ${first.y}`;
  if (route.length === 2) {
    const dx = last.x - first.x, dy = last.y - first.y, length = Math.hypot(dx, dy), bow = Math.min(6, length * .08);
    return `${path} Q ${(first.x + last.x) / 2 - dy / length * bow} ${(first.y + last.y) / 2 + dx / length * bow} ${last.x} ${last.y}`;
  }
  for (let index = 1; index < route.length - 1; index++) {
    const previous = route[index - 1], current = route[index], next = route[index + 1];
    const before = Math.hypot(current.x - previous.x, current.y - previous.y), after = Math.hypot(next.x - current.x, next.y - current.y);
    if (before < .001 || after < .001) continue;
    const radius = Math.min(6, before / 3, after / 3);
    const entry = { x: current.x + (previous.x - current.x) * radius / before, y: current.y + (previous.y - current.y) * radius / before };
    const exit = { x: current.x + (next.x - current.x) * radius / after, y: current.y + (next.y - current.y) * radius / after };
    path += ` L ${entry.x} ${entry.y} Q ${current.x} ${current.y} ${exit.x} ${exit.y}`;
  }
  return `${path} L ${last.x} ${last.y}`;
}
