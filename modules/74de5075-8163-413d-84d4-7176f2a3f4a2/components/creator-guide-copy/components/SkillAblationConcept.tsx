import { Typography } from "@shuku/course-style/react";
import { EvaluationSkillDemo } from './EvaluationSkillDemo';
import { EvolutionSkillDemo } from './EvolutionSkillDemo';
import './SkillAblationConcept.css';

const routingDocuments = ['图表', '训练', '推理', '问答', '大模型', '素材'];


function RoutingDocument({ ghost = false }: { ghost?: boolean }) {
  return <svg shuku-edit-id="e-eff5f62e-8443-4cc7-8636-e9cb0c7a50bd" className={`aipe-replay-cg-route-document${ghost ? ' is-ghost' : ''}`} viewBox="0 0 56 64" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path shuku-edit-id="e-499126c6-8476-4dd9-8af9-a5ee8fd83324" d="M10 4h23l13 13v43H10ZM33 4v14h13M19 30h18M19 39h18M19 48h12"/></svg>;
}


export function SkillAblationConcept({ kind }: { kind: 'route' | 'evaluation' | 'evolution' }) {

  if (kind === 'route') {
    return <div shuku-edit-id="e-1c096d10-cea9-4cf7-bae4-856474897902" className="aipe-replay-cg-route-simulation">
      <Typography shuku-edit-id="e-30ae2242-2010-4c91-a07c-3fd0d9c88cc1" variant="h3" tone="inherit" className="aipe-replay-cg-route-task">任务：做<Typography shuku-edit-id="e-72a43334-469a-4f19-b977-b93f4a38b079" as="span" variant="h3" tone="inherit" className="aipe-replay-cg-route-accent">图表</Typography></Typography>
      <div shuku-edit-id="e-585c6728-805d-461d-bee4-3e4c48403e19" className="aipe-replay-cg-route-row">
        <Typography shuku-edit-id="e-f1d3559e-9c0d-4b90-8866-be0849c8de0e" variant="h3" tone="inherit" className="aipe-replay-cg-route-row-label">无路由</Typography>
        <div shuku-edit-id="e-8f396d08-e649-4dc9-9d60-951e416c40a7" className="aipe-replay-cg-route-documents" role="group" aria-label="全量加载六项能力说明">{routingDocuments.map((name, index) => <div shuku-edit-id="e-c9e6a160-d5f0-41c0-aaac-6472aa5b28ac" key={name} className={index === 0 ? 'aipe-replay-cg-route-document-item is-needed' : 'aipe-replay-cg-route-document-item'}><RoutingDocument/><Typography shuku-edit-id="e-07e17718-a6f1-4d38-939a-1bde6597ad95" variant="body" tone="inherit">{name}</Typography></div>)}</div>
        <div shuku-edit-id="e-303015b2-88cd-47e2-a7c7-54a412d13328" className="aipe-replay-cg-route-amount"><Typography shuku-edit-id="e-c7291094-2d76-43c3-a022-daaafdf918eb" variant="display" tone="inherit">8,000</Typography><Typography shuku-edit-id="e-e408d1bb-6259-4c5b-8fd9-cc4dd5720aa7" variant="body" tone="muted">Token</Typography></div>
      </div>
      <div shuku-edit-id="e-ad9b2f5f-4645-4a21-9a0d-69f67ab32c1d" className="aipe-replay-cg-route-row is-routed">
        <Typography shuku-edit-id="e-4ec505ac-4ac7-471b-8f93-3332f862cdbf" variant="h3" tone="inherit" className="aipe-replay-cg-route-row-label">有路由</Typography>
        <div shuku-edit-id="e-577a1d0d-58bd-4e71-8349-e504df781565" className="aipe-replay-cg-route-documents" role="group" aria-label="只加载图表说明，其余五项不加载">
          <div shuku-edit-id="e-03a8a3ba-0140-492a-9b07-624c980c1f0a" className="aipe-replay-cg-route-document-item is-needed"><RoutingDocument/><Typography shuku-edit-id="e-cca0a705-f5b0-408f-987b-6d460b9284c5" variant="body" tone="inherit">图表</Typography></div>
          <div shuku-edit-id="e-e8025038-248a-499a-aa75-cb7041139bd5" className="aipe-replay-cg-route-skipped"><div shuku-edit-id="e-59e9fda5-3796-4439-97c4-fefa4e4942bc" className="aipe-replay-cg-route-ghosts">{routingDocuments.slice(1).map(name => <RoutingDocument key={name} ghost/>)}</div><Typography shuku-edit-id="e-8ea11535-7be4-48d1-a292-8ecc022be4fb" variant="body" tone="muted">其余 5 项不加载</Typography></div>
        </div>
        <div shuku-edit-id="e-e099b9d3-b506-47a3-950b-86d19bf30a8a" className="aipe-replay-cg-route-amount aipe-replay-cg-route-accent"><Typography shuku-edit-id="e-2417472c-7aa4-486e-9d68-848f95e4cc4b" variant="display" tone="inherit">3,200</Typography><Typography shuku-edit-id="e-2c4ad95a-c5dc-4351-8ed8-bbc6530b626c" variant="body" tone="muted">Token</Typography></div>
      </div>
      <div shuku-edit-id="e-fe6b1a3a-2f4e-4444-8770-5229cf30c354" className="aipe-replay-cg-route-result"><Typography shuku-edit-id="e-f9768137-8a73-46ac-a958-9b4bd84abe72" variant="body" tone="inherit">相同任务，少读无关说明</Typography><Typography shuku-edit-id="e-4f1cc39b-5e1c-4fe8-a595-8be9d712e735" variant="h2" tone="inherit" className="aipe-replay-cg-route-accent">模拟节省 60%</Typography></div>
      <Typography shuku-edit-id="e-45a1f204-2fe8-4a0b-bca4-996ac7710b8b" variant="bodySmall" tone="muted" className="aipe-replay-cg-route-note">上下文 Token 示意，含路由开销</Typography>
    </div>;
  }
  if (kind === 'evaluation') return <EvaluationSkillDemo/>;
  return <EvolutionSkillDemo/>;
}
