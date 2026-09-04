import { predict, type HeightPair } from '../model/linearRegressionMath';

export function RegressionPlot({ points, slope, intercept, highlightParent }: { points: HeightPair[]; slope: number; intercept: number; highlightParent?: number }) {
  const width = 620;
  const height = 300;
  const x = (value: number) => 34 + ((value - 63) / 13) * 550;
  const y = (value: number) => 270 - ((value - 61) / 16) * 230;
  const lineStart = { x: x(63), y: y(predict(63, slope, intercept)) };
  const lineEnd = { x: x(76), y: y(predict(76, slope, intercept)) };
  return (
    <svg className="lr-regression-plot" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="父母身高与孩子身高散点图和回归直线">
      <line x1="34" y1="270" x2="584" y2="270" stroke="currentColor" opacity=".25" />
      <line x1="34" y1="40" x2="34" y2="270" stroke="currentColor" opacity=".25" />
      {points.map((point, index) => <circle key={`${point.parent}-${point.child}-${index}`} cx={x(point.parent)} cy={y(point.child)} r="6" fill="var(--ui-accent)" opacity=".75" />)}
      <line x1={lineStart.x} y1={lineStart.y} x2={lineEnd.x} y2={lineEnd.y} stroke="var(--ui-accent-alt)" strokeWidth="4" />
      {highlightParent !== undefined && <>
        <line x1={x(highlightParent)} y1="270" x2={x(highlightParent)} y2={y(predict(highlightParent, slope, intercept))} stroke="var(--ui-danger)" strokeDasharray="6 5" />
        <circle cx={x(highlightParent)} cy={y(predict(highlightParent, slope, intercept))} r="8" fill="var(--ui-danger)" />
      </>}
    </svg>
  );
}

