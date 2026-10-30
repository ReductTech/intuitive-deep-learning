import { useId } from 'react';
import { Button, Typography, type LessonStepContext } from '../../shared/react';
import { StepSequenceControl, useStepSequence } from '../components/LessonVisuals';
import { rainImage as sourceImage } from '../media';
import './LongRangePage.css';

// A 12×7 feature grid. Each 3×3, stride-1 convolution advances influence
// by one cell (no dilation/pooling). Target displacement is (4, -1).
const grid = { columns: 12, rows: 7, source: { x: 4, y: 4 }, target: { x: 8, y: 3 } };
const lastLayer = Math.max(Math.abs(grid.target.x - grid.source.x), Math.abs(grid.target.y - grid.source.y));

function ComparisonImage({ kind, layer }: { kind: 'cnn' | 'vit'; layer: number }) {
  const local = kind === 'cnn';
  return <div className="vlm-range-image" role="img" aria-label={local
    ? `CNN 局部传播示意：${layer === 0 ? '尚未传播' : `经过 ${layer} 层`}${layer === lastLayer ? '，已覆盖龙猫区域' : '，尚未覆盖龙猫区域'}`
    : `ViT 全局自注意力示意：${layer === 0 ? '等待比较' : '第 1 层即可关联两个区域'}`}>
    <img src={sourceImage} alt="" />
    {local && <div className="vlm-range-grid" aria-hidden="true">
      {Array.from({ length: grid.columns * grid.rows }, (_, index) => {
        const x = index % grid.columns, y = Math.floor(index / grid.columns);
        const distance = Math.max(Math.abs(x - grid.source.x), Math.abs(y - grid.source.y));
        return <div key={index} className={layer > 0 && distance <= layer ? 'is-reached' : undefined} />;
      })}
    </div>}
    {!local && layer > 0 && <svg className="vlm-range-link" viewBox="0 0 1200 700" preserveAspectRatio="none" aria-hidden="true">
      <path d="M 450 450 Q 650 120 850 350" />
      <path d="M 830 321 L 850 350 L 816 348" />
    </svg>}
    {[grid.source, grid.target].map((point, index) => <div key={index} aria-hidden="true"
      className={`vlm-range-marker ${index === 0 ? 'is-source' : 'is-target'} ${index === 1 && (local ? layer === lastLayer : layer > 0) ? 'is-linked' : ''}`}
      style={{ left: `${point.x / grid.columns * 100}%`, top: `${point.y / grid.rows * 100}%`, width: `${100 / grid.columns}%`, height: `${100 / grid.rows}%` }} />)}
  </div>;
}

export function LongRangePage({ context }: { context: LessonStepContext }) {
  const titleId = useId();
  // Initial grid plus one visible expansion per convolution layer.
  const sequence = useStepSequence(lastLayer + 1);
  const layer = Math.min(sequence.step, lastLayer);
  return <article className="vlm-range-page ng-ppt-slide-surface" aria-labelledby={titleId} data-layer={layer}
    onKeyDown={event => { if (event.target instanceof HTMLButtonElement && event.key === ' ') event.stopPropagation(); }}>
    <header className="vlm-range-header">
      <Typography variant="bodySmall" tone="accent">ViT / 02　图块之间的信息交换</Typography>
      <Typography as="h1" variant="h1" id={titleId}>女孩和龙猫相隔很远，信息要走几步？</Typography>
    </header>
    <div className="vlm-range-comparison" ref={sequence.hostRef}>
      <section className="vlm-range-column" aria-label="CNN 局部传播">
        <Typography as="h2" variant="h3">CNN：每层混合邻域特征</Typography>
        <ComparisonImage kind="cnn" layer={layer} />
        <Typography variant="body" tone="accent" aria-live="polite">{layer === 0 ? '从女孩所在区域出发' : `第 ${layer} 层 · ${layer === lastLayer ? '终于覆盖龙猫区域' : '信息再向邻域传一步'}`}</Typography>
        <Typography variant="bodySmall" tone="muted">CNN（卷积神经网络）用局部滤波提取特征；本例每层扩 1 格。</Typography>
      </section>
      <section className="vlm-range-column" aria-label="ViT 全局关联">
        <Typography as="h2" variant="h3">ViT：同一层直接联系</Typography>
        <ComparisonImage kind="vit" layer={layer} />
        <Typography variant="body" tone="accent" aria-live="polite">{layer === 0 ? '比较同样的两个图像区域' : '第 1 层 · 已可直接关联'}</Typography>
        <Typography variant="bodySmall" tone="muted">一层可直连；是否关注仍需学习。</Typography>
      </section>
    </div>
    <footer className="vlm-range-footer">
      <Typography variant="body" tone="accent">局部卷积逐层传递；全局注意力允许两个 Token 直接联系。</Typography>
      <div className="vlm-options"><StepSequenceControl step={sequence.step} steps={sequence.steps} onPrevious={sequence.previous} onNext={sequence.next} label="传播范围逐步演示" /><Button variant="primary" onClick={context.complete} disabled={context.isComplete}><Typography as="span" variant="bodySmall" tone="inherit">{context.isComplete ? '已完成本页' : '继续学习'}</Typography></Button></div>
    </footer>
  </article>;
}
