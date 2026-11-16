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
  return <Typography shuku-edit-id="e-3c08c9f3-a2cd-41b5-986f-b3bdca603227" as="span" variant="bodySmall" tone="inherit">{children}</Typography>;
}
function Wires({ kind }: { kind: 'traditional' | 'single' | 'pair' }) {
  const id = 'paper-wire-' + useId().replaceAll(':', '');
  const paths = kind === 'traditional'
    ? ['M100 70V83H215V202', 'M330 70V83H215', 'M100 158V174H215', 'M330 158V174H215', 'M215 256V285']
    : kind === 'single' ? ['M215 76V145', 'M215 229V285']
    : ['M100 132V163', 'M330 132V163', 'M100 228V245', 'M330 228V245', 'M100 286V290Q100 294 112 294H199Q215 294 215 299', 'M330 286V290Q330 294 318 294H231Q215 294 215 299'];
  return <svg shuku-edit-id="e-8a3d7908-7fd5-4d62-bb5f-ff0631afdb17" className="rf-method-wires" viewBox="0 0 430 340" preserveAspectRatio="none" aria-hidden="true">
    <defs shuku-edit-id="e-9a50751b-aa96-4326-8139-8161cb376498"><marker shuku-edit-id="e-9a41aaa8-f6fb-43de-92fb-d0f376dbad07" id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path shuku-edit-id="e-88e80b4c-f4e6-473d-9a5c-64aa803e65f6" d="M1 1L9 5L1 9Z" fill="currentColor" /></marker></defs>
    {paths.map((d, i) => <path shuku-edit-id="e-457fe64c-1ea5-40d8-b227-6af8802f609c" key={d} d={d} fill="none" stroke="currentColor" strokeWidth="1.8" markerEnd={(kind !== 'traditional' || i === 0 || i === 4) ? 'url(#'+id+')' : undefined} />)}
  </svg>;
}
function Model({ pair = false }: { pair?: boolean }) {
  return <div shuku-edit-id="e-e6c2700a-bc31-46b4-9e52-c93cdd0dc87f" className={'rf-method-model' + (pair ? ' is-pair' : '')}><Typography shuku-edit-id="e-9e389c5f-6681-4daa-9400-a97c44562848" as="span" variant="body" tone="inherit">{pair ? '共享大语言模型' : '大语言模型'}</Typography></div>;
}
function Points({ warning = false, children }: { warning?: boolean; children: readonly string[] }) {
  const Icon = warning ? TriangleAlert : Check;
  return <div shuku-edit-id="e-0a1bc6ba-fc47-42b8-b2c0-c0a4f1bf00f2" className={'rf-method-points' + (warning ? ' is-warning' : '')}>{children.map(text => <div shuku-edit-id="e-b3943697-9aea-4e13-a486-a0521e01f340" key={text}><span shuku-edit-id="e-4aca0d51-3416-4b32-a330-97d1d75b1b1e" className="rf-method-point-icon"><Icon aria-hidden="true" /></span><Typography shuku-edit-id="e-e52f6a07-7c35-47a3-b3ad-0980e2051455" as="span" variant="bodySmall" tone="accent"><strong shuku-edit-id="e-0f4555ab-28ea-4a79-bf34-478e7a6f1ebd">{text}</strong></Typography></div>)}</div>;
}
export function PaperQualityPage() {
  return <ContentBlock shuku-edit-id="e-ce11d6d8-6fc0-41e2-b5d0-01a479deac16" className="rf-paper-method-page" headingLevel={1} title={outline.pages.find(page => page.id === '43137cd3-71ea-4fde-8322-f4706d819016')!.title}
    subtitle="团队首次提出基于大语言模型的后训练微调方法，支撑高质量筛选与个性化推荐" bodyClassName="rf-paper-method-body">
    <div shuku-edit-id="e-b5b9531b-8938-46d9-aafb-43c9081837a9" className="rf-method-columns">
      <section shuku-edit-id="e-70e05179-2880-47f0-8404-f30ccd32d46a" className="rf-method-column rf-method-traditional" aria-label="传统预测方法">
        <header shuku-edit-id="e-3d1fbaab-9c6c-4f0d-a994-1390d1cbecc1"><Typography shuku-edit-id="e-9de94bba-0da2-47db-9b9c-a9c847d86773" as="h2" variant="h3" tone="accent">传统预测方法</Typography><Typography shuku-edit-id="e-20b5af5e-0d9e-4dba-99ea-bed0ff52b1f3" variant="bodySmall" tone="muted">依赖外部信息</Typography></header>
        <div shuku-edit-id="e-a1586ea9-b537-4831-99df-19cde42e6096" className="rf-method-diagram rf-method-external">
          <Wires kind="traditional" />
          <div shuku-edit-id="e-71e784f3-ed00-4d2c-b1e8-ec8f05f06c5d" className="rf-method-sources">{sources.map(({Icon,text}) => <div shuku-edit-id="e-83a8b7a2-e484-4eda-902a-4ee609f8c179" className="rf-method-source" key={text}><Icon aria-hidden="true" /><Copy>{text}</Copy></div>)}</div>
          <div shuku-edit-id="e-61eaee0c-f0c7-4099-88ec-962c9bbb7137" className="rf-method-predictor"><ChartNoAxesColumnIncreasing aria-hidden="true" /><Copy>预测模型</Copy></div>
          <div shuku-edit-id="e-25bd42bc-0cf3-45eb-ba6f-0d8e2ce29b7e" className="rf-method-output"><ChartNoAxesColumnIncreasing aria-hidden="true" /><Copy>影响力预测</Copy></div>
        </div>
        <Points warning>{['外部信息可能缺失', '新论文缺少引用积累']}</Points>
      </section>
      <section shuku-edit-id="e-99f0ca76-d3e9-4654-bc2f-be270f03f64b" className="rf-method-column rf-method-v1" aria-label="NAIPv1 影响力预测">
        <header shuku-edit-id="e-d1c3665d-5d1a-4ca1-9bf0-8a9a699456c6"><Typography shuku-edit-id="e-d590c183-08a0-49c9-ac9a-5b47accea342" as="h2" variant="h3" tone="accent">NAIPv1</Typography><Typography shuku-edit-id="e-a4ba3566-e95f-4e2a-92ba-74dd9a6f0b80" variant="bodySmall" tone="muted">从内容预测潜在影响力</Typography></header>
        <div shuku-edit-id="e-0b6e357a-d7b7-409a-983a-c9d2d4d4b0d6" className="rf-method-diagram rf-method-single">
          <Wires kind="single" />
          <div shuku-edit-id="e-4292cdf9-c6f0-472a-ab35-2ca9fd7c4b39" className="rf-method-paper"><FileText aria-hidden="true" /><Copy>题目与摘要等<br shuku-edit-id="e-01051bd2-62fd-4bf1-bf82-dc6aaa28956a"/>内部信息</Copy></div>
          <Model />
          <div shuku-edit-id="e-fb4f7a7c-e9d3-4de0-93ea-ef19e1b5bd0f" className="rf-method-output"><ChartNoAxesColumnIncreasing aria-hidden="true" /><Copy>潜在影响力</Copy></div>
        </div>
        <Points>{['无需等待长期引用积累', '为新论文提供早期参考']}</Points>
      </section>
      <section shuku-edit-id="e-d15641fa-b35b-4c10-a5be-9235f77091fa" className="rf-method-column rf-method-v2" aria-label="NAIPv2 成对训练与单篇打分">
        <header shuku-edit-id="e-874c455c-bdb1-4b90-9a63-7a6d88032a0e"><Typography shuku-edit-id="e-6193ea69-620c-41ec-b9c0-a18df2b83d04" as="h2" variant="h3" tone="accent">NAIPv2</Typography><Typography shuku-edit-id="e-9247f4d5-6193-4d06-b73e-1a8bd7b51f3f" variant="bodySmall" tone="muted">学习相对质量，保留单篇打分</Typography></header>
        <div shuku-edit-id="e-35a487e5-f979-45a3-9ac8-8fc6e0b47ff3" className="rf-method-diagram rf-method-pair">
          <Wires kind="pair" />
          <div shuku-edit-id="e-5333be8d-52af-4e0d-b8b6-7e07e88f3788" className="rf-method-paper-pair">{['A', 'B'].map(name => <div shuku-edit-id="e-47ea9040-fa4e-4b42-a5e6-1c8f7f90dac7" className="rf-method-paired-paper" key={name}><FileText aria-hidden="true" /><div shuku-edit-id="e-dd3009c2-51a4-45c4-a9dc-cbd95022b9d9"><Copy>论文 {name}</Copy><Copy>题目与摘要等<br shuku-edit-id="e-58d117b8-13ae-4452-acf4-f70d54157e2b"/>内部信息</Copy></div></div>)}</div>
          <Model pair />
          <div shuku-edit-id="e-51b5486c-934b-4800-a5ff-93c359c6abe7" className="rf-method-scores">{['A', 'B'].map(name => <div shuku-edit-id="e-99a4a9cb-d788-404d-9a47-bf27acd549b2" key={name}><Star aria-hidden="true" /><Copy>质量分 {name}</Copy></div>)}</div>
          <div shuku-edit-id="e-f20836ce-bf6b-493a-919c-cd386b802a36" className="rf-method-comparison"><Copy>Pairwise 相对质量学习</Copy></div>
        </div>
        <Typography shuku-edit-id="e-bb9c6732-7daf-4e15-8840-605e07eeccb2" variant="bodySmall" tone="muted" className="rf-method-pair-note" align="center">训练时成对学习，推理时单篇打分</Typography>
        <Points>{['减轻领域与评分尺度差异', '单篇打分，支持批量处理']}</Points>
      </section>
    </div>
    <div shuku-edit-id="e-d0a8bcd3-f937-4d3b-9486-6d664c8bf6f5" className="rf-paper-method-references" aria-label="论文引用">{references.map(ref => <section shuku-edit-id="e-a29bf884-1304-46a9-b516-657442a37998" className="rf-paper-method-publication" key={ref.label} aria-label={ref.label}>
      <Typography shuku-edit-id="e-dcec656c-b8fe-41e8-8419-48941146bd09" as="span" variant="body" tone="inherit" className="rf-paper-method-venue"><strong shuku-edit-id="e-975c5563-1a8c-404e-ac60-f06bd86e277a">{ref.label}</strong></Typography>
      <div shuku-edit-id="e-65ff24a5-8c8a-496e-a487-3067ce4d5dcc" className="rf-paper-method-citation">
        <Typography shuku-edit-id="e-e7e1680e-3db1-49bd-ba8d-7ccaee4add34" as="span" variant="bodySmall" tone="muted">{ref.text}</Typography>
        <a shuku-edit-id="e-8bc76c51-f33d-46aa-ac20-01b796389bab" className="rf-paper-method-reference-link" href={ref.url} target="_blank" rel="noreferrer" aria-label={`打开 ${ref.label} 论文：${ref.text}`}><ArrowUpRight aria-hidden="true" /></a>
      </div>
    </section>)}</div>
  </ContentBlock>;
}
