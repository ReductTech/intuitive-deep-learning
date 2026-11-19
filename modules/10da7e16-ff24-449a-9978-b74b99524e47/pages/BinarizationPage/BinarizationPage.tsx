import moduleAssetOutline from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from "@shuku/course-style/react";
import './BinarizationPage.css';
const photo = moduleAssetUrl("images/binarization-metal-tokens.webp");
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
  const label=(x:number,y:number,width:number,text:string)=><foreignObject shuku-edit-id="e-c3a37dc1-d779-4e5a-8071-3aae49f48884" x={x} y={y} width={width} height={40}><Typography shuku-edit-id="e-15e636f5-df64-484d-b267-2404b7b8f4e8" variant="bodySmall" tone="muted" align="center">{text}</Typography></foreignObject>;
  return <ContentBlock shuku-edit-id="e-b844cb9c-60d4-4920-a061-817b4d686138" className="di-binary" title="二值化" subtitle="选一个阈值，把灰度图分成黑和白两类。" headingLevel={1}>
    <div shuku-edit-id="e-a174a2eb-6635-4f33-9a12-c6d2b18148d9" className="di-binary__body" data-ready={Boolean(source)} data-threshold={threshold} data-inverted={inverted}>
      <div shuku-edit-id="e-fcb759c5-09a0-41e0-ae9f-605ec91d019f" className="di-binary__main">
        <section shuku-edit-id="e-2be5a2dd-2bdf-4296-b95a-558ca371c8d9" className="di-binary__image"><Typography shuku-edit-id="e-05dc268c-99a2-43ae-9a31-931ee28a8868" as="h2" variant="h3" tone="accent" align="center">灰度图</Typography><div shuku-edit-id="e-525d8155-3fde-4f06-9794-0d6493526112"><canvas shuku-edit-id="e-439b6f20-61c9-40f4-9206-d4c872c2cf68" ref={original} width={SIZE} height={SIZE} role="img" aria-label="硬币与垫圈的原始灰度图"/></div><Typography shuku-edit-id="e-095ff5d9-ab04-46e3-abd8-0022f15e5392" variant="bodySmall" tone="muted" align="center">每个像素有自己的灰度值</Typography></section>
        <section shuku-edit-id="e-138061bb-03d1-4dd9-9630-617ecf0dcd3e" className="di-binary__control"><Typography shuku-edit-id="e-50ade276-ec06-4c6d-8321-ddbf77b85b02" as="h2" variant="h3" tone="accent">选择阈值 T</Typography>
          <label shuku-edit-id="e-d42800f1-6193-4ffc-939b-72b77c02c147" className="di-binary__slider"><input shuku-edit-id="e-97cdd041-9a1e-455d-a137-9257feb3071f" type="range" min="0" max="255" step="1" value={threshold} aria-label="二值化阈值" onChange={e=>setThreshold(Number(e.target.value))}/><Typography shuku-edit-id="e-e9519c39-2d6c-465b-8fde-f9f0003d321a" variant="body" tone="accent">T = {threshold}</Typography></label>
          <svg shuku-edit-id="e-69458d06-4ad7-450b-8476-8f638de013d2" className="di-binary__histogram" viewBox="0 0 500 305" role="img" aria-label="实际灰度直方图；点击或拖动选择阈值" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);move(e);}} onPointerMove={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))move(e);}} onPointerUp={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}}>
            {label(0,0,100,'像素数')}
            {histogram.map((n,v)=>{const h=n/max*GRAPH.height;return <rect shuku-edit-id="e-3c35f7f4-43b5-411c-829e-89d78f8074f6" key={v} data-gray={v} data-count={n} x={GRAPH.x+v/256*GRAPH.width} y={GRAPH.y+GRAPH.height-h} width={GRAPH.width/256} height={h} fill={v<threshold?'#526f90':'#bdccdf'}/>;})}
            <path shuku-edit-id="e-5fc866d1-78d4-4661-8f6d-30ceb4ce774a" d={`M${GRAPH.x} ${GRAPH.y-5}V${GRAPH.y+GRAPH.height}H${GRAPH.x+GRAPH.width+7}`} stroke="#71849e" strokeWidth="1.5" fill="none"/>
            <path shuku-edit-id="e-938032d5-6798-4a6b-b9fb-4150e15cd92a" data-threshold-line="true" d={`M${divider} ${GRAPH.y}V${GRAPH.y+GRAPH.height}`} stroke="#197bf5" strokeWidth="3" strokeDasharray="6 4"/>
            <circle shuku-edit-id="e-1a9163ba-0717-4914-abb4-7eb6f995a1c3" cx={divider} cy={GRAPH.y} r="6" fill="#197bf5"/>
            {label(GRAPH.x-25,GRAPH.y+GRAPH.height+2,50,'0')}{label(GRAPH.x+GRAPH.width-30,GRAPH.y+GRAPH.height+2,60,'255')}{label(GRAPH.x+120,GRAPH.y+GRAPH.height+2,160,'灰度值')}
          </svg>
          <Typography shuku-edit-id="e-6cb58cbc-aec5-4b28-b447-1f4ff1adbba4" variant="bodySmall" tone="muted">拖动分界线，看哪些像素改变类别。</Typography>
          <div shuku-edit-id="e-9e426a2a-b98e-4692-80e8-62f2b7278f0a" className="di-binary__actions"><button shuku-edit-id="e-74a283c7-8dab-485e-9410-9cdfb82ce2aa" type="button" aria-pressed={inverted} className={inverted?'is-selected':''} onClick={()=>setInverted(v=>!v)}><Typography shuku-edit-id="e-9a8d8859-eb7f-4bb6-8cdc-86b2968703c2" variant="bodySmall" tone="inherit">黑白反转</Typography></button><button shuku-edit-id="e-30e17848-14e7-4663-a7f7-b1e5e36c79ca" type="button" onClick={()=>{setThreshold(128);setInverted(false);}}><Typography shuku-edit-id="e-20afdf5e-551c-47ad-910b-3285db5e844d" variant="bodySmall" tone="inherit">重置</Typography></button></div>
        </section>
        <section shuku-edit-id="e-ec2ecc02-53e9-42ea-95bb-2c15ef6cae90" className="di-binary__image"><Typography shuku-edit-id="e-e39ba80a-71f3-4b30-a2c7-318c2e516ef8" as="h2" variant="h3" tone="accent" align="center">二值结果</Typography><div shuku-edit-id="e-5c476430-d951-4cd6-a137-0fb415070b53"><canvas shuku-edit-id="e-b5ad98a8-d3c8-470a-8448-12d47ffa301b" ref={result} width={SIZE} height={SIZE} role="img" aria-label="依据当前阈值真实计算的黑白二值结果"/></div><Typography shuku-edit-id="e-65033458-e8ec-4ea3-800a-b9d44fc01546" variant="bodySmall" tone="muted" align="center">黑 {(dark/(SIZE*SIZE)*100).toFixed(1)}% · 白 {((SIZE*SIZE-dark)/(SIZE*SIZE)*100).toFixed(1)}%</Typography></section>
      </div>
      <footer shuku-edit-id="e-d7f71b1d-9418-4cba-9e6a-a0dc1ff29757" className="di-binary__rule"><MathFormulaBlock appearance="plain" ariaLabel="按阈值逐像素映射为黑色或白色"><MathFormulaTerm latex="B(x,y)" tooltip="二值结果图；这里只保留黑、白两种显示值。" tooltipPlacement="top"/><MathFormulaStatic latex={`=\\begin{cases}${inverted?255:0},&I(x,y)<T\\\\${inverted?0:255},&I(x,y)\\ge T\\end{cases}`}/></MathFormulaBlock><div shuku-edit-id="e-762f6402-98f6-4d82-a4ba-7b48007f3e52"><Typography shuku-edit-id="e-956c2d29-2ba3-4723-b046-14165a23ea18" variant="body" tone="accent">低于阈值 → {inverted?'白色':'黑色'}；其余 → {inverted?'黑色':'白色'}。</Typography><Typography shuku-edit-id="e-e0df0f00-686e-4e31-8f80-d51c57ddff94" variant="bodySmall" tone="muted">阈值改变分类边界，同一幅图就会得到不同结果。</Typography></div></footer>
      {failed&&<Typography shuku-edit-id="e-e63a2ee0-65e3-491c-a504-7c32af80d856" variant="bodySmall" tone="danger" role="alert">素材加载失败，请刷新重试。</Typography>}
    </div>
  </ContentBlock>;
}
