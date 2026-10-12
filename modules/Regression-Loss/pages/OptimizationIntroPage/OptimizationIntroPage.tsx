import { useCallback, useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from '../../../shared/react';
import './OptimizationIntroPage.css';
import { SaddleDiagram } from './SaddleDiagram';
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
  return <ContentBlock headingLevel={1} title="非凸问题：求导为零还不够" subtitle="更复杂的损失可能有多个局部极小值和鞍点，驻点不再保证是全局最优。" className="rl-optimization-page">
    <div className="rl-optimization-layout">
      <section className="rl-optimization-scene" aria-label="可旋转的非凸损失曲面">
        <SurfaceDiagram height={height} landmarks={model.points as Landmark[]} axes={['\\theta_1','\\theta_2']} nonconvex revision={index} />
        <div className="rl-landscape-change"><Typography variant="bodySmall" tone="muted">同一个曲面中，驻点可以有不同性质。</Typography><Button onClick={()=>setIndex(i=>(i+1+Math.floor(Math.random()*(catalog.length-1)))%catalog.length)}>换一组曲面</Button></div>
      </section>
      <section className="rl-optimization-explanation rl-nonconvex-explanation">
        <Typography variant="h3" tone="accent">为什么驻点还不够？</Typography>
        <MathFormulaBlock appearance="plain"><MathFormulaTerm latex="\nabla L(\theta)=0" tooltip="无约束、可微问题中，内部最优点必须满足梯度为零。但非凸时，反过来不成立：驻点可能是局部极小、极大或鞍点。" /></MathFormulaBlock>
        <div className="rl-nonconvex-cases"><div><Typography variant="h3" tone="accent">局部极小</Typography><Typography variant="bodySmall" tone="muted">比附近低，别处仍可能更低。</Typography></div><div><Typography variant="h3" tone="accent">鞍点</Typography><Typography variant="bodySmall" tone="muted">有些方向升高，另一些方向降低。</Typography></div></div>
        <SaddleDiagram />
        <Typography variant="bodySmall" tone="muted">驻点还可能是极大值，仍需进一步判断。</Typography>
      </section>
      <div className="rl-optimization-footer"><Typography variant="h3" tone="accent" align="center">非凸问题：求导为零只是找到驻点，还不能断定全局最优。</Typography></div>
    </div>
  </ContentBlock>;
}

