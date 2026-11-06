import moduleAssetOutline from '../../outlines.json';
import { moduleAssetUrl } from '../../../shared/react/assets';
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from '../../../shared/react';
import './BinarizationPage.css';
const photo = moduleAssetUrl(moduleAssetOutline.moduleIdentity.id, 'images/binarization-metal-tokens.jpg');
const SIZE=500, GRAPH={x:58,y:38,width:390,height:218};
function paint(canvas:HTMLCanvasElement|null, pixels:Uint8Array) {
  if(!canvas)return;const ctx=canvas.getContext('2d')!, image=ctx.createImageData(SIZE,SIZE);
  pixels.forEach((v,i)=>image.data.set([v,v,v,255],i*4));ctx.putImageData(image,0,0);
}
export function BinarizationPage() {
  const [source,setSource]=useState<Uint8Array>(), [failed,setFailed]=useState(false), [threshold,setThreshold]=useState(128), [inverted,setInverted]=useState(false);
  const original=useRef<HTMLCanvasElement>(null), result=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{let active=true;const image=new Image(); image.crossOrigin = 'anonymous';image.onload=()=>{if(!active)return;const c=document.createElement('canvas');c.width=SIZE;c.height=SIZE;const ctx=c.getContext('2d')!;ctx.drawImage(image,0,0,SIZE,SIZE);const rgba=ctx.getImageData(0,0,SIZE,SIZE).data;setSource(Uint8Array.from({length:SIZE*SIZE},(_,i)=>Math.round(.299*rgba[i*4]+.587*rgba[i*4+1]+.114*rgba[i*4+2])));};image.onerror=()=>{if(active)setFailed(true);};image.src=photo;return()=>{active=false;};},[]);
  const histogram=useMemo(()=>{const counts=Array<number>(256).fill(0);source?.forEach(v=>counts[v]++);return counts;},[source]);
  // Equality belongs to the upper class, consistently in pixels, counts and formula.
  const binary=useMemo(()=>source?.map(v=>(v<threshold)!==inverted?0:255),[source,threshold,inverted]);
  const dark=useMemo(()=>binary?.reduce((n,v)=>n+(v===0?1:0),0)??0,[binary]);
  useEffect(()=>{if(source)paint(original.current,source);},[source]);useEffect(()=>{if(binary)paint(result.current,binary);},[binary]);
  const max=Math.max(1,...histogram), divider=GRAPH.x+threshold/255*GRAPH.width;
  const move=(e:PointerEvent<SVGSVGElement>)=>{const box=e.currentTarget.getBoundingClientRect();setThreshold(Math.max(0,Math.min(255,Math.round(((e.clientX-box.left)/box.width*500-GRAPH.x)/GRAPH.width*255))));};
  const label=(x:number,y:number,width:number,text:string)=><foreignObject x={x} y={y} width={width} height={40}><Typography variant="bodySmall" tone="muted" align="center">{text}</Typography></foreignObject>;
  return <ContentBlock className="di-binary" title="二值化" subtitle="选一个阈值，把灰度图分成黑和白两类。" headingLevel={1}>
    <div className="di-binary__body" data-ready={Boolean(source)} data-threshold={threshold} data-inverted={inverted}>
      <div className="di-binary__main">
        <section className="di-binary__image"><Typography as="h2" variant="h3" tone="accent" align="center">灰度图</Typography><div><canvas ref={original} width={SIZE} height={SIZE} role="img" aria-label="硬币与垫圈的原始灰度图"/></div><Typography variant="bodySmall" tone="muted" align="center">每个像素有自己的灰度值</Typography></section>
        <section className="di-binary__control"><Typography as="h2" variant="h3" tone="accent">选择阈值 T</Typography>
          <label className="di-binary__slider"><input type="range" min="0" max="255" step="1" value={threshold} aria-label="二值化阈值" onChange={e=>setThreshold(Number(e.target.value))}/><Typography variant="body" tone="accent">T = {threshold}</Typography></label>
          <svg className="di-binary__histogram" viewBox="0 0 500 305" role="img" aria-label="实际灰度直方图；点击或拖动选择阈值" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);move(e);}} onPointerMove={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))move(e);}} onPointerUp={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}}>
            {label(0,0,100,'像素数')}
            {histogram.map((n,v)=>{const h=n/max*GRAPH.height;return <rect key={v} data-gray={v} data-count={n} x={GRAPH.x+v/256*GRAPH.width} y={GRAPH.y+GRAPH.height-h} width={GRAPH.width/256} height={h} fill={v<threshold?'#526f90':'#bdccdf'}/>;})}
            <path d={`M${GRAPH.x} ${GRAPH.y-5}V${GRAPH.y+GRAPH.height}H${GRAPH.x+GRAPH.width+7}`} stroke="#71849e" strokeWidth="1.5" fill="none"/>
            <path data-threshold-line="true" d={`M${divider} ${GRAPH.y}V${GRAPH.y+GRAPH.height}`} stroke="#197bf5" strokeWidth="3" strokeDasharray="6 4"/>
            <circle cx={divider} cy={GRAPH.y} r="6" fill="#197bf5"/>
            {label(GRAPH.x-25,GRAPH.y+GRAPH.height+2,50,'0')}{label(GRAPH.x+GRAPH.width-30,GRAPH.y+GRAPH.height+2,60,'255')}{label(GRAPH.x+120,GRAPH.y+GRAPH.height+2,160,'灰度值')}
          </svg>
          <Typography variant="bodySmall" tone="muted">拖动分界线，看哪些像素改变类别。</Typography>
          <div className="di-binary__actions"><button type="button" aria-pressed={inverted} className={inverted?'is-selected':''} onClick={()=>setInverted(v=>!v)}><Typography variant="bodySmall" tone="inherit">黑白反转</Typography></button><button type="button" onClick={()=>{setThreshold(128);setInverted(false);}}><Typography variant="bodySmall" tone="inherit">重置</Typography></button></div>
        </section>
        <section className="di-binary__image"><Typography as="h2" variant="h3" tone="accent" align="center">二值结果</Typography><div><canvas ref={result} width={SIZE} height={SIZE} role="img" aria-label="依据当前阈值真实计算的黑白二值结果"/></div><Typography variant="bodySmall" tone="muted" align="center">黑 {(dark/(SIZE*SIZE)*100).toFixed(1)}% · 白 {((SIZE*SIZE-dark)/(SIZE*SIZE)*100).toFixed(1)}%</Typography></section>
      </div>
      <footer className="di-binary__rule"><MathFormulaBlock appearance="plain" ariaLabel="按阈值逐像素映射为黑色或白色"><MathFormulaTerm latex="B(x,y)" tooltip="二值结果图；这里只保留黑、白两种显示值。" tooltipPlacement="top"/><MathFormulaStatic latex={`=\\begin{cases}${inverted?255:0},&I(x,y)<T\\\\${inverted?0:255},&I(x,y)\\ge T\\end{cases}`}/></MathFormulaBlock><div><Typography variant="body" tone="accent">低于阈值 → {inverted?'白色':'黑色'}；其余 → {inverted?'黑色':'白色'}。</Typography><Typography variant="bodySmall" tone="muted">阈值改变分类边界，同一幅图就会得到不同结果。</Typography></div></footer>
      {failed&&<Typography variant="bodySmall" tone="danger" role="alert">素材加载失败，请刷新重试。</Typography>}
    </div>
  </ContentBlock>;
}
