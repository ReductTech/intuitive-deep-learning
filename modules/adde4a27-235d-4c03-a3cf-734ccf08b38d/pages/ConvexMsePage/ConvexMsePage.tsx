import { useMemo } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaTerm, Typography } from "@shuku/course-style/react";
import { useRecordedData } from '../../regressionData';
import { MseBowlDiagram } from './MseBowlDiagram';
import './ConvexMsePage.css';

export function ConvexMsePage() {
  const data=useRecordedData();
  const unique=useMemo(()=>data.some(p=>p.mass!==data[0]?.mass),[data]);
  if(!data.length) return <ContentBlock shuku-edit-id="e-e14e11b9-cd1b-44a9-b5d8-1a6173ca3e58" title="请先完成称象记录" subtitle="本页说明 MSE 关于模型参数的凸性。" />;
  return <ContentBlock shuku-edit-id="e-85ae73ea-dde6-47d1-b36f-dfd0054efcc0" headingLevel={1} title="为什么正规方程能找到全局最优？" subtitle="线性模型＋平方误差，得到一个凸二次目标。" className="rl-convex-page">
    <div shuku-edit-id="e-79fd473c-0024-451d-a3e8-f40e0de476ad" className="rl-convex-layout">
      <section shuku-edit-id="e-f441e0b8-5807-41e3-a59c-144c5868581a" className="rl-convex-visual">
        <MseBowlDiagram unique={unique} />
        <div shuku-edit-id="e-dc576bd2-0452-4061-a026-d7e81731566b" className="rl-convex-labels"><div shuku-edit-id="e-0f22c2c2-9222-4c4c-a3ce-400a074f9cea"><Typography shuku-edit-id="e-c5b26368-2133-46c3-8d68-1654a8a8c1ec" variant="body" tone="accent">每个点 = 一组参数</Typography><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="(w,b)" tooltip="线性回归的参数向量。MSE的Hessian为2XᵀX/n，半正定，因此目标凸；输入不全相同时正定，目标严格凸。" /></MathFormulaBlock></div><div shuku-edit-id="e-a666b90f-f404-4f72-8457-1e407ffd27a9"><Typography shuku-edit-id="e-dc901aa9-9ceb-4522-a352-5c5b0d90e94d" variant="body" tone="accent">高度 = MSE</Typography></div></div>
      </section>
      <section shuku-edit-id="e-03c5b2a8-61f7-471d-b434-9dd8a5f5918f" className="rl-convex-explanation" aria-label="二次结构便于求解，凸性保证全局最优">
        <MathFormulaBlock appearance="plain" className="rl-convex-objective" ariaLabel="最小二乘目标是预测误差向量的平方范数"><MathFormulaTerm latex="S(\theta)=\|X\theta-y\|_2^2" tooltip="沿用前面的矩阵形式。这里使用平方误差和；除以样本数得到MSE，不改变最优参数或凸性。" /></MathFormulaBlock>
        <section shuku-edit-id="e-cebffc64-99a3-49d1-982a-6f2465e8b88f" className="rl-convex-reason">
          <div shuku-edit-id="e-8bebf491-c11d-434f-9f97-940d706467e7" className="rl-convex-reason-heading"><Typography shuku-edit-id="e-373277aa-5b49-426b-9e07-71b37bd37d50" as="span" variant="body" tone="inherit" className="rl-convex-number">1</Typography><Typography shuku-edit-id="e-1b808ef6-acf4-4891-ad3e-8057ae489cba" variant="h3" tone="accent">为什么能直接求解？</Typography></div>
          <Typography shuku-edit-id="e-b854318a-4966-4432-acc1-29ed03395b57" variant="body" tone="muted">二次目标求导后，得到线性方程组。</Typography>
          <MathFormulaBlock appearance="plain" className="rl-convex-reason-formula"><MathFormulaTerm latex="X^\top X\theta=X^\top y" tooltip="令梯度2Xᵀ(Xθ−y)=0，得到正规方程。可直接求解线性方程组，无需枚举候选参数；X列不满秩时，最优参数可能不唯一。" /></MathFormulaBlock>
        </section>
        <section shuku-edit-id="e-0e26c165-a17f-42cc-8d77-9e152ce6a277" className="rl-convex-reason rl-convex-reason--global">
          <div shuku-edit-id="e-df03469b-3c50-4022-9fa1-7718fe27abc9" className="rl-convex-reason-heading"><Typography shuku-edit-id="e-47b72568-3a9b-4ccf-8f19-f3b815b5b263" as="span" variant="body" tone="inherit" className="rl-convex-number">2</Typography><Typography shuku-edit-id="e-9071b021-612e-4a20-a4a7-96cdd9fa7963" variant="h3" tone="accent">为什么是全局最优？</Typography></div>
          <Typography shuku-edit-id="e-7b449942-d863-4c53-84ab-566339b2dffe" variant="body" tone="muted">目标是凸函数，驻点就是全局最低点。</Typography>
          <MathFormulaBlock appearance="plain" className="rl-convex-reason-formula"><MathFormulaTerm latex="\nabla S(\theta^*)=0\ \Longrightarrow\ S(\theta)\ge S(\theta^*)" tooltip="对无约束、可微凸问题，一阶性质保证这个不等式对所有θ成立。因此正规方程的任意解都是全局最优解。线性最小二乘的Hessian为2XᵀX，半正定。" /></MathFormulaBlock>
        </section>
        <div shuku-edit-id="e-def0ae9e-196c-4107-ad5e-ae0481b07b70" className="rl-convex-scope">
          <Typography shuku-edit-id="e-a108414a-e5e5-4164-a403-8e290feba43c" variant="body" tone="accent">{unique ? 'X 列满秩时，最优解唯一。' : '当前 X 列不满秩，最优解不唯一。'}</Typography>
          <Typography shuku-edit-id="e-671e152d-d8eb-41a7-af74-f9273456ea46" variant="body" tone="muted">凸性保证最优性，不保证所有凸问题都有解析解。</Typography>
        </div>
      </section>
    </div>
  </ContentBlock>;
}
