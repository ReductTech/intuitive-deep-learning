import { Typography } from "@shuku/course-style/react";
import { WormholeLab } from '../components/WormholeLab';
import { WormholeBenefit, WormholeLessonFrame } from '../components/WormholeLessonFrame';
import './IntuitiveLearningPage.css';

export function IntuitiveLearningPage() {
  return <WormholeLessonFrame className="cg-intuitive-page" title="直觉式学习会怎样讲解知识？" subtitle="调节物质的能量与拉应力，让虫洞几何成为计算的结果。" conclusion="让学习者先建立直觉，再通过交互走向严谨理解。" sidebar={<>
    <Typography shuku-edit-id="e-0a27dfee-5906-48fe-af35-46b6ad5bfb5c" as="h2" variant="h2" tone="accent" className="cg-wormhole-sidebar-title">直觉式学习的优势</Typography>
    <WormholeBenefit kind="light" title="直观易懂">先看现象，再理解概念<br shuku-edit-id="e-d0284820-e1d0-4a90-be9f-80a82fb5c7ed" />降低第一次接触的门槛</WormholeBenefit>
    <WormholeBenefit kind="eye" title="主动探索">通过操作观察变化<br shuku-edit-id="e-51b9a280-c9ad-402f-80eb-1e5a8445be7d" />把因果关系变得可见</WormholeBenefit>
    <WormholeBenefit kind="book" title="保持严谨">把直观体验连接到<br shuku-edit-id="e-af666070-235b-47aa-9f33-cabed9566c59" />公式与专业知识</WormholeBenefit>
  </>}><WormholeLab /></WormholeLessonFrame>;
}

