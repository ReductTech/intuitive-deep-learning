import outline from '../../outlines.json';
import { Typography } from "@shuku/course-style/react";
import { WormholeLab } from './WormholeLab';
import { WormholeBenefit, WormholeLessonFrame } from '../../components/WormholeLessonFrame';
import './IntuitiveLearningPage.css';

export function IntuitiveLearningPage() {
  return <WormholeLessonFrame className="llmpe-cg-intuitive-page" title={outline.pages.find(page => page.id === '37b3ae2a-6923-4e2b-9d67-a05488969bff')!.title} subtitle="调节物质的能量与拉应力，让虫洞几何成为计算的结果。" conclusion="让学习者先建立直觉，再通过交互走向严谨理解。" sidebar={<>
    <Typography shuku-edit-id="e-ff942801-dd58-44ad-a1db-4493d90132b5" as="h2" variant="h2" tone="accent" className="llmpe-cg-wormhole-sidebar-title">直觉式学习的优势</Typography>
    <WormholeBenefit kind="light" title="直观易懂">先看现象，再理解概念<br shuku-edit-id="e-82be48f4-6b2e-4307-bb13-4eb0fac3b3cf" />降低第一次接触的门槛</WormholeBenefit>
    <WormholeBenefit kind="eye" title="主动探索">通过操作观察变化<br shuku-edit-id="e-5cc81534-0376-484f-b351-f959ab12e1f6" />把因果关系变得可见</WormholeBenefit>
    <WormholeBenefit kind="book" title="保持严谨">把直观体验连接到<br shuku-edit-id="e-930b30fb-d35d-4220-9c98-ab4929c173eb" />公式与专业知识</WormholeBenefit>
  </>}><WormholeLab /></WormholeLessonFrame>;
}

