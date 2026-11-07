import { useMemo } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaTerm, Typography } from '../../../shared/react';
import { useRecordedData } from '../../regressionData';
import { MseBowlDiagram } from './MseBowlDiagram';
import './ConvexMsePage.css';

export function ConvexMsePage() {
  const data=useRecordedData();
  const unique=useMemo(()=>data.some(p=>p.mass!==data[0]?.mass),[data]);
  if(!data.length) return <ContentBlock title="请先完成称象记录" subtitle="本页说明 MSE 关于模型参数的凸性。" />;
  return <ContentBlock headingLevel={1} title="为什么正规方程能找到全局最优？" subtitle="线性模型＋平方误差，得到一个凸二次目标。" className="rl-convex-page">
    <div className="rl-convex-layout">
      <section className="rl-convex-visual">
        <MseBowlDiagram unique={unique} />
        <div className="rl-convex-labels"><div><Typography variant="body" tone="accent">每个点 = 一组参数</Typography><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="(w,b)" tooltip="线性回归的参数向量。MSE的Hessian为2XᵀX/n，半正定，因此目标凸；输入不全相同时正定，目标严格凸。" /></MathFormulaBlock></div><div><Typography variant="body" tone="accent">高度 = MSE</Typography></div></div>
      </section>
      <section className="rl-convex-explanation" aria-label="二次结构便于求解，凸性保证全局最优">
        <MathFormulaBlock appearance="plain" className="rl-convex-objective" ariaLabel="最小二乘目标是预测误差向量的平方范数"><MathFormulaTerm latex="S(\theta)=\|X\theta-y\|_2^2" tooltip="沿用前面的矩阵形式。这里使用平方误差和；除以样本数得到MSE，不改变最优参数或凸性。" /></MathFormulaBlock>
        <section className="rl-convex-reason">
          <div className="rl-convex-reason-heading"><Typography as="span" variant="body" tone="inherit" className="rl-convex-number">1</Typography><Typography variant="h3" tone="accent">为什么能直接求解？</Typography></div>
          <Typography variant="body" tone="muted">二次目标求导后，得到线性方程组。</Typography>
          <MathFormulaBlock appearance="plain" className="rl-convex-reason-formula"><MathFormulaTerm latex="X^\top X\theta=X^\top y" tooltip="令梯度2Xᵀ(Xθ−y)=0，得到正规方程。可直接求解线性方程组，无需枚举候选参数；X列不满秩时，最优参数可能不唯一。" /></MathFormulaBlock>
        </section>
        <section className="rl-convex-reason rl-convex-reason--global">
          <div className="rl-convex-reason-heading"><Typography as="span" variant="body" tone="inherit" className="rl-convex-number">2</Typography><Typography variant="h3" tone="accent">为什么是全局最优？</Typography></div>
          <Typography variant="body" tone="muted">目标是凸函数，驻点就是全局最低点。</Typography>
          <MathFormulaBlock appearance="plain" className="rl-convex-reason-formula"><MathFormulaTerm latex="\nabla S(\theta^*)=0\ \Longrightarrow\ S(\theta)\ge S(\theta^*)" tooltip="对无约束、可微凸问题，一阶性质保证这个不等式对所有θ成立。因此正规方程的任意解都是全局最优解。线性最小二乘的Hessian为2XᵀX，半正定。" /></MathFormulaBlock>
        </section>
        <div className="rl-convex-scope">
          <Typography variant="body" tone="accent">{unique ? 'X 列满秩时，最优解唯一。' : '当前 X 列不满秩，最优解不唯一。'}</Typography>
          <Typography variant="body" tone="muted">凸性保证最优性，不保证所有凸问题都有解析解。</Typography>
        </div>
      </section>
    </div>
  </ContentBlock>;
}
