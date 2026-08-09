import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { ContentBlock, NoticeStrip, Question, RangeControl, ValueTile, emitTelemetry, getTelemetryState } from '../../shared/react';
import { getAugmentationMetrics, metricPolyline } from '../domain/augmentationSimulation';

interface AugmentationStrengthBlockProps {
  onComplete?: () => void;
}

const stateKey = 'experiment:vision-augmentation-strength-v1';
const transforms = [
  { rotate: -1, shift: -1, light: .7 },
  { rotate: .55, shift: .6, light: -.35 },
  { rotate: -.35, shift: .25, light: .45 },
  { rotate: .8, shift: -.45, light: -.65 },
  { rotate: -.7, shift: .75, light: .2 },
  { rotate: .25, shift: -.7, light: -.15 },
];

const semanticCopy = {
  safe: { tone: 'green' as const, label: '标签安全', detail: '变化增加了样本多样性，但箭头方向仍然清楚。' },
  warning: { tone: 'orange' as const, label: '接近边界', detail: '局部裁剪和模糊开始遮挡关键形状，需要结合任务检查。' },
  broken: { tone: 'red' as const, label: '标签风险', detail: '关键结构已经严重缺失，这些样本可能教给模型错误标签。' },
};

export function AugmentationStrengthBlock({ onComplete }: AugmentationStrengthBlockProps) {
  const [strength, setStrength] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [foundUsefulRange, setFoundUsefulRange] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const metrics = getAugmentationMetrics(strength);
  const semantic = semanticCopy[metrics.semanticStatus];
  const markerX = 14 + metrics.strength * 2.72;
  const trainY = 116 - (metrics.trainAccuracy - 50) * 1.72;
  const validationY = 116 - (metrics.validationAccuracy - 50) * 1.72;

  useEffect(() => {
    let active = true;
    void getTelemetryState<{ strength?: number }>(stateKey).then((entry) => {
      if (!active) return;
      const restored = Number(entry?.state?.strength);
      if (Number.isFinite(restored)) setStrength(Math.max(0, Math.min(100, restored)));
      setHydrated(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (metrics.validationAccuracy >= 88.5 && metrics.semanticStatus === 'safe') setFoundUsefulRange(true);
  }, [hydrated, metrics.semanticStatus, metrics.validationAccuracy]);

  const samples = useMemo(() => transforms.map((pattern, index) => {
    const factor = strength / 100;
    const style = {
      '--vgen-sample-rotate': `${pattern.rotate * factor * 20}deg`,
      '--vgen-sample-shift': `${pattern.shift * factor * 24}px`,
      '--vgen-sample-light': `${Math.max(.65, 1 + pattern.light * factor * .38)}`,
      '--vgen-sample-scale': `${1 - factor * (index % 2 === 0 ? .08 : .15)}`,
      '--vgen-sample-blur': `${strength > 68 ? (strength - 68) * (index % 3 === 0 ? .07 : .025) : 0}px`,
    } as CSSProperties;
    return { index, style };
  }), [strength]);

  function commitStrength() {
    if (!hydrated) return;
    emitTelemetry('control_commit', rootRef.current, {
      state_key: stateKey,
      state: { strength },
      value: strength,
    });
  }

  function handleKeyUp(event: KeyboardEvent<HTMLInputElement>) {
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) commitStrength();
  }

  return (
    <ContentBlock
      className="vgen-block vgen-strength-block"
      title="增广越强，泛化一定越好吗？"
      subtitle="训练集准确率高可能只是记住了少量原图。调节增广强度，同时观察训练表现、验证表现和标签风险。"
    >
      <div className="vgen-strength-layout" ref={rootRef}>
        <section className="vgen-strength-controls" aria-labelledby="vgen-strength-control-title">
          <h3 id="vgen-strength-control-title">生成一批不同但仍合理的训练样本</h3>
          <RangeControl
            label="增广强度"
            min={0}
            max={100}
            step={1}
            value={strength}
            suffix="%"
            hint={strength === 0}
            scale={['原图重复', '适度变化', '语义风险']}
            onChange={(event) => setStrength(Number(event.currentTarget.value))}
            onPointerUp={commitStrength}
            onKeyUp={handleKeyUp}
          />
          <div className="vgen-sample-grid" aria-label={`当前增广强度 ${strength}%，六个训练样本预览`}>
            {samples.map(({ index, style }) => (
              <div className={`vgen-mini-scene ${metrics.semanticStatus === 'broken' && index % 3 === 0 ? 'is-clipped' : ''}`} style={style} key={index}>
                <span className="vgen-mini-sign" aria-hidden="true">➜</span>
                <span className="vgen-sr-only">样本 {index + 1}</span>
              </div>
            ))}
          </div>
          <NoticeStrip tone={semantic.tone} lead={`${semantic.label}：`}>{semantic.detail}</NoticeStrip>
        </section>

        <section className="vgen-metric-panel" aria-labelledby="vgen-metric-title">
          <h3 id="vgen-metric-title">同样训练 20 轮后的模拟结果</h3>
          <div className="vgen-metric-tiles">
            <ValueTile tone="blue" label="训练准确率" value={`${metrics.trainAccuracy}%`} />
            <ValueTile tone={metrics.validationAccuracy >= 88.5 ? 'success' : 'orange'} label="验证准确率" value={`${metrics.validationAccuracy}%`} />
            <ValueTile tone={metrics.gap <= 7 ? 'success' : 'danger'} label="泛化差距" value={`${metrics.gap}%`} />
          </div>
          <svg className="vgen-accuracy-chart" viewBox="0 0 300 132" role="img" aria-labelledby="vgen-chart-title vgen-chart-desc">
            <title id="vgen-chart-title">准确率随增广强度变化</title>
            <desc id="vgen-chart-desc">训练准确率随强度缓慢下降；验证准确率先升后降，在适度增广时最高。</desc>
            <line x1="14" y1="116" x2="286" y2="116" />
            <line x1="14" y1="12" x2="14" y2="116" />
            <rect className="vgen-chart-target" x="109" y="12" width="68" height="104" />
            <polyline className="vgen-chart-train" points={metricPolyline('trainAccuracy')} />
            <polyline className="vgen-chart-validation" points={metricPolyline('validationAccuracy')} />
            <line className="vgen-chart-marker" x1={markerX} y1="12" x2={markerX} y2="116" />
            <circle className="vgen-chart-train" cx={markerX} cy={trainY} r="4" />
            <circle className="vgen-chart-validation" cx={markerX} cy={validationY} r="4" />
          </svg>
          <div className="vgen-chart-legend" aria-hidden="true"><span className="is-train">训练集</span><span className="is-validation">验证集</span><span className="is-target">合适区间</span></div>
        </section>
      </div>

      <NoticeStrip tone={foundUsefulRange ? 'green' : 'orange'} lead={foundUsefulRange ? '已找到平衡点：' : '实验目标：'}>
        {foundUsefulRange
          ? '适度增广降低了死记硬背，让验证准确率提高；继续加大则会破坏语义并让表现回落。'
          : '移动滑杆，找到验证准确率至少 88.5%，同时仍显示“标签安全”的强度。'}
      </NoticeStrip>

      {foundUsefulRange && (
        <Question
          persistenceKey="vision-augmentation-strength-conclusion-v1"
          type="choice"
          title="为什么验证准确率会随着增广强度先升后降？"
          options={[
            { key: 'A', value: 'balance', label: '适度变化减少对原图细节的死记硬背；过强变化又可能破坏标签语义' },
            { key: 'B', value: 'more-always', label: '增广样本越多越好，下降只是模拟误差', wrongFeedback: '样本数量增加不代表标签仍可靠；过强变换会引入错误监督。' },
            { key: 'C', value: 'train-equals-validation', label: '训练准确率和验证准确率必须始终相等', wrongFeedback: '两者反映不同数据上的表现，差距可以缩小但不要求完全相等。' },
            { key: 'D', value: 'validation-trained', label: '因为模型也使用验证集更新了参数', wrongFeedback: '验证集用于评估，不应参与参数更新。' },
          ]}
          answer="balance"
          feedback={{ correct: '正确。好的增广策略是在增加有效变化与保持标签语义之间取得平衡。' }}
          onCheck={(result) => { if (result.ok) onComplete?.(); }}
        />
      )}
    </ContentBlock>
  );
}
