import { Typography } from "@shuku/course-style/react";
import { WormholeLab } from '../components/WormholeLab';
import { WormholeBenefit, WormholeLessonFrame } from '../components/WormholeLessonFrame';
import './IntuitiveLearningPage.css';

export function IntuitiveLearningPage() {
  return <WormholeLessonFrame className="cg-intuitive-page" title="直觉式学习会怎样讲解知识？" subtitle="调节物质的能量与拉应力，让虫洞几何成为计算的结果。" conclusion="让学习者先建立直觉，再通过交互走向严谨理解。" sidebar={<>
    <Typography shuku-edit-id="e-cc04f8a7-6d5e-4456-8bda-5e284840be6e" as="h2" variant="h2" tone="accent" className="cg-wormhole-sidebar-title">直觉式学习的优势</Typography>
    <WormholeBenefit kind="light" title="直观易懂">先看现象，再理解概念<br shuku-edit-id="e-fb91fa88-69b1-434e-a2d4-08571cf14c9e" />降低第一次接触的门槛</WormholeBenefit>
    <WormholeBenefit kind="eye" title="主动探索">通过操作观察变化<br shuku-edit-id="e-87b426a1-bd18-4862-a58c-49ecff54dd0d" />把因果关系变得可见</WormholeBenefit>
    <WormholeBenefit kind="book" title="保持严谨">把直观体验连接到<br shuku-edit-id="e-ffafc4a0-0c9e-44d1-b199-32205d46c941" />公式与专业知识</WormholeBenefit>
  </>}><WormholeLab /></WormholeLessonFrame>;
}

