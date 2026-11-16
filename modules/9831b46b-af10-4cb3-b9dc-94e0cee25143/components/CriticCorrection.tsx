import { T } from './LessonVisuals';
import './CriticCorrection.css';

export function CriticCorrection({ before, after, target }: { before: number; after: number; target: number }) {
  const low = Math.min(before, after, target);
  const range = Math.max(Math.max(before, after, target) - low, 1e-9);
  const x = (value: number) => 24 + 552 * (value - low) / range;
  return <div shuku-edit-id="e-f5dc373f-d96c-4f46-8899-29872b67fddd" className="pg-critic-correction" aria-label={`更新前预测${before.toFixed(3)}，更新后${after.toFixed(3)}，固定目标${target.toFixed(3)}`}>
    <svg shuku-edit-id="e-1b50430b-adca-4e7a-be1c-84ff431c80d6" viewBox="0 0 600 62" role="img" aria-label="蓝色新预测向绿色固定目标靠近；橙色标记旧预测">
      <path shuku-edit-id="e-85c87f6e-f836-46cb-aa08-5f8059642e7e" d="M24 31H576" stroke="var(--ui-border-strong)" strokeWidth="2" />
      <path shuku-edit-id="e-6873d043-f37a-497f-b86b-2a3d755b6296" d={`M${x(before)} 31H${x(after)}`} stroke="var(--ui-accent)" strokeWidth="5" />
      <circle shuku-edit-id="e-2d366182-4c22-45fd-ac5c-a94be698c2fa" cx={x(before)} cy="31" r="7" fill="var(--ui-accent-alt)" />
      <circle shuku-edit-id="e-d747bb35-b544-4a23-bd01-b562b5037b20" cx={x(after)} cy="31" r="9" fill="var(--ui-accent)" />
      <path shuku-edit-id="e-92cc1c24-deb6-47e4-bafc-c905b41b1d35" d={`M${x(target)} 10V52`} stroke="var(--ui-success)" strokeWidth="3" />
      <circle shuku-edit-id="e-628f04d6-4e18-4728-bd46-b1aee590e792" cx={x(target)} cy="31" r="7" fill="var(--ui-success)" />
    </svg>
    <div shuku-edit-id="e-1cc861ea-c7f0-45d6-9868-d4146adb0ab7" className="pg-critic-correction-labels">
      <div shuku-edit-id="e-2c0eed8b-15d0-484d-8e8e-57af2d62304a"><T small tone="warning">旧预测 {before.toFixed(3)}</T></div>
      <div shuku-edit-id="e-7e684030-d79c-446e-9cf4-a50faac49b84"><T small tone="accent">新预测 {after.toFixed(3)}</T></div>
      <div shuku-edit-id="e-9939b9bf-d9e9-46aa-a3c3-e25fd6c85f21"><T small tone="success">固定目标 {target.toFixed(3)}</T></div>
    </div>
  </div>;
}
