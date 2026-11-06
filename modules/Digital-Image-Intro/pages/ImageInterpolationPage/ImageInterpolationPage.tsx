import { useEffect, useRef, useState } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from '../../../shared/react';
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
  return <ContentBlock className="di-interpolation" title="双线性插值" subtitle="把像素间的空位，用四个邻居算出来。" headingLevel={1}>
    <div className="di-interpolation__body" data-expansion={view.expansion} data-done={view.done} data-total={order.length} data-mode={view.mode}>
      <div className="di-interpolation__toolbar"><Typography variant="bodySmall" tone="muted">{status} · {expanded?`${WIDTH} × ${HEIGHT}`:`${SOURCE_WIDTH} × ${SOURCE_HEIGHT}`}</Typography><div><button type="button" className="is-primary" onClick={start} disabled={view.mode==='one'}><Typography variant="bodySmall" tone="inherit">{view.mode==='all'?'暂停':complete?'重新开始':started?'继续':'开始插值'}</Typography></button><button type="button" onClick={one} disabled={complete||view.mode==='one'}><Typography variant="bodySmall" tone="inherit">算一个</Typography></button><button type="button" onClick={reset}><Typography variant="bodySmall" tone="inherit">重置</Typography></button></div></div>
      <div className="di-interpolation__stage"><canvas ref={canvas} width={CW} height={CH} role="img" aria-label="像素小人逐渐放大，新像素从原像素周围扩散填入的单画布"/>
        <div className="di-interpolation__stage-note"><Typography variant="bodySmall" tone="muted">{!expanded?'原像素拉开，空位等待计算。':'彩色边框：四个邻居 · 蓝框：公式示例'}</Typography></div>
        {expanded&&<div className="di-interpolation__position"><Typography variant="bodySmall" tone="accent">四个邻居 → 新像素</Typography><Typography variant="bodySmall" tone="muted">先横向混合，再纵向混合</Typography></div>}
        <div className="di-interpolation__progress"><Typography variant="bodySmall" tone="muted">已填入 {view.done} / {order.length} 个新像素</Typography></div>
      </div>
      <footer className="di-interpolation__formula" data-current={JSON.stringify(sample)}>
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
        <div className="di-interpolation__annotations">{['C₀₀：左上','C₁₀：右上','C₀₁：左下','C₁₁：右下'].map((label,i)=><Typography key={label} variant="bodySmall" style={{color:tones[i]}}>{label}</Typography>)}<Typography variant="bodySmall" tone="muted">u：横向比例 · v：纵向比例</Typography></div>
        <Typography variant="body" tone="accent" align="center">新像素值 = 四个邻居像素值的加权平均。</Typography>
      </footer>
    </div>
  </ContentBlock>;
}
