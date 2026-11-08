import {useEffect,useState} from 'react';
import {Button,ContentBlock,MathFormulaBlock,MathFormulaStatic,Typography} from '../../../shared/react';
import {identityExamples,identityPhotoUrl} from '../../components/identityExamples';
import './TripletLossPage.css';

const labels=['锚点 a','正样本 p','负样本 n'];
const phases=['训练前 · 距离关系尚未满足要求','同时拉近正样本、推远负样本','已满足距离间隔，损失为 0'];
function Portrait({index}:{index:number}){const photo=identityExamples[index];return <img alt={photo.name} className={`vfl-triplet-portrait photo-${index}`} src={identityPhotoUrl(photo.file)}/>;}
const smooth=(x:number)=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
const trainingSteps=8;
const playbackDurationMs=10000;
function distancesAt(time:number){const progress=smooth(time/10);return {ap:2.60-1.60*progress,an:2.00+.50*progress};}
export function TripletLossPage(){
 const [time,setTime]=useState(0),[playing,setPlaying]=useState(false);
 useEffect(()=>{
  if(!playing)return;
  let id=0,last=0;
  const tick=(now:number)=>{
   const elapsed=last&&!document.hidden?Math.min(now-last,80):0;
   last=now;
   if(elapsed)setTime(t=>Math.min(10,t+elapsed*10/playbackDurationMs));
   id=requestAnimationFrame(tick);
  };
  id=requestAnimationFrame(tick);
  return()=>cancelAnimationFrame(id);
 },[playing]);
 useEffect(()=>{if(time>=10)setPlaying(false);},[time]);
 const phase=time===0?0:time<10?1:2;
 const {ap,an}=distancesAt(time),margin=1.5;
 const loss=Math.max(0,ap-an+margin),scale=104,a={x:270,y:130};
 const pd={x:.8,y:.6},nd={x:.99,y:-Math.sqrt(1-.99**2)};
 const p={x:a.x+ap*scale*pd.x,y:a.y+ap*scale*pd.y},n={x:a.x+an*scale*nd.x,y:a.y+an*scale*nd.y};
 function next(){setPlaying(false);setTime(t=>Math.min(10,(Math.floor(t/10*trainingSteps+1e-6)+1)*10/trainingSteps));}
 return <ContentBlock className="vfl-triplet-page" headingLevel={1} title="三元组损失：让特征适合比较身份" subtitle="以锚点为参照，同时减小正样本距离、增大负样本距离，并保留间隔。">
 <div className={`vfl-triplet-body phase-${phase} ${playing?'is-playing':'is-paused'}`}>
 <section className="vfl-triplet-samples" aria-label="锚点和正样本为杰森·斯坦森，负样本为郭达">
 <Typography variant="h3" tone="accent">一组训练样本</Typography>
 <div className="vfl-triplet-sample-row">{identityExamples.map((photo,i)=><div key={photo.file} className={`vfl-triplet-sample sample-${i}`}><div className="vfl-triplet-label"><span/><Typography variant="bodySmall" tone="inherit">{labels[i]}</Typography></div><Portrait index={i}/><Typography variant="bodySmall" tone="accent">{i===2?'郭达':'斯坦森'}</Typography></div>)}</div>
 <div className="vfl-triplet-sample-cues"><div className="positive"><span/><Typography variant="body" tone="inherit">同一人 · 拉近</Typography></div><div className="negative"><span/><Typography variant="body" tone="inherit">不同人 · 推远</Typography></div></div>
 </section>
 <section className="vfl-triplet-space" aria-label="特征空间中的可控动画">
 <div className="vfl-triplet-space-title"><Typography variant="h3" tone="accent">特征空间</Typography><Typography variant="bodySmall" tone="muted">距离变化示意</Typography></div>
 <div className="vfl-triplet-plot" data-ap={ap} data-an={an} data-loss={loss}><svg viewBox="0 0 860 360" aria-label="绿色照片靠近锚点，红色照片远离锚点">
 <defs><pattern id="vfl-triplet-dots" width="64" height="64" patternUnits="userSpaceOnUse"><circle cx="32" cy="32" r="1.5" fill="#c4d8f2"/></pattern><marker id="vfl-triplet-green-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#269465"/></marker><marker id="vfl-triplet-red-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#ed746e"/></marker></defs>
 <rect x="24" y="12" width="812" height="328" fill="url(#vfl-triplet-dots)"/>
 <path d="M20 15V340H840m-825 -318l5 -7l5 7m808 313l7 5l-7 5" fill="none" stroke="#adbed6" strokeWidth="2"/>
 <line data-relationship="positive" x1={p.x-pd.x*44} y1={p.y-pd.y*44} x2={a.x+pd.x*44} y2={a.y+pd.y*44} stroke="#269465" strokeWidth="3" markerEnd="url(#vfl-triplet-green-arrow)"/><line data-relationship="negative" x1={a.x+nd.x*44} y1={a.y+nd.y*44} x2={n.x-nd.x*44} y2={n.y-nd.y*44} stroke="#ed746e" strokeWidth="3" markerEnd="url(#vfl-triplet-red-arrow)"/>
 <foreignObject x="150" y="240" width="235" height="60"><div className="vfl-triplet-distance-label positive"><MathFormulaBlock><MathFormulaStatic latex={`{\\color{#26764f}d(a,p)=${ap.toFixed(2)}}`}/></MathFormulaBlock></div></foreignObject>
 <foreignObject x="200" y="15" width="235" height="60"><div className="vfl-triplet-distance-label negative"><MathFormulaBlock><MathFormulaStatic latex={`{\\color{#b64742}d(a,n)=${an.toFixed(2)}}`}/></MathFormulaBlock></div></foreignObject>
 <foreignObject x={a.x-142} y={a.y-22} width="100" height="60"><Typography className="vfl-triplet-node-label anchor" variant="bodySmall" tone="inherit">a 锚点</Typography></foreignObject>
 <foreignObject x={p.x+44} y={p.y-8} width="150" height="60"><Typography className="vfl-triplet-node-label positive" variant="bodySmall" tone="inherit">p 正样本</Typography></foreignObject>
 <foreignObject x={n.x+15} y={n.y-78} width="150" height="60"><Typography className="vfl-triplet-node-label negative" variant="bodySmall" tone="inherit">n 负样本</Typography></foreignObject>
 {[a,p,n].map((pos,i)=><foreignObject key={i} x={pos.x-36} y={pos.y-36} width="72" height="72"><div className={`vfl-triplet-point point-${i}`}><Portrait index={i}/></div></foreignObject>)}
 </svg></div>
 <div className="vfl-triplet-playbar"><div className="vfl-triplet-stage" aria-live="polite"><Typography variant="bodySmall" tone="accent">{phases[phase]}</Typography></div>
 <div className="vfl-triplet-controls"><Button variant="primary" onClick={()=>{if(time>=10)setTime(0);setPlaying(v=>!v);}}>{playing?'暂停':'播放缓存'}</Button><Button onClick={next} disabled={time>=10}>下一步</Button><Button onClick={()=>{setPlaying(false);setTime(0);}}>重播</Button></div>
 </div></section>
 <section className="vfl-triplet-calculation" aria-label="实时三元组损失">
 <div className="vfl-triplet-formula-panel"><Typography variant="h3" tone="accent">三元组损失</Typography><div className="vfl-triplet-formula-content">
 <MathFormulaBlock ariaLabel="损失等于正样本距离减负样本距离加间隔，与零取最大值"><MathFormulaStatic latex={String.raw`L=\max\bigl(0,\,{\color{#26764f}d(a,p)}-{\color{#b64742}d(a,n)}+{\color{#987019}m}\bigr)`}/></MathFormulaBlock>
 <div className="vfl-triplet-numbers"><Typography variant="bodySmall" tone="muted">正样本 {ap.toFixed(2)}</Typography><Typography variant="bodySmall" tone="muted">负样本 {an.toFixed(2)}</Typography><Typography variant="bodySmall" tone="muted">间隔 m = 1.50</Typography></div>
 </div></div><div className="vfl-triplet-result"><div className="vfl-triplet-loss"><Typography variant="h3" tone="accent">当前损失</Typography><Typography variant="h1" tone={loss<.001?'accent':'warning'}>{loss.toFixed(2)}</Typography></div><div className="vfl-triplet-condition"><MathFormulaBlock><MathFormulaStatic latex={String.raw`d(a,n)\ge d(a,p)+m`}/></MathFormulaBlock><Typography variant="bodySmall" tone="muted">满足间隔后，损失为 0</Typography></div></div>
 </section></div></ContentBlock>;
}
