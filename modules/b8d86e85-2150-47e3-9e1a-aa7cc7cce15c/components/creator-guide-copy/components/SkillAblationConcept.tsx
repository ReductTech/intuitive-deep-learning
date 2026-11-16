import { Typography } from "@shuku/course-style/react";
import { EvaluationSkillDemo } from './EvaluationSkillDemo';
import { EvolutionSkillDemo } from './EvolutionSkillDemo';
import './SkillAblationConcept.css';

const routingDocuments = ['图表', '训练', '推理', '问答', '大模型', '素材'];


function RoutingDocument({ ghost = false }: { ghost?: boolean }) {
  return <svg shuku-edit-id="e-67304ad6-ae1d-4bf6-9d27-a6e1ad68b9b7" className={`aipe-replay-cg-route-document${ghost ? ' is-ghost' : ''}`} viewBox="0 0 56 64" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path shuku-edit-id="e-4d2855f4-14bb-4971-9c69-7c286498c6fc" d="M10 4h23l13 13v43H10ZM33 4v14h13M19 30h18M19 39h18M19 48h12"/></svg>;
}


export function SkillAblationConcept({ kind }: { kind: 'route' | 'evaluation' | 'evolution' }) {

  if (kind === 'route') {
    return <div shuku-edit-id="e-96139880-4003-48b3-bc8a-010450aa86ea" className="aipe-replay-cg-route-simulation">
      <Typography shuku-edit-id="e-18d70b2a-b50f-4f26-949d-1930485b3960" variant="h3" tone="inherit" className="aipe-replay-cg-route-task">任务：做<Typography shuku-edit-id="e-aef6dc1d-6ed7-4e7f-a497-0908003677c7" as="span" variant="h3" tone="inherit" className="aipe-replay-cg-route-accent">图表</Typography></Typography>
      <div shuku-edit-id="e-d4845cec-4786-45c9-976f-8be406b2ffbe" className="aipe-replay-cg-route-row">
        <Typography shuku-edit-id="e-e5387df9-d6c0-421e-8969-8a3442fc9929" variant="h3" tone="inherit" className="aipe-replay-cg-route-row-label">无路由</Typography>
        <div shuku-edit-id="e-5d9e9d41-4529-4d32-ba5a-bb87b4039278" className="aipe-replay-cg-route-documents" role="group" aria-label="全量加载六项能力说明">{routingDocuments.map((name, index) => <div shuku-edit-id="e-896e3276-e2a0-4922-89fe-f42cac78534d" key={name} className={index === 0 ? 'aipe-replay-cg-route-document-item is-needed' : 'aipe-replay-cg-route-document-item'}><RoutingDocument/><Typography shuku-edit-id="e-8e29afac-685b-43e9-9a18-b3193d3f3347" variant="body" tone="inherit">{name}</Typography></div>)}</div>
        <div shuku-edit-id="e-e0a37daf-bc10-420e-9d79-a28c4863d9ff" className="aipe-replay-cg-route-amount"><Typography shuku-edit-id="e-3936d638-8af6-4d2e-abea-badb4932bebf" variant="display" tone="inherit">8,000</Typography><Typography shuku-edit-id="e-ceff34a7-586e-4b57-b69f-c36c0a864477" variant="body" tone="muted">Token</Typography></div>
      </div>
      <div shuku-edit-id="e-1f3e7957-e738-4a10-a829-3f3a5426a590" className="aipe-replay-cg-route-row is-routed">
        <Typography shuku-edit-id="e-bc505d14-8178-4d43-8746-118c2081a158" variant="h3" tone="inherit" className="aipe-replay-cg-route-row-label">有路由</Typography>
        <div shuku-edit-id="e-87524b82-d9f7-4524-bf52-90d3b878b975" className="aipe-replay-cg-route-documents" role="group" aria-label="只加载图表说明，其余五项不加载">
          <div shuku-edit-id="e-2a4ed835-6717-4d2f-aa33-1a84894eb421" className="aipe-replay-cg-route-document-item is-needed"><RoutingDocument/><Typography shuku-edit-id="e-b48f958c-3da9-4912-a047-90fd1ff6cfb4" variant="body" tone="inherit">图表</Typography></div>
          <div shuku-edit-id="e-7554d51f-4c79-48ab-8786-47bb7c597de8" className="aipe-replay-cg-route-skipped"><div shuku-edit-id="e-2d0bef0a-184a-4575-b25e-f0cba83197f4" className="aipe-replay-cg-route-ghosts">{routingDocuments.slice(1).map(name => <RoutingDocument key={name} ghost/>)}</div><Typography shuku-edit-id="e-a466869d-2390-430f-871c-d38bbccb713d" variant="body" tone="muted">其余 5 项不加载</Typography></div>
        </div>
        <div shuku-edit-id="e-2fa67761-3ae3-45b5-9897-95e36552f8da" className="aipe-replay-cg-route-amount aipe-replay-cg-route-accent"><Typography shuku-edit-id="e-5358d21b-2657-4119-a543-b6fe95013048" variant="display" tone="inherit">3,200</Typography><Typography shuku-edit-id="e-5e185e3c-a8d7-4287-b886-ba58383fea4b" variant="body" tone="muted">Token</Typography></div>
      </div>
      <div shuku-edit-id="e-86b81bd8-300b-44ec-8b0f-0e1e08419eca" className="aipe-replay-cg-route-result"><Typography shuku-edit-id="e-510dee48-aec9-43b7-9477-228da21f7ef6" variant="body" tone="inherit">相同任务，少读无关说明</Typography><Typography shuku-edit-id="e-af4f21e2-e8c5-4bc0-a41c-0309c9ed7324" variant="h2" tone="inherit" className="aipe-replay-cg-route-accent">模拟节省 60%</Typography></div>
      <Typography shuku-edit-id="e-e38925a0-335d-45a2-be2b-7abca9fef34e" variant="bodySmall" tone="muted" className="aipe-replay-cg-route-note">上下文 Token 示意，含路由开销</Typography>
    </div>;
  }
  if (kind === 'evaluation') return <EvaluationSkillDemo/>;
  return <EvolutionSkillDemo/>;
}
