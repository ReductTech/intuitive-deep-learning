import { Typography } from '../../../../shared/react';
import { EvaluationSkillDemo } from './EvaluationSkillDemo';
import { EvolutionSkillDemo } from './EvolutionSkillDemo';
import './SkillAblationConcept.css';

const routingDocuments = ['图表', '训练', '推理', '问答', '大模型', '素材'];


function RoutingDocument({ ghost = false }: { ghost?: boolean }) {
  return <svg className={`aipe-replay-cg-route-document${ghost ? ' is-ghost' : ''}`} viewBox="0 0 56 64" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 4h23l13 13v43H10ZM33 4v14h13M19 30h18M19 39h18M19 48h12"/></svg>;
}


export function SkillAblationConcept({ kind }: { kind: 'route' | 'evaluation' | 'evolution' }) {

  if (kind === 'route') {
    return <div className="aipe-replay-cg-route-simulation">
      <Typography variant="h3" tone="inherit" className="aipe-replay-cg-route-task">任务：做<Typography as="span" variant="h3" tone="inherit" className="aipe-replay-cg-route-accent">图表</Typography></Typography>
      <div className="aipe-replay-cg-route-row">
        <Typography variant="h3" tone="inherit" className="aipe-replay-cg-route-row-label">无路由</Typography>
        <div className="aipe-replay-cg-route-documents" role="group" aria-label="全量加载六项能力说明">{routingDocuments.map((name, index) => <div key={name} className={index === 0 ? 'aipe-replay-cg-route-document-item is-needed' : 'aipe-replay-cg-route-document-item'}><RoutingDocument/><Typography variant="body" tone="inherit">{name}</Typography></div>)}</div>
        <div className="aipe-replay-cg-route-amount"><Typography variant="display" tone="inherit">8,000</Typography><Typography variant="body" tone="muted">Token</Typography></div>
      </div>
      <div className="aipe-replay-cg-route-row is-routed">
        <Typography variant="h3" tone="inherit" className="aipe-replay-cg-route-row-label">有路由</Typography>
        <div className="aipe-replay-cg-route-documents" role="group" aria-label="只加载图表说明，其余五项不加载">
          <div className="aipe-replay-cg-route-document-item is-needed"><RoutingDocument/><Typography variant="body" tone="inherit">图表</Typography></div>
          <div className="aipe-replay-cg-route-skipped"><div className="aipe-replay-cg-route-ghosts">{routingDocuments.slice(1).map(name => <RoutingDocument key={name} ghost/>)}</div><Typography variant="body" tone="muted">其余 5 项不加载</Typography></div>
        </div>
        <div className="aipe-replay-cg-route-amount aipe-replay-cg-route-accent"><Typography variant="display" tone="inherit">3,200</Typography><Typography variant="body" tone="muted">Token</Typography></div>
      </div>
      <div className="aipe-replay-cg-route-result"><Typography variant="body" tone="inherit">相同任务，少读无关说明</Typography><Typography variant="h2" tone="inherit" className="aipe-replay-cg-route-accent">模拟节省 60%</Typography></div>
      <Typography variant="bodySmall" tone="muted" className="aipe-replay-cg-route-note">上下文 Token 示意，含路由开销</Typography>
    </div>;
  }
  if (kind === 'evaluation') return <EvaluationSkillDemo/>;
  return <EvolutionSkillDemo/>;
}
