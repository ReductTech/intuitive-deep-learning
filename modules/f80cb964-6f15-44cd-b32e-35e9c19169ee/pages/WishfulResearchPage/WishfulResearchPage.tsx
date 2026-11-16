import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useId } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './WishfulResearchPage.css';

export function WishfulResearchPage() {
  const marker = useId().replaceAll(':', '');
  return (
    <ContentBlock shuku-edit-id="e-8db974e4-60c6-4988-9a47-4eb615f72cd7" title={outline.pages.find(page => page.id === 'd98982d4-186a-4307-93c4-d5a1e2be2625')!.title} subtitle="提出研究目标，期待 AI 推进研究过程" headingLevel={1} className="rie-wishful" data-scene-id="d98982d4-186a-4307-93c4-d5a1e2be2625">
      <img shuku-edit-id="e-c1261a6b-f9bd-4e91-b275-234b14828430" className="rie-wishful-art" src={moduleAssetUrl('images/wishful-research-art-v1.jpg')} alt="左侧的想法笔记，中间整合的文献与研究计划，右侧的结果报告" />
      <svg shuku-edit-id="e-1e240d3e-06ec-43ae-8be2-0378495f03f2" className="rie-wishful-connections" viewBox="0 0 1600 900" aria-hidden="true">
        <defs shuku-edit-id="e-8c3ec87b-cfda-4f3f-8ae8-77a9165d0ebd"><marker shuku-edit-id="e-8bf6ba13-d563-4744-94b4-11a192fa16bf" id={`${marker}-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path shuku-edit-id="e-d337bcd6-a59a-48d6-9627-6c8848e9ecf4" d="M0 0L10 5L0 10Z" fill="#27446e" /></marker></defs>
        {['M476 480h40', 'M1138 480h54'].map(path => <path shuku-edit-id="e-c76fcd91-f3cd-4bff-8a4d-d0a2610422b1" key={path} d={path} fill="none" stroke="#27446e" strokeWidth="4" markerEnd={`url(#${marker}-arrow)`} />)}
      </svg>
      <div shuku-edit-id="e-58480e22-7970-470e-9fc9-824ff152cbf2" className="rie-wishful-labels" aria-label="许愿式科研的使用方式">
        <Typography shuku-edit-id="e-594bdc9a-ab23-42ce-92ad-c30d42a985d5" variant="h2" tone="accent" className="rie-wishful-input">提出想法</Typography>
        <Typography shuku-edit-id="e-472803a9-2e3b-4458-8050-1b3d72e0a4bb" variant="h2" tone="accent" className="rie-wishful-work">AI 推进研究过程</Typography>
        <Typography shuku-edit-id="e-8d487ae9-e388-4cb9-aca7-6b383aa7172d" variant="h2" tone="accent" className="rie-wishful-output">查看结果</Typography>
      </div>
      <Typography shuku-edit-id="e-b8586173-9058-4d21-a81d-45ed0198f8e3" variant="h2" tone="accent" className="rie-wishful-takeaway">从亲自做每一步，到提出目标、让 AI 去做。</Typography>
    </ContentBlock>
  );
}
