import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useId } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './ConventionalResearchPage.css';

const stages = ['提出问题', '查阅文献', '设计研究', '收集材料', '分析论证', '写作发表'];

export function ConventionalResearchPage() {
  const marker = useId().replaceAll(':', '');
  return (
    <ContentBlock shuku-edit-id="e-113029c1-c0ab-4468-b181-d77e93eeedd2" title={outline.pages.find(page => page.id === '366440f3-29d5-4c7a-aed1-c1f3baf9d0f4')!.title} subtitle="从提出问题，到形成研究成果" headingLevel={1} className="rie-traditional" data-scene-id="366440f3-29d5-4c7a-aed1-c1f3baf9d0f4">
      <img shuku-edit-id="e-50329c1c-483b-40df-9583-ed2ffb2bcb16" className="rie-traditional-art" src={moduleAssetUrl('images/conventional-research-art-v1.jpg')} alt="依次对应研究六个环节的笔记本、书籍、研究计划、资料夹、分析材料与文稿" />
      <svg shuku-edit-id="e-45518bb3-4461-45f6-a3a9-9615c9e2cc36" className="rie-traditional-connections" viewBox="0 0 1600 900" aria-hidden="true">
        <defs shuku-edit-id="e-949ea6af-858d-47f1-b9d7-5971d13a9983">
          <marker shuku-edit-id="e-d016e89b-72a2-4bd7-8d0f-3493e9738a45" id={`${marker}-forward`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path shuku-edit-id="e-47aacce2-4b4c-46dd-b9fc-12c47b910287" d="M0 0L10 5L0 10Z" fill="#27446e" /></marker>
          <marker shuku-edit-id="e-ca30ec7f-3250-4a4b-b420-c490271329ec" id={`${marker}-return`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path shuku-edit-id="e-5cdf616d-f093-49d7-ab69-fa35e5135556" d="M0 0L10 5L0 10Z" fill="#f07e47" /></marker>
        </defs>
        {[273, 554, 798, 1057, 1336].map(x => <path shuku-edit-id="e-78122c02-f97d-4b30-92cc-e0a4d36b4b32" key={x} d={`M${x} 458h26`} stroke="#27446e" strokeWidth="3" fill="none" markerEnd={`url(#${marker}-forward)`} />)}
        <path shuku-edit-id="e-93d251bc-5d30-4d3e-84b6-445324cc9de9" d="M1190 632v22q0 15-15 15H694q-16 0-16-16v-21" fill="none" stroke="#f07e47" strokeWidth="3.5" markerEnd={`url(#${marker}-return)`} />
      </svg>
      <ol shuku-edit-id="e-9766c61f-8727-4cfb-b8e9-f09991800df7" className="rie-traditional-labels" aria-label="常见科研流程">
        {stages.map(stage => <Typography shuku-edit-id="e-41763f87-efaf-4897-9f06-3f5461c794a4" key={stage} as="li" variant="h3" tone="accent">{stage}</Typography>)}
      </ol>
      <Typography shuku-edit-id="e-1c0a69ad-96e4-445a-a863-5cd24ed7bba4" variant="body" tone="inherit" className="rie-traditional-return">反复调整</Typography>
      <Typography shuku-edit-id="e-700cbd52-d22a-4ffd-82da-8ac32a4cc58b" variant="h2" tone="accent" className="rie-traditional-takeaway">过去，研究者既要提出想法，也要一步步把它做出来。</Typography>
    </ContentBlock>
  );
}
