import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { Button, ContentBlock, Typography, moduleAssetUrl } from '../../../shared/react';
import data from '../../../../assets/80396753-7fc8-4f55-9188-bddbdb828169/flatten-interface/responses.json';
import './FeatureMapsToClassifierPage.css';
const CHANNELS = Array.from({length:16},(_,c)=>({c,score:data.samples.reduce((sum,s)=>{const v=s.values[c],mean=v.reduce((a,b)=>a+b,0)/v.length;return sum+v.reduce((a,b)=>a+(b-mean)**2,0)/v.length;},0)})).sort((a,b)=>b.score-a.score).slice(0,5).map(item=>item.c);
const RANGES = Array.from({length:16},(_,c)=>{const v=data.samples.flatMap(s=>s.values[c]).sort((a,b)=>a-b),baseline=v[Math.floor(v.length/2)];return [baseline,Math.max(...v.map(n=>Math.abs(n-baseline)))];});
function Texture({values,size,channel}:{values:number[];size:number;channel:number}){
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{const ctx=ref.current?.getContext('2d');if(!ctx)return;const p=ctx.createImageData(size,size),[baseline,range]=RANGES[channel],colors=[[21,20,72],[20,65,136],[20,158,189],[112,205,108],[255,218,67]];values.forEach((v,i)=>{const t=Math.max(0,Math.min(.9999,Math.abs(v-baseline)/Math.max(range,1e-9)))*4,k=Math.floor(t),f=t-k;p.data.set([...colors[k].map((a,j)=>Math.round(a+(colors[k+1][j]-a)*f)),255],i*4);});ctx.putImageData(p,0,0);},[values,size,channel]);
  return <canvas ref={ref} width={size} height={size}/>;
}
const SIZES = [20, 24, 28, 32, 36, 40];
export function FeatureMapsToClassifierPage(){
  const [size,setSize]=useState(28),[failed,setFailed]=useState(false);
  const scene=useRef<HTMLDivElement>(null),drag=useRef<{x:number;y:number;size:number;scale:number}|null>(null);
  const sample=data.samples.find(s=>s.inputSize===size) ?? data.samples[0];
  const count=sample.values.flat().length,matched=count===784;
  const difference=count-784;
  function change(v:number){setSize(Math.max(20,Math.min(40,Math.round(v/4)*4)));}
  function start(e:PointerEvent<HTMLButtonElement>){e.currentTarget.setPointerCapture(e.pointerId);drag.current={x:e.clientX,y:e.clientY,size,scale:(scene.current?.getBoundingClientRect().width??1480)/1480};}
  function move(e:PointerEvent<HTMLButtonElement>){const d=drag.current;if(d)change(d.size+((e.clientX-d.x)+(e.clientY-d.y))/2/d.scale/9);}
  return <ContentBlock className="vfl-flatten-page" headingLevel={1} title="从特征图到全连接分类器" subtitle="改变图像尺寸后，展平向量还能接入原来的全连接层吗？">
    <div className="vfl-flatten-controls">
      <Typography variant="body" tone="accent">调整输入尺寸</Typography>
      <div className="vfl-flatten-sizes" role="group" aria-label="选择输入尺寸">{SIZES.map(value=><Button key={value} active={size===value} aria-pressed={size===value} onClick={()=>change(value)}>{value} × {value}</Button>)}</div>
    </div>
    <div ref={scene} className={`vfl-flatten-scene ${matched?'is-matched':'is-mismatched'}`}>
      <section className="vfl-flatten-stage vfl-flatten-input">
        <div className="vfl-flatten-heading"><Typography as="h2" variant="h3" tone="accent">输入图像</Typography><Typography variant="bodySmall" tone="muted">{size} × {size}</Typography></div>
        <div className="vfl-flatten-visual vfl-flatten-image-zone"><div className="vfl-flatten-image" style={{width:size*5.5,height:size*5.5}}><img src={moduleAssetUrl('80396753-7fc8-4f55-9188-bddbdb828169',`flatten-interface/${sample.input}`)} alt={`数字7，${size}×${size}输入`} onError={()=>setFailed(true)}/><Button className="vfl-flatten-handle" role="slider" aria-label="拖动放大或缩小输入图像" aria-valuemin={20} aria-valuemax={40} aria-valuenow={size} aria-valuetext={`${size}×${size}`} onPointerDown={start} onPointerMove={move} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} onKeyDown={e=>{if(['ArrowLeft','ArrowDown','ArrowRight','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();change(e.key==='Home'?20:e.key==='End'?40:size+(['ArrowLeft','ArrowDown'].includes(e.key)?-4:4));}}}><span aria-hidden="true"/></Button></div></div>
        <Typography className="vfl-flatten-stage-note" variant="bodySmall" tone="muted">拖动调整尺寸</Typography>
      </section>
      <span className="vfl-flatten-arrow" aria-hidden="true">→</span>
      <section className="vfl-flatten-stage vfl-flatten-maps">
        <div className="vfl-flatten-heading"><Typography as="h2" variant="h3" tone="accent">卷积特征图</Typography><Typography variant="bodySmall" tone="muted">{sample.mapSize} × {sample.mapSize} × 16</Typography></div>
        <div className="vfl-flatten-visual"><div className="vfl-flatten-stack" style={{'--map-side':`${sample.mapSize*14}px`} as CSSProperties}>{[...CHANNELS].reverse().map((channel,i)=><div key={channel} className="vfl-flatten-plane" style={{'--depth':4-i} as CSSProperties}><Texture values={sample.values[channel]} size={sample.mapSize} channel={channel}/></div>)}</div></div>

      </section>
      <span className="vfl-flatten-arrow" aria-hidden="true">→</span>
      <section className="vfl-flatten-stage vfl-flatten-vector">
        <div className="vfl-flatten-heading"><Typography as="h2" variant="h3" tone="accent">展平向量</Typography><Typography variant="bodySmall" tone={matched?'success':'warning'}>{count} 个数</Typography></div>
        <div className="vfl-flatten-visual"><div className="vfl-flatten-length-comparison" aria-label={`一个展平向量，共${count}个数；虚线框代表要求的784个数`}>
          <div className="vfl-flatten-required-frame" style={{height:`${232*784/1600+4}px`}} aria-hidden="true"/>
          <span className={`vfl-flatten-length-bar ${matched?'is-fit':''}`} style={{height:`${232*count/1600}px`}} aria-hidden="true"/>
          <div className="vfl-flatten-frame-label"><Typography variant="bodySmall" tone="muted">要求 784</Typography></div>
        </div></div>
        <Typography className="vfl-flatten-stage-note" variant="bodySmall" tone="muted">向量长度须与框相同</Typography>
      </section>
      <span className={`vfl-flatten-arrow ${matched?'':'is-blocked'}`} aria-hidden="true">{matched?'→':'⇥'}</span>
      <section className="vfl-flatten-stage vfl-flatten-classifier">
        <div className="vfl-flatten-heading"><Typography as="h2" variant="h3" tone="accent">全连接分类器</Typography><Typography variant="bodySmall" tone="muted">固定接收 784 个数</Typography></div>
        <div className="vfl-flatten-visual"><svg viewBox="0 0 280 250" aria-label="全连接网络示意，固定输入长度784"><g className="vfl-flatten-wires">{[25,60,95,155,190,225].flatMap(a=>[35,85,165,215].map(b=><line key={`${a}-${b}`} x1="30" y1={a} x2="140" y2={b}/>))}{[35,85,165,215].flatMap(a=>[45,85,165,205].map(b=><line key={`${a}-${b}`} x1="140" y1={a} x2="250" y2={b}/>))}</g><g className="vfl-flatten-input-nodes">{[25,60,95,155,190,225].map(y=><circle key={y} cx="30" cy={y} r="8"/>)}</g><g className="vfl-flatten-hidden-nodes">{[35,85,165,215].map(y=><circle key={y} cx="140" cy={y} r="11"/>)}</g><g className="vfl-flatten-output-nodes">{[45,85,165,205].map(y=><circle key={y} cx="250" cy={y} r="10"/>)}</g><g className="vfl-flatten-node-ellipsis" aria-hidden="true">{[30,140,250].map(x=><g key={x}><rect x={x-9} y="105" width="18" height="40" rx="5"/>{[117,125,133].map(y=><circle key={y} cx={x} cy={y} r="1.8"/>)}</g>)}</g></svg></div>
        <Typography className="vfl-flatten-stage-note" variant="bodySmall" tone="muted">一个输入节点接收一个数</Typography>
      </section>
    </div>
    <div className={`vfl-flatten-conclusion ${matched?'is-matched':''}`} aria-live="polite"><Typography variant="body" tone={matched?'success':'warning'}>{matched?'长度匹配，可以接入':'长度不匹配，无法接入'}</Typography><Typography variant="bodySmall" tone="accent">{matched?'784 个数，长度相同':difference<0?`少 ${-difference} 个数`:`多 ${difference} 个数`}</Typography></div>
    {failed && <Typography variant="bodySmall" tone="danger">图像加载失败，请刷新重试。</Typography>}
  </ContentBlock>;
}
