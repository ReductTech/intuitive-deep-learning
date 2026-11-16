import { useId } from 'react';
import { Button, Typography, type LessonStepContext } from "@shuku/course-style/react";
import { StepSequenceControl, useStepSequence } from '../components/LessonVisuals';
import { rainImage as sourceImage } from '../media';
import './LongRangePage.css';

// A 12×7 feature grid. Each 3×3, stride-1 convolution advances influence
// by one cell (no dilation/pooling). Target displacement is (4, -1).
const grid = { columns: 12, rows: 7, source: { x: 4, y: 4 }, target: { x: 8, y: 3 } };
const lastLayer = Math.max(Math.abs(grid.target.x - grid.source.x), Math.abs(grid.target.y - grid.source.y));

function ComparisonImage({ kind, layer }: { kind: 'cnn' | 'vit'; layer: number }) {
  const local = kind === 'cnn';
  return <div shuku-edit-id="e-e229c13a-adf4-4880-892b-3e3273d8adc3" className="vlm-range-image" role="img" aria-label={local
    ? `CNN 局部传播示意：${layer === 0 ? '尚未传播' : `经过 ${layer} 层`}${layer === lastLayer ? '，已覆盖龙猫区域' : '，尚未覆盖龙猫区域'}`
    : `ViT 全局自注意力示意：${layer === 0 ? '等待比较' : '第 1 层即可关联两个区域'}`}>
    <img shuku-edit-id="e-67785866-f673-49d7-896b-d4100432d3c6" src={sourceImage} alt="" />
    {local && <div shuku-edit-id="e-9f727920-96ad-40d1-ac70-7d0c1d0ccb91" className="vlm-range-grid" aria-hidden="true">
      {Array.from({ length: grid.columns * grid.rows }, (_, index) => {
        const x = index % grid.columns, y = Math.floor(index / grid.columns);
        const distance = Math.max(Math.abs(x - grid.source.x), Math.abs(y - grid.source.y));
        return <div shuku-edit-id="e-67c9c773-0488-4fe5-bc71-e66cc100fb80" key={index} className={layer > 0 && distance <= layer ? 'is-reached' : undefined} />;
      })}
    </div>}
    {!local && layer > 0 && <svg shuku-edit-id="e-fcf4a8e2-a62d-4f36-a69c-4068431cf89f" className="vlm-range-link" viewBox="0 0 1200 700" preserveAspectRatio="none" aria-hidden="true">
      <path shuku-edit-id="e-119fa10d-3eb5-4c61-94d6-50bededc32e8" d="M 450 450 Q 650 120 850 350" />
      <path shuku-edit-id="e-e5d0e7f4-29b1-4a7b-aa09-d002cc3879ab" d="M 830 321 L 850 350 L 816 348" />
    </svg>}
    {[grid.source, grid.target].map((point, index) => <div shuku-edit-id="e-31b712d8-7ecf-46c5-838d-67295f17a088" key={index} aria-hidden="true"
      className={`vlm-range-marker ${index === 0 ? 'is-source' : 'is-target'} ${index === 1 && (local ? layer === lastLayer : layer > 0) ? 'is-linked' : ''}`}
      style={{ left: `${point.x / grid.columns * 100}%`, top: `${point.y / grid.rows * 100}%`, width: `${100 / grid.columns}%`, height: `${100 / grid.rows}%` }} />)}
  </div>;
}

export function LongRangePage({ context }: { context: LessonStepContext }) {
  const titleId = useId();
  // Initial grid plus one visible expansion per convolution layer.
  const sequence = useStepSequence(lastLayer + 1);
  const layer = Math.min(sequence.step, lastLayer);
  return <article shuku-edit-id="e-383ca57c-84e7-4f89-b0bc-2f6a2dda442f" className="vlm-range-page ng-ppt-slide-surface" aria-labelledby={titleId} data-layer={layer}
    onKeyDown={event => { if (event.target instanceof HTMLButtonElement && event.key === ' ') event.stopPropagation(); }}>
    <header shuku-edit-id="e-1de0afca-6fc0-49c3-bb7d-b7f857150776" className="vlm-range-header">
      <Typography shuku-edit-id="e-c4f36235-2214-4428-9476-d99d7a0cac37" variant="bodySmall" tone="accent">ViT / 02　图块之间的信息交换</Typography>
      <Typography shuku-edit-id="e-79faceba-21f2-44d1-851b-19848254b6f6" as="h1" variant="h1" id={titleId}>女孩和龙猫相隔很远，信息要走几步？</Typography>
    </header>
    <div shuku-edit-id="e-df17294b-7c4c-46e2-ac58-1e148df48164" className="vlm-range-comparison" ref={sequence.hostRef}>
      <section shuku-edit-id="e-7234d4ba-39b2-4fac-8c9c-cf1ec02a3626" className="vlm-range-column" aria-label="CNN 局部传播">
        <Typography shuku-edit-id="e-4abdf868-5d2a-414a-a309-c99b8bc98b64" as="h2" variant="h3">CNN：每层混合邻域特征</Typography>
        <ComparisonImage kind="cnn" layer={layer} />
        <Typography shuku-edit-id="e-8010e7f6-18a9-4dee-9a46-5cafb4ce5ef7" variant="body" tone="accent" aria-live="polite">{layer === 0 ? '从女孩所在区域出发' : `第 ${layer} 层 · ${layer === lastLayer ? '终于覆盖龙猫区域' : '信息再向邻域传一步'}`}</Typography>
        <Typography shuku-edit-id="e-bf9ef1d5-c1b2-4cc6-b28d-c4354e2f0302" variant="bodySmall" tone="muted">CNN（卷积神经网络）用局部滤波提取特征；本例每层扩 1 格。</Typography>
      </section>
      <section shuku-edit-id="e-e65085c4-10fb-485e-9ee9-f9f67cc50e71" className="vlm-range-column" aria-label="ViT 全局关联">
        <Typography shuku-edit-id="e-c1a42dc5-e986-46bb-98af-3e9e6140941b" as="h2" variant="h3">ViT：同一层直接联系</Typography>
        <ComparisonImage kind="vit" layer={layer} />
        <Typography shuku-edit-id="e-97128b6c-d35d-4be9-903a-99dc83bac282" variant="body" tone="accent" aria-live="polite">{layer === 0 ? '比较同样的两个图像区域' : '第 1 层 · 已可直接关联'}</Typography>
        <Typography shuku-edit-id="e-e24c3539-4e89-4969-bd42-b17319d70b1f" variant="bodySmall" tone="muted">一层可直连；是否关注仍需学习。</Typography>
      </section>
    </div>
    <footer shuku-edit-id="e-fe0df72c-f3a4-4b84-a408-38979c9ead7e" className="vlm-range-footer">
      <Typography shuku-edit-id="e-c71bea10-ff68-487f-92ff-edf773196606" variant="body" tone="accent">局部卷积逐层传递；全局注意力允许两个 Token 直接联系。</Typography>
      <div shuku-edit-id="e-ccf7799e-b1ce-4960-bd53-b3938bbb2c55" className="vlm-options"><StepSequenceControl step={sequence.step} steps={sequence.steps} onPrevious={sequence.previous} onNext={sequence.next} label="传播范围逐步演示" /><Button variant="primary" onClick={context.complete} disabled={context.isComplete}><Typography shuku-edit-id="e-92392b1d-1169-4a76-9254-7073691f1395" as="span" variant="bodySmall" tone="inherit">{context.isComplete ? '已完成本页' : '继续学习'}</Typography></Button></div>
    </footer>
  </article>;
}
