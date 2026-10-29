import { useCallback, useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaTerm, Typography } from '../../../shared/react';
import './OptimizationIntroPage.css';
import { SurfaceDiagram, type Landmark } from '../LossLandscape/SurfaceDiagram';
import catalog from '../LossLandscape/landscapes.json';

export function OptimizationIntroPage() {
  const [index,setIndex]=useState(0);
  const model=catalog[index];
  const height=useCallback((x:number,y:number)=>{
    const u=Math.cos(model.angle)*x-Math.sin(model.angle)*y;
    const v=Math.sin(model.angle)*x+Math.cos(model.angle)*y;
    return model.a*(u*u-1)**2+model.b*(v*v-1)**2+model.c*u+model.d*v;
  },[model]);
  return <ContentBlock headingLevel={1} title="为什么不能总靠解析求解？" subtitle="求导、解方程、判断最优：每一步都可能遇到限制。" className="rl-optimization-page">
    <div className="rl-optimization-layout">
      <div className="rl-optimization-top">
      <section className="rl-optimization-scene" aria-label="可旋转的非凸损失曲面">
        <SurfaceDiagram height={height} landmarks={model.points as Landmark[]} axes={['\\theta_1','\\theta_2']} nonconvex wide revision={index} toolbarActions={<Button onClick={()=>setIndex(i=>(i+1+Math.floor(Math.random()*(catalog.length-1)))%catalog.length)}>换一组曲面</Button>} />
      </section>
        <aside className="rl-optimization-stationary" aria-label="驻点条件的含义">
          <div className="rl-optimization-stationary-copy"><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="\nabla L(\theta)=0" tooltip="无约束、可微问题中，内部最优点需要满足梯度为零；非凸时，驻点也可能是局部极小、鞍点或极大值。" /></MathFormulaBlock><Typography variant="body" tone="accent" align="center">只说明找到了驻点</Typography></div>
        </aside>
      </div>
      <section className="rl-analytic-limits" aria-label="解析求解的三个局限，静态说明">
        <div className="rl-analytic-limit"><Typography variant="h3" tone="accent">方程难解</Typography><Typography variant="body" tone="muted">复杂目标的驻点方程，<br />未必有闭式解。</Typography></div>
        <div className="rl-analytic-limit"><Typography variant="h3" tone="accent">计算昂贵</Typography><Typography variant="body" tone="muted">参数很多时，<br />矩阵求解成本上升。</Typography></div>
        <div className="rl-analytic-limit"><Typography variant="h3" tone="accent">最优性需判断</Typography><Typography variant="body" tone="muted">非凸时，<br />驻点未必是全局最优。</Typography></div>
      </section>
      <div className="rl-optimization-footer"><Typography variant="body" tone="muted" align="center">因此，还需要迭代优化等方法。</Typography></div>
    </div>
  </ContentBlock>;
}

