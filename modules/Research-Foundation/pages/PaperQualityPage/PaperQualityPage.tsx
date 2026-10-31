import { useId, type ReactNode } from 'react';
import { UsersRound, Landmark, Network, Database, FileText, ChartNoAxesColumnIncreasing, Star, Check, TriangleAlert, ArrowUpRight } from 'lucide-react';
import { ContentBlock, Typography } from '../../../shared/react';
import outline from '../../outlines.json';
import './PaperQualityPage.css';

const references = [
  { label: 'AAAI 2025', text: 'From Words to Worth: Newborn Article Impact Prediction with LLM', url: 'https://doi.org/10.1609/aaai.v39i1.32106' },
  { label: 'ICLR 2026', text: 'NAIPv2: Debiased Pairwise Learning for Efficient Paper Quality Estimation', url: 'https://openreview.net/forum?id=rNl8XiSHiJ' },
];
const sources = [{Icon:UsersRound,text:'作者与机构'},{Icon:Landmark,text:'发表渠道'},{Icon:Network,text:'引用网络'},{Icon:Database,text:'历史记录'}];
function Copy({ children }: { children: ReactNode }) {
  return <Typography as="span" variant="bodySmall" tone="inherit">{children}</Typography>;
}
function Wires({ kind }: { kind: 'traditional' | 'single' | 'pair' }) {
  const id = 'paper-wire-' + useId().replaceAll(':', '');
  const paths = kind === 'traditional'
    ? ['M100 70V83H215V202', 'M330 70V83H215', 'M100 158V174H215', 'M330 158V174H215', 'M215 256V285']
    : kind === 'single' ? ['M215 76V145', 'M215 229V285']
    : ['M100 72V130', 'M330 72V130', 'M100 196V221', 'M330 196V221', 'M100 259V271Q100 281 112 281H199Q215 281 215 297', 'M330 259V271Q330 281 318 281H231Q215 281 215 297'];
  return <svg className="rf-method-wires" viewBox="0 0 430 340" preserveAspectRatio="none" aria-hidden="true">
    <defs><marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1L9 5L1 9Z" fill="currentColor" /></marker></defs>
    {paths.map((d, i) => <path key={d} d={d} fill="none" stroke="currentColor" strokeWidth="1.8" markerEnd={(kind !== 'traditional' || i === 0 || i === 4) ? 'url(#'+id+')' : undefined} />)}
  </svg>;
}
function Model({ pair = false }: { pair?: boolean }) {
  return <div className={'rf-method-model' + (pair ? ' is-pair' : '')}><Typography as="span" variant="body" tone="inherit">{pair ? '共享大语言模型' : '大语言模型'}</Typography></div>;
}
function Points({ warning = false, children }: { warning?: boolean; children: readonly string[] }) {
  const Icon = warning ? TriangleAlert : Check;
  return <div className={'rf-method-points' + (warning ? ' is-warning' : '')}>{children.map(text => <div key={text}><span className="rf-method-point-icon"><Icon aria-hidden="true" /></span><Typography as="span" variant="bodySmall" tone="accent"><strong>{text}</strong></Typography></div>)}</div>;
}
export function PaperQualityPage() {
  return <ContentBlock className="rf-paper-method-page" headingLevel={1} title={outline.pages[5].title}
    subtitle="团队首次提出基于大语言模型的后训练微调方法，支撑高质量筛选与个性化推荐" bodyClassName="rf-paper-method-body">
    <div className="rf-method-columns">
      <section className="rf-method-column rf-method-traditional" aria-label="传统预测方法">
        <header><Typography as="h2" variant="h3" tone="accent">传统预测方法</Typography><Typography variant="bodySmall" tone="muted">依赖外部信息</Typography></header>
        <div className="rf-method-diagram rf-method-external">
          <Wires kind="traditional" />
          <div className="rf-method-sources">{sources.map(({Icon,text}) => <div className="rf-method-source" key={text}><Icon aria-hidden="true" /><Copy>{text}</Copy></div>)}</div>
          <div className="rf-method-predictor"><ChartNoAxesColumnIncreasing aria-hidden="true" /><Copy>预测模型</Copy></div>
          <div className="rf-method-output"><ChartNoAxesColumnIncreasing aria-hidden="true" /><Copy>影响力预测</Copy></div>
        </div>
        <Points warning>{['外部信息可能缺失', '新论文缺少引用积累']}</Points>
      </section>
      <section className="rf-method-column rf-method-v1" aria-label="NAIPv1 影响力预测">
        <header><Typography as="h2" variant="h3" tone="accent">NAIPv1</Typography><Typography variant="bodySmall" tone="muted">从内容预测潜在影响力</Typography></header>
        <div className="rf-method-diagram rf-method-single">
          <Wires kind="single" />
          <div className="rf-method-paper"><FileText aria-hidden="true" /><Copy>题目与摘要</Copy></div>
          <Model />
          <div className="rf-method-output"><ChartNoAxesColumnIncreasing aria-hidden="true" /><Copy>潜在影响力</Copy></div>
        </div>
        <Points>{['仅需题目与摘要', '为新论文提供早期参考']}</Points>
      </section>
      <section className="rf-method-column rf-method-v2" aria-label="NAIPv2 成对训练与单篇打分">
        <header><Typography as="h2" variant="h3" tone="accent">NAIPv2</Typography><Typography variant="bodySmall" tone="muted">学习相对质量，保留单篇打分</Typography></header>
        <div className="rf-method-diagram rf-method-pair">
          <Wires kind="pair" />
          <div className="rf-method-paper-pair">{['A', 'B'].map(name => <div className="rf-method-paired-paper" key={name}><FileText aria-hidden="true" /><div><Copy>论文 {name}</Copy><Copy>题目与摘要</Copy></div></div>)}</div>
          <Model pair />
          <div className="rf-method-scores">{['A', 'B'].map(name => <div key={name}><Star aria-hidden="true" /><Copy>质量分 {name}</Copy></div>)}</div>
          <div className="rf-method-comparison"><Copy>Pairwise 相对质量学习</Copy></div>
        </div>
        <Typography variant="bodySmall" tone="muted" className="rf-method-pair-note" align="center">训练时成对学习，推理时单篇打分</Typography>
        <Points>{['减轻领域与评分尺度差异', '单篇打分，支持批量处理']}</Points>
      </section>
    </div>
    <div className="rf-paper-method-references" aria-label="论文引用">{references.map(ref => <section className="rf-paper-method-publication" key={ref.label} aria-label={ref.label}>
      <Typography as="span" variant="body" tone="inherit" className="rf-paper-method-venue"><strong>{ref.label}</strong></Typography>
      <div className="rf-paper-method-citation">
        <Typography as="span" variant="bodySmall" tone="muted">{ref.text}</Typography>
        <a className="rf-paper-method-reference-link" href={ref.url} target="_blank" rel="noreferrer" aria-label={`打开 ${ref.label} 论文：${ref.text}`}><ArrowUpRight aria-hidden="true" /></a>
      </div>
    </section>)}</div>
  </ContentBlock>;
}
