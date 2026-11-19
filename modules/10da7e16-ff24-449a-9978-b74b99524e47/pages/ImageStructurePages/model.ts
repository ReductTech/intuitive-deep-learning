export type DistributionMode = 'stretch' | 'equalize' | 'match';
export function histogram(values: readonly number[]) {
  const counts = Array<number>(256).fill(0);
  values.forEach(value => { counts[Math.max(0, Math.min(255, Math.round(value)))]++; });
  return counts;
}
export function distributionLookup(values: readonly number[], mode: DistributionMode) {
  const counts = histogram(values), total = values.length;
  if (!total) return Array.from({ length: 256 }, (_, i) => i);
  const low = counts.findIndex(count => count > 0), high = 255 - [...counts].reverse().findIndex(count => count > 0);
  if (low === high) return Array.from({ length: 256 }, (_, i) => i);
  let cumulative = 0;
  const cdf = counts.map(count => (cumulative += count) / total);
  const target = histogram(Array.from({ length: 256 }, (_, i) => Math.round(255 * Math.sqrt(i / 255))));
  let targetCount = 0;
  const targetCdf = target.map(count => (targetCount += count) / 256);
  return counts.map((_, value) => {
    if (mode === 'stretch') return Math.round(255 * Math.max(0, Math.min(1, (value - low) / (high - low))));
    if (mode === 'equalize') return Math.round(255 * Math.max(0, (cdf[value] - cdf[low]) / (1 - cdf[low])));
    return Math.max(0, targetCdf.findIndex(probability => probability >= cdf[value]));
  });
}
