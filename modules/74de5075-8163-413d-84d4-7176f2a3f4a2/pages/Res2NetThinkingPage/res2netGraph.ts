export type ConvId = string;
export type Connection = { from: ConvId; to: ConvId };
export type ConvNode = { id: ConvId; branch: number; layer: number; level: number; ranges: number[] };
export const convId = (branch: number, layer: number) => `${branch}:${layer}`;

// The output width stays D; full-width parallel branches enlarge the fusion input.
export function parameterWeights(branches: number[], width: number, grouped: boolean) {
  const groups = grouped ? branches.length + 1 : 1;
  const pointwise = (grouped ? 2 : 1 + branches.length) * width * width;
  const spatial = 9 * branches.reduce((sum, count) => sum + count, 0) * (width / groups) ** 2;
  return { pointwise, spatial, total: pointwise + spatial };
}

export function graphNodes(branches: number[], connections: Connection[]): ConvNode[] {
  const nodes = branches.flatMap((count, branch) => Array.from({ length: count }, (_, layer) => ({ id: convId(branch, layer), branch, layer, level: 0, ranges: [] as number[] })));
  const byId = new Map(nodes.map(node => [node.id, node]));
  const done = new Set<string>();
  const visiting = new Set<string>();
  function resolve(node: ConvNode) {
    if (done.has(node.id)) return;
    if (visiting.has(node.id)) throw new Error('Network contains a cycle');
    visiting.add(node.id);
    const parentIds = [...(node.layer > 0 ? [convId(node.branch, node.layer - 1)] : []), ...connections.filter(c => c.to === node.id).map(c => c.from)];
    const parents = parentIds.map(id => { const parent = byId.get(id); if (!parent) throw new Error(`Unknown module ${id}`); return parent; });
    parents.forEach(resolve);
    node.level = parents.length ? 1 + Math.max(...parents.map(parent => parent.level)) : 0;
    // A first convolution always retains its own group's input at the sum.
    const inputs = [...(node.layer === 0 ? [1] : []), ...parents.flatMap(parent => parent.ranges)];
    node.ranges = [...new Set(inputs.map(size => size + 2))].sort((a, b) => a - b);
    visiting.delete(node.id); done.add(node.id);
  }
  nodes.forEach(resolve);
  return nodes;
}

// Show one input-to-output route that produces the requested scale. Prefer the
// deepest output, so scales on a Res2Net chain share its final output group.
export function receptiveFieldPath(branches: number[], connections: Connection[], scale: number): ConvId[] {
  const nodes=graphNodes(branches,connections);
  const byId=new Map(nodes.map(node=>[node.id,node]));
  function trace(node:ConvNode,size:number):ConvId[]|null {
    if(size===3&&node.layer===0)return[node.id];
    if(size<3)return null;
    const parentIds=[...(node.layer>0?[convId(node.branch,node.layer-1)]:[]),...connections.filter(edge=>edge.to===node.id).map(edge=>edge.from)];
    const parents=parentIds.map(id=>byId.get(id)!).filter(parent=>parent.ranges.includes(size-2)).sort((a,b)=>b.level-a.level||b.branch-a.branch);
    for(const parent of parents){const path=trace(parent,size-2);if(path)return[...path,node.id];}
    return null;
  }
  const outputs=nodes.filter(node=>node.layer===branches[node.branch]-1&&node.ranges.includes(scale)).sort((a,b)=>b.level-a.level||b.branch-a.branch);
  for(const output of outputs){const path=trace(output,scale);if(path)return path;}
  return[];
}

export function connectionError(branches: number[], connections: Connection[], from: string, to: string): string | null {
  const nodes = graphNodes(branches, connections);
  if (!nodes.some(n => n.id === from) || !nodes.some(n => n.id === to)) return '请连接画布上的两个卷积模块。';
  if (from === to) return '同一个模块不能连接自己。';
  const target = nodes.find(n => n.id === to)!;
  if (connections.some(c => c.from === from && c.to === to) || (target.layer > 0 && from === convId(target.branch, target.layer - 1))) return '这两个模块已经直接相连。';
  try { graphNodes(branches, [...connections, { from, to }]); }
  catch { return '这条连接会形成回路，请换一个模块。'; }
  return null;
}

export function isRes2NetChain(branches: number[], connections: Connection[]) {
  if (branches.length !== 3 || branches.some(n => n !== 1) || connections.length !== 2) return false;
  const nodes = graphNodes(branches, connections);
  return nodes.every(n => connections.filter(c => c.from === n.id).length <= 1 && connections.filter(c => c.to === n.id).length <= 1);
}
