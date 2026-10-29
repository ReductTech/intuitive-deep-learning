import { useId } from 'react';
import { ContentBlock, moduleAssetUrl, Typography } from '../../../shared/react';
import outline from '../../outlines.json';
import './FoundationFrontierPage.css';

export function FoundationFrontierPage() {
  const id = useId().replaceAll(':', '');
  return <ContentBlock className="aipe-ff-page" headingLevel={1}
    title={outline.pages[2].title} subtitle="建立系统理解，持续更新认识" bodyClassName="aipe-ff-body">
    <div className="aipe-ff-map" role="group" aria-label="知识探索者同时需要系统掌握知识和持续追踪前沿，两者相互支撑">
      <svg className="aipe-ff-connections" viewBox="0 0 1538 690" aria-hidden="true">
        <defs>
          <marker id={`${id}-orange`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="2.6" markerHeight="2.6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#f07e47"/></marker>
          <marker id={`${id}-blue`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="2.6" markerHeight="2.6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#7494bd"/></marker>
          <marker id={`${id}-fine`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#7494bd"/></marker>
        </defs>
        <path d="M430 274C555 260 605 116 750 116" stroke="#f07e47" strokeWidth="18" fill="none" markerEnd={`url(#${id}-orange)`}/>
        <path d="M430 340C555 360 620 465 750 465" stroke="#7494bd" strokeWidth="18" fill="none" markerEnd={`url(#${id}-blue)`}/>
        <path d="M1082 197C1123 241 1123 299 1082 345" stroke="#7494bd" strokeWidth="3" strokeDasharray="4 7" fill="none" markerStart={`url(#${id}-fine)`} markerEnd={`url(#${id}-fine)`}/>
      </svg>
      <div className="aipe-ff-hub"><Typography as="h2" variant="h1" tone="inherit">知识<br/>探索者</Typography></div>
      <Typography as="p" variant="subtitle" tone="muted" className="aipe-ff-hub-caption">理解与应用</Typography>
      <img className="aipe-ff-materials" src={moduleAssetUrl(outline.moduleIdentity.id,'images/foundation-frontier-materials-v2.png')}
        alt="研究论文与系统教材，分别承载前沿跟踪与知识体系学习" draggable={false}/>
      <section className="aipe-ff-branch aipe-ff-frontier">
        <Typography as="h2" variant="h1" tone="inherit">持续追踪前沿</Typography>
        <div className="aipe-ff-details"><Typography as="p" variant="body" tone="accent">关注新问题与新方法</Typography><Typography as="p" variant="body" tone="accent">获取与目标相关的研究</Typography></div>
      </section>
      <Typography as="p" variant="body" tone="muted" className="aipe-ff-relation">相互支撑，持续深化</Typography>
      <section className="aipe-ff-branch aipe-ff-systematic">
        <Typography as="h2" variant="h1" tone="accent">系统掌握知识</Typography>
        <div className="aipe-ff-details"><Typography as="p" variant="body" tone="accent">理解概念、方法与联系</Typography><Typography as="p" variant="body" tone="accent">形成可应用的知识体系</Typography></div>
      </section>
    </div>
  </ContentBlock>;
}
