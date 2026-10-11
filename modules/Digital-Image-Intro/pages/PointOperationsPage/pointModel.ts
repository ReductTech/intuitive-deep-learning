export type Operation = 'brighten' | 'darken' | 'invert' | 'threshold';
export const mapGray = (r: number, operation: Operation, amount: number) => operation === 'invert' ? 255 - r : operation === 'threshold' ? (r >= amount ? 255 : 0) : Math.max(0, Math.min(255, r + (operation === 'brighten' ? amount : -amount)));
