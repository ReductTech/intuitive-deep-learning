import { useState } from 'react';
import { Button, Typography } from '../../shared/react';
import './AttentionSharingPage.css';

const STRUCTURES = [
  { name: 'MHA', fullName: 'Multi-head', groups: 8, caption: '每头独立' },
  { name: 'GQA', fullName: 'Grouped-query', groups: 4, caption: '分组共享' },
  { name: 'MQA', fullName: 'Multi-query', groups: 1, caption: '全部共享' },
] as const;
const QUERY_X = Array.from({ length: 8 }, (_, index) => 34 + index * 46);

function SharingDiagram({ groups, name }: { groups: number; name: string }) {
  const groupSize = 8 / groups;
  const kvX = Array.from({ length: groups }, (_, group) =>
    (QUERY_X[group * groupSize] + QUERY_X[(group + 1) * groupSize - 1]) / 2);
  return <svg className="ash-diagram" viewBox="0 0 390 540" role="img" aria-label={`${name}：8 个 Q 头，${groups} 组 K、V；每 ${groupSize} 个 Q 头使用同一组 K、V`}>
    {QUERY_X.map((x, head) => <line className="ash-connection" x1={kvX[Math.floor(head / groupSize)]} y1="300" x2={x} y2="380" key={`connection-${head}`} />)}
    {kvX.map((x, group) => <g key={`kv-${group}`}>
      <rect className="ash-block ash-block--v" x={x - 14} y="100" width="28" height="82" rx="3" />
      <rect className="ash-block ash-block--k" x={x - 14} y="218" width="28" height="82" rx="3" />
    </g>)}
    {QUERY_X.map((x, head) => <rect className="ash-block ash-block--q" x={x - 14} y="380" width="28" height="82" rx="3" key={`q-${head}`} />)}
  </svg>;
}

export function AttentionSharingPage() {
  const [showQuestion, setShowQuestion] = useState(false);
  if (showQuestion) return <section className="ash-slide ash-slide--question" aria-label="减少 KV 头后的问题">
    <Typography as="p" variant="display" align="center" className="ash-question" aria-live="polite">
      <span>但 KV 头数减少，</span>
      <span>表达能力受到更强约束，影响模型质量。</span>
      <span>那我们应该怎么办呢？</span>
    </Typography>
  </section>;
  return <section className="ash-slide" aria-label="第十五页：MHA、GQA、MQA 的 KV 共享方式对比">
    <header className="ash-header">
      <Typography as="h1" variant="h1">MHA、GQA、MQA 的 K、V 共享方式</Typography>
      <Typography as="p" variant="bodySmall" tone="muted">以 8 个 Q 头为例。</Typography>
    </header>
    <main className="ash-comparison">
      <div className="ash-row-labels" aria-hidden="true">
        <Typography as="strong" variant="h3" className="ash-label-v">值 V</Typography>
        <Typography as="strong" variant="h3" className="ash-label-k">键 K</Typography>
        <Typography as="strong" variant="h3" className="ash-label-q">查询 Q</Typography>
      </div>
      {STRUCTURES.map(structure => <div className="ash-structure" key={structure.name}>
        <div className="ash-structure-title">
          <Typography as="h2" variant="h2">{structure.name}</Typography>
          <Typography as="span" variant="bodySmall" tone="muted">{structure.fullName}</Typography>
        </div>
        <SharingDiagram groups={structure.groups} name={structure.name} />
        <div className="ash-caption">
          <Typography as="strong" variant="h3">{structure.caption}</Typography>
          <Typography as="span" variant="body" tone="muted">{structure.groups} 组 K/V</Typography>
        </div>
      </div>)}
    </main>
    <footer className="ash-footer"><Typography as="p" variant="h3">为减少 KV Cache 显存占用，逐步减少 KV 头数。</Typography><Button variant="primary" onClick={event => { event.stopPropagation(); setShowQuestion(true); }}>下一步 →</Button></footer>
  </section>;
}
