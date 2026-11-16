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
    return <figure shuku-edit-id="e-ebcc3427-56bd-4cda-b0fe-b84b9a69ea8a" className="cg-sim-design cg-sim-course-thumbnail"><img shuku-edit-id="e-d02c1c25-77a7-428f-af61-b8590baf2728" src={asset(`course-thumbnails/${item.id}.webp`)} alt={`课程参考缩略图：${item.title}`}/></figure>;
  }
  if (view === 'outline-basic' || view === 'outline-gomoku') {
    const revised = view === 'outline-gomoku';
    const pages = simulationOutline(revised);
    return <div shuku-edit-id="e-c79f13f6-33bf-4a9f-8d1a-0d060f6cb8c7" className="cg-sim-slide cg-sim-outline">
      <Typography shuku-edit-id="e-a7fccf69-493d-4bc3-b302-c78c6a5eaa31" as="h2" variant="h2" tone="accent">{revised ? '从五子棋到图像卷积' : '卷积核入门：课程大纲'}</Typography>
      <Typography shuku-edit-id="e-12a4d0e6-cd9b-4888-8332-b28883b81f19" variant="bodySmall" tone="muted">{revised ? '24页 · 从体验和观察，走向计算与概念' : '第一版 · 定义、运算、应用与扩展'}</Typography>
      <div shuku-edit-id="e-1673571d-d28d-4779-80c3-5ae77bda1d72" className="cg-sim-outline-pages" ref={outlineRef}>{pages.map((item,i) => <div shuku-edit-id="e-3226d63d-01f5-44e3-ac1b-942ab2defb43" data-outline-page={i} key={item.title} className={page === i ? 'is-selected' : undefined}><Typography shuku-edit-id="e-d9875430-1bbb-4798-9146-b4b1a9faf9f6" as="span" variant="bodySmall" tone="muted">{String(i+1).padStart(2,'0')}</Typography><div shuku-edit-id="e-40cd2771-9a2e-42c5-b912-8768e32653ce"><Typography shuku-edit-id="e-9a86d514-3bbf-4d3f-9a8b-bd6388459ec4" variant="bodySmall" tone="inherit">{item.title}</Typography><Typography shuku-edit-id="e-d89f1032-5f94-4459-836c-6c0c1848654a" variant="bodySmall" tone="muted">{item.summary}</Typography></div></div>)}</div>
    </div>;
  }
  if ((view === 'design-draft' || view === 'design-refined') && page === 0) return <figure shuku-edit-id="e-612d32cb-912e-42ae-a141-ec45931c9083" className="cg-sim-design"><img shuku-edit-id="e-bbd5f044-360f-454b-af36-78e3053a655f" src={asset(view === 'design-draft' ? 'gomoku-design-draft.jpg' : 'gomoku-design-refined.jpg')} alt={view === 'design-draft' ? '第一页设计初稿：简洁棋盘和操作区' : '第一页修改版设计：庭院背景，左侧引导、中间棋盘、右侧对局面板'}/></figure>;
  if ((view === 'page' || view === 'review') && page === 0) return <CopiedCoursePreview page={page} reviewed={reviewed}/>;
  const item = simulationPages[page] ?? conventionalOutline[page];
  return <div shuku-edit-id="e-33f7339d-90f5-4cc9-88fc-af27f21a75fd" className="cg-sim-slide cg-sim-text-slide"><Typography shuku-edit-id="e-44d57776-eb20-4e0d-a610-4ecc223fdef0" as="h2" variant="h2" tone="accent">{item.title}</Typography><Typography shuku-edit-id="e-6fb3e87b-bc2c-426b-a1af-0efebe186f9a" variant="bodySmall" tone="muted">内容提要 · 待逐页制作</Typography><Typography shuku-edit-id="e-f301f04e-36d9-47a5-80f3-19970196438b" variant="body" tone="inherit">{item.summary}</Typography>{reviewed && page === 1 && <Typography shuku-edit-id="e-36fb7a9f-2ada-4bdd-b961-39adcd17a94c" className="cg-sim-link-note" variant="bodySmall" tone="accent">这些数字对应上一页的棋盘位置。</Typography>}</div>;
}
