import { Typography } from "@shuku/course-style/react";
import { WormholeLab } from '../components/WormholeLab';
import { WormholeBenefit, WormholeLessonFrame } from '../components/WormholeLessonFrame';
import './IntuitiveLearningPage.css';

export function IntuitiveLearningPage() {
  return <WormholeLessonFrame className="aipe-replay-cg-intuitive-page" title="直觉式学习会怎样讲解知识？" subtitle="调节物质的能量与拉应力，让虫洞几何成为计算的结果。" conclusion="让学习者先建立直觉，再通过交互走向严谨理解。" sidebar={<>
    <Typography shuku-edit-id="e-61117b22-7f40-4704-bc41-f68bac0583e1" as="h2" variant="h2" tone="accent" className="aipe-replay-cg-wormhole-sidebar-title">直觉式学习的优势</Typography>
    <WormholeBenefit kind="light" title="直观易懂">先看现象，再理解概念<br shuku-edit-id="e-0b720eb8-458c-4957-bbbd-d1d702231cd3" />降低第一次接触的门槛</WormholeBenefit>
    <WormholeBenefit kind="eye" title="主动探索">通过操作观察变化<br shuku-edit-id="e-529745f9-aa48-4935-b42b-db05de14f951" />把因果关系变得可见</WormholeBenefit>
    <WormholeBenefit kind="book" title="保持严谨">把直观体验连接到<br shuku-edit-id="e-517f3b56-73dc-4d5d-8539-657fff1ea0b4" />公式与专业知识</WormholeBenefit>
  </>}><WormholeLab /></WormholeLessonFrame>;
}

