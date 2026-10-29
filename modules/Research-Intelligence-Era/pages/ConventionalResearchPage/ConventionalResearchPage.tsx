import { useId } from 'react';
import { ContentBlock, Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import './ConventionalResearchPage.css';

const stages = ['提出问题', '查阅文献', '设计研究', '收集材料', '分析论证', '写作发表'];

export function ConventionalResearchPage() {
  const marker = useId().replaceAll(':', '');
  return (
    <ContentBlock title={outline.pages[2].title} subtitle="从提出问题，到形成研究成果" headingLevel={1} className="rie-traditional" data-scene-id="conventional-research">
      <img className="rie-traditional-art" src={moduleAssetUrl(outline.moduleIdentity.id, 'images/conventional-research-art-v1.jpg')} alt="依次对应研究六个环节的笔记本、书籍、研究计划、资料夹、分析材料与文稿" />
      <svg className="rie-traditional-connections" viewBox="0 0 1600 900" aria-hidden="true">
        <defs>
          <marker id={`${marker}-forward`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#27446e" /></marker>
          <marker id={`${marker}-return`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#f07e47" /></marker>
        </defs>
        {[273, 554, 798, 1057, 1336].map(x => <path key={x} d={`M${x} 458h26`} stroke="#27446e" strokeWidth="3" fill="none" markerEnd={`url(#${marker}-forward)`} />)}
        <path d="M1190 632v22q0 15-15 15H694q-16 0-16-16v-21" fill="none" stroke="#f07e47" strokeWidth="3.5" markerEnd={`url(#${marker}-return)`} />
      </svg>
      <ol className="rie-traditional-labels" aria-label="常见科研流程">
        {stages.map(stage => <Typography key={stage} as="li" variant="h3" tone="accent">{stage}</Typography>)}
      </ol>
      <Typography variant="body" tone="inherit" className="rie-traditional-return">反复调整</Typography>
      <Typography variant="h2" tone="accent" className="rie-traditional-takeaway">过去，研究者既要提出想法，也要一步步把它做出来。</Typography>
    </ContentBlock>
  );
}
