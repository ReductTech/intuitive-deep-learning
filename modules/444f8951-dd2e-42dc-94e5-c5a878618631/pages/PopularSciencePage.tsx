import { Typography } from "@shuku/course-style/react";
import { WormholeBenefit, WormholeLessonFrame } from '../components/WormholeLessonFrame';
import './PopularSciencePage.css';
import { FoldingWormhole } from '../components/FoldingWormhole';

export function PopularSciencePage() {
  return <WormholeLessonFrame className="cg-pop-page" title="科普教育的问题是什么？" subtitle="折纸的比喻让人迅速理解“捷径”，但还没有解释虫洞的物理条件。" conclusion="先建立印象，再追问机制与适用条件。" sidebar={<>
    <Typography shuku-edit-id="e-d6e26727-4c00-4a1b-a302-7e972155fecc" as="h2" variant="h2" tone="accent" className="cg-wormhole-sidebar-title">科普教育的优势</Typography>
    <WormholeBenefit kind="light" title="直观">用熟悉的事物帮助理解</WormholeBenefit>
    <WormholeBenefit kind="book" title="低门槛">不需要太多专业知识</WormholeBenefit>
    <WormholeBenefit kind="heart" title="激发兴趣">让复杂的概念变得有趣</WormholeBenefit>
    <div shuku-edit-id="e-c9865e29-a323-4995-9c2a-69f9b1ca6506" className="cg-wormhole-questions"><Typography shuku-edit-id="e-d342ea9e-9024-4021-9602-5b28b9d27d4f" as="h3" variant="h3" tone="inherit">还需要回答</Typography><Typography shuku-edit-id="e-c1b5fcbd-6787-48f8-a6aa-19bea567944f" variant="bodySmall" tone="inherit">通道为何能保持开放？<br shuku-edit-id="e-ea2bc378-5c2e-4b59-a227-e667edd6c97f" />什么条件下可以通过？</Typography></div>
  </>}>
    <Typography shuku-edit-id="e-281a0ced-fdf4-4fc8-a1b7-357c5821c0f1" as="h2" variant="h2" tone="accent">虫洞：连接遥远区域的假想捷径</Typography>
    <FoldingWormhole />
    <Typography shuku-edit-id="e-07c9ab99-a11c-4c5c-bc33-3fa584e3ee0d" variant="bodySmall" tone="muted" className="cg-pop-model-note">折纸是比喻，不是虫洞的真实外观。</Typography>
  </WormholeLessonFrame>;
}

