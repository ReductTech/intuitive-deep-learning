import { useMemo } from 'react';
import { Tips } from '@icon-park/react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from '../../../shared/react';
import { useRecordedData } from '../../regressionData';
import { MseBowlDiagram } from './MseBowlDiagram';
import './ConvexMsePage.css';

export function ConvexMsePage() {
  const data=useRecordedData();
  const unique=useMemo(()=>data.some(p=>p.mass!==data[0]?.mass),[data]);
  if(!data.length) return <ContentBlock title="请先完成称象记录" subtitle="本页说明 MSE 关于模型参数的凸性。" />;
  const properties=[
    '局部最优就是全局最优。',
    unique?'严格凸，最优解至多一个。':'凸但不严格凸，解可能不唯一。',
    '凸性不保证有解析解。',
  ];
  return <ContentBlock headingLevel={1} title="解析求解：何时能保证全局最优？" subtitle="对无约束、可微的凸问题，令梯度为零得到的驻点就是全局最优。" className="rl-convex-page">
    <div className="rl-convex-layout">
      <section className="rl-convex-visual">
        <MseBowlDiagram unique={unique} />
        <div className="rl-convex-labels"><div><Typography variant="body" tone="accent">每个点 = 一组参数</Typography><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="(w,b)" tooltip="线性回归的参数向量。MSE的Hessian为2XᵀX/n，半正定，因此目标凸；输入不全相同时正定，目标严格凸。" /></MathFormulaBlock></div><div><Typography variant="body" tone="accent">高度 = MSE</Typography></div></div>
      </section>
      <section className="rl-convex-explanation">
        <Typography variant="h2" tone="accent">凸性提供什么保证？</Typography>
        <div className="rl-convex-definition"><Typography variant="bodySmall" tone="muted">凸函数：图像不高于任意两点的连线。</Typography><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="f(tx+(1-t)y)\le t f(x)+(1-t)f(y)" tooltip="x、y是任意两个参数向量，0≤t≤1。定义要求任意两点之间的函数值不高于连线的高度。" /></MathFormulaBlock><MathFormulaBlock appearance="plain"><MathFormulaStatic latex="0\le t\le1" /></MathFormulaBlock></div>
        <div className="rl-convex-proof"><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="f(\theta)\ge f(\theta^*)+\nabla f(\theta^*)^\top(\theta-\theta^*)" tooltip="可微凸函数的一阶性质：函数值不低于任一点的切平面。该不等式对所有参数θ成立。" /></MathFormulaBlock><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="\nabla f(\theta^*)=0\ \Longrightarrow\ f(\theta)\ge f(\theta^*)" tooltip="当θ*是驻点，切平面的线性项为零。因此所有其他参数的函数值都不更低，θ*是全局最优。这里讨论无约束问题。" /></MathFormulaBlock></div>
        <div className="rl-convex-properties">{properties.map((property,index)=><div className="rl-convex-property" key={index}><span className="rl-convex-number"><Typography variant="h3" tone="accent">{index+1}</Typography></span><Typography variant="h3" tone="accent">{property}</Typography></div>)}</div>
        <div className="rl-convex-conclusion"><Tips theme="two-tone" size="58" fill={['#367de8','#dbeaff']} /><Typography variant="h3" tone="accent">MSE 是凸二次目标，<br/>解正规方程可得到全局最优。</Typography></div>
      </section>
    </div>
  </ContentBlock>;
}
