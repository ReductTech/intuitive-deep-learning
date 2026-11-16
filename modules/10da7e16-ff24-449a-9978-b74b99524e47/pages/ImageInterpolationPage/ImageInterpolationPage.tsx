import { useEffect, useRef, useState } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from "@shuku/course-style/react";
import { color, GAP, HEIGHT, interpolate, order, source, SOURCE_HEIGHT, SOURCE_WIDTH, WIDTH } from './interpolationModel';
import './ImageInterpolationPage.css';
const CW=1500, CH=480, CELL=8;
const samples=order.map(point=>interpolate(point.x,point.y));
const EXAMPLE=Math.max(0,samples.findIndex(s=>s.u>0&&s.v>0&&s.corners.some(c=>c.rgb.some((n,i)=>Math.abs(n-s.corners[0].rgb[i])>100))));
const tones=['#ec7550','#24a58a','#2987e7','#9b67da'];
type Engine = { expansion:number; done:number; current:number; lesson:number; elapsed:number; mode:'all'|'one'|'none' };
const initial = ():Engine=>({expansion:0,done:0,current:0,lesson:EXAMPLE,elapsed:0,mode:'none'});
export function ImageInterpolationPage() {
  const canvas=useRef<HTMLCanvasElement>(null), engine=useRef<Engine>(initial());
  const [view,setView]=useState<Engine>(initial());
  const item=order[Math.min(view.lesson,order.length-1)], sample=interpolate(item.x,item.y);
  const started=view.expansion>0, expanded=view.expansion>=1, complete=view.done>=order.length;
  const status=complete?'插值完成':view.mode==='none'?(started?'已暂停':'原始像素'):expanded?'向周围填充':'原像素正在就位';
  const publish=()=>setView({...engine.current});
  const start=()=>{const e=engine.current;if(e.mode==='all'){e.mode='none';e.lesson=e.current;}else{if(e.done===order.length)engine.current=initial();engine.current.mode='all';}publish();};
  const one=()=>{const e=engine.current;if(e.done===order.length||e.mode==='one')return;e.mode='one';e.current=Math.min(e.done,order.length-1);e.lesson=e.current;e.elapsed=0;publish();};
  const reset=()=>{engine.current=initial();publish();};
  useEffect(()=>{
    let frame=0, previous=performance.now(), notified=0;
    const ctx=canvas.current!.getContext('2d')!;ctx.imageSmoothingEnabled=false;
    let lastSignature='';
    const tick=(now:number)=>{
      const dt=Math.min(now-previous,100);previous=now;const e=engine.current;
      if(e.mode!=='none'){
        if(e.expansion<1)e.expansion=Math.min(1,e.expansion+dt/1700);
        else{
          e.elapsed+=dt;const duration=e.mode==='one'?600:8;
          while(e.elapsed>=duration&&e.done<order.length){e.elapsed-=duration;e.current=e.done;e.done++;if(e.mode==='one'){e.mode='none';e.elapsed=0;break;}e.current=Math.min(e.done,order.length-1);}
          if(e.done===order.length)e.mode='none';
        }
      }
      ctx.clearRect(0,0,CW,CH);
      const spacing=CELL*(1+2*e.expansion), originX=CW/2-(SOURCE_WIDTH-1)*spacing/2-CELL/2, originY=CH/2-(SOURCE_HEIGHT-1)*spacing/2-CELL/2;
      if(e.expansion>0){
        ctx.strokeStyle=`rgba(190,207,226,${e.expansion*.55})`;ctx.lineWidth=.7;
        for(let x=0;x<=WIDTH;x++){ctx.beginPath();ctx.moveTo(originX+x*CELL,originY);ctx.lineTo(originX+x*CELL,originY+HEIGHT*CELL);ctx.stroke();}
        for(let y=0;y<=HEIGHT;y++){ctx.beginPath();ctx.moveTo(originX,originY+y*CELL);ctx.lineTo(originX+WIDTH*CELL,originY+y*CELL);ctx.stroke();}
      }
      if(e.expansion===1){for(let i=0;i<e.done;i++){const point=order[i];ctx.fillStyle=color(samples[i].rgb);ctx.fillRect(originX+point.x*CELL,originY+point.y*CELL,CELL,CELL);}}
      source.forEach((rgb,i)=>{const x=originX+(i%SOURCE_WIDTH)*spacing,y=originY+Math.floor(i/SOURCE_WIDTH)*spacing;ctx.fillStyle=color(rgb);ctx.fillRect(x,y,CELL,CELL);if(e.expansion===1){ctx.strokeStyle='#718cac';ctx.lineWidth=.45;ctx.strokeRect(x+.2,y+.2,CELL-.4,CELL-.4);}});
      if(e.expansion===1){
        const point=order[e.lesson], selected=interpolate(point.x,point.y), px=originX+point.x*CELL+CELL/2,py=originY+point.y*CELL+CELL/2;
        selected.corners.forEach((corner,i)=>{
          const cx=originX+corner.x*CELL,cy=originY+corner.y*CELL;ctx.strokeStyle=tones[i];ctx.lineWidth=1.4;ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(cx+CELL/2,cy+CELL/2);ctx.lineTo(px,py);ctx.stroke();ctx.setLineDash([]);ctx.strokeRect(cx-1,cy-1,CELL+2,CELL+2);
        });
        ctx.strokeStyle='#1676f4';ctx.lineWidth=2;ctx.strokeRect(px-CELL/2-1,py-CELL/2-1,CELL+2,CELL+2);
        ctx.setLineDash([4,6]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(px+12,py);ctx.lineTo(1000,220);ctx.stroke();ctx.setLineDash([]);
      }
      const signature=JSON.stringify(e);if(now-notified>80 && signature!==lastSignature){setView({...e});notified=now;lastSignature=signature;}
      frame=requestAnimationFrame(tick);
    };
    frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
  },[]);
  return <ContentBlock shuku-edit-id="e-2e6003a8-72a7-4897-a2a3-839f8f6e289c" className="di-interpolation" title="双线性插值" subtitle="把像素间的空位，用四个邻居算出来。" headingLevel={1}>
    <div shuku-edit-id="e-71cac74a-5553-4297-988c-d4a4f9433c0d" className="di-interpolation__body" data-expansion={view.expansion} data-done={view.done} data-total={order.length} data-mode={view.mode}>
      <div shuku-edit-id="e-140951e9-8522-40de-9a39-d5332e552881" className="di-interpolation__toolbar"><Typography shuku-edit-id="e-5a8e29bc-4eca-45a7-8a44-f007d58e5d43" variant="bodySmall" tone="muted">{status} · {expanded?`${WIDTH} × ${HEIGHT}`:`${SOURCE_WIDTH} × ${SOURCE_HEIGHT}`}</Typography><div shuku-edit-id="e-915a6e24-1a06-4b44-9c29-29dd14f2cde0"><button shuku-edit-id="e-20427d14-605b-4166-aa9c-da592a4004d2" type="button" className="is-primary" onClick={start} disabled={view.mode==='one'}><Typography shuku-edit-id="e-c7cebd20-1c5e-4371-bc85-b688b159c2cf" variant="bodySmall" tone="inherit">{view.mode==='all'?'暂停':complete?'重新开始':started?'继续':'开始插值'}</Typography></button><button shuku-edit-id="e-f134712d-0c7d-4805-b80e-77b1cb94b858" type="button" onClick={one} disabled={complete||view.mode==='one'}><Typography shuku-edit-id="e-69808ddb-3ea8-460a-b9ff-bde88d5978b6" variant="bodySmall" tone="inherit">算一个</Typography></button><button shuku-edit-id="e-c551e693-4dc6-4c75-bc41-180083437081" type="button" onClick={reset}><Typography shuku-edit-id="e-4372612f-7667-4e9b-9e0b-82e07ae4531f" variant="bodySmall" tone="inherit">重置</Typography></button></div></div>
      <div shuku-edit-id="e-241fc9d5-be75-4b0e-91b5-ecf777165d88" className="di-interpolation__stage"><canvas shuku-edit-id="e-d72c7bc9-3e90-4c73-9719-d26587408e42" ref={canvas} width={CW} height={CH} role="img" aria-label="像素小人逐渐放大，新像素从原像素周围扩散填入的单画布"/>
        <div shuku-edit-id="e-73062d45-1e0f-47f0-8067-51e0e1069346" className="di-interpolation__stage-note"><Typography shuku-edit-id="e-02489fff-03d5-416d-9d78-ce6b50bdb3b9" variant="bodySmall" tone="muted">{!expanded?'原像素拉开，空位等待计算。':'彩色边框：四个邻居 · 蓝框：公式示例'}</Typography></div>
        {expanded&&<div shuku-edit-id="e-e0295311-d4a3-454b-b15d-e29e52ae5881" className="di-interpolation__position"><Typography shuku-edit-id="e-94b6c075-0a60-4fec-9ee5-488ed0e2949d" variant="bodySmall" tone="accent">四个邻居 → 新像素</Typography><Typography shuku-edit-id="e-6a37962d-fbe2-4300-a3d3-c9f44f73030d" variant="bodySmall" tone="muted">先横向混合，再纵向混合</Typography></div>}
        <div shuku-edit-id="e-4b451197-48f9-47ae-9f5e-161e55e18ded" className="di-interpolation__progress"><Typography shuku-edit-id="e-fed44c1f-d0ae-4db6-813e-88dcb14bd9c7" variant="bodySmall" tone="muted">已填入 {view.done} / {order.length} 个新像素</Typography></div>
      </div>
      <footer shuku-edit-id="e-dd287696-221c-44af-9cec-149663cc6d7b" className="di-interpolation__formula" data-current={JSON.stringify(sample)}>
        {/* UIKit terms provide keyboard-accessible, upward-facing explanations. */}
        <MathFormulaBlock appearance="plain" ariaLabel="双线性插值：四个原始邻居像素值按横向与纵向位置比例加权求和">
          <MathFormulaTerm latex="C" tooltip="新位置的像素值；彩色图像的 RGB 三个通道分别计算。" tooltipPlacement="top"/>
          <MathFormulaStatic latex="="/>
          <MathFormulaTerm latex={"(1-u)(1-v){\\color{#ec7550}C_{00}}"} tooltip="左上邻居 × 左侧权重 × 上侧权重。u、v 分别是横向、纵向的归一化位置比例。" tooltipPlacement="top"/>
          <MathFormulaStatic latex="+"/>
          <MathFormulaTerm latex={"u(1-v){\\color{#24a58a}C_{10}}"} tooltip="右上邻居 × 右侧权重 × 上侧权重。" tooltipPlacement="top"/>
          <MathFormulaStatic latex="+"/>
          <MathFormulaTerm latex={"(1-u)v{\\color{#2987e7}C_{01}}"} tooltip="左下邻居 × 左侧权重 × 下侧权重。" tooltipPlacement="top"/>
          <MathFormulaStatic latex="+"/>
          <MathFormulaTerm latex={"uv{\\color{#9b67da}C_{11}}"} tooltip="右下邻居 × 右侧权重 × 下侧权重。四项权重非负且相加为一。" tooltipPlacement="top"/>
        </MathFormulaBlock>
        <div shuku-edit-id="e-a6e4661c-e5c2-4d9c-a11b-1e2e0d63aa08" className="di-interpolation__annotations">{['C₀₀：左上','C₁₀：右上','C₀₁：左下','C₁₁：右下'].map((label,i)=><Typography shuku-edit-id="e-3fafa33b-0a5f-4f96-b47d-6e6e577580c5" key={label} variant="bodySmall" style={{color:tones[i]}}>{label}</Typography>)}<Typography shuku-edit-id="e-e2a3a95e-9d57-4f7b-a09a-b10ea2ef1c7b" variant="bodySmall" tone="muted">u：横向比例 · v：纵向比例</Typography></div>
        <Typography shuku-edit-id="e-93b63794-f48d-4d52-8a3a-7b1f721c49c4" variant="body" tone="accent" align="center">新像素值 = 四个邻居像素值的加权平均。</Typography>
      </footer>
    </div>
  </ContentBlock>;
}
