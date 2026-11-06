export type Orbital = '1s' | '2s' | '2p';
export const orbitals: Record<Orbital, { name: string; detail: string; viewScale: number }> = {
  '1s': { name: '球形基础态', detail: '中心最密，向外平滑衰减，没有节点。', viewScale: 1.2 },
  '2s': { name: '双层球形态', detail: '内外两区之间有一个概率密度为零的球面。', viewScale: .45 },
  '2p': { name: '双瓣形态', detail: '沿竖直方向呈双瓣，中间有一个零概率平面。', viewScale: .45 },
};
// u = r/a, where a is the effective Bohr radius. These radial PDFs integrate to 1.
export function radialDensity(orbital: Orbital, u: number) {
  if (orbital === '1s') return 4*u*u*Math.exp(-2*u);
  if (orbital === '2s') return u*u*(2-u)**2*Math.exp(-u)/8;
  return u**4*Math.exp(-u)/24;
}
export function radialProbability(orbital: Orbital, u: number) {
  if (u <= 0) return 0;
  if (orbital === '1s') return 1-Math.exp(-2*u)*(1+2*u+2*u*u);
  if (orbital === '2s') return 1-Math.exp(-u)*(1+u+u*u/2+u**4/8);
  return 1-Math.exp(-u)*(1+u+u*u/2+u**3/6+u**4/24);
}
// Hydrogen 2p_y is a chosen real orbital orientation, not every possible p state.
export function spatialDensity(orbital: Orbital, u: number, cosine: number) {
  if (orbital === '1s') return Math.exp(-2*u)/Math.PI;
  if (orbital === '2s') return (2-u)**2*Math.exp(-u)/(32*Math.PI);
  return u*u*Math.exp(-u)*cosine*cosine/(32*Math.PI);
}
