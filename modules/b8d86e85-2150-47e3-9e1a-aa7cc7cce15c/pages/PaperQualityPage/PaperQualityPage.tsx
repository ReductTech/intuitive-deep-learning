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
  return <Typography shuku-edit-id="e-7e15ff76-a0e2-4436-91ed-d4caaec3301c" as="span" variant="bodySmall" tone="inherit">{children}</Typography>;
}
function Wires({ kind }: { kind: 'traditional' | 'single' | 'pair' }) {
  const id = 'paper-wire-' + useId().replaceAll(':', '');
  const paths = kind === 'traditional'
    ? ['M100 70V83H215V202', 'M330 70V83H215', 'M100 158V174H215', 'M330 158V174H215', 'M215 256V285']
    : kind === 'single' ? ['M215 76V145', 'M215 229V285']
    : ['M100 132V163', 'M330 132V163', 'M100 228V245', 'M330 228V245', 'M100 286V290Q100 294 112 294H199Q215 294 215 299', 'M330 286V290Q330 294 318 294H231Q215 294 215 299'];
  return <svg shuku-edit-id="e-fc4a56f1-8caf-4a61-ab93-60e7498af1e6" className="aipe-method-wires" viewBox="0 0 430 340" preserveAspectRatio="none" aria-hidden="true">
    <defs shuku-edit-id="e-932f32c4-26d3-4837-8238-6d2edbd8a649"><marker shuku-edit-id="e-c96c7205-3c1f-4ecb-90f3-23725a919867" id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path shuku-edit-id="e-32553721-97d4-4a76-8fe3-792e86b6225d" d="M1 1L9 5L1 9Z" fill="currentColor" /></marker></defs>
    {paths.map((d, i) => <path shuku-edit-id="e-4245a246-2a21-441b-8ca2-bc4fe6410ef6" key={d} d={d} fill="none" stroke="currentColor" strokeWidth="1.8" markerEnd={(kind !== 'traditional' || i === 0 || i === 4) ? 'url(#'+id+')' : undefined} />)}
  </svg>;
}
function Model({ pair = false }: { pair?: boolean }) {
  return <div shuku-edit-id="e-dd9065f7-103d-4329-8ef7-f8b404aa83a5" className={'aipe-method-model' + (pair ? ' is-pair' : '')}><Typography shuku-edit-id="e-4844de57-db5b-4120-b397-31e872845f26" as="span" variant="body" tone="inherit">{pair ? '共享大语言模型' : '大语言模型'}</Typography></div>;
}
function Points({ warning = false, children }: { warning?: boolean; children: readonly string[] }) {
  const Icon = warning ? TriangleAlert : Check;
  return <div shuku-edit-id="e-ac443ad1-0236-457e-ae50-abdb344d2cd6" className={'aipe-method-points' + (warning ? ' is-warning' : '')}>{children.map(text => <div shuku-edit-id="e-fbedca22-a45f-458d-ac7d-c1255edafcf9" key={text}><span shuku-edit-id="e-d0ea8b6e-f8f2-4eae-8c67-2341dbccc384" className="aipe-method-point-icon"><Icon aria-hidden="true" /></span><Typography shuku-edit-id="e-89998a39-aa60-4c8a-9d1e-d27102b0de12" as="span" variant="bodySmall" tone="accent"><strong shuku-edit-id="e-e560db6e-ee9d-4754-b775-a03b3da5114a">{text}</strong></Typography></div>)}</div>;
}
export function PaperQualityPage() {
  return <ContentBlock shuku-edit-id="e-553b6fbc-e5f6-4611-bc2e-c2ed39210260" className="aipe-paper-method-page" headingLevel={1} title={outline.pages.find(page => page.id === 'c51115d8-0d27-4fc1-a962-cf7f41dd783e')!.title}
    subtitle="团队首次提出基于大语言模型的后训练微调方法，支撑高质量筛选与个性化推荐" bodyClassName="aipe-paper-method-body">
    <div shuku-edit-id="e-d75545a4-0f3e-464c-8519-df2ad6a2ac2c" className="aipe-method-columns">
      <section shuku-edit-id="e-7d5ab729-9c1b-46bf-9aae-63af3eae7dc6" className="aipe-method-column aipe-method-traditional" aria-label="传统预测方法">
        <header shuku-edit-id="e-f2978e38-6f6d-4716-b110-ae347c1b92a8"><Typography shuku-edit-id="e-d5003dbb-8021-46df-bc3c-c8ae5a5d5ed3" as="h2" variant="h3" tone="accent">传统预测方法</Typography><Typography shuku-edit-id="e-2e79e1ec-aeb1-44b8-bc3b-5bd2a871a618" variant="bodySmall" tone="muted">依赖外部信息</Typography></header>
        <div shuku-edit-id="e-25a0af62-ef24-4688-928e-4ac317c78683" className="aipe-method-diagram aipe-method-external">
          <Wires kind="traditional" />
          <div shuku-edit-id="e-48f7f54f-0446-47ff-84df-12c009e76c78" className="aipe-method-sources">{sources.map(({Icon,text}) => <div shuku-edit-id="e-12781246-8587-4491-ab0d-3e0ff058e3d2" className="aipe-method-source" key={text}><Icon aria-hidden="true" /><Copy>{text}</Copy></div>)}</div>
          <div shuku-edit-id="e-b2c4ef63-6a3d-4ffd-9da4-4273d4a8bb63" className="aipe-method-predictor"><ChartNoAxesColumnIncreasing aria-hidden="true" /><Copy>预测模型</Copy></div>
          <div shuku-edit-id="e-a9954b3e-dd04-4962-932b-32060155eef6" className="aipe-method-output"><ChartNoAxesColumnIncreasing aria-hidden="true" /><Copy>影响力预测</Copy></div>
        </div>
        <Points warning>{['外部信息可能缺失', '新论文缺少引用积累']}</Points>
      </section>
      <section shuku-edit-id="e-26c61f27-f302-4e91-952d-5531fccd4b93" className="aipe-method-column aipe-method-v1" aria-label="NAIPv1 影响力预测">
        <header shuku-edit-id="e-55ea9211-bb47-4cd3-8e6d-1ecae8436018"><Typography shuku-edit-id="e-aaa7fe84-a719-4494-a3ed-44061bfc6d35" as="h2" variant="h3" tone="accent">NAIPv1</Typography><Typography shuku-edit-id="e-64dd9e78-fa9a-40ea-9644-7931fa05a72a" variant="bodySmall" tone="muted">从内容预测潜在影响力</Typography></header>
        <div shuku-edit-id="e-dec7d915-8a2e-4225-9f89-be06dd467dcf" className="aipe-method-diagram aipe-method-single">
          <Wires kind="single" />
          <div shuku-edit-id="e-80a15101-4918-4135-9ec8-c9aeca8f0feb" className="aipe-method-paper"><FileText aria-hidden="true" /><Copy>题目与摘要等<br shuku-edit-id="e-a7f2ea0d-8bff-4a57-b756-0352574b66c4"/>内部信息</Copy></div>
          <Model />
          <div shuku-edit-id="e-8e1afb7f-7cf1-4e8c-8caf-e8261d072d30" className="aipe-method-output"><ChartNoAxesColumnIncreasing aria-hidden="true" /><Copy>潜在影响力</Copy></div>
        </div>
        <Points>{['无需等待长期引用积累', '为新论文提供早期参考']}</Points>
      </section>
      <section shuku-edit-id="e-507df2eb-741f-4aec-a7f7-a94362657fc8" className="aipe-method-column aipe-method-v2" aria-label="NAIPv2 成对训练与单篇打分">
        <header shuku-edit-id="e-deb2cf4a-6442-4b0d-bb51-9bcf3927e07c"><Typography shuku-edit-id="e-4f60e7c0-f432-4fa8-9de3-d3b6f5ca8933" as="h2" variant="h3" tone="accent">NAIPv2</Typography><Typography shuku-edit-id="e-52b617bb-57a6-4613-8c02-4de8791baa2e" variant="bodySmall" tone="muted">学习相对质量，保留单篇打分</Typography></header>
        <div shuku-edit-id="e-0476b537-1b15-47d2-bf80-59523d4c4065" className="aipe-method-diagram aipe-method-pair">
          <Wires kind="pair" />
          <div shuku-edit-id="e-634cdcc0-4c53-467e-8405-d1db9b323f99" className="aipe-method-paper-pair">{['A', 'B'].map(name => <div shuku-edit-id="e-df05de8a-a4c1-4334-afdd-31a662e4d0e5" className="aipe-method-paired-paper" key={name}><FileText aria-hidden="true" /><div shuku-edit-id="e-6b8cd02e-d86c-47d9-98f1-37360b18f3a4"><Copy>论文 {name}</Copy><Copy>题目与摘要等<br shuku-edit-id="e-3de2781b-6598-4988-94eb-cd93842113fb"/>内部信息</Copy></div></div>)}</div>
          <Model pair />
          <div shuku-edit-id="e-83b08672-c7b0-4034-8e70-7c7b821d6ad2" className="aipe-method-scores">{['A', 'B'].map(name => <div shuku-edit-id="e-1178c200-fa04-4066-a515-d9bd9a97fab2" key={name}><Star aria-hidden="true" /><Copy>质量分 {name}</Copy></div>)}</div>
          <div shuku-edit-id="e-ec9acf9b-5df4-4649-bed7-ab5d3b306f07" className="aipe-method-comparison"><Copy>Pairwise 相对质量学习</Copy></div>
        </div>
        <Typography shuku-edit-id="e-723b8bae-b94d-45d2-84aa-7cfb34d8ee5a" variant="bodySmall" tone="muted" className="aipe-method-pair-note" align="center">训练时成对学习，推理时单篇打分</Typography>
        <Points>{['减轻领域与评分尺度差异', '单篇打分，支持批量处理']}</Points>
      </section>
    </div>
    <div shuku-edit-id="e-e760c1e6-a470-4a2f-88a3-16ca8e56c868" className="aipe-paper-method-references" aria-label="论文引用">{references.map(ref => <section shuku-edit-id="e-0d0a88e5-6b64-4b57-ae4c-88890eb61a3f" className="aipe-paper-method-publication" key={ref.label} aria-label={ref.label}>
      <Typography shuku-edit-id="e-4d9b53c4-2e64-4654-be7c-87641588f603" as="span" variant="body" tone="inherit" className="aipe-paper-method-venue"><strong shuku-edit-id="e-3d882557-b842-47d4-ab6e-e6047995845e">{ref.label}</strong></Typography>
      <div shuku-edit-id="e-6ec32677-c4cc-4837-837a-05275be73fde" className="aipe-paper-method-citation">
        <Typography shuku-edit-id="e-ca66db25-8bca-446a-8dcb-449c62930d6a" as="span" variant="bodySmall" tone="muted">{ref.text}</Typography>
        <a shuku-edit-id="e-2a11e2f9-361d-4ea9-bd93-0141b174e4b1" className="aipe-paper-method-reference-link" href={ref.url} target="_blank" rel="noreferrer" aria-label={`打开 ${ref.label} 论文：${ref.text}`}><ArrowUpRight aria-hidden="true" /></a>
      </div>
    </section>)}</div>
  </ContentBlock>;
}
