import moduleAssetOutline from '../../outlines.json';
import { moduleAssetUrl } from '../../../shared/react/assets';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, Typography } from '../../../shared/react';
import { analyzeHistogram } from './otsuModel';
import './OtsuThresholdPage.css';
const SAMPLES=[
  {id:'coins',title:'硬币',url:moduleAssetUrl(moduleAssetOutline.moduleIdentity.id, 'images/binarization-metal-tokens.png')},
  {id:'parts',title:'零件',url:moduleAssetUrl(moduleAssetOutline.moduleIdentity.id, 'images/otsu-mechanical-parts.png')},
  {id:'document',title:'文档',url:moduleAssetUrl(moduleAssetOutline.moduleIdentity.id, 'images/otsu-document.png')},
  {id:'cat',title:'猫咪',url:moduleAssetUrl(moduleAssetOutline.moduleIdentity.id, 'images/digital-image-cat-scene.png')},
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
  const text=(x:number,y:number,w:number,value:string)=><foreignObject x={x} y={y} width={w} height={40}><Typography variant="bodySmall" tone="muted" align="center">{value}</Typography></foreignObject>;
  return <ContentBlock className="di-otsu" title="大津法（Otsu）" subtitle="尝试不同阈值，选两类分离得分最高的一个。" headingLevel={1}>
    <div className="di-otsu__body" data-ready={Boolean(source)} data-threshold={threshold} data-best={analysis.best??''} data-sample={SAMPLES[selected].id} data-pending={pending} data-running={running} data-scanning={scan!==null} data-scan={scan??''} data-best-so-far={bestSoFar??''}>
      <div className="di-otsu__toolbar"><div className="di-otsu__samples" role="group" aria-label="示例图像">{SAMPLES.map((sample,index)=><button type="button" key={sample.id} disabled={!source} aria-pressed={selected===index} className={selected===index?'is-primary':''} onClick={()=>{if(index===selected)return;setRunning(false);setScan(null);setSelected(index);setPending(true);setPreviousThreshold(null);}}><Typography variant="body" tone="inherit">{sample.title}</Typography></button>)}</div><button type="button" className="is-primary" disabled={!source||analysis.best===null} onClick={recalculate}><Typography variant="body" tone="inherit">{running?'暂停':scan!==null?'继续计算':'重新计算阈值'}</Typography></button></div>
      <div className="di-otsu__main">
        <section className="di-otsu__image"><Typography as="h2" variant="h3" tone="accent" align="center">灰度图</Typography><div><canvas ref={before} width={SIZE} height={SIZE} role="img" aria-label="当前示例的原始灰度图"/></div><Typography variant="bodySmall" tone="muted" align="center">从像素的灰度分布出发</Typography></section>
        <section className="di-otsu__analysis"><Typography as="h2" variant="h3" tone="accent">直方图与分离得分</Typography>
          <div className="di-otsu__legend"><Typography variant="body" tone="muted"><span className="di-otsu__legend-bar"/>像素分布</Typography><Typography variant="body" tone="accent"><span className="di-otsu__legend-line"/>分离得分</Typography></div>
          <svg viewBox="0 0 600 340" preserveAspectRatio="none" className="di-otsu__histogram" role="img" aria-label="合并图：直方图和类间方差共用灰度阈值横轴，两种纵向高度分别按各自最大值缩放">
            {[.25,.5,.75,1].map(r=><path key={r} d={`M${HIST.x} ${HIST.y+HIST.height*(1-r)}H${HIST.x+HIST.width}`} stroke="#d9e5f1" strokeDasharray="4 5"/>)}
            {histogram.map((n,i)=>{const h=n/max*HIST.height;return <rect key={i} data-gray={i} data-count={n} x={HIST.x+i/256*HIST.width} y={HIST.y+HIST.height-h} width={HIST.width/256} height={h} fill={i<threshold?'#94adc6':'#cbd9e7'} opacity=".8"><title>灰度 {i}：{n} 个像素</title></rect>;})}
            <path data-score-curve="true" d={scorePath} fill="none" stroke="#247aeb" strokeWidth="4" strokeLinejoin="round"/>
            <path d={`M${HIST.x} ${HIST.y}V${HIST.y+HIST.height}H${HIST.x+HIST.width}V${HIST.y}`} fill="none" stroke="#95aac3" strokeWidth="1.5"/>
            <path data-threshold-marker="true" d={`M${marker} ${HIST.y}V${HIST.y+HIST.height}`} stroke="#147cf4" strokeWidth="2.5" strokeDasharray="6 5"/>
            <circle cx={marker} cy={SCORE.y+SCORE.height-(analysis.maxScore?current.score/analysis.maxScore:0)*SCORE.height} r="6" fill="#147cf4" stroke="white" strokeWidth="2"/>
            {bestMarker!==null&&<circle data-best-marker="true" cx={SCORE.x+bestMarker/255*SCORE.width} cy={SCORE.y+SCORE.height-(analysis.maxScore?analysis.candidates[bestMarker].score/analysis.maxScore:0)*SCORE.height} r="10" fill="none" stroke="#d99b25" strokeWidth="3"/>}
            {text(Math.max(0,Math.min(500,marker-50)),0,100,scan!==null||pending?'T':'T*')}
            {[0,64,128,192,255].map(v=><g key={v}><path d={`M${HIST.x+v/255*HIST.width} ${HIST.y+HIST.height}v6`} stroke="#95aac3"/>{text(HIST.x+v/255*HIST.width-25,264,50,String(v))}</g>)}
            {text(170,291,260,'灰度 / 候选阈值')}
          </svg>
          <div className="di-otsu__classes" data-statistics={JSON.stringify(current)}>{[[current.w0,current.mu0,'暗类'],[current.w1,current.mu1,'亮类']].map(([w,mu,name],i)=><div key={String(name)} className={`di-otsu__class di-otsu__class--${i}`}><Typography variant="body" tone="accent">{name} · {(Number(w)*100).toFixed(1)}%</Typography><Typography variant="bodySmall" tone="muted">平均灰度 {mu===null?'—':Number(mu).toFixed(1)}</Typography></div>)}</div>
          <Typography variant="bodySmall" tone="muted" align="center">金圈：{scan!==null?'目前最高分':'最佳阈值'} · 两种高度各自缩放</Typography>
        </section>
        <section className="di-otsu__image"><Typography as="h2" variant="h3" tone="accent" align="center">二值结果</Typography><div><canvas ref={after} width={SIZE} height={SIZE} role="img" aria-label="依据当前使用阈值计算的二值结果"/><div className="di-otsu__badge"><Typography variant="bodySmall" tone="inherit">{scan!==null?'候选阈值 T':pending?'沿用阈值 T':'自动阈值 T*'} = {threshold}</Typography></div></div><Typography variant="bodySmall" tone="muted" align="center">{scan!==null?(scan===255?'扫描完成，选取得分最高位置':running?'从左到右，逐个比较分离得分':'已暂停，点击继续计算'):pending?'沿用旧阈值，点击重新计算':previousThreshold!==null?`重新计算：${previousThreshold} → ${threshold}`:'切换图片，观察阈值是否适用'}</Typography></section>
      </div>
      <footer className="di-otsu__formula"><MathFormulaBlock appearance="plain" ariaLabel="类间方差等于两类占比的乘积乘以两类平均灰度之差的平方"><MathFormulaTerm latex={"\\sigma_b^2(T)"} tooltip="类间方差：比较候选阈值的分离得分，选择得分最大者。" tooltipPlacement="top"/><MathFormulaStatic latex="="/><MathFormulaTerm latex={"\\omega_0(T)\\omega_1(T)"} tooltip="两类像素占比的乘积。如果只分出极少像素，这一项会很小。" tooltipPlacement="top"/><MathFormulaTerm latex={"[\\mu_0(T)-\\mu_1(T)]^2"} tooltip="两类平均灰度差的平方：均值越远，这一项越大。" tooltipPlacement="top"/></MathFormulaBlock><Typography variant="bodySmall" tone="muted" align="center">ω：各类像素占比 · μ：各类平均灰度 · T：候选阈值</Typography><Typography variant="body" tone="accent" align="center">{scan!==null?'移动阈值 → 分成两类 → 比较得分 → 选最高分':'两类均值要分得开，也要考虑各类有多少像素。'}</Typography></footer>
      {failed&&<Typography variant="bodySmall" tone="danger" role="alert">素材加载失败，请刷新重试。</Typography>}
    </div>
  </ContentBlock>;
}
