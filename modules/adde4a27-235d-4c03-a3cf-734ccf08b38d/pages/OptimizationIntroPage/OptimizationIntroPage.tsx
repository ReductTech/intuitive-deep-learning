import { useCallback, useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaTerm, Typography } from "@shuku/course-style/react";
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
  return <ContentBlock shuku-edit-id="e-407b63a9-7bdf-46a5-aa6f-bba606609a1c" headingLevel={1} title="为什么不能总靠解析求解？" subtitle="求导、解方程、判断最优：每一步都可能遇到限制。" className="rl-optimization-page">
    <div shuku-edit-id="e-8caadb05-35be-4b59-8cb6-b660747facc8" className="rl-optimization-layout">
      <div shuku-edit-id="e-6bebc9c2-a85f-41d6-bc09-a36f1f15bd4b" className="rl-optimization-top">
      <section shuku-edit-id="e-7c8ad1b7-c064-4510-8806-eec171b1750a" className="rl-optimization-scene" aria-label="可旋转的非凸损失曲面">
        <SurfaceDiagram height={height} landmarks={model.points as Landmark[]} axes={['\\theta_1','\\theta_2']} nonconvex wide revision={index} toolbarActions={<Button onClick={()=>setIndex(i=>(i+1+Math.floor(Math.random()*(catalog.length-1)))%catalog.length)}>换一组曲面</Button>} />
      </section>
        <aside shuku-edit-id="e-56c348a8-ed88-438d-893e-7fa645388629" className="rl-optimization-stationary" aria-label="驻点条件的含义">
          <div shuku-edit-id="e-ddec480d-4356-4a2a-9890-1d7a1cbb9b3b" className="rl-optimization-stationary-copy"><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="\nabla L(\theta)=0" tooltip="无约束、可微问题中，内部最优点需要满足梯度为零；非凸时，驻点也可能是局部极小、鞍点或极大值。" /></MathFormulaBlock><Typography shuku-edit-id="e-1976c41c-efce-4891-b7fb-fd13f6a69132" variant="body" tone="accent" align="center">只说明找到了驻点</Typography></div>
        </aside>
      </div>
      <section shuku-edit-id="e-d3c22500-5c86-42e4-b50b-b15200652b30" className="rl-analytic-limits" aria-label="解析求解的三个局限，静态说明">
        <div shuku-edit-id="e-99777b6f-ff86-40ce-bcc6-b7346ee58783" className="rl-analytic-limit"><Typography shuku-edit-id="e-e2a20f0e-8258-4974-9270-247a29dfbf15" variant="h3" tone="accent">方程难解</Typography><Typography shuku-edit-id="e-59898bb9-d126-4428-9f06-384b81d4a2fa" variant="body" tone="muted">复杂目标的驻点方程，<br shuku-edit-id="e-e91a653c-d5c0-4993-a4a0-8debf1d14ebc" />未必有闭式解。</Typography></div>
        <div shuku-edit-id="e-e78fea93-22dd-4ead-a057-d20d730c3c1a" className="rl-analytic-limit"><Typography shuku-edit-id="e-ced049d3-e478-426c-a04f-7d7c3ad137ee" variant="h3" tone="accent">计算昂贵</Typography><Typography shuku-edit-id="e-3a7e835b-aa20-43cf-89d4-7ba094c3b5aa" variant="body" tone="muted">参数很多时，<br shuku-edit-id="e-e92102f6-dc71-4124-a094-60d636515035" />矩阵求解成本上升。</Typography></div>
        <div shuku-edit-id="e-e1e57019-6b94-4e87-8095-be39d26f7f64" className="rl-analytic-limit"><Typography shuku-edit-id="e-6e1e902a-e2d4-4375-8f1b-b2df350d8099" variant="h3" tone="accent">最优性需判断</Typography><Typography shuku-edit-id="e-58b2146f-5976-457b-a6a8-663ba8940792" variant="body" tone="muted">非凸时，<br shuku-edit-id="e-de052e7b-fbc0-4921-ab07-739bef0baa37" />驻点未必是全局最优。</Typography></div>
      </section>
      <div shuku-edit-id="e-5bb1ccf2-4171-48f3-b81e-bed08e9238b9" className="rl-optimization-footer"><Typography shuku-edit-id="e-3ba944c0-f32c-40de-9e11-64bb3be7439d" variant="body" tone="muted" align="center">因此，还需要迭代优化等方法。</Typography></div>
    </div>
  </ContentBlock>;
}

