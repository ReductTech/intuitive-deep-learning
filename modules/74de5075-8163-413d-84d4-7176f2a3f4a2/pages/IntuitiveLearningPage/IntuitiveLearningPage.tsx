import outline from '../../outlines.json';
import { Typography } from "@shuku/course-style/react";
import { WormholeLab } from './WormholeLab';
import { WormholeBenefit, WormholeLessonFrame } from '../../components/WormholeLessonFrame';
import './IntuitiveLearningPage.css';

export function IntuitiveLearningPage() {
  return <WormholeLessonFrame className="llmpe-cg-intuitive-page" title={outline.pages.find(page => page.id === 'b4f18ddc-6815-4c49-8e6e-2c74b3eaeb01')!.title} subtitle="调节物质的能量与拉应力，让虫洞几何成为计算的结果。" conclusion="让学习者先建立直觉，再通过交互走向严谨理解。" sidebar={<>
    <Typography shuku-edit-id="e-3fb0324f-9063-427e-a6f4-979a4194a895" as="h2" variant="h2" tone="accent" className="llmpe-cg-wormhole-sidebar-title">直觉式学习的优势</Typography>
    <WormholeBenefit kind="light" title="直观易懂">先看现象，再理解概念<br shuku-edit-id="e-38a2e0e3-8916-4c61-a7a8-967020c2767f" />降低第一次接触的门槛</WormholeBenefit>
    <WormholeBenefit kind="eye" title="主动探索">通过操作观察变化<br shuku-edit-id="e-2d6053db-4810-48df-bfec-9cbe194da75d" />把因果关系变得可见</WormholeBenefit>
    <WormholeBenefit kind="book" title="保持严谨">把直观体验连接到<br shuku-edit-id="e-2e2fcb27-6cf4-4fce-93a6-939b4c5b9e34" />公式与专业知识</WormholeBenefit>
  </>}><WormholeLab /></WormholeLessonFrame>;
}

