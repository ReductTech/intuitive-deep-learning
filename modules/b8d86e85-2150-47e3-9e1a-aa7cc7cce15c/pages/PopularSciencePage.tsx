import { Typography } from "@shuku/course-style/react";
import { WormholeBenefit, WormholeLessonFrame } from '../components/WormholeLessonFrame';
import './PopularSciencePage.css';
import { FoldingWormhole } from '../components/FoldingWormhole';

export function PopularSciencePage() {
  return <WormholeLessonFrame className="cg-pop-page" title="科普教育的问题是什么？" subtitle="折纸的比喻让人迅速理解“捷径”，但还没有解释虫洞的物理条件。" conclusion="先建立印象，再追问机制与适用条件。" sidebar={<>
    <Typography shuku-edit-id="e-3fa4ff64-c427-46c0-86f7-94dd8ceaf4fb" as="h2" variant="h2" tone="accent" className="cg-wormhole-sidebar-title">科普教育的优势</Typography>
    <WormholeBenefit kind="light" title="直观">用熟悉的事物帮助理解</WormholeBenefit>
    <WormholeBenefit kind="book" title="低门槛">不需要太多专业知识</WormholeBenefit>
    <WormholeBenefit kind="heart" title="激发兴趣">让复杂的概念变得有趣</WormholeBenefit>
    <div shuku-edit-id="e-66b4dbd0-a4c7-43ae-b7b3-cb0cc14e7817" className="cg-wormhole-questions"><Typography shuku-edit-id="e-c27e7302-0df3-4916-8ba7-25bda074e586" as="h3" variant="h3" tone="inherit">还需要回答</Typography><Typography shuku-edit-id="e-2ac3375c-ae9f-4c68-ac2c-90fa2d306b1c" variant="bodySmall" tone="inherit">通道为何能保持开放？<br shuku-edit-id="e-b52940c7-6b6a-457b-bb1b-60f7240146da" />什么条件下可以通过？</Typography></div>
  </>}>
    <Typography shuku-edit-id="e-4a936e50-dd30-4c50-9fb9-8f06280ddf38" as="h2" variant="h2" tone="accent">虫洞：连接遥远区域的假想捷径</Typography>
    <FoldingWormhole />
    <Typography shuku-edit-id="e-181cfba5-c573-4121-99a0-e9b6571404fa" variant="bodySmall" tone="muted" className="cg-pop-model-note">折纸是比喻，不是虫洞的真实外观。</Typography>
  </WormholeLessonFrame>;
}

