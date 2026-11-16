import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './RecommendedAssessmentPage.css';

const advantages = [
  { title: '呈现理解', detail: '方法关系讲清楚', image: 'assessment-understanding-icon-v5.jpg' },
  { title: '看见AI协作', detail: '核验内容再改进', image: 'assessment-collaboration-icon-v5.jpg' },
  { title: '积累学习资源', detail: '供同学学习复用', image: 'assessment-resource-icon-v5.jpg' },
] as const;

const asset = (file: string) => moduleAssetUrl(`images/assessment/${file}`);

export function RecommendedAssessmentPage() {
  return <ContentBlock shuku-edit-id="e-38a252be-302d-4bfc-b74e-cd2341b1a761" title="课后专题研究考核模式"
    subtitle="一个方向 · 三篇论文 · 三份交互作品 · 一次动手实践（复现 Jittor 代码）"
    headingLevel={1} className="aipe-assessment-page" bodyClassName="aipe-assessment-body">
    <figure shuku-edit-id="e-6cab7e92-5b12-49c3-8428-faafcaa1d6ef" className="aipe-assessment-hero">
      <img shuku-edit-id="e-6a294313-6f9e-4531-b3a6-f58ac419b10e" src={asset('assessment-flow-approved-v5.jpg')}
        alt="选定一个研究方向，深读三篇论文，形成交互式学习作品。"
        draggable={false}/>
      <figcaption shuku-edit-id="e-d24ff4ab-21e4-43c4-8391-c739564d34ed" className="aipe-assessment-stage-labels">
        {['选定方向', '深读三篇论文', '形成交互作品'].map(label =>
          <Typography shuku-edit-id="e-e8bd0670-fa32-4f43-9e6f-1dcab79161f8" key={label} as="span" variant="h3" tone="accent">{label}</Typography>)}
      </figcaption>
    </figure>
    <ul shuku-edit-id="e-fbc87674-34ac-4a8f-9b19-e6388f415425" className="aipe-assessment-benefits" aria-label="作品型考核的补充价值">
      {advantages.map(({ title, detail, image }) => <li shuku-edit-id="e-d359926c-af1e-4632-9ad7-b3b44884e1d7" key={title}>
        <img shuku-edit-id="e-e33c9357-0996-4d9e-b0ba-6c9b3111cf10" src={asset(image)} alt="" aria-hidden="true" draggable={false}/>
        <div shuku-edit-id="e-e52bbf3e-fcf6-48bc-aa04-8f69160e844c"><Typography shuku-edit-id="e-52b098e0-8e9e-483f-bdb9-7247a651445d" as="h2" variant="h3" tone="accent">{title}</Typography>
          <Typography shuku-edit-id="e-e5075701-5240-4145-9c1b-c4aef5c23601" as="p" variant="body" tone="muted">{detail}</Typography></div>
      </li>)}
    </ul>
    <div shuku-edit-id="e-fcca2f1a-4c1f-4fc0-9e23-0c33268866ff" className="aipe-assessment-complement">
      <Typography shuku-edit-id="e-b7f2e488-1764-4127-b1c5-80420265f85b" as="p" variant="bodySmall" tone="muted">传统考试检验基础，专题研究考核呈现理解、创造与实践，可结合使用。</Typography>
    </div>
  </ContentBlock>;
}
