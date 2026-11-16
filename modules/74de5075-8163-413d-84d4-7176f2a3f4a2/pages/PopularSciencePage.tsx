import { Typography } from "@shuku/course-style/react";
import { WormholeBenefit, WormholeLessonFrame } from '../components/WormholeLessonFrame';
import './PopularSciencePage.css';
import { FoldingWormhole } from '../components/FoldingWormhole';

export function PopularSciencePage() {
  return <WormholeLessonFrame className="cg-pop-page" title="科普教育的问题是什么？" subtitle="折纸的比喻让人迅速理解“捷径”，但还没有解释虫洞的物理条件。" conclusion="先建立印象，再追问机制与适用条件。" sidebar={<>
    <Typography shuku-edit-id="e-7227b2a8-7815-425d-9660-c2077650ae30" as="h2" variant="h2" tone="accent" className="cg-wormhole-sidebar-title">科普教育的优势</Typography>
    <WormholeBenefit kind="light" title="直观">用熟悉的事物帮助理解</WormholeBenefit>
    <WormholeBenefit kind="book" title="低门槛">不需要太多专业知识</WormholeBenefit>
    <WormholeBenefit kind="heart" title="激发兴趣">让复杂的概念变得有趣</WormholeBenefit>
    <div shuku-edit-id="e-8b58d6ea-25f2-404d-b453-6512726a1d39" className="cg-wormhole-questions"><Typography shuku-edit-id="e-6c34de6c-e216-4884-9da5-37f5788e5f15" as="h3" variant="h3" tone="inherit">还需要回答</Typography><Typography shuku-edit-id="e-e4734c56-b4a5-43c5-9106-d4337582b61b" variant="bodySmall" tone="inherit">通道为何能保持开放？<br shuku-edit-id="e-b01e4794-88e6-455c-81b2-9b5db6082af6" />什么条件下可以通过？</Typography></div>
  </>}>
    <Typography shuku-edit-id="e-c7c0e4de-d0d6-4e3c-a166-87b5f9b03878" as="h2" variant="h2" tone="accent">虫洞：连接遥远区域的假想捷径</Typography>
    <FoldingWormhole />
    <Typography shuku-edit-id="e-f0363fc6-5562-4179-8b39-5f18a2fe420b" variant="bodySmall" tone="muted" className="cg-pop-model-note">折纸是比喻，不是虫洞的真实外观。</Typography>
  </WormholeLessonFrame>;
}

