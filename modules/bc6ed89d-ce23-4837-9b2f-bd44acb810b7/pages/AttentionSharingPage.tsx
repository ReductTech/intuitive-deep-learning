import { useState } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
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
  return <svg shuku-edit-id="e-f72c8fc4-9579-4b1c-88ec-f21cc95861b0" className="ash-diagram" viewBox="0 0 390 540" role="img" aria-label={`${name}：8 个 Q 头，${groups} 组 K、V；每 ${groupSize} 个 Q 头使用同一组 K、V`}>
    {QUERY_X.map((x, head) => <line shuku-edit-id="e-0a3a9434-c0ab-43c5-aa0f-090ac4544daf" className="ash-connection" x1={kvX[Math.floor(head / groupSize)]} y1="300" x2={x} y2="380" key={`connection-${head}`} />)}
    {kvX.map((x, group) => <g shuku-edit-id="e-77b60db0-8ea1-4c83-94d6-22a615c4617f" key={`kv-${group}`}>
      <rect shuku-edit-id="e-af0ff188-6822-48ea-82db-b69319f54b52" className="ash-block ash-block--v" x={x - 14} y="100" width="28" height="82" rx="3" />
      <rect shuku-edit-id="e-7bf73ccc-d468-48fe-ac48-8d89c4aedba2" className="ash-block ash-block--k" x={x - 14} y="218" width="28" height="82" rx="3" />
    </g>)}
    {QUERY_X.map((x, head) => <rect shuku-edit-id="e-7573ce61-32a1-4d8e-a8a1-8823a7e2b571" className="ash-block ash-block--q" x={x - 14} y="380" width="28" height="82" rx="3" key={`q-${head}`} />)}
  </svg>;
}

export function AttentionSharingPage() {
  const [showQuestion, setShowQuestion] = useState(false);
  if (showQuestion) return <section shuku-edit-id="e-ef52b25a-7075-443d-94c8-3bf9abf95f5c" className="ash-slide ash-slide--question" aria-label="减少 KV 头后的问题">
    <Typography shuku-edit-id="e-12925c10-5c43-4413-9ec2-0c4aa5a34f25" as="p" variant="display" align="center" className="ash-question" aria-live="polite">
      <span shuku-edit-id="e-e14f2ae9-94d0-43c8-8e4c-9718dc5486e7">但 KV 头数减少，</span>
      <span shuku-edit-id="e-e97de2e2-52e5-4611-93d4-07e3161ad552">表达能力受到更强约束，影响模型质量。</span>
      <span shuku-edit-id="e-fec0db76-3925-4ac5-ba99-08d04c785bb8">那我们应该怎么办呢？</span>
    </Typography>
  </section>;
  return <section shuku-edit-id="e-cc4215cc-7b17-499a-9a47-c1951cd1d037" className="ash-slide" aria-label="第十五页：MHA、GQA、MQA 的 KV 共享方式对比">
    <header shuku-edit-id="e-82f5dae1-df1a-4863-939f-9cddcd0c24d7" className="ash-header">
      <Typography shuku-edit-id="e-63f3b33b-44f5-457a-a99d-fc51f10efb64" as="h1" variant="h1">MHA、GQA、MQA 的 K、V 共享方式</Typography>
      <Typography shuku-edit-id="e-71db2c1b-2197-477a-8290-df431154d7a1" as="p" variant="bodySmall" tone="muted">以 8 个 Q 头为例。</Typography>
    </header>
    <main shuku-edit-id="e-f01c3606-4b29-4de4-b9f5-7e2e89796a94" className="ash-comparison">
      <div shuku-edit-id="e-b7c441b2-5f4b-4e0c-9087-9357cc9e7c69" className="ash-row-labels" aria-hidden="true">
        <Typography shuku-edit-id="e-08718ef7-8284-4aea-96a8-7237de625b99" as="strong" variant="h3" className="ash-label-v">值 V</Typography>
        <Typography shuku-edit-id="e-964c4327-e6c4-4328-9fef-2922eb2609a2" as="strong" variant="h3" className="ash-label-k">键 K</Typography>
        <Typography shuku-edit-id="e-d388b06c-41f9-4858-9819-9c3d7d286e22" as="strong" variant="h3" className="ash-label-q">查询 Q</Typography>
      </div>
      {STRUCTURES.map(structure => <div shuku-edit-id="e-62dab784-5f48-453b-82c2-10ab2617b5fb" className="ash-structure" key={structure.name}>
        <div shuku-edit-id="e-a8d7cfb5-df04-4249-adbb-fbb632550fce" className="ash-structure-title">
          <Typography shuku-edit-id="e-5bdeabed-708d-4d0f-93e9-1f24acebe930" as="h2" variant="h2">{structure.name}</Typography>
          <Typography shuku-edit-id="e-96f467f6-94db-4b93-b836-cd269f853945" as="span" variant="bodySmall" tone="muted">{structure.fullName}</Typography>
        </div>
        <SharingDiagram groups={structure.groups} name={structure.name} />
        <div shuku-edit-id="e-0fa8b810-5b1c-438a-86d4-87113d65595b" className="ash-caption">
          <Typography shuku-edit-id="e-58e3117a-8ee9-4260-8ff1-26d29d9870ed" as="strong" variant="h3">{structure.caption}</Typography>
          <Typography shuku-edit-id="e-c78a0cff-da67-4da9-af71-36572b7bfac6" as="span" variant="body" tone="muted">{structure.groups} 组 K/V</Typography>
        </div>
      </div>)}
    </main>
    <footer shuku-edit-id="e-5789f7e2-0c1a-4e2f-a6d5-387efdd13ec3" className="ash-footer"><Typography shuku-edit-id="e-73a5cea4-3674-4315-a9e7-a553c4cbebbb" as="p" variant="h3">为减少 KV Cache 显存占用，逐步减少 KV 头数。</Typography><Button variant="primary" onClick={event => { event.stopPropagation(); setShowQuestion(true); }}>下一步 →</Button></footer>
  </section>;
}
