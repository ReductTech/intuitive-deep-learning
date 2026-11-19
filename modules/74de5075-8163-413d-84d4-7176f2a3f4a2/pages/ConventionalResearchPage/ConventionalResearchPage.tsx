import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useId } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './ConventionalResearchPage.css';

const stages = ['提出问题', '查阅文献', '设计研究', '收集材料', '分析论证', '写作发表'];

export function ConventionalResearchPage() {
  const marker = useId().replaceAll(':', '');
  return (
    <ContentBlock shuku-edit-id="e-c5310e33-d793-4847-8d82-6271c9c9d501" title={outline.pages.find(page => page.id === 'spp-research-conventional-research')!.title} subtitle="从提出问题，到形成研究成果" headingLevel={1} className="rie-traditional" data-scene-id="spp-research-conventional-research">
      <img shuku-edit-id="e-b6ed230c-7217-40b1-806d-efee2f9deb38" className="rie-traditional-art" src={moduleAssetUrl("images/research-background/conventional-research-art-v1.webp")} alt="依次对应研究六个环节的笔记本、书籍、研究计划、资料夹、分析材料与文稿" />
      <svg shuku-edit-id="e-3556e6c6-cf55-4077-bf08-5de7ebbc94a3" className="rie-traditional-connections" viewBox="0 0 1600 900" aria-hidden="true">
        <defs shuku-edit-id="e-e03ea627-8908-4931-969f-e79e49f858c1">
          <marker shuku-edit-id="e-7c204482-83f1-4cde-ac71-592850701d0f" id={`${marker}-forward`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path shuku-edit-id="e-5ae293f1-eb16-41ef-bde0-7e5fac157697" d="M0 0L10 5L0 10Z" fill="#27446e" /></marker>
          <marker shuku-edit-id="e-c2acfdf7-2a93-44ce-8c75-67398850ef31" id={`${marker}-return`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path shuku-edit-id="e-73171322-34f7-479e-9e7b-838e8fad811b" d="M0 0L10 5L0 10Z" fill="#f07e47" /></marker>
        </defs>
        {[273, 554, 798, 1057, 1336].map(x => <path shuku-edit-id="e-1d391283-33c8-44e8-b692-463de7c5ce34" key={x} d={`M${x} 458h26`} stroke="#27446e" strokeWidth="3" fill="none" markerEnd={`url(#${marker}-forward)`} />)}
        <path shuku-edit-id="e-610885c1-2bfc-441f-9457-e86c08ef3139" d="M1190 632v22q0 15-15 15H694q-16 0-16-16v-21" fill="none" stroke="#f07e47" strokeWidth="3.5" markerEnd={`url(#${marker}-return)`} />
      </svg>
      <ol shuku-edit-id="e-f369b1ee-d006-4078-a142-fd95caf856f3" className="rie-traditional-labels" aria-label="常见科研流程">
        {stages.map(stage => <Typography shuku-edit-id="e-532a4e5e-f550-40a0-b5c5-8c665776cb73" key={stage} as="li" variant="h3" tone="accent">{stage}</Typography>)}
      </ol>
      <Typography shuku-edit-id="e-876bce35-a562-484b-8dd1-5edc0f1e61a8" variant="body" tone="inherit" className="rie-traditional-return">反复调整</Typography>
      <Typography shuku-edit-id="e-302201bb-34ec-4f3b-bd89-c3735830e18e" variant="h2" tone="accent" className="rie-traditional-takeaway">过去，研究者既要提出想法，也要一步步把它做出来。</Typography>
    </ContentBlock>
  );
}
