import { Typography } from "@shuku/course-style/react";
import { WormholeLab } from '../components/WormholeLab';
import { WormholeBenefit, WormholeLessonFrame } from '../components/WormholeLessonFrame';
import './IntuitiveLearningPage.css';

export function IntuitiveLearningPage() {
  return <WormholeLessonFrame className="aipe-replay-cg-intuitive-page" title="直觉式学习会怎样讲解知识？" subtitle="调节物质的能量与拉应力，让虫洞几何成为计算的结果。" conclusion="让学习者先建立直觉，再通过交互走向严谨理解。" sidebar={<>
    <Typography shuku-edit-id="e-20fa879d-211e-4c32-be08-ff5fb27f8cd5" as="h2" variant="h2" tone="accent" className="aipe-replay-cg-wormhole-sidebar-title">直觉式学习的优势</Typography>
    <WormholeBenefit kind="light" title="直观易懂">先看现象，再理解概念<br shuku-edit-id="e-aa7d4fb7-ea0b-4990-809f-ba312a95ed56" />降低第一次接触的门槛</WormholeBenefit>
    <WormholeBenefit kind="eye" title="主动探索">通过操作观察变化<br shuku-edit-id="e-016161f9-5552-4c65-8430-7594f5cbcc70" />把因果关系变得可见</WormholeBenefit>
    <WormholeBenefit kind="book" title="保持严谨">把直观体验连接到<br shuku-edit-id="e-109fa6b1-d4df-4003-802b-8fc8969952a2" />公式与专业知识</WormholeBenefit>
  </>}><WormholeLab /></WormholeLessonFrame>;
}

