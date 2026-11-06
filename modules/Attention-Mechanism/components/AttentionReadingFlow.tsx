import { Typography } from '../../shared/react';
import './AttentionReadingFlow.css';
export function AttentionReadingFlow({active='all'}:{active?:'score'|'weight'|'all'}) {
  const steps=[{id:'score',label:'Q、K → 匹配分数 s'},{id:'weight',label:'分数 s → 权重 w → 汇聚 V → 结果 r'}];
  return <ol className="attn-reading-flow" aria-label="注意力的两个阶段">
    {steps.map((step,i)=>{const current=active===step.id;const complete=active==='weight'&&i===0;return <li key={step.id} className={'attn-reading-step'+(current?' is-current':complete?' is-complete':active==='all'?' is-overview':'')} aria-current={current?'step':undefined}>
      <Typography as="span" variant="bodySmall" tone="inherit">{step.label}</Typography>
    </li>;})}
  </ol>;
}
