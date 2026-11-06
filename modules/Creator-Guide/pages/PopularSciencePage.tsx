import { Typography } from '../../shared/react';
import { WormholeBenefit, WormholeLessonFrame } from '../components/WormholeLessonFrame';
import './PopularSciencePage.css';
import { FoldingWormhole } from '../components/FoldingWormhole';

export function PopularSciencePage() {
  return <WormholeLessonFrame className="cg-pop-page" title="科普教育的问题是什么？" subtitle="折纸的比喻让人迅速理解“捷径”，但还没有解释虫洞的物理条件。" conclusion="先建立印象，再追问机制与适用条件。" sidebar={<>
    <Typography as="h2" variant="h2" tone="accent" className="cg-wormhole-sidebar-title">科普教育的优势</Typography>
    <WormholeBenefit kind="light" title="直观">用熟悉的事物帮助理解</WormholeBenefit>
    <WormholeBenefit kind="book" title="低门槛">不需要太多专业知识</WormholeBenefit>
    <WormholeBenefit kind="heart" title="激发兴趣">让复杂的概念变得有趣</WormholeBenefit>
    <div className="cg-wormhole-questions"><Typography as="h3" variant="h3" tone="inherit">还需要回答</Typography><Typography variant="bodySmall" tone="inherit">通道为何能保持开放？<br />什么条件下可以通过？</Typography></div>
  </>}>
    <Typography as="h2" variant="h2" tone="accent">虫洞：连接遥远区域的假想捷径</Typography>
    <FoldingWormhole />
    <Typography variant="bodySmall" tone="muted" className="cg-pop-model-note">折纸是比喻，不是虫洞的真实外观。</Typography>
  </WormholeLessonFrame>;
}

