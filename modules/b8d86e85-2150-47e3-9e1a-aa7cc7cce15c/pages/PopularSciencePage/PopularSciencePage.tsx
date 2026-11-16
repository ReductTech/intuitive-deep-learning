import outline from '../../outlines.json';
import { Typography } from "@shuku/course-style/react";
import { WormholeBenefit, WormholeLessonFrame } from '../../components/WormholeLessonFrame';
import './PopularSciencePage.css';
import { FoldingWormhole } from './FoldingWormhole';

export function PopularSciencePage() {
  return <WormholeLessonFrame className="llmpe-cg-pop-page" title={outline.pages.find(page => page.id === '1c673e39-9fd4-4402-858e-67185f3125dd')!.title} subtitle="折纸的比喻让人迅速理解“捷径”，但还没有解释虫洞的物理条件。" conclusion="先建立印象，再追问机制与适用条件。" sidebar={<>
    <Typography shuku-edit-id="e-4b303fcb-6ae6-4e24-bfbd-b5ba98900011" as="h2" variant="h2" tone="accent" className="llmpe-cg-wormhole-sidebar-title">科普教育的优势</Typography>
    <WormholeBenefit kind="light" title="直观">用熟悉的事物帮助理解</WormholeBenefit>
    <WormholeBenefit kind="book" title="低门槛">不需要太多专业知识</WormholeBenefit>
    <WormholeBenefit kind="heart" title="激发兴趣">让复杂的概念变得有趣</WormholeBenefit>
    <div shuku-edit-id="e-dd19285d-4c2c-4128-bcb2-ea4978b5a4b7" className="llmpe-cg-wormhole-questions"><Typography shuku-edit-id="e-bb4663e3-68a2-4c7a-95d4-535497ee3fd4" as="h3" variant="h3" tone="inherit">还需要回答</Typography><Typography shuku-edit-id="e-8ae5dbfe-ad75-45e6-8033-77c57854a928" variant="bodySmall" tone="inherit">通道为何能保持开放？<br shuku-edit-id="e-b79af700-9f68-4388-9e9f-e1a005978bc4" />什么条件下可以通过？</Typography></div>
  </>}>
    <Typography shuku-edit-id="e-523277e9-110a-4207-a210-f1266ccc0b30" as="h2" variant="h2" tone="accent">虫洞：连接遥远区域的假想捷径</Typography>
    <FoldingWormhole />
    <Typography shuku-edit-id="e-7ff213d2-5b6b-4b02-8262-2d369b02bb0f" variant="bodySmall" tone="muted" className="llmpe-cg-pop-model-note">折纸是比喻，不是虫洞的真实外观。</Typography>
  </WormholeLessonFrame>;
}

