import { Typography } from "@shuku/course-style/react";
import './AttentionReadingFlow.css';
export function AttentionReadingFlow({active='all'}:{active?:'score'|'weight'|'all'}) {
  const steps=[{id:'score',label:'Q、K → 匹配分数 s'},{id:'weight',label:'分数 s → 权重 w → 汇聚 V → 结果 r'}];
  return <ol shuku-edit-id="e-9a75231b-30ce-4a74-8b19-3eea8b002506" className="attn-reading-flow" aria-label="注意力的两个阶段">
    {steps.map((step,i)=>{const current=active===step.id;const complete=active==='weight'&&i===0;return <li shuku-edit-id="e-bdf2ea84-6346-4a7b-b9fe-38dd269cccfb" key={step.id} className={'attn-reading-step'+(current?' is-current':complete?' is-complete':active==='all'?' is-overview':'')} aria-current={current?'step':undefined}>
      <Typography shuku-edit-id="e-b6798782-c078-4214-961f-b21aeb616059" as="span" variant="bodySmall" tone="inherit">{step.label}</Typography>
    </li>;})}
  </ol>;
}
