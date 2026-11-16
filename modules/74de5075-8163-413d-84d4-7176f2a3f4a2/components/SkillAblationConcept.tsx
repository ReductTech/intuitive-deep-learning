import { Typography } from "@shuku/course-style/react";
import { EvaluationSkillDemo } from './EvaluationSkillDemo';
import { EvolutionSkillDemo } from './EvolutionSkillDemo';
import './SkillAblationConcept.css';

const routingDocuments = ['图表', '训练', '推理', '问答', '大模型', '素材'];


function RoutingDocument({ ghost = false }: { ghost?: boolean }) {
  return <svg shuku-edit-id="e-2c079af5-7c81-436c-a08f-747adc920b95" className={`cg-route-document${ghost ? ' is-ghost' : ''}`} viewBox="0 0 56 64" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path shuku-edit-id="e-6c4f7bb9-e81b-4f7e-96dc-2b39e58ac48e" d="M10 4h23l13 13v43H10ZM33 4v14h13M19 30h18M19 39h18M19 48h12"/></svg>;
}


export function SkillAblationConcept({ kind }: { kind: 'route' | 'evaluation' | 'evolution' }) {

  if (kind === 'route') {
    return <div shuku-edit-id="e-982cf642-7a31-4742-accc-35bea61009be" className="cg-route-simulation">
      <Typography shuku-edit-id="e-e44e50f4-26f6-4683-b5ab-8dafae5f10fb" variant="h3" tone="inherit" className="cg-route-task">任务：做<Typography shuku-edit-id="e-43043540-b1d5-42fe-a09c-543747e3e9e4" as="span" variant="h3" tone="inherit" className="cg-route-accent">图表</Typography></Typography>
      <div shuku-edit-id="e-90d9b8db-0cb1-49ba-841f-78981c98ce3e" className="cg-route-row">
        <Typography shuku-edit-id="e-765b4e14-499e-4b4e-b178-2a60f60f65d6" variant="h3" tone="inherit" className="cg-route-row-label">无路由</Typography>
        <div shuku-edit-id="e-51e8316d-d12e-4250-8533-92e534fdcfa2" className="cg-route-documents" role="group" aria-label="全量加载六项能力说明">{routingDocuments.map((name, index) => <div shuku-edit-id="e-ae7fa6ff-256f-4164-ba84-f0be23dc24fb" key={name} className={index === 0 ? 'cg-route-document-item is-needed' : 'cg-route-document-item'}><RoutingDocument/><Typography shuku-edit-id="e-a6ba90a1-dc13-40ac-b56e-0b6d50d466a5" variant="body" tone="inherit">{name}</Typography></div>)}</div>
        <div shuku-edit-id="e-ba1f44a5-c9d3-4814-9709-77b88d717e63" className="cg-route-amount"><Typography shuku-edit-id="e-499b5c7d-2084-417b-b4b0-9a3995f69993" variant="display" tone="inherit">8,000</Typography><Typography shuku-edit-id="e-905879c0-591f-45ee-bed4-908fec76ddd6" variant="body" tone="muted">Token</Typography></div>
      </div>
      <div shuku-edit-id="e-980a1962-d56d-407b-9ce2-c54804b7dd3d" className="cg-route-row is-routed">
        <Typography shuku-edit-id="e-a17b8d5f-04cc-4f02-97f9-6acf8ca23c4f" variant="h3" tone="inherit" className="cg-route-row-label">有路由</Typography>
        <div shuku-edit-id="e-82e7aaeb-53c5-4eb2-84b0-fc88eb4badd9" className="cg-route-documents" role="group" aria-label="只加载图表说明，其余五项不加载">
          <div shuku-edit-id="e-c14fabe9-d2a4-43e3-af24-955c4c1cf01f" className="cg-route-document-item is-needed"><RoutingDocument/><Typography shuku-edit-id="e-cadb2ee3-6128-42d9-a955-aa2f97177057" variant="body" tone="inherit">图表</Typography></div>
          <div shuku-edit-id="e-96b89265-aa5b-40d8-ab69-97dd9866d5c9" className="cg-route-skipped"><div shuku-edit-id="e-59771c92-7593-4076-b150-d336a4f5023b" className="cg-route-ghosts">{routingDocuments.slice(1).map(name => <RoutingDocument key={name} ghost/>)}</div><Typography shuku-edit-id="e-2c660f45-5b26-49e4-9dcd-fa6c880bf112" variant="body" tone="muted">其余 5 项不加载</Typography></div>
        </div>
        <div shuku-edit-id="e-f12def15-c834-48b4-b1db-fd0f63c4e11a" className="cg-route-amount cg-route-accent"><Typography shuku-edit-id="e-fbb655b1-70f8-4ef4-ad2e-0973bc05f2bd" variant="display" tone="inherit">3,200</Typography><Typography shuku-edit-id="e-0f630592-dbce-4c2c-81b1-7a1aedb3305b" variant="body" tone="muted">Token</Typography></div>
      </div>
      <div shuku-edit-id="e-c47d20f6-9bf1-4d0a-b609-8537045123f0" className="cg-route-result"><Typography shuku-edit-id="e-58bcde8f-cdd8-430e-90ed-fbefd73480c8" variant="body" tone="inherit">相同任务，少读无关说明</Typography><Typography shuku-edit-id="e-4949c304-7974-4791-aeeb-333183490dea" variant="h2" tone="inherit" className="cg-route-accent">模拟节省 60%</Typography></div>
      <Typography shuku-edit-id="e-f5918ffd-243c-40db-95d5-3ff1a8f965a8" variant="bodySmall" tone="muted" className="cg-route-note">上下文 Token 示意，含路由开销</Typography>
    </div>;
  }
  if (kind === 'evaluation') return <EvaluationSkillDemo/>;
  return <EvolutionSkillDemo/>;
}
