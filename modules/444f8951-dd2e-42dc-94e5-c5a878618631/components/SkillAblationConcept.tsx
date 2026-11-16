import { Typography } from "@shuku/course-style/react";
import { EvaluationSkillDemo } from './EvaluationSkillDemo';
import { EvolutionSkillDemo } from './EvolutionSkillDemo';
import './SkillAblationConcept.css';

const routingDocuments = ['图表', '训练', '推理', '问答', '大模型', '素材'];


function RoutingDocument({ ghost = false }: { ghost?: boolean }) {
  return <svg shuku-edit-id="e-e28fe228-9cae-47d3-aa6e-ad43d15866f7" className={`cg-route-document${ghost ? ' is-ghost' : ''}`} viewBox="0 0 56 64" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path shuku-edit-id="e-6ebdb5f1-63d4-473c-a743-99c2baef8388" d="M10 4h23l13 13v43H10ZM33 4v14h13M19 30h18M19 39h18M19 48h12"/></svg>;
}


export function SkillAblationConcept({ kind }: { kind: 'route' | 'evaluation' | 'evolution' }) {

  if (kind === 'route') {
    return <div shuku-edit-id="e-bd8c023c-26a9-4096-b5d4-55ac6f11d99a" className="cg-route-simulation">
      <Typography shuku-edit-id="e-378af5c9-2d1f-47bb-a1fb-c804cff85721" variant="h3" tone="inherit" className="cg-route-task">任务：做<Typography shuku-edit-id="e-91a99571-027a-4cdd-acd4-acf8fa6598af" as="span" variant="h3" tone="inherit" className="cg-route-accent">图表</Typography></Typography>
      <div shuku-edit-id="e-834f40a7-cfa1-4ddd-93a7-fcec991e9742" className="cg-route-row">
        <Typography shuku-edit-id="e-1839cbb3-fca1-4e06-bdc5-8ef365d32dfd" variant="h3" tone="inherit" className="cg-route-row-label">无路由</Typography>
        <div shuku-edit-id="e-508906d3-77e3-48c5-9f2f-66534ddb41c4" className="cg-route-documents" role="group" aria-label="全量加载六项能力说明">{routingDocuments.map((name, index) => <div shuku-edit-id="e-d027004d-dcd1-4e7c-8746-98658e7e4ef5" key={name} className={index === 0 ? 'cg-route-document-item is-needed' : 'cg-route-document-item'}><RoutingDocument/><Typography shuku-edit-id="e-4b663e5b-aa4e-4a98-8dd1-e5564bb3c2c8" variant="body" tone="inherit">{name}</Typography></div>)}</div>
        <div shuku-edit-id="e-68f066ff-4975-4c25-a310-2ddf5f91be20" className="cg-route-amount"><Typography shuku-edit-id="e-1cc44f86-9726-4ea0-a511-e6038737cd99" variant="display" tone="inherit">8,000</Typography><Typography shuku-edit-id="e-72d5b91a-2468-4298-99ce-40b6209b9bb5" variant="body" tone="muted">Token</Typography></div>
      </div>
      <div shuku-edit-id="e-3b66f606-f7d1-42d1-9012-3db139bfd650" className="cg-route-row is-routed">
        <Typography shuku-edit-id="e-3759ded9-cc37-4112-91ee-a8d1d76c5a29" variant="h3" tone="inherit" className="cg-route-row-label">有路由</Typography>
        <div shuku-edit-id="e-a126c956-81a5-4d77-b09e-b53b184f4ef3" className="cg-route-documents" role="group" aria-label="只加载图表说明，其余五项不加载">
          <div shuku-edit-id="e-61042a52-c063-4d55-b983-fd88152609e7" className="cg-route-document-item is-needed"><RoutingDocument/><Typography shuku-edit-id="e-37bc6820-5cc0-465d-83b1-fae8eb9d3af3" variant="body" tone="inherit">图表</Typography></div>
          <div shuku-edit-id="e-99391cda-6aeb-4e92-b5b6-e7244d525ebe" className="cg-route-skipped"><div shuku-edit-id="e-01bafa08-b590-426e-b044-d96d42b44538" className="cg-route-ghosts">{routingDocuments.slice(1).map(name => <RoutingDocument key={name} ghost/>)}</div><Typography shuku-edit-id="e-11ef3fb0-b8d4-44db-b411-e4ca0810d911" variant="body" tone="muted">其余 5 项不加载</Typography></div>
        </div>
        <div shuku-edit-id="e-4a75a752-9aa4-4db8-80f6-83adce337d54" className="cg-route-amount cg-route-accent"><Typography shuku-edit-id="e-b432f09d-fe79-4118-99de-4d12bcb7275f" variant="display" tone="inherit">3,200</Typography><Typography shuku-edit-id="e-7bfab973-ac79-4b6f-ba15-306d6c20e5d9" variant="body" tone="muted">Token</Typography></div>
      </div>
      <div shuku-edit-id="e-e4304b6c-43fe-4d5c-be16-ab8fbed831b5" className="cg-route-result"><Typography shuku-edit-id="e-230ae21a-0172-4646-95f9-a86cb6a4b21b" variant="body" tone="inherit">相同任务，少读无关说明</Typography><Typography shuku-edit-id="e-c463ee05-ec55-4712-b10f-a6759c05097f" variant="h2" tone="inherit" className="cg-route-accent">模拟节省 60%</Typography></div>
      <Typography shuku-edit-id="e-592630d9-ca88-4653-85cd-a01284b10fa2" variant="bodySmall" tone="muted" className="cg-route-note">上下文 Token 示意，含路由开销</Typography>
    </div>;
  }
  if (kind === 'evaluation') return <EvaluationSkillDemo/>;
  return <EvolutionSkillDemo/>;
}
