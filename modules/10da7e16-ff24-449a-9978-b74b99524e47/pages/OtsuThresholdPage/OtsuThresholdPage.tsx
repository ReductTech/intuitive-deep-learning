import moduleAssetOutline from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useEffect, useMemo, useRef, useState } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from "@shuku/course-style/react";
import { analyzeHistogram } from './otsuModel';
import './OtsuThresholdPage.css';
const SAMPLES=[
  {id:'coins',title:'硬币',url:moduleAssetUrl("images/binarization-metal-tokens.webp")},
  {id:'parts',title:'零件',url:moduleAssetUrl("images/otsu-mechanical-parts.webp")},
  {id:'document',title:'文档',url:moduleAssetUrl("images/otsu-document.webp")},
  {id:'cat',title:'猫咪',url:moduleAssetUrl("images/digital-image-cat-scene.webp")},
];
function histogramOf(pixels:Uint8Array|undefined){const h=Array<number>(256).fill(0);pixels?.forEach(v=>h[v]++);return h;}
function loadGray(url:string):Promise<Uint8Array>{return new Promise((resolve,reject)=>{const image=new Image(); image.crossOrigin = 'anonymous';image.onload=()=>{const c=document.createElement('canvas');c.width=SIZE;c.height=SIZE;const ctx=c.getContext('2d')!;ctx.drawImage(image,0,0,SIZE,SIZE);const rgba=ctx.getImageData(0,0,SIZE,SIZE).data;resolve(Uint8Array.from({length:SIZE*SIZE},(_,i)=>Math.round(.299*rgba[i*4]+.587*rgba[i*4+1]+.114*rgba[i*4+2])));};image.onerror=reject;image.src=url;});}
const SIZE=500,HIST={x:48,y:34,width:504,height:226},SCORE=HIST;
function paint(canvas:HTMLCanvasElement|null,pixels:Uint8Array){if(!canvas)return;const ctx=canvas.getContext('2d')!,image=ctx.createImageData(SIZE,SIZE);for(let i=0;i<pixels.length;i++){const v=pixels[i],j=i*4;image.data[j]=v;image.data[j+1]=v;image.data[j+2]=v;image.data[j+3]=255;}ctx.putImageData(image,0,0);}
export function OtsuThresholdPage(){
  const [sources,setSources]=useState<Uint8Array[]>([]),[failed,setFailed]=useState(false),[selected,setSelected]=useState(0),[appliedThreshold,setAppliedThreshold]=useState(128),[scan,setScan]=useState<number|null>(null),[running,setRunning]=useState(false),[pending,setPending]=useState(false),[previousThreshold,setPreviousThreshold]=useState<number|null>(null);
  const before=useRef<HTMLCanvasElement>(null),after=useRef<HTMLCanvasElement>(null);
  // Preload all inputs so switching a sample updates its pixels and statistics atomically.
  useEffect(()=>{let active=true;Promise.all(SAMPLES.map(sample=>loadGray(sample.url))).then(images=>{if(!active)return;setSources(images);setAppliedThreshold(analyzeHistogram(histogramOf(images[0])).best??128);}).catch(()=>{if(active)setFailed(true);});return()=>{active=false;};},[]);
  const source=sources[selected];
  const histogram=useMemo(()=>histogramOf(source),[source]);
  const threshold=scan??appliedThreshold;
  const analysis=useMemo(()=>analyzeHistogram(histogram),[histogram]),current=analysis.candidates[threshold];
  const binary=useMemo(()=>source?.map(v=>v<threshold?0:255),[source,threshold]);
  useEffect(()=>{if(source)paint(before.current,source);},[source]);useEffect(()=>{if(binary)paint(after.current,binary);},[binary]);
  // Visit candidates in increasing order. Pause retains the candidate; switching cancels
  // the scan and restores the last applied threshold instead of applying a partial result.
  useEffect(()=>{
    if(!running)return;
    const initial=scan??0,startTime=performance.now();
    let candidate=initial;
    let finishTimer:number|undefined;
    const timer=window.setInterval(()=>{
      // Four-second sweep; all 256 scores are still evaluated, even between display frames.
      candidate=Math.min(255,initial+Math.floor((performance.now()-startTime)/15));
      setScan(candidate);
      if(candidate===255){
        window.clearInterval(timer);
        // Hold the full score curve briefly before returning to the best candidate.
        finishTimer=window.setTimeout(()=>{
          if(analysis.best!==null)setAppliedThreshold(analysis.best);
          setScan(null);setRunning(false);setPending(false);
        },350);
      }
    },30);
    return()=>{window.clearInterval(timer);window.clearTimeout(finishTimer);};
  },[running,analysis]);
  const bestSoFar=useMemo(()=>{
    if(scan===null)return null;
    let best:number|null=null,score=-1;
    for(let t=0;t<=scan;t++){const c=analysis.candidates[t];if(c.valid&&c.score>score){best=t;score=c.score;}}
    return best;
  },[analysis,scan]);
  const recalculate=()=>{
    if(running){setRunning(false);return;}
    if(scan===null){setPreviousThreshold(appliedThreshold);setScan(0);}
    setRunning(true);
  };
  const max=Math.max(1,...histogram), marker=HIST.x+threshold/255*HIST.width;
  const scorePath=analysis.candidates.slice(0,scan===null?256:scan+1).map((c,i)=>`${i?'L':'M'}${SCORE.x+c.threshold/255*SCORE.width} ${SCORE.y+SCORE.height-(analysis.maxScore?c.score/analysis.maxScore:0)*SCORE.height}`).join(' ');
  const bestMarker=scan===null?(pending?null:analysis.best):bestSoFar;
  const text=(x:number,y:number,w:number,value:string)=><foreignObject shuku-edit-id="e-3978e307-dca1-4892-a81c-35fac9d9a04c" x={x} y={y} width={w} height={40}><Typography shuku-edit-id="e-47bed81b-866c-4020-9410-f3d7f325900f" variant="bodySmall" tone="muted" align="center">{value}</Typography></foreignObject>;
  return <ContentBlock shuku-edit-id="e-17e0f71b-e787-4325-966a-7785cd1beb04" className="di-otsu" title="大津法（Otsu）" subtitle="尝试不同阈值，选两类分离得分最高的一个。" headingLevel={1}>
    <div shuku-edit-id="e-1ec46ac7-9dc0-43cd-83d6-dc65c30616ed" className="di-otsu__body" data-ready={Boolean(source)} data-threshold={threshold} data-best={analysis.best??''} data-sample={SAMPLES[selected].id} data-pending={pending} data-running={running} data-scanning={scan!==null} data-scan={scan??''} data-best-so-far={bestSoFar??''}>
      <div shuku-edit-id="e-c53241a8-bd33-43db-b4cb-870bc2be0caf" className="di-otsu__toolbar"><div shuku-edit-id="e-a1fa5df8-46e0-49a4-8fd8-888c1a0b4800" className="di-otsu__samples" role="group" aria-label="示例图像">{SAMPLES.map((sample,index)=><button shuku-edit-id="e-3931ef4a-5d4e-4a52-8eaa-f5ebac5f146c" type="button" key={sample.id} disabled={!source} aria-pressed={selected===index} className={selected===index?'is-primary':''} onClick={()=>{if(index===selected)return;setRunning(false);setScan(null);setSelected(index);setPending(true);setPreviousThreshold(null);}}><Typography shuku-edit-id="e-8831deec-944f-45c8-8cb4-7099401c7f4e" variant="body" tone="inherit">{sample.title}</Typography></button>)}</div><button shuku-edit-id="e-0d3579f3-0f84-4d3d-aabc-2a0f468a74b0" type="button" className="is-primary" disabled={!source||analysis.best===null} onClick={recalculate}><Typography shuku-edit-id="e-85079d8e-45a4-4702-852c-2c9840e7b4c2" variant="body" tone="inherit">{running?'暂停':scan!==null?'继续计算':'重新计算阈值'}</Typography></button></div>
      <div shuku-edit-id="e-ae021091-dd55-4ade-b324-29e4057fb84c" className="di-otsu__main">
        <section shuku-edit-id="e-e8027d6a-f5bd-4dc9-a2d8-3e6f6ebbb63b" className="di-otsu__image"><Typography shuku-edit-id="e-7aba27ae-e906-47ac-bea9-61a194b36a73" as="h2" variant="h3" tone="accent" align="center">灰度图</Typography><div shuku-edit-id="e-7eda5aac-2e49-456e-83dc-1ea4c8a50f83"><canvas shuku-edit-id="e-a1a66685-e893-4634-8a3f-f939fd6c668f" ref={before} width={SIZE} height={SIZE} role="img" aria-label="当前示例的原始灰度图"/></div><Typography shuku-edit-id="e-49715ef6-71be-4991-8fde-2ca25412f0bf" variant="bodySmall" tone="muted" align="center">从像素的灰度分布出发</Typography></section>
        <section shuku-edit-id="e-6298ee87-5091-45c4-aa2b-549cb2ee3e10" className="di-otsu__analysis"><Typography shuku-edit-id="e-9f3ecaff-99cb-4462-86a1-b1b66641daf9" as="h2" variant="h3" tone="accent">直方图与分离得分</Typography>
          <div shuku-edit-id="e-a5038c70-8057-4eae-86c4-10c2494290a5" className="di-otsu__legend"><Typography shuku-edit-id="e-91ace23f-7ad1-414e-8a90-d58f11582b41" variant="body" tone="muted"><span shuku-edit-id="e-6703b5ab-68a7-4dc6-b228-8b0925767147" className="di-otsu__legend-bar"/>像素分布</Typography><Typography shuku-edit-id="e-0da724e4-391d-4695-88f1-349de29b5dcf" variant="body" tone="accent"><span shuku-edit-id="e-91f1327e-4120-4150-9523-225e376b6ba7" className="di-otsu__legend-line"/>分离得分</Typography></div>
          <svg shuku-edit-id="e-212e4722-8b0b-4dbc-adfc-cf28379f11ae" viewBox="0 0 600 340" preserveAspectRatio="none" className="di-otsu__histogram" role="img" aria-label="合并图：直方图和类间方差共用灰度阈值横轴，两种纵向高度分别按各自最大值缩放">
            {[.25,.5,.75,1].map(r=><path shuku-edit-id="e-d3edb5e2-e868-414b-aa87-e54a070fc730" key={r} d={`M${HIST.x} ${HIST.y+HIST.height*(1-r)}H${HIST.x+HIST.width}`} stroke="#d9e5f1" strokeDasharray="4 5"/>)}
            {histogram.map((n,i)=>{const h=n/max*HIST.height;return <rect shuku-edit-id="e-589e6803-c58d-4247-9b3f-bc41972746be" key={i} data-gray={i} data-count={n} x={HIST.x+i/256*HIST.width} y={HIST.y+HIST.height-h} width={HIST.width/256} height={h} fill={i<threshold?'#94adc6':'#cbd9e7'} opacity=".8"><title>灰度 {i}：{n} 个像素</title></rect>;})}
            <path shuku-edit-id="e-509eb582-e903-4a28-9188-6ee041e39e43" data-score-curve="true" d={scorePath} fill="none" stroke="#247aeb" strokeWidth="4" strokeLinejoin="round"/>
            <path shuku-edit-id="e-620a80b5-4aa8-4483-921c-203d9c98e7dd" d={`M${HIST.x} ${HIST.y}V${HIST.y+HIST.height}H${HIST.x+HIST.width}V${HIST.y}`} fill="none" stroke="#95aac3" strokeWidth="1.5"/>
            <path shuku-edit-id="e-fcf5a1dc-157e-4dec-996f-1b33b6634f8d" data-threshold-marker="true" d={`M${marker} ${HIST.y}V${HIST.y+HIST.height}`} stroke="#147cf4" strokeWidth="2.5" strokeDasharray="6 5"/>
            <circle shuku-edit-id="e-36d473d4-8de6-41a1-888d-28f87a251e9a" cx={marker} cy={SCORE.y+SCORE.height-(analysis.maxScore?current.score/analysis.maxScore:0)*SCORE.height} r="6" fill="#147cf4" stroke="white" strokeWidth="2"/>
            {bestMarker!==null&&<circle shuku-edit-id="e-9cfd09bd-fb59-4f6e-9fec-252dcd51490b" data-best-marker="true" cx={SCORE.x+bestMarker/255*SCORE.width} cy={SCORE.y+SCORE.height-(analysis.maxScore?analysis.candidates[bestMarker].score/analysis.maxScore:0)*SCORE.height} r="10" fill="none" stroke="#d99b25" strokeWidth="3"/>}
            {text(Math.max(0,Math.min(500,marker-50)),0,100,scan!==null||pending?'T':'T*')}
            {[0,64,128,192,255].map(v=><g shuku-edit-id="e-be36de83-226f-46f1-888f-b3dd15b10829" key={v}><path shuku-edit-id="e-8043d852-58cc-4a12-b51b-c6b83c8924d3" d={`M${HIST.x+v/255*HIST.width} ${HIST.y+HIST.height}v6`} stroke="#95aac3"/>{text(HIST.x+v/255*HIST.width-25,264,50,String(v))}</g>)}
            {text(170,291,260,'灰度 / 候选阈值')}
          </svg>
          <div shuku-edit-id="e-25b2bc0b-1ef9-4e6e-8dd7-ea3b811c7613" className="di-otsu__classes" data-statistics={JSON.stringify(current)}>{[[current.w0,current.mu0,'暗类'],[current.w1,current.mu1,'亮类']].map(([w,mu,name],i)=><div shuku-edit-id="e-f25dd48a-c131-4ed1-addd-e5177bc2c5e6" key={String(name)} className={`di-otsu__class di-otsu__class--${i}`}><Typography shuku-edit-id="e-7effbeb8-30e5-4107-9aeb-f6ee09a1139e" variant="body" tone="accent">{name} · {(Number(w)*100).toFixed(1)}%</Typography><Typography shuku-edit-id="e-7be18e5d-1534-42bc-90da-a6568a7e0630" variant="bodySmall" tone="muted">平均灰度 {mu===null?'—':Number(mu).toFixed(1)}</Typography></div>)}</div>
          <Typography shuku-edit-id="e-0597c91d-e435-43c6-bfdc-3be950f6478b" variant="bodySmall" tone="muted" align="center">金圈：{scan!==null?'目前最高分':'最佳阈值'} · 两种高度各自缩放</Typography>
        </section>
        <section shuku-edit-id="e-71b838d2-68b1-426e-9260-007f7431ce33" className="di-otsu__image"><Typography shuku-edit-id="e-4d534f1a-14a8-496d-acba-07a51653c7b8" as="h2" variant="h3" tone="accent" align="center">二值结果</Typography><div shuku-edit-id="e-bd7d3785-f098-47e3-ac7d-24d188adf89e"><canvas shuku-edit-id="e-e938f3e7-187f-4331-a24d-41937d65ecf4" ref={after} width={SIZE} height={SIZE} role="img" aria-label="依据当前使用阈值计算的二值结果"/><div shuku-edit-id="e-4b639272-16f1-451f-8a92-acd8d3bdd694" className="di-otsu__badge"><Typography shuku-edit-id="e-541abfe7-6390-4e78-822c-f42b51a889e3" variant="bodySmall" tone="inherit">{scan!==null?'候选阈值 T':pending?'沿用阈值 T':'自动阈值 T*'} = {threshold}</Typography></div></div><Typography shuku-edit-id="e-ecf4444c-e179-42a7-831d-8618449709a9" variant="bodySmall" tone="muted" align="center">{scan!==null?(scan===255?'扫描完成，选取得分最高位置':running?'从左到右，逐个比较分离得分':'已暂停，点击继续计算'):pending?'沿用旧阈值，点击重新计算':previousThreshold!==null?`重新计算：${previousThreshold} → ${threshold}`:'切换图片，观察阈值是否适用'}</Typography></section>
      </div>
      <footer shuku-edit-id="e-0a663d91-635a-406b-89ae-7a8ec07e2ce7" className="di-otsu__formula"><MathFormulaBlock appearance="plain" ariaLabel="类间方差等于两类占比的乘积乘以两类平均灰度之差的平方"><MathFormulaTerm latex={"\\sigma_b^2(T)"} tooltip="类间方差：比较候选阈值的分离得分，选择得分最大者。" tooltipPlacement="top"/><MathFormulaStatic latex="="/><MathFormulaTerm latex={"\\omega_0(T)\\omega_1(T)"} tooltip="两类像素占比的乘积。如果只分出极少像素，这一项会很小。" tooltipPlacement="top"/><MathFormulaTerm latex={"[\\mu_0(T)-\\mu_1(T)]^2"} tooltip="两类平均灰度差的平方：均值越远，这一项越大。" tooltipPlacement="top"/></MathFormulaBlock><Typography shuku-edit-id="e-67451281-a927-45b6-8f4d-ceedac16647a" variant="bodySmall" tone="muted" align="center">ω：各类像素占比 · μ：各类平均灰度 · T：候选阈值</Typography><Typography shuku-edit-id="e-8fb77694-10eb-4052-9888-106f6a25103e" variant="body" tone="accent" align="center">{scan!==null?'移动阈值 → 分成两类 → 比较得分 → 选最高分':'两类均值要分得开，也要考虑各类有多少像素。'}</Typography></footer>
      {failed&&<Typography shuku-edit-id="e-daa9b736-330e-4e90-8b81-c25ba0a92abd" variant="bodySmall" tone="danger" role="alert">素材加载失败，请刷新重试。</Typography>}
    </div>
  </ContentBlock>;
}
