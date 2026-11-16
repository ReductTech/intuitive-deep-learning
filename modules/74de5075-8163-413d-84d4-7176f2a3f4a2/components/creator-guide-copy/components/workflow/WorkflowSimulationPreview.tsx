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
    return <figure shuku-edit-id="e-2a6dfff2-6f75-4771-aacb-7989402db91c" className="aipe-replay-cg-sim-design aipe-replay-cg-sim-course-thumbnail"><img shuku-edit-id="e-981502f2-1366-429c-bd98-cce5b04a0746" src={asset(`course-thumbnails/${item.id}.webp`)} alt={`课程参考缩略图：${item.title}`}/></figure>;
  }
  if (view === 'outline-basic' || view === 'outline-gomoku') {
    const revised = view === 'outline-gomoku';
    const pages = simulationOutline(revised);
    return <div shuku-edit-id="e-131b8bb0-3c1d-4e47-87b6-607449b0134a" className="aipe-replay-cg-sim-slide aipe-replay-cg-sim-outline">
      <Typography shuku-edit-id="e-964e5740-05d5-4ae0-8c81-6cf773a01aac" as="h2" variant="h2" tone="accent">{revised ? '从五子棋到图像卷积' : '卷积核入门：课程大纲'}</Typography>
      <Typography shuku-edit-id="e-595df5f9-6ab5-4be6-84b0-3f6e96011a85" variant="bodySmall" tone="muted">{revised ? '24页 · 从体验和观察，走向计算与概念' : '第一版 · 定义、运算、应用与扩展'}</Typography>
      <div shuku-edit-id="e-52d72217-cdc2-432b-b913-18aa6bde7e07" className="aipe-replay-cg-sim-outline-pages" ref={outlineRef}>{pages.map((item,i) => <div shuku-edit-id="e-d89d49d7-5cbc-498b-8331-10ec8d6b49a4" data-outline-page={i} key={item.title} className={page === i ? 'is-selected' : undefined}><Typography shuku-edit-id="e-0b90e06b-83c3-412c-a70e-bf3358c3779b" as="span" variant="bodySmall" tone="muted">{String(i+1).padStart(2,'0')}</Typography><div shuku-edit-id="e-8ec556b2-f1a4-4537-89c0-31aac6b60d96"><Typography shuku-edit-id="e-ac2f1650-217b-41e9-9f1d-07b5e118aa67" variant="bodySmall" tone="inherit">{item.title}</Typography><Typography shuku-edit-id="e-1168597c-a955-43db-b86e-5169cc7f995b" variant="bodySmall" tone="muted">{item.summary}</Typography></div></div>)}</div>
    </div>;
  }
  if ((view === 'design-draft' || view === 'design-refined') && page === 0) return <figure shuku-edit-id="e-563f139a-3faf-4e77-8163-b7c78d2ea394" className="aipe-replay-cg-sim-design"><img shuku-edit-id="e-2fa6691c-3a3b-4a97-9819-5033d4e4eca9" src={asset(view === 'design-draft' ? 'gomoku-design-draft.jpg' : 'gomoku-design-refined.jpg')} alt={view === 'design-draft' ? '第一页设计初稿：简洁棋盘和操作区' : '第一页修改版设计：庭院背景，左侧引导、中间棋盘、右侧对局面板'}/></figure>;
  if ((view === 'page' || view === 'review') && page === 0) return <CopiedCoursePreview page={page} reviewed={reviewed}/>;
  const item = simulationPages[page] ?? conventionalOutline[page];
  return <div shuku-edit-id="e-b8877d81-9dc1-4fc2-9507-c30ff1e9c1c2" className="aipe-replay-cg-sim-slide aipe-replay-cg-sim-text-slide"><Typography shuku-edit-id="e-38ffbe68-8396-482e-b8f1-d9fa2447d7ca" as="h2" variant="h2" tone="accent">{item.title}</Typography><Typography shuku-edit-id="e-4a55b169-b0d6-4782-bf9e-aa08ef907057" variant="bodySmall" tone="muted">内容提要 · 待逐页制作</Typography><Typography shuku-edit-id="e-e05ad539-4d7e-4f46-ab4f-8151f286514b" variant="body" tone="inherit">{item.summary}</Typography>{reviewed && page === 1 && <Typography shuku-edit-id="e-acc54c00-3631-4165-b737-2fc9df552453" className="aipe-replay-cg-sim-link-note" variant="bodySmall" tone="accent">这些数字对应上一页的棋盘位置。</Typography>}</div>;
}
