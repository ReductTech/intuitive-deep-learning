import { useId, type ReactNode } from 'react';
import { UsersRound, Landmark, Network, Database, FileText, ChartNoAxesColumnIncreasing, Star, Check, TriangleAlert, ArrowUpRight } from 'lucide-react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './PaperQualityPage.css';

const references = [
  { label: 'AAAI 2025', text: 'From Words to Worth: Newborn Article Impact Prediction with LLM', url: 'https://doi.org/10.1609/aaai.v39i1.32106' },
  { label: 'ICLR 2026', text: 'NAIPv2: Debiased Pairwise Learning for Efficient Paper Quality Estimation', url: 'https://openreview.net/forum?id=rNl8XiSHiJ' },
];
const sources = [{Icon:UsersRound,text:'作者与机构'},{Icon:Landmark,text:'发表渠道'},{Icon:Network,text:'引用网络'},{Icon:Database,text:'历史记录'}];
function Copy({ children }: { children: ReactNode }) {
  return <Typography shuku-edit-id="e-b75f1a8f-47dc-4af5-ad01-ae7566463e8a" as="span" variant="bodySmall" tone="inherit">{children}</Typography>;
}
function Wires({ kind }: { kind: 'traditional' | 'single' | 'pair' }) {
  const id = 'paper-wire-' + useId().replaceAll(':', '');
  const paths = kind === 'traditional'
    ? ['M100 70V83H215V202', 'M330 70V83H215', 'M100 158V174H215', 'M330 158V174H215', 'M215 256V285']
    : kind === 'single' ? ['M215 76V145', 'M215 229V285']
    : ['M100 132V163', 'M330 132V163', 'M100 228V245', 'M330 228V245', 'M100 286V290Q100 294 112 294H199Q215 294 215 299', 'M330 286V290Q330 294 318 294H231Q215 294 215 299'];
  return <svg shuku-edit-id="e-5f870e3b-a3d4-45fb-94f5-2ed9ce5ea35f" className="aipe-method-wires" viewBox="0 0 430 340" preserveAspectRatio="none" aria-hidden="true">
    <defs shuku-edit-id="e-15fb1173-5024-4cb2-9470-4a14a5abaa75"><marker shuku-edit-id="e-0cd84790-e840-44f8-b96b-1cf0a3d34dd6" id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path shuku-edit-id="e-999c84b7-0641-4474-b007-116a305a9b8e" d="M1 1L9 5L1 9Z" fill="currentColor" /></marker></defs>
    {paths.map((d, i) => <path shuku-edit-id="e-c6a0327a-0e3c-4f07-a373-0215f78c4d61" key={d} d={d} fill="none" stroke="currentColor" strokeWidth="1.8" markerEnd={(kind !== 'traditional' || i === 0 || i === 4) ? 'url(#'+id+')' : undefined} />)}
  </svg>;
}
function Model({ pair = false }: { pair?: boolean }) {
  return <div shuku-edit-id="e-2dc4a75e-c376-457c-9d78-30f11bddecf0" className={'aipe-method-model' + (pair ? ' is-pair' : '')}><Typography shuku-edit-id="e-22a95313-2f8c-4c62-ba00-1bda22aca5cb" as="span" variant="body" tone="inherit">{pair ? '共享大语言模型' : '大语言模型'}</Typography></div>;
}
function Points({ warning = false, children }: { warning?: boolean; children: readonly string[] }) {
  const Icon = warning ? TriangleAlert : Check;
  return <div shuku-edit-id="e-fc2aac91-645b-4bf8-ba1f-81b1c5a1c9a9" className={'aipe-method-points' + (warning ? ' is-warning' : '')}>{children.map(text => <div shuku-edit-id="e-e61a8c79-dff2-4c18-8487-f7b3df068f07" key={text}><span shuku-edit-id="e-e5fbbd2a-e6d1-4541-a373-6084b0e4329a" className="aipe-method-point-icon"><Icon aria-hidden="true" /></span><Typography shuku-edit-id="e-4b65e1e3-8960-4d2e-b7f9-759bf5a49aef" as="span" variant="bodySmall" tone="accent"><strong shuku-edit-id="e-2bc04011-fbfb-42dc-a5f0-928c03608af2">{text}</strong></Typography></div>)}</div>;
}
export function PaperQualityPage() {
  return <ContentBlock shuku-edit-id="e-a4aed038-fa05-4936-a62b-63ac23c160b8" className="aipe-paper-method-page" headingLevel={1} title={outline.pages.find(page => page.id === '2bdb1f72-89f6-4d31-80e6-97ecd980a6ca')!.title}
    subtitle="团队首次提出基于大语言模型的后训练微调方法，支撑高质量筛选与个性化推荐" bodyClassName="aipe-paper-method-body">
    <div shuku-edit-id="e-5c4b51e8-b0a9-493b-a668-87761b08a3c0" className="aipe-method-columns">
      <section shuku-edit-id="e-4872d47d-e757-4ffc-9487-e25bb28472d2" className="aipe-method-column aipe-method-traditional" aria-label="传统预测方法">
        <header shuku-edit-id="e-d0784055-ef1e-41f5-bfa3-fc0af3153315"><Typography shuku-edit-id="e-82fafdb4-0671-4061-92df-9940456bb199" as="h2" variant="h3" tone="accent">传统预测方法</Typography><Typography shuku-edit-id="e-bd04fdda-936c-4bea-b9ac-49d37da656aa" variant="bodySmall" tone="muted">依赖外部信息</Typography></header>
        <div shuku-edit-id="e-d8db0f18-af34-4486-82df-b4e021ba4916" className="aipe-method-diagram aipe-method-external">
          <Wires kind="traditional" />
          <div shuku-edit-id="e-7952f917-8db5-46b9-9d24-3e33d94d0bc0" className="aipe-method-sources">{sources.map(({Icon,text}) => <div shuku-edit-id="e-1aa6a141-257d-423e-84d3-ba7e86098dc7" className="aipe-method-source" key={text}><Icon aria-hidden="true" /><Copy>{text}</Copy></div>)}</div>
          <div shuku-edit-id="e-d02b7f30-2daf-4639-bbfa-3b10deae2c29" className="aipe-method-predictor"><ChartNoAxesColumnIncreasing aria-hidden="true" /><Copy>预测模型</Copy></div>
          <div shuku-edit-id="e-821c44a6-6abb-4328-8a1c-70a484e50437" className="aipe-method-output"><ChartNoAxesColumnIncreasing aria-hidden="true" /><Copy>影响力预测</Copy></div>
        </div>
        <Points warning>{['外部信息可能缺失', '新论文缺少引用积累']}</Points>
      </section>
      <section shuku-edit-id="e-2a09c8b5-7e2c-4192-bfb2-c34943927236" className="aipe-method-column aipe-method-v1" aria-label="NAIPv1 影响力预测">
        <header shuku-edit-id="e-847cc9ba-03a9-428b-9730-fc3d1896fbd0"><Typography shuku-edit-id="e-47320e05-83da-4904-afe9-8305a88f59c3" as="h2" variant="h3" tone="accent">NAIPv1</Typography><Typography shuku-edit-id="e-80606b01-1f45-48b1-a7b4-4c243d98ed1c" variant="bodySmall" tone="muted">从内容预测潜在影响力</Typography></header>
        <div shuku-edit-id="e-38b2641f-93c0-4751-9486-0b6512b68c70" className="aipe-method-diagram aipe-method-single">
          <Wires kind="single" />
          <div shuku-edit-id="e-8d9d2588-a5ed-46d9-ab8a-66fc9c23c1b4" className="aipe-method-paper"><FileText aria-hidden="true" /><Copy>题目与摘要等<br shuku-edit-id="e-5d1831c5-7ca1-446a-9a4c-6eeb38549857"/>内部信息</Copy></div>
          <Model />
          <div shuku-edit-id="e-cc7fb75c-d97d-4dc9-8b9b-1171bba5148a" className="aipe-method-output"><ChartNoAxesColumnIncreasing aria-hidden="true" /><Copy>潜在影响力</Copy></div>
        </div>
        <Points>{['无需等待长期引用积累', '为新论文提供早期参考']}</Points>
      </section>
      <section shuku-edit-id="e-ebdbe39c-b72b-45f1-bf87-685cdf9cbf77" className="aipe-method-column aipe-method-v2" aria-label="NAIPv2 成对训练与单篇打分">
        <header shuku-edit-id="e-e019e582-aa11-4983-ac40-101a6e728b1e"><Typography shuku-edit-id="e-4aafbf34-f39e-4f18-8f9e-36799acd03c1" as="h2" variant="h3" tone="accent">NAIPv2</Typography><Typography shuku-edit-id="e-2e4c2b43-eb88-4b38-a90e-42ced89531d5" variant="bodySmall" tone="muted">学习相对质量，保留单篇打分</Typography></header>
        <div shuku-edit-id="e-47237c77-3bfb-4b8e-ae2c-c2ec8b6b3c6f" className="aipe-method-diagram aipe-method-pair">
          <Wires kind="pair" />
          <div shuku-edit-id="e-594c2b36-9bcd-4b8e-ba94-5108bd83569f" className="aipe-method-paper-pair">{['A', 'B'].map(name => <div shuku-edit-id="e-8f85477d-e8a1-4f2c-8e75-90a57d4dca5d" className="aipe-method-paired-paper" key={name}><FileText aria-hidden="true" /><div shuku-edit-id="e-f5989532-9984-4d4d-a568-2139ac7cc7c3"><Copy>论文 {name}</Copy><Copy>题目与摘要等<br shuku-edit-id="e-9a0dac6f-b554-479a-835a-8d07e5c7adb6"/>内部信息</Copy></div></div>)}</div>
          <Model pair />
          <div shuku-edit-id="e-e29f07c4-190f-4014-9643-9d3363af53df" className="aipe-method-scores">{['A', 'B'].map(name => <div shuku-edit-id="e-71c41680-f24a-490c-aaa7-f851afcaa169" key={name}><Star aria-hidden="true" /><Copy>质量分 {name}</Copy></div>)}</div>
          <div shuku-edit-id="e-3b6d76c8-c2be-4e2b-b06c-1476101b1606" className="aipe-method-comparison"><Copy>Pairwise 相对质量学习</Copy></div>
        </div>
        <Typography shuku-edit-id="e-400cee3a-bbb4-4e09-9ffb-55196262bea8" variant="bodySmall" tone="muted" className="aipe-method-pair-note" align="center">训练时成对学习，推理时单篇打分</Typography>
        <Points>{['减轻领域与评分尺度差异', '单篇打分，支持批量处理']}</Points>
      </section>
    </div>
    <div shuku-edit-id="e-20f8cf40-2608-4d75-80bf-54ffce8459c2" className="aipe-paper-method-references" aria-label="论文引用">{references.map(ref => <section shuku-edit-id="e-dcabf383-38a1-47f0-b972-44055df29f52" className="aipe-paper-method-publication" key={ref.label} aria-label={ref.label}>
      <Typography shuku-edit-id="e-1af9b13a-80f3-4908-8508-882232d26220" as="span" variant="body" tone="inherit" className="aipe-paper-method-venue"><strong shuku-edit-id="e-9b35174a-e7d4-486b-ae3c-410442519026">{ref.label}</strong></Typography>
      <div shuku-edit-id="e-f2b4e466-291f-4b94-90ed-73888dac3ad6" className="aipe-paper-method-citation">
        <Typography shuku-edit-id="e-3c93d0e3-8f67-48a6-946b-f4f3173218e3" as="span" variant="bodySmall" tone="muted">{ref.text}</Typography>
        <a shuku-edit-id="e-649cc1aa-5513-412c-9ff6-92632a23c79d" className="aipe-paper-method-reference-link" href={ref.url} target="_blank" rel="noreferrer" aria-label={`打开 ${ref.label} 论文：${ref.text}`}><ArrowUpRight aria-hidden="true" /></a>
      </div>
    </section>)}</div>
  </ContentBlock>;
}
