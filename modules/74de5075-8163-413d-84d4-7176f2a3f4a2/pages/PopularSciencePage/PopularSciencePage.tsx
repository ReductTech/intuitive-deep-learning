import outline from '../../outlines.json';
import { Typography } from "@shuku/course-style/react";
import { WormholeBenefit, WormholeLessonFrame } from '../../components/WormholeLessonFrame';
import './PopularSciencePage.css';
import { FoldingWormhole } from './FoldingWormhole';

export function PopularSciencePage() {
  return <WormholeLessonFrame className="llmpe-cg-pop-page" title={outline.pages.find(page => page.id === '53c7df3e-7d4c-4501-86ff-459e78985dc7')!.title} subtitle="折纸的比喻让人迅速理解“捷径”，但还没有解释虫洞的物理条件。" conclusion="先建立印象，再追问机制与适用条件。" sidebar={<>
    <Typography shuku-edit-id="e-987c3c42-7d39-4724-a350-9ddb6841455e" as="h2" variant="h2" tone="accent" className="llmpe-cg-wormhole-sidebar-title">科普教育的优势</Typography>
    <WormholeBenefit kind="light" title="直观">用熟悉的事物帮助理解</WormholeBenefit>
    <WormholeBenefit kind="book" title="低门槛">不需要太多专业知识</WormholeBenefit>
    <WormholeBenefit kind="heart" title="激发兴趣">让复杂的概念变得有趣</WormholeBenefit>
    <div shuku-edit-id="e-454f15fb-c805-44c3-96ed-e45701f62f0e" className="llmpe-cg-wormhole-questions"><Typography shuku-edit-id="e-2ee31371-d2ce-433e-910b-f7d30603c40d" as="h3" variant="h3" tone="inherit">还需要回答</Typography><Typography shuku-edit-id="e-749b49bc-d384-4779-89f1-a888de4a9d5d" variant="bodySmall" tone="inherit">通道为何能保持开放？<br shuku-edit-id="e-655f923b-412d-4a57-ad2d-9ef5a8be8497" />什么条件下可以通过？</Typography></div>
  </>}>
    <Typography shuku-edit-id="e-33086d32-971a-4d18-80d7-f1458709dbb9" as="h2" variant="h2" tone="accent">虫洞：连接遥远区域的假想捷径</Typography>
    <FoldingWormhole />
    <Typography shuku-edit-id="e-55d76206-703a-49d0-9157-5cc8e387f2c5" variant="bodySmall" tone="muted" className="llmpe-cg-pop-model-note">折纸是比喻，不是虫洞的真实外观。</Typography>
  </WormholeLessonFrame>;
}

