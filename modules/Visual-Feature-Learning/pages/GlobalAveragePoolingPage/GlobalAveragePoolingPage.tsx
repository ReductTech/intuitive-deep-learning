import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography, moduleAssetUrl } from '../../../shared/react';
import data from '../../../../assets/80396753-7fc8-4f55-9188-bddbdb828169/flatten-interface/responses.json';
import './GlobalAveragePoolingPage.css';
const CHANNELS = Array.from({length:16},(_,c)=>({c,score:data.samples.reduce((sum,s)=>{const v=s.values[c],mean=v.reduce((a,b)=>a+b,0)/v.length;return sum+v.reduce((a,b)=>a+(b-mean)**2,0)/v.length;},0)})).sort((a,b)=>b.score-a.score).slice(0,5).map(item=>item.c);
const RANGES = Array.from({length:16},(_,c)=>{const v=data.samples.flatMap(s=>s.values[c]).sort((a,b)=>a-b),baseline=v[Math.floor(v.length/2)];return [baseline,Math.max(...v.map(n=>Math.abs(n-baseline)))];});
function Texture({values,size,channel}:{values:number[];size:number;channel:number}){
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{const ctx=ref.current?.getContext('2d');if(!ctx)return;const p=ctx.createImageData(size,size),[baseline,range]=RANGES[channel],colors=[[21,20,72],[20,65,136],[20,158,189],[112,205,108],[255,218,67]];values.forEach((v,i)=>{const t=Math.max(0,Math.min(.9999,Math.abs(v-baseline)/Math.max(range,1e-9)))*4,k=Math.floor(t),f=t-k;p.data.set([...colors[k].map((a,j)=>Math.round(a+(colors[k+1][j]-a)*f)),255],i*4);});ctx.putImageData(p,0,0);},[values,size,channel]);
  return <canvas ref={ref} width={size} height={size}/>;
}
const SIZES = [20, 24, 28, 32, 36, 40];
export function GlobalAveragePoolingPage(){
  const [size,setSize]=useState(28),[failed,setFailed]=useState(false);
  const scene=useRef<HTMLDivElement>(null),drag=useRef<{x:number;y:number;size:number;scale:number}|null>(null);
  const sample=data.samples.find(s=>s.inputSize===size) ?? data.samples[0];
  const count=sample.values.length,matched=count===16;
  function change(v:number){setSize(Math.max(20,Math.min(40,Math.round(v/4)*4)));}
  function start(e:PointerEvent<HTMLButtonElement>){e.currentTarget.setPointerCapture(e.pointerId);drag.current={x:e.clientX,y:e.clientY,size,scale:(scene.current?.getBoundingClientRect().width??1480)/1480};}
  function move(e:PointerEvent<HTMLButtonElement>){const d=drag.current;if(d)change(d.size+((e.clientX-d.x)+(e.clientY-d.y))/2/d.scale/9);}
  return <ContentBlock className="vfl-gap-page" headingLevel={1} title="全局平均池化（GAP）" subtitle="Global Average Pooling · 输入大小可以改变，输出向量始终保持 16 维。">
    <div className="vfl-gap-controls">
      <Typography variant="body" tone="accent">调整输入尺寸</Typography>
      <div className="vfl-gap-sizes" role="group" aria-label="选择输入尺寸">{SIZES.map(value=><Button key={value} active={size===value} aria-pressed={size===value} onClick={()=>change(value)}>{value} × {value}</Button>)}</div>
    </div>
    <div ref={scene} className={`vfl-gap-scene ${matched?'is-matched':'is-mismatched'}`}>
      <section className="vfl-gap-stage vfl-gap-input">
        <div className="vfl-gap-heading"><Typography as="h2" variant="h3" tone="accent">输入图像</Typography><Typography variant="bodySmall" tone="muted">{size} × {size}</Typography></div>
        <div className="vfl-gap-visual vfl-gap-image-zone"><div className="vfl-gap-image" style={{width:size*4.5,height:size*4.5}}><img src={moduleAssetUrl('80396753-7fc8-4f55-9188-bddbdb828169',`flatten-interface/${sample.input}`)} alt={`数字7，${size}×${size}输入`} onError={()=>setFailed(true)}/><Button className="vfl-gap-handle" role="slider" aria-label="拖动放大或缩小输入图像" aria-valuemin={20} aria-valuemax={40} aria-valuenow={size} aria-valuetext={`${size}×${size}`} onPointerDown={start} onPointerMove={move} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} onKeyDown={e=>{if(['ArrowLeft','ArrowDown','ArrowRight','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();change(e.key==='Home'?20:e.key==='End'?40:size+(['ArrowLeft','ArrowDown'].includes(e.key)?-4:4));}}}><span aria-hidden="true"/></Button></div></div>
      </section>
      <span className="vfl-gap-arrow" aria-hidden="true">→</span>
      <section className="vfl-gap-stage vfl-gap-maps">
        <div className="vfl-gap-heading"><Typography as="h2" variant="h3" tone="accent">卷积特征图</Typography><Typography variant="bodySmall" tone="muted">{sample.mapSize} × {sample.mapSize} × 16</Typography></div>
        <div className="vfl-gap-visual"><div className="vfl-gap-stack" style={{'--map-side':`${sample.mapSize*11}px`} as CSSProperties}>{[...CHANNELS].reverse().map((channel,i)=><div key={channel} className="vfl-gap-plane" style={{'--depth':4-i} as CSSProperties}><Texture values={sample.values[channel]} size={sample.mapSize} channel={channel}/></div>)}</div></div>

      </section>
      <span className="vfl-gap-arrow" aria-hidden="true">→</span>
      <section className="vfl-gap-stage vfl-gap-vector">
        <Typography as="h2" variant="h3" tone="accent">GAP：固定长度输出</Typography>
        <div className="vfl-gap-shape">
          <MathFormulaBlock className="vfl-gap-average-formula"><MathFormulaStatic latex={String.raw`g_c=\frac{1}{HW}\sum_{i=1}^{H}\sum_{j=1}^{W}X_c(i,j)`}/></MathFormulaBlock>
          <MathFormulaBlock className="vfl-gap-shape-formula"><MathFormulaStatic latex={`${sample.mapSize} \\times ${sample.mapSize} \\times 16 \\;\\longrightarrow\\; 16`}/></MathFormulaBlock>
        </div>
        <div className="vfl-gap-output" data-dimension={count}>
          <Typography variant="h2" tone="success">{count} 维输出向量</Typography>
          <div className="vfl-gap-vector-cells" role="img" aria-label={`输出向量包含 ${count} 个分量，输入尺寸改变时长度不变`}>{sample.values.map((_,channel)=><span key={channel} className="vfl-gap-vector-cell"/>)}</div>
          <Typography variant="body" tone="accent">输入怎么缩放，长度都是 16</Typography>
        </div>
        <Typography variant="bodySmall" tone="muted">每个通道求平均 → 每个通道输出 1 个数</Typography>
      </section>
      <span className={`vfl-gap-arrow ${matched?'':'is-blocked'}`} aria-hidden="true">{matched?'→':'⇥'}</span>
      <section className="vfl-gap-stage vfl-gap-classifier">
        <div className="vfl-gap-heading"><Typography as="h2" variant="h3" tone="accent">全连接分类器</Typography><Typography variant="bodySmall" tone="muted">固定接收 16 个数</Typography></div>
        <div className="vfl-gap-visual"><svg viewBox="0 0 280 250" aria-label="全连接网络示意，固定输入长度16"><g className="vfl-gap-wires">{[25,60,95,155,190,225].flatMap(a=>[35,85,165,215].map(b=><line key={`${a}-${b}`} x1="30" y1={a} x2="140" y2={b}/>))}{[35,85,165,215].flatMap(a=>[45,85,165,205].map(b=><line key={`${a}-${b}`} x1="140" y1={a} x2="250" y2={b}/>))}</g><g className="vfl-gap-input-nodes">{[25,60,95,155,190,225].map(y=><circle key={y} cx="30" cy={y} r="8"/>)}</g><g className="vfl-gap-hidden-nodes">{[35,85,165,215].map(y=><circle key={y} cx="140" cy={y} r="11"/>)}</g><g className="vfl-gap-output-nodes">{[45,85,165,205].map(y=><circle key={y} cx="250" cy={y} r="10"/>)}</g><g className="vfl-gap-node-ellipsis" aria-hidden="true">{[30,140,250].map(x=><g key={x}><rect x={x-9} y="105" width="18" height="40" rx="5"/>{[117,125,133].map(y=><circle key={y} cx={x} cy={y} r="1.8"/>)}</g>)}</g></svg></div>
      </section>
    </div>
    <div className="vfl-gap-conclusion is-matched" aria-live="polite">
      <Typography variant="body" tone="success">{sample.mapSize} × {sample.mapSize} × 16 → 16 维向量</Typography>
      <Typography variant="bodySmall" tone="accent">输入尺寸可变，分类器始终接收 16 维向量。</Typography>
    </div>
    {failed && <Typography variant="bodySmall" tone="danger">图像加载失败，请刷新重试。</Typography>}
  </ContentBlock>;
}
