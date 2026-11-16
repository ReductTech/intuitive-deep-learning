import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useRef } from 'react';
import { Typography } from "@shuku/course-style/react";
import { CopiedCoursePreview } from './CopiedCoursePreview';
import { conventionalOutline, simulationOutline, simulationPages, type WalkthroughView } from './simulation';
import outline from '../../outlines.json';

const asset = (name: string) => moduleAssetUrl(`workflow/${name}`);
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
    return <figure shuku-edit-id="e-448a4c9f-acde-4486-b17e-2904b7e51a9a" className="cg-sim-design cg-sim-course-thumbnail"><img shuku-edit-id="e-32268fc3-4f28-44b6-8336-d8d4eaad9a80" src={asset(`course-thumbnails/${item.id}.webp`)} alt={`课程参考缩略图：${item.title}`}/></figure>;
  }
  if (view === 'outline-basic' || view === 'outline-gomoku') {
    const revised = view === 'outline-gomoku';
    const pages = simulationOutline(revised);
    return <div shuku-edit-id="e-cda2da4f-c897-4334-8653-04c86d87953a" className="cg-sim-slide cg-sim-outline">
      <Typography shuku-edit-id="e-9507af02-28ad-4cc9-b9be-109ce9e2206a" as="h2" variant="h2" tone="accent">{revised ? '从五子棋到图像卷积' : '卷积核入门：课程大纲'}</Typography>
      <Typography shuku-edit-id="e-5848b2ef-7854-4631-be2c-1bb035670c55" variant="bodySmall" tone="muted">{revised ? '24页 · 从体验和观察，走向计算与概念' : '第一版 · 定义、运算、应用与扩展'}</Typography>
      <div shuku-edit-id="e-05d8a767-db57-475c-8aab-af4ca226ea23" className="cg-sim-outline-pages" ref={outlineRef}>{pages.map((item,i) => <div shuku-edit-id="e-30bcc4d8-5986-48b4-aacd-62457e918103" data-outline-page={i} key={item.title} className={page === i ? 'is-selected' : undefined}><Typography shuku-edit-id="e-ef94f2ed-a0bc-459f-89f7-c04a6bce272b" as="span" variant="bodySmall" tone="muted">{String(i+1).padStart(2,'0')}</Typography><div shuku-edit-id="e-cc35abde-3ad7-45e3-b185-bc5d2f2cc3da"><Typography shuku-edit-id="e-ccb9e08a-a6aa-4b62-ba24-fc9bf1e5e6c7" variant="bodySmall" tone="inherit">{item.title}</Typography><Typography shuku-edit-id="e-a49815d3-a89e-4d4d-a372-15b121dd9cd8" variant="bodySmall" tone="muted">{item.summary}</Typography></div></div>)}</div>
    </div>;
  }
  if ((view === 'design-draft' || view === 'design-refined') && page === 0) return <figure shuku-edit-id="e-1c4c2e1a-d64d-473e-9d83-37ca1599ca66" className="cg-sim-design"><img shuku-edit-id="e-62455966-f11c-478b-86e8-0f8833a5d750" src={asset(view === 'design-draft' ? 'gomoku-design-draft.jpg' : 'gomoku-design-refined.jpg')} alt={view === 'design-draft' ? '第一页设计初稿：简洁棋盘和操作区' : '第一页修改版设计：庭院背景，左侧引导、中间棋盘、右侧对局面板'}/></figure>;
  if ((view === 'page' || view === 'review') && page === 0) return <CopiedCoursePreview page={page} reviewed={reviewed}/>;
  const item = simulationPages[page] ?? conventionalOutline[page];
  return <div shuku-edit-id="e-c2c59bd8-0930-4e30-9b96-f902093da781" className="cg-sim-slide cg-sim-text-slide"><Typography shuku-edit-id="e-b903868f-84ff-4afc-ae93-0d86ea9709e7" as="h2" variant="h2" tone="accent">{item.title}</Typography><Typography shuku-edit-id="e-85d26d51-e9db-4aa3-97b9-3c2a61a09145" variant="bodySmall" tone="muted">内容提要 · 待逐页制作</Typography><Typography shuku-edit-id="e-522a86db-1735-40da-9321-beef7d142e4f" variant="body" tone="inherit">{item.summary}</Typography>{reviewed && page === 1 && <Typography shuku-edit-id="e-42f711f9-e89f-498f-a764-934a7fada50a" className="cg-sim-link-note" variant="bodySmall" tone="accent">这些数字对应上一页的棋盘位置。</Typography>}</div>;
}
