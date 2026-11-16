import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useId } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './WishfulResearchPage.css';

export function WishfulResearchPage() {
  const marker = useId().replaceAll(':', '');
  return (
    <ContentBlock shuku-edit-id="e-2b3e8034-20f3-43f5-b000-7be96c67824a" title={outline.pages.find(page => page.id === 'spp-research-wishful-research')!.title} subtitle="提出研究目标，期待 AI 推进研究过程" headingLevel={1} className="rie-wishful" data-scene-id="spp-research-wishful-research">
      <img shuku-edit-id="e-e2f9bf9a-db93-4264-ab9a-c56a5f71f6f0" className="rie-wishful-art" src={moduleAssetUrl('images/research-background/wishful-research-art-v1.jpg')} alt="左侧的想法笔记，中间整合的文献与研究计划，右侧的结果报告" />
      <svg shuku-edit-id="e-582f9bf1-6aad-46da-a962-ba3171d8fd22" className="rie-wishful-connections" viewBox="0 0 1600 900" aria-hidden="true">
        <defs shuku-edit-id="e-87d56ea3-c79a-4633-97a5-de7530962c43"><marker shuku-edit-id="e-bc35aac1-2a37-40dd-9c8b-c3d339fc9ec3" id={`${marker}-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path shuku-edit-id="e-5fedcab5-a2f3-4261-b375-9ea8f163654a" d="M0 0L10 5L0 10Z" fill="#27446e" /></marker></defs>
        {['M476 480h40', 'M1138 480h54'].map(path => <path shuku-edit-id="e-6002c6ba-2ad7-4e0f-b579-aec250a185ed" key={path} d={path} fill="none" stroke="#27446e" strokeWidth="4" markerEnd={`url(#${marker}-arrow)`} />)}
      </svg>
      <div shuku-edit-id="e-8e10e984-f28c-4f27-8177-fdfdd2affa4f" className="rie-wishful-labels" aria-label="许愿式科研的使用方式">
        <Typography shuku-edit-id="e-ab5528cd-6559-4ed5-a97d-b6a8c52c05ea" variant="h2" tone="accent" className="rie-wishful-input">提出想法</Typography>
        <Typography shuku-edit-id="e-282b2e04-4ef8-4bc1-b24e-4ba0f3de3c10" variant="h2" tone="accent" className="rie-wishful-work">AI 推进研究过程</Typography>
        <Typography shuku-edit-id="e-d633e4f9-8002-4302-a043-e0a15d25a9f5" variant="h2" tone="accent" className="rie-wishful-output">查看结果</Typography>
      </div>
      <Typography shuku-edit-id="e-548291e9-10bc-4a18-ad20-9e4c3556caae" variant="h2" tone="accent" className="rie-wishful-takeaway">从亲自做每一步，到提出目标、让 AI 去做。</Typography>
    </ContentBlock>
  );
}
