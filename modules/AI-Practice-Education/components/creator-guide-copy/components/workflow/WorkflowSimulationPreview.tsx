import { creatorGuideAssetUrl } from '../../creatorGuideAssets';
import { useEffect, useRef } from 'react';
import { Typography, moduleAssetUrl } from '../../../../../shared/react';
import { CopiedCoursePreview } from './CopiedCoursePreview';
import { conventionalOutline, simulationOutline, simulationPages, type WalkthroughView } from './simulation';
import outline from '../../outlines.json';

const asset = (name: string) => creatorGuideAssetUrl(outline.moduleIdentity.id, `workflow/${name}`);
export function WorkflowSimulationPreview({ view, page, reviewed, browsing }: { view: WalkthroughView; page: number; reviewed: boolean; browsing: boolean }) {
  const outlineRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const item = outlineRef.current?.querySelector(`[data-outline-page="${page}"]`);
    if (item) item.scrollIntoView({ block: 'nearest' });
  }, [page]);
  const isOutline = view === 'outline-basic' || view === 'outline-gomoku';
  const firstPageDemo = page === 0 && ['design-draft', 'design-refined', 'page', 'review'].includes(view);
  if ((browsing || !isOutline) && !firstPageDemo) {
    if (view === 'page' || view === 'review') return <CopiedCoursePreview page={page} reviewed={reviewed}/>;
    const item = simulationPages[page];
    return <figure className="aipe-replay-cg-sim-design aipe-replay-cg-sim-course-thumbnail"><img src={asset(`course-thumbnails/${item.id}.jpg`)} alt={`课程参考缩略图：${item.title}`}/></figure>;
  }
  if (view === 'outline-basic' || view === 'outline-gomoku') {
    const revised = view === 'outline-gomoku';
    const pages = simulationOutline(revised);
    return <div className="aipe-replay-cg-sim-slide aipe-replay-cg-sim-outline">
      <Typography as="h2" variant="h2" tone="accent">{revised ? '从五子棋到图像卷积' : '卷积核入门：课程大纲'}</Typography>
      <Typography variant="bodySmall" tone="muted">{revised ? '24页 · 从体验和观察，走向计算与概念' : '第一版 · 定义、运算、应用与扩展'}</Typography>
      <div className="aipe-replay-cg-sim-outline-pages" ref={outlineRef}>{pages.map((item,i) => <div data-outline-page={i} key={item.title} className={page === i ? 'is-selected' : undefined}><Typography as="span" variant="bodySmall" tone="muted">{String(i+1).padStart(2,'0')}</Typography><div><Typography variant="bodySmall" tone="inherit">{item.title}</Typography><Typography variant="bodySmall" tone="muted">{item.summary}</Typography></div></div>)}</div>
    </div>;
  }
  if ((view === 'design-draft' || view === 'design-refined') && page === 0) return <figure className="aipe-replay-cg-sim-design"><img src={asset(view === 'design-draft' ? 'gomoku-design-draft.jpg' : 'gomoku-design-refined.jpg')} alt={view === 'design-draft' ? '第一页设计初稿：简洁棋盘和操作区' : '第一页修改版设计：庭院背景，左侧引导、中间棋盘、右侧对局面板'}/></figure>;
  if ((view === 'page' || view === 'review') && page === 0) return <CopiedCoursePreview page={page} reviewed={reviewed}/>;
  const item = simulationPages[page] ?? conventionalOutline[page];
  return <div className="aipe-replay-cg-sim-slide aipe-replay-cg-sim-text-slide"><Typography as="h2" variant="h2" tone="accent">{item.title}</Typography><Typography variant="bodySmall" tone="muted">内容提要 · 待逐页制作</Typography><Typography variant="body" tone="inherit">{item.summary}</Typography>{reviewed && page === 1 && <Typography className="aipe-replay-cg-sim-link-note" variant="bodySmall" tone="accent">这些数字对应上一页的棋盘位置。</Typography>}</div>;
}
