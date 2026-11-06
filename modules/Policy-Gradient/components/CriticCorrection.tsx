import { T } from './LessonVisuals';
import './CriticCorrection.css';

export function CriticCorrection({ before, after, target }: { before: number; after: number; target: number }) {
  const low = Math.min(before, after, target);
  const range = Math.max(Math.max(before, after, target) - low, 1e-9);
  const x = (value: number) => 24 + 552 * (value - low) / range;
  return <div className="pg-critic-correction" aria-label={`更新前预测${before.toFixed(3)}，更新后${after.toFixed(3)}，固定目标${target.toFixed(3)}`}>
    <svg viewBox="0 0 600 62" role="img" aria-label="蓝色新预测向绿色固定目标靠近；橙色标记旧预测">
      <path d="M24 31H576" stroke="var(--ui-border-strong)" strokeWidth="2" />
      <path d={`M${x(before)} 31H${x(after)}`} stroke="var(--ui-accent)" strokeWidth="5" />
      <circle cx={x(before)} cy="31" r="7" fill="var(--ui-accent-alt)" />
      <circle cx={x(after)} cy="31" r="9" fill="var(--ui-accent)" />
      <path d={`M${x(target)} 10V52`} stroke="var(--ui-success)" strokeWidth="3" />
      <circle cx={x(target)} cy="31" r="7" fill="var(--ui-success)" />
    </svg>
    <div className="pg-critic-correction-labels">
      <div><T small tone="warning">旧预测 {before.toFixed(3)}</T></div>
      <div><T small tone="accent">新预测 {after.toFixed(3)}</T></div>
      <div><T small tone="success">固定目标 {target.toFixed(3)}</T></div>
    </div>
  </div>;
}
