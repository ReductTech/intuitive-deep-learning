import {useEffect,useState,type CSSProperties} from 'react';
import {Button,ContentBlock,MathFormulaBlock,MathFormulaStatic,Typography,moduleAssetUrl} from '../../../shared/react';
import './TripletLossPage.css';

const photos=['luxun-1930.jpg','luxun-1933.jpg','martin-luther-king.jpg'];
const labels=['锚点 Anchor','正样本 Positive','负样本 Negative'];
const names=['鲁迅 · 照片 1','鲁迅 · 照片 2','马丁·路德·金'];
const phases=['训练前：距离关系尚未满足要求','同时拉近正样本、推远负样本','已满足距离间隔，损失为 0'];
function Portrait({index}:{index:number}){return <div role="img" aria-label={names[index]} className={`vfl-triplet-portrait photo-${index}`} style={{'--vfl-triplet-photo':`url(${moduleAssetUrl('80396753-7fc8-4f55-9188-bddbdb828169',`open-identity/${photos[index]}`)})`} as CSSProperties}/>;}
const smooth=(x:number)=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
// Each update shares one pair of distances across the geometry and loss.
// One brief reversal illustrates a fluctuation before steady convergence.
const trainingDistances = [
 [2.60,2.00],[2.35,2.08],[2.10,2.16],[1.85,2.24],
 [1.94,2.20],[1.60,2.30],[1.35,2.38],[1.15,2.45],[1.00,2.50],
] as const;
const playbackDurationMs=4000;
function distancesAt(time:number){
 const update=Math.max(0,Math.min(1,time/10))*(trainingDistances.length-1);
 const index=Math.min(Math.floor(update),trainingDistances.length-2);
 const blend=smooth(update-index),from=trainingDistances[index],to=trainingDistances[index+1];
 return {ap:from[0]+(to[0]-from[0])*blend,an:from[1]+(to[1]-from[1])*blend};
}
export function TripletLossPage(){
 const [time,setTime]=useState(0),[playing,setPlaying]=useState(false);
 useEffect(()=>{if(!playing)return;let id=0,last=0;const tick=(now:number)=>{if(last)setTime(t=>Math.min(10,t+(now-last)*10/playbackDurationMs));last=now;id=requestAnimationFrame(tick);};id=requestAnimationFrame(tick);return()=>cancelAnimationFrame(id);},[playing]);
 useEffect(()=>{if(time>=10)setPlaying(false);},[time]);
 const phase=time===0?0:time<10?1:2;
 const {ap,an}=distancesAt(time),margin=1.5;
 const loss=Math.max(0,ap-an+margin),scale=73,a={x:215,y:190};
 const p={x:a.x+ap*scale*.48,y:a.y+ap*scale*Math.sqrt(1-.48**2)},n={x:a.x+an*scale*.98,y:a.y-an*scale*Math.sqrt(1-.98**2)};
 const ring=(ap+margin)*scale;
 function next(){setPlaying(false);setTime(t=>Math.min(10,(Math.floor(t/10*(trainingDistances.length-1)+1e-6)+1)*10/(trainingDistances.length-1)));}
 return <ContentBlock className="vfl-triplet-page" headingLevel={1} title="三元组损失：让特征适合比较身份" subtitle="以锚点为参照，同时减小正样本距离、增大负样本距离，并保留间隔。">
 <div className={`vfl-triplet-body phase-${phase} ${playing?'is-playing':'is-paused'}`}>
 <div className="vfl-triplet-left">
 <section className="vfl-triplet-samples" aria-label="一个三元组的三张照片">{photos.map((_,i)=><div key={i} className={`vfl-triplet-sample sample-${i}`}><div className="vfl-triplet-label"><Typography variant="body" tone="inherit">{labels[i]}</Typography></div><Portrait index={i}/></div>)}</section>
 <section className="vfl-triplet-formula-panel"><Typography variant="h3" tone="accent">三元组损失</Typography>
 <MathFormulaBlock ariaLabel="损失等于正样本距离减负样本距离加间隔，与零取最大值"><MathFormulaStatic latex={String.raw`L=\max`}/><MathFormulaStatic latex={String.raw`\lparen 0,`}/><span className="vfl-triplet-term positive"><MathFormulaStatic latex="d(a,p)"/></span><MathFormulaStatic latex="-"/><span className="vfl-triplet-term negative"><MathFormulaStatic latex="d(a,n)"/></span><MathFormulaStatic latex="+"/><span className="vfl-triplet-term margin"><MathFormulaStatic latex="m"/></span><MathFormulaStatic latex={String.raw`\rparen`}/></MathFormulaBlock>
 <div className="vfl-triplet-term-notes"><div><Typography variant="body" tone="inherit">正样本距离</Typography><Typography variant="bodySmall" tone="muted">让它减小</Typography></div><div><Typography variant="body" tone="inherit">负样本距离</Typography><Typography variant="bodySmall" tone="muted">让它增大</Typography></div><div><Typography variant="body" tone="inherit">间隔 m</Typography><Typography variant="bodySmall" tone="muted">留出比较的余量</Typography></div></div>
 <div className="vfl-triplet-numbers"><Typography variant="bodySmall" tone="muted">欧氏距离示意：正样本 {ap.toFixed(2)} · 负样本 {an.toFixed(2)} · m = 1.50</Typography><Typography variant="h3" tone={loss<.001?'accent':'warning'}>L = {loss.toFixed(2)}</Typography></div>
 </section>
 </div>
 <section className="vfl-triplet-space" aria-label="特征空间中的可控动画">
 <div className="vfl-triplet-space-title"><Typography variant="h3" tone="accent">在特征空间中的效果</Typography><Typography variant="bodySmall" tone="muted">特征距离的二维示意</Typography></div>
 <div className="vfl-triplet-plot"><svg viewBox="0 0 520 400" aria-label="绿色照片靠近锚点，红色照片远离锚点"><path d="M20 15V390H505" fill="none" stroke="#bed0e9" strokeWidth="2"/>
 {time>=10&&<g className="vfl-triplet-margin-ring"><circle cx={a.x} cy={a.y} r={ring} fill="#fff3cb" fillOpacity=".22" stroke="#dfad37" strokeWidth="2" strokeDasharray="7 7"/><path d={`M${a.x-ring} ${a.y-7}v14m0 -7h${margin*scale}m0 -7v14`} fill="none" stroke="#dfad37" strokeWidth="3"/><foreignObject x={a.x-ring} y={a.y-48} width="115" height="38"><Typography variant="bodySmall" tone="warning">间隔 m</Typography></foreignObject></g>}
 <circle cx={a.x} cy={a.y} r={ap*scale} fill="#eaf8f0" fillOpacity=".45" stroke="#85c7a4" strokeDasharray="5 7"/>
 <line x1={a.x} y1={a.y} x2={p.x} y2={p.y} stroke="#40a779" strokeWidth={phase===1?5:3}/><line x1={a.x} y1={a.y} x2={n.x} y2={n.y} stroke="#ed746e" strokeWidth={phase===1?5:3}/>
 {[a,p,n].map((pos,i)=><foreignObject key={i} x={pos.x-36} y={pos.y-36} width="72" height="72"><div className={`vfl-triplet-point point-${i}`}><Portrait index={i}/></div></foreignObject>)}
 </svg><div className="vfl-triplet-plot-legend"><Typography variant="bodySmall" tone="accent">蓝：锚点</Typography><Typography variant="bodySmall" className="positive" tone="inherit">绿：正样本</Typography><Typography variant="bodySmall" className="negative" tone="inherit">红：负样本</Typography></div></div>
 <div className="vfl-triplet-stage" aria-live="polite"><Typography variant="body" tone="accent">{phases[phase]}</Typography></div>
 <div className="vfl-triplet-controls"><Button variant="primary" onClick={()=>{if(time>=10)setTime(0);setPlaying(v=>!v);}}>{playing?'暂停':'开始训练'}</Button><Button onClick={next} disabled={time>=10}>下一步</Button><Button onClick={()=>{setPlaying(false);setTime(0);}}>重播</Button></div>
 <div className="vfl-triplet-condition"><MathFormulaBlock><MathFormulaStatic latex={String.raw`d(a,n)\ge d(a,p)+m`}/></MathFormulaBlock><Typography variant="bodySmall" tone="muted">满足后，这一组不再贡献损失。</Typography></div>
 </section></div></ContentBlock>;
}

