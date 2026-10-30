import { useId } from 'react';
import { ContentBlock, Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import './WishfulResearchPage.css';

export function WishfulResearchPage() {
  const marker = useId().replaceAll(':', '');
  return (
    <ContentBlock title={outline.pages[3].title} subtitle="提出研究目标，期待 AI 推进研究过程" headingLevel={1} className="rie-wishful" data-scene-id="wishful-research">
      <img className="rie-wishful-art" src={moduleAssetUrl(outline.moduleIdentity.id, 'images/wishful-research-art-v1.jpg')} alt="左侧的想法笔记，中间整合的文献与研究计划，右侧的结果报告" />
      <svg className="rie-wishful-connections" viewBox="0 0 1600 900" aria-hidden="true">
        <defs><marker id={`${marker}-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#27446e" /></marker></defs>
        {['M476 480h40', 'M1138 480h54'].map(path => <path key={path} d={path} fill="none" stroke="#27446e" strokeWidth="4" markerEnd={`url(#${marker}-arrow)`} />)}
      </svg>
      <div className="rie-wishful-labels" aria-label="许愿式科研的使用方式">
        <Typography variant="h2" tone="accent" className="rie-wishful-input">提出想法</Typography>
        <Typography variant="h2" tone="accent" className="rie-wishful-work">AI 推进研究过程</Typography>
        <Typography variant="h2" tone="accent" className="rie-wishful-output">查看结果</Typography>
      </div>
      <Typography variant="h2" tone="accent" className="rie-wishful-takeaway">从亲自做每一步，到提出目标、让 AI 去做。</Typography>
    </ContentBlock>
  );
}
