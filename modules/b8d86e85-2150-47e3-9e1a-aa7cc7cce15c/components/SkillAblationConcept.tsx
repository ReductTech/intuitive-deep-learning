import { Typography } from "@shuku/course-style/react";
import { EvaluationSkillDemo } from './EvaluationSkillDemo';
import { EvolutionSkillDemo } from './EvolutionSkillDemo';
import './SkillAblationConcept.css';

const routingDocuments = ['图表', '训练', '推理', '问答', '大模型', '素材'];


function RoutingDocument({ ghost = false }: { ghost?: boolean }) {
  return <svg shuku-edit-id="e-3912b748-4017-4e7c-842a-882595edc7f2" className={`cg-route-document${ghost ? ' is-ghost' : ''}`} viewBox="0 0 56 64" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path shuku-edit-id="e-c6b4d29a-9833-4fc5-b7c2-2615427d8f8e" d="M10 4h23l13 13v43H10ZM33 4v14h13M19 30h18M19 39h18M19 48h12"/></svg>;
}


export function SkillAblationConcept({ kind }: { kind: 'route' | 'evaluation' | 'evolution' }) {

  if (kind === 'route') {
    return <div shuku-edit-id="e-a42a54c0-9a0e-4f7d-9aee-13efb1e9fa4b" className="cg-route-simulation">
      <Typography shuku-edit-id="e-4c277667-056a-4f27-9722-500d114f59cc" variant="h3" tone="inherit" className="cg-route-task">任务：做<Typography shuku-edit-id="e-beef96ca-361a-48d0-af6f-de60894551a9" as="span" variant="h3" tone="inherit" className="cg-route-accent">图表</Typography></Typography>
      <div shuku-edit-id="e-84b078a9-a3bd-4a1b-8e95-e438a5765a34" className="cg-route-row">
        <Typography shuku-edit-id="e-9a668bbe-d560-40c2-a0d9-86d831c285db" variant="h3" tone="inherit" className="cg-route-row-label">无路由</Typography>
        <div shuku-edit-id="e-4eddb131-5df3-4343-b881-cc57850bc18e" className="cg-route-documents" role="group" aria-label="全量加载六项能力说明">{routingDocuments.map((name, index) => <div shuku-edit-id="e-67ed7c95-4047-44c2-900c-7512c0190793" key={name} className={index === 0 ? 'cg-route-document-item is-needed' : 'cg-route-document-item'}><RoutingDocument/><Typography shuku-edit-id="e-944fca78-7f50-4f50-9972-36cf42ddca2a" variant="body" tone="inherit">{name}</Typography></div>)}</div>
        <div shuku-edit-id="e-8611c4cb-2921-4430-bb56-bfde7b4e4d17" className="cg-route-amount"><Typography shuku-edit-id="e-1d7134a5-0e10-468b-8fcc-ca610285c40f" variant="display" tone="inherit">8,000</Typography><Typography shuku-edit-id="e-5929fcd3-04e2-4214-a696-b3f51391f3c2" variant="body" tone="muted">Token</Typography></div>
      </div>
      <div shuku-edit-id="e-78eac4d6-bbce-4a17-9273-14ad90bcffb0" className="cg-route-row is-routed">
        <Typography shuku-edit-id="e-db4128ee-a34c-4c0f-925a-d989645e5d3f" variant="h3" tone="inherit" className="cg-route-row-label">有路由</Typography>
        <div shuku-edit-id="e-159a87f6-e38c-431e-84fc-e4b57dc6aa3b" className="cg-route-documents" role="group" aria-label="只加载图表说明，其余五项不加载">
          <div shuku-edit-id="e-7e43a50c-6a68-45f6-8f74-f2682b5029b1" className="cg-route-document-item is-needed"><RoutingDocument/><Typography shuku-edit-id="e-f7e024c5-42dc-4e0e-9cad-d223d2403b10" variant="body" tone="inherit">图表</Typography></div>
          <div shuku-edit-id="e-c5a878ef-f7ba-47b1-9195-5ee4748cbb2b" className="cg-route-skipped"><div shuku-edit-id="e-49dc99c7-1461-462c-8c73-6202b9b82e59" className="cg-route-ghosts">{routingDocuments.slice(1).map(name => <RoutingDocument key={name} ghost/>)}</div><Typography shuku-edit-id="e-df1f78e3-155e-4719-a58c-5f95efbacf3c" variant="body" tone="muted">其余 5 项不加载</Typography></div>
        </div>
        <div shuku-edit-id="e-4d849889-6e7a-466f-ba89-e2ac98d580a4" className="cg-route-amount cg-route-accent"><Typography shuku-edit-id="e-6897c42e-0a31-4a55-a89a-e021542dfcb9" variant="display" tone="inherit">3,200</Typography><Typography shuku-edit-id="e-40f5d74f-a274-4c0a-9743-2a9b11a6914f" variant="body" tone="muted">Token</Typography></div>
      </div>
      <div shuku-edit-id="e-a3c2cbee-f6ff-43d5-b973-1525d042c6da" className="cg-route-result"><Typography shuku-edit-id="e-7ab5ada8-4c8d-45fb-9ce4-e85ca7331265" variant="body" tone="inherit">相同任务，少读无关说明</Typography><Typography shuku-edit-id="e-66c4dbb1-14e3-4da9-becd-e731bd933348" variant="h2" tone="inherit" className="cg-route-accent">模拟节省 60%</Typography></div>
      <Typography shuku-edit-id="e-553ad07c-24d3-4cd8-a14a-c46acbb174dd" variant="bodySmall" tone="muted" className="cg-route-note">上下文 Token 示意，含路由开销</Typography>
    </div>;
  }
  if (kind === 'evaluation') return <EvaluationSkillDemo/>;
  return <EvolutionSkillDemo/>;
}
