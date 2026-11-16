import { Typography } from "@shuku/course-style/react";
import { WormholeBenefit, WormholeLessonFrame } from '../components/WormholeLessonFrame';
import './PopularSciencePage.css';
import { FoldingWormhole } from '../components/FoldingWormhole';

export function PopularSciencePage() {
  return <WormholeLessonFrame className="aipe-replay-cg-pop-page" title="科普教育的问题是什么？" subtitle="折纸的比喻让人迅速理解“捷径”，但还没有解释虫洞的物理条件。" conclusion="先建立印象，再追问机制与适用条件。" sidebar={<>
    <Typography shuku-edit-id="e-c71c5d01-7e72-4e07-a206-4be58b0f3341" as="h2" variant="h2" tone="accent" className="aipe-replay-cg-wormhole-sidebar-title">科普教育的优势</Typography>
    <WormholeBenefit kind="light" title="直观">用熟悉的事物帮助理解</WormholeBenefit>
    <WormholeBenefit kind="book" title="低门槛">不需要太多专业知识</WormholeBenefit>
    <WormholeBenefit kind="heart" title="激发兴趣">让复杂的概念变得有趣</WormholeBenefit>
    <div shuku-edit-id="e-b555dada-c6ee-4d73-8f1c-6f5e8cff614c" className="aipe-replay-cg-wormhole-questions"><Typography shuku-edit-id="e-5ab1bcc0-72f9-40c1-85a9-dd3ef7a55a43" as="h3" variant="h3" tone="inherit">还需要回答</Typography><Typography shuku-edit-id="e-a82897ed-62a9-40d8-9568-d9d72012f461" variant="bodySmall" tone="inherit">通道为何能保持开放？<br shuku-edit-id="e-41d927b2-d211-4d8d-b2e2-ca37a4e8af81" />什么条件下可以通过？</Typography></div>
  </>}>
    <Typography shuku-edit-id="e-8409a2f2-7786-4c77-8484-6feaa4ee22bc" as="h2" variant="h2" tone="accent">虫洞：连接遥远区域的假想捷径</Typography>
    <FoldingWormhole />
    <Typography shuku-edit-id="e-6b678ed3-d601-433f-8111-b89005a57e5c" variant="bodySmall" tone="muted" className="aipe-replay-cg-pop-model-note">折纸是比喻，不是虫洞的真实外观。</Typography>
  </WormholeLessonFrame>;
}

