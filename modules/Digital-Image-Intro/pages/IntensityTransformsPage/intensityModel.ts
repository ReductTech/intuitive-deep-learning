export type Transform = 'linear' | 'log' | 'gamma';
export type Parameters = { a: number; b: number; k: number; gamma: number };
export const initialParameters: Parameters = { a: 1, b: 0, k: 9, gamma: .5 };
export function transformGray(r: number, mode: Transform, p: Parameters): number {
 const value = mode === 'linear' ? p.a * r + p.b : mode === 'log' ? p.k === 0 ? r : Math.log1p(p.k * r) / Math.log1p(p.k) : r ** p.gamma;
 return Math.max(0, Math.min(1, value));
}
