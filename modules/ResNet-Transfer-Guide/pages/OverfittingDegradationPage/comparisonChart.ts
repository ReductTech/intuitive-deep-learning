import { defaultTheme, type EChartsOption } from '../../../shared/react';

function themeColor(token: string) {
  const color = defaultTheme.colors.find(item => item.token === token);
  if (!color) throw new Error('Missing Shared theme color: ' + token);
  return color.value;
}

export const comparisonColors = {
  training: themeColor('--ui-accent'),
  test: themeColor('--ui-accent-alt'),
  axis: themeColor('--ui-text-muted'),
  grid: themeColor('--ui-grid'),
};

export type ComparisonKind = 'overfitting' | 'degradation';
const positions = Array.from({ length: 41 }, (_, index) => index / 40);
// Dimensionless conceptual curves, not recorded training history or error percentages.
export const conceptualCurves = {
  training: positions.map(x => [x, .08 + .77 * Math.exp(-5 * x)]),
  test: positions.map(x => [x, .22 + .63 * Math.exp(-7 * x) + .42 * x * x]),
  deepTraining: positions.map(x => [x, .28 + .57 * Math.exp(-5 * x)]),
};

export function buildComparisonChart(kind: ComparisonKind, comparisonVisible: boolean): EChartsOption {
  const line = (id: string, name: string, data: number[][], color: string, dashed = false) => ({
    id, name, type: 'line', data, showSymbol: false, silent: true,
    lineStyle: { color, width: 4, type: dashed ? 'dashed' : 'solid' }, itemStyle: { color },
  });
  const series = [line('training', kind === 'overfitting' ? '训练误差' : '浅网络 · 训练误差',
    conceptualCurves.training, comparisonColors.training)];
  if (comparisonVisible) series.push(kind === 'overfitting'
    ? line('test', '测试误差', conceptualCurves.test, comparisonColors.test)
    : line('deep-training', '深网络 · 训练误差', conceptualCurves.deepTraining, comparisonColors.training, true));
  return {
    animation: false, tooltip: { show: false }, legend: { show: false },
    grid: { top: 12, bottom: 12, left: 12, right: 16, containLabel: false },
    xAxis: { type: 'value', min: 0, max: 1, axisLabel: { show: false }, axisTick: { show: false },
      axisLine: { show: true, lineStyle: { color: comparisonColors.axis } }, splitLine: { show: false } },
    yAxis: { type: 'value', min: 0, max: 1, splitNumber: 4, axisLabel: { show: false }, axisTick: { show: false },
      axisLine: { show: true, lineStyle: { color: comparisonColors.axis } },
      splitLine: { lineStyle: { color: comparisonColors.grid } } },
    series,
  };
}
