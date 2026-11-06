import { ContentBlock, Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import './RecommendedAssessmentPage.css';

const advantages = [
  { title: '呈现理解', detail: '方法关系讲清楚', image: 'assessment-understanding-icon-v5.png' },
  { title: '看见AI协作', detail: '核验内容再改进', image: 'assessment-collaboration-icon-v5.png' },
  { title: '积累学习资源', detail: '供同学学习复用', image: 'assessment-resource-icon-v5.png' },
] as const;

const asset = (file: string) => moduleAssetUrl(outline.moduleIdentity.id, `images/assessment/${file}`);

export function RecommendedAssessmentPage() {
  return <ContentBlock title="课后专题研究考核模式"
    subtitle="一个方向 · 三篇论文 · 三份交互作品 · 一次动手实践（复现 Jittor 代码）"
    headingLevel={1} className="aipe-assessment-page" bodyClassName="aipe-assessment-body">
    <figure className="aipe-assessment-hero">
      <img src={asset('assessment-flow-approved-v5.png')}
        alt="选定一个研究方向，深读三篇论文，形成交互式学习作品。"
        draggable={false}/>
      <figcaption className="aipe-assessment-stage-labels">
        {['选定方向', '深读三篇论文', '形成交互作品'].map(label =>
          <Typography key={label} as="span" variant="h3" tone="accent">{label}</Typography>)}
      </figcaption>
    </figure>
    <ul className="aipe-assessment-benefits" aria-label="作品型考核的补充价值">
      {advantages.map(({ title, detail, image }) => <li key={title}>
        <img src={asset(image)} alt="" aria-hidden="true" draggable={false}/>
        <div><Typography as="h2" variant="h3" tone="accent">{title}</Typography>
          <Typography as="p" variant="body" tone="muted">{detail}</Typography></div>
      </li>)}
    </ul>
    <div className="aipe-assessment-complement">
      <Typography as="p" variant="bodySmall" tone="muted">传统考试检验基础，专题研究考核呈现理解、创造与实践，可结合使用。</Typography>
    </div>
  </ContentBlock>;
}
