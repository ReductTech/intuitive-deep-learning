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
  return <ContentBlock shuku-edit-id="e-d5d3afe3-4409-44dd-bef5-4ba703512bca" title="课后专题研究考核模式"
    subtitle="一个方向 · 三篇论文 · 三份交互作品 · 一次动手实践（复现 Jittor 代码）"
    headingLevel={1} className="aipe-assessment-page" bodyClassName="aipe-assessment-body">
    <figure shuku-edit-id="e-f2b1881f-4510-493c-92be-9450b2fe996d" className="aipe-assessment-hero">
      <img shuku-edit-id="e-f6d9b2b2-9b3b-4c41-8536-e206243b9d5e" src={asset('assessment-flow-approved-v5.jpg')}
        alt="选定一个研究方向，深读三篇论文，形成交互式学习作品。"
        draggable={false}/>
      <figcaption shuku-edit-id="e-85d059a4-8242-41db-baa8-f8edd0afb759" className="aipe-assessment-stage-labels">
        {['选定方向', '深读三篇论文', '形成交互作品'].map(label =>
          <Typography shuku-edit-id="e-00d49550-608c-45d4-a7b9-ad6a550b74ce" key={label} as="span" variant="h3" tone="accent">{label}</Typography>)}
      </figcaption>
    </figure>
    <ul shuku-edit-id="e-42f53470-da1c-419d-b6f6-7584b327be65" className="aipe-assessment-benefits" aria-label="作品型考核的补充价值">
      {advantages.map(({ title, detail, image }) => <li shuku-edit-id="e-efd7f655-b1f6-4621-9688-bedec3147f9f" key={title}>
        <img shuku-edit-id="e-05e5b691-8e3a-4705-ae38-39d83bb1792a" src={asset(image)} alt="" aria-hidden="true" draggable={false}/>
        <div shuku-edit-id="e-3f4cd838-85bd-4ee9-90eb-d558584d8147"><Typography shuku-edit-id="e-54d75003-9f33-4bc3-b059-5c784c5e3f8b" as="h2" variant="h3" tone="accent">{title}</Typography>
          <Typography shuku-edit-id="e-c42c2461-e30a-488b-b5c7-8c8cb8b42e16" as="p" variant="body" tone="muted">{detail}</Typography></div>
      </li>)}
    </ul>
    <div shuku-edit-id="e-8fecab61-8bad-4215-b962-371acc4eb924" className="aipe-assessment-complement">
      <Typography shuku-edit-id="e-5ceb8338-9059-40b4-9f38-9dd62677a203" as="p" variant="bodySmall" tone="muted">传统考试检验基础，专题研究考核呈现理解、创造与实践，可结合使用。</Typography>
    </div>
  </ContentBlock>;
}
