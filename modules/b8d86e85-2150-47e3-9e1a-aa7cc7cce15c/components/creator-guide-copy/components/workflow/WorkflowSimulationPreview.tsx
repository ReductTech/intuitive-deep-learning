import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { creatorGuideAssetUrl } from '../../creatorGuideAssets';
import { useEffect, useRef } from 'react';
import { Typography } from "@shuku/course-style/react";
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
    return <figure shuku-edit-id="e-9a26f84b-bbbf-4075-85c9-b602757fdf30" className="aipe-replay-cg-sim-design aipe-replay-cg-sim-course-thumbnail"><img shuku-edit-id="e-98255219-8ca8-4ed1-9349-956a50387318" src={asset(`course-thumbnails/${item.id}.webp`)} alt={`课程参考缩略图：${item.title}`}/></figure>;
  }
  if (view === 'outline-basic' || view === 'outline-gomoku') {
    const revised = view === 'outline-gomoku';
    const pages = simulationOutline(revised);
    return <div shuku-edit-id="e-93d0b846-9d89-4d39-ba43-84fa7e0c75f2" className="aipe-replay-cg-sim-slide aipe-replay-cg-sim-outline">
      <Typography shuku-edit-id="e-7f9ba403-e74c-431b-b862-7a5a6a05a671" as="h2" variant="h2" tone="accent">{revised ? '从五子棋到图像卷积' : '卷积核入门：课程大纲'}</Typography>
      <Typography shuku-edit-id="e-ee2a37d3-b91c-4ce0-ade3-36048a728a26" variant="bodySmall" tone="muted">{revised ? '24页 · 从体验和观察，走向计算与概念' : '第一版 · 定义、运算、应用与扩展'}</Typography>
      <div shuku-edit-id="e-f4c5ef8f-2067-423f-bd3a-887e4bb65ffb" className="aipe-replay-cg-sim-outline-pages" ref={outlineRef}>{pages.map((item,i) => <div shuku-edit-id="e-b947e257-7e2d-43cd-9fc8-82de03be36a0" data-outline-page={i} key={item.title} className={page === i ? 'is-selected' : undefined}><Typography shuku-edit-id="e-4cae6cf0-cb2b-44ca-a93c-7eba2b3f4d94" as="span" variant="bodySmall" tone="muted">{String(i+1).padStart(2,'0')}</Typography><div shuku-edit-id="e-22c58a0f-1067-41f1-a1ca-ae356eb3a1c2"><Typography shuku-edit-id="e-e301d1a8-8ae9-4767-8284-1125372f462d" variant="bodySmall" tone="inherit">{item.title}</Typography><Typography shuku-edit-id="e-5e23f275-384d-4098-b23e-70c99104e29a" variant="bodySmall" tone="muted">{item.summary}</Typography></div></div>)}</div>
    </div>;
  }
  if ((view === 'design-draft' || view === 'design-refined') && page === 0) return <figure shuku-edit-id="e-eb95a9d9-9db5-4155-b04b-765defc49945" className="aipe-replay-cg-sim-design"><img shuku-edit-id="e-d0f5d309-de34-4da3-bb6c-3a9168638b29" src={asset(view === 'design-draft' ? 'gomoku-design-draft.jpg' : 'gomoku-design-refined.jpg')} alt={view === 'design-draft' ? '第一页设计初稿：简洁棋盘和操作区' : '第一页修改版设计：庭院背景，左侧引导、中间棋盘、右侧对局面板'}/></figure>;
  if ((view === 'page' || view === 'review') && page === 0) return <CopiedCoursePreview page={page} reviewed={reviewed}/>;
  const item = simulationPages[page] ?? conventionalOutline[page];
  return <div shuku-edit-id="e-98b57e8b-c727-4228-aa5a-2744d012dab9" className="aipe-replay-cg-sim-slide aipe-replay-cg-sim-text-slide"><Typography shuku-edit-id="e-f665f5f1-4285-482c-8cb9-a80998240fea" as="h2" variant="h2" tone="accent">{item.title}</Typography><Typography shuku-edit-id="e-29b232b7-5149-4466-8d76-1427ea88246c" variant="bodySmall" tone="muted">内容提要 · 待逐页制作</Typography><Typography shuku-edit-id="e-06770602-2627-405c-9960-e488e0837b2f" variant="body" tone="inherit">{item.summary}</Typography>{reviewed && page === 1 && <Typography shuku-edit-id="e-3a32c368-0483-4360-a76f-aa3d4a67039b" className="aipe-replay-cg-sim-link-note" variant="bodySmall" tone="accent">这些数字对应上一页的棋盘位置。</Typography>}</div>;
}
