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
    return <figure shuku-edit-id="e-5d2ba71c-2fc6-482b-b14e-a3b5a22c3f3a" className="cg-sim-design cg-sim-course-thumbnail"><img shuku-edit-id="e-4fa36783-591b-4538-90b6-13fc039c1535" src={asset(`course-thumbnails/${item.id}.webp`)} alt={`课程参考缩略图：${item.title}`}/></figure>;
  }
  if (view === 'outline-basic' || view === 'outline-gomoku') {
    const revised = view === 'outline-gomoku';
    const pages = simulationOutline(revised);
    return <div shuku-edit-id="e-7fd8941a-9a7e-4e8b-b065-78d80a39888a" className="cg-sim-slide cg-sim-outline">
      <Typography shuku-edit-id="e-a5b056a1-6be7-4ff4-b1fe-3d2a872ad948" as="h2" variant="h2" tone="accent">{revised ? '从五子棋到图像卷积' : '卷积核入门：课程大纲'}</Typography>
      <Typography shuku-edit-id="e-2db8c529-0280-400f-b04d-58220a32c8d4" variant="bodySmall" tone="muted">{revised ? '24页 · 从体验和观察，走向计算与概念' : '第一版 · 定义、运算、应用与扩展'}</Typography>
      <div shuku-edit-id="e-a56e39cb-7da3-46eb-9ed5-ca93dde8b047" className="cg-sim-outline-pages" ref={outlineRef}>{pages.map((item,i) => <div shuku-edit-id="e-ee8a3540-cd44-400a-b526-04dc720c3f8c" data-outline-page={i} key={item.title} className={page === i ? 'is-selected' : undefined}><Typography shuku-edit-id="e-2709ee1b-a191-4fd5-9e20-e17696a36b24" as="span" variant="bodySmall" tone="muted">{String(i+1).padStart(2,'0')}</Typography><div shuku-edit-id="e-473eaf15-50ed-4de1-a033-4575c7dd1b3e"><Typography shuku-edit-id="e-ab8f6332-2f76-4a3f-8962-a862fa8930f1" variant="bodySmall" tone="inherit">{item.title}</Typography><Typography shuku-edit-id="e-542b5f5d-9d9f-4ab7-91ec-c62fc89e0dc6" variant="bodySmall" tone="muted">{item.summary}</Typography></div></div>)}</div>
    </div>;
  }
  if ((view === 'design-draft' || view === 'design-refined') && page === 0) return <figure shuku-edit-id="e-a2c82fbb-9a89-452c-950c-f87c5e711948" className="cg-sim-design"><img shuku-edit-id="e-c1a0e401-31f0-4183-a3d6-20eda086b4f0" src={asset(view === 'design-draft' ? 'gomoku-design-draft.webp' : 'gomoku-design-refined.webp')} alt={view === 'design-draft' ? '第一页设计初稿：简洁棋盘和操作区' : '第一页修改版设计：庭院背景，左侧引导、中间棋盘、右侧对局面板'}/></figure>;
  if ((view === 'page' || view === 'review') && page === 0) return <CopiedCoursePreview page={page} reviewed={reviewed}/>;
  const item = simulationPages[page] ?? conventionalOutline[page];
  return <div shuku-edit-id="e-f7c3a0ba-8d6b-4736-a9b1-d4ea7eae4bc9" className="cg-sim-slide cg-sim-text-slide"><Typography shuku-edit-id="e-c7e3ee33-9674-4d81-b632-1f4b8352d5ec" as="h2" variant="h2" tone="accent">{item.title}</Typography><Typography shuku-edit-id="e-dc7a45ab-de9a-4fe7-b917-e8f2965ed078" variant="bodySmall" tone="muted">内容提要 · 待逐页制作</Typography><Typography shuku-edit-id="e-b303ae7f-903e-4800-b915-655e5bbc30ec" variant="body" tone="inherit">{item.summary}</Typography>{reviewed && page === 1 && <Typography shuku-edit-id="e-900e5ce4-5b21-443d-9158-b90ee4f49d65" className="cg-sim-link-note" variant="bodySmall" tone="accent">这些数字对应上一页的棋盘位置。</Typography>}</div>;
}
