import {useEffect,useState,type CSSProperties} from 'react';
import {Button,ContentBlock,MathFormulaBlock,MathFormulaStatic,RangeControl,Typography,moduleAssetUrl} from '../../../shared/react';
import './TripletLossPage.css';

const photos=['luxun-1930.jpg','luxun-1933.jpg','guo-moruo.jpg'];
const labels=['锚点 Anchor','正样本 Positive','负样本 Negative'];
const names=['鲁迅 · 照片 1','鲁迅 · 照片 2','郭沫若'];
const explanations=['作为比较的参照','同一个人的另一张照片','不同人的照片'];
const phases=['尚未满足：同人距离应更小','拉近同人：减小绿色距离项','推远异人：增大红色距离项','留出间隔：异人至少比同人远 m','满足间隔：这一组三元组损失为 0'];
function Portrait({index}:{index:number}){return <div role="img" aria-label={names[index]} className={`vfl-triplet-portrait photo-${index}`} style={{'--vfl-triplet-photo':`url(${moduleAssetUrl('80396753-7fc8-4f55-9188-bddbdb828169',`open-identity/${photos[index]}`)})`} as CSSProperties}/>;}
const smooth=(x:number)=>{const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};
export function TripletLossPage(){
 const [time,setTime]=useState(0),[playing,setPlaying]=useState(false);
 useEffect(()=>{if(!playing)return;let id=0,last=0;const tick=(now:number)=>{if(last)setTime(t=>Math.min(10,t+(now-last)/1000));last=now;id=requestAnimationFrame(tick);};id=requestAnimationFrame(tick);return()=>cancelAnimationFrame(id);},[playing]);
 useEffect(()=>{if(time>=10)setPlaying(false);},[time]);
 const phase=time===0?0:time<3?1:time<6?2:time<9?3:4;
 const ap=2.6-1.6*smooth(time/3),an=2+.5*smooth((time-3)/3),margin=1.5;
 const loss=Math.max(0,ap-an+margin),scale=73,a={x:215,y:190};
 const p={x:a.x+ap*scale*.48,y:a.y+ap*scale*Math.sqrt(1-.48**2)},n={x:a.x+an*scale*.98,y:a.y-an*scale*Math.sqrt(1-.98**2)};
 const ring=(ap+margin)*scale;
 function next(){setPlaying(false);setTime(time<3?3:time<6?6:time<9?9:10);}
 return <ContentBlock className="vfl-triplet-page" headingLevel={1} title="三元组损失：让特征适合比较身份" subtitle="同一张参照照片：让同人的特征更近，让异人的特征更远，并留出间隔。">
 <div className={`vfl-triplet-body phase-${phase} ${playing?'is-playing':'is-paused'}`}>
 <div className="vfl-triplet-left">
 <section className="vfl-triplet-samples" aria-label="一个三元组的三张照片">{photos.map((_,i)=><div key={i} className={`vfl-triplet-sample sample-${i}`}><div className="vfl-triplet-label"><Typography variant="body" tone="inherit">{labels[i]}</Typography></div><Portrait index={i}/><Typography variant="h3" tone="accent">{names[i]}</Typography><Typography variant="bodySmall" tone="muted">{explanations[i]}</Typography></div>)}</section>
 <section className="vfl-triplet-formula-panel"><Typography variant="h3" tone="accent">三元组损失</Typography>
 <MathFormulaBlock ariaLabel="损失等于同人距离减异人距离加间隔，与零取最大值"><MathFormulaStatic latex={String.raw`L=\max`}/><MathFormulaStatic latex={String.raw`\lparen 0,`}/><span className="vfl-triplet-term positive"><MathFormulaStatic latex="d(a,p)"/></span><MathFormulaStatic latex="-"/><span className="vfl-triplet-term negative"><MathFormulaStatic latex="d(a,n)"/></span><MathFormulaStatic latex="+"/><span className="vfl-triplet-term margin"><MathFormulaStatic latex="m"/></span><MathFormulaStatic latex={String.raw`\rparen`}/></MathFormulaBlock>
 <div className="vfl-triplet-term-notes"><div><Typography variant="body" tone="inherit">同人距离</Typography><Typography variant="bodySmall" tone="muted">让它减小</Typography></div><div><Typography variant="body" tone="inherit">异人距离</Typography><Typography variant="bodySmall" tone="muted">让它增大</Typography></div><div><Typography variant="body" tone="inherit">间隔 m</Typography><Typography variant="bodySmall" tone="muted">留出比较的余量</Typography></div></div>
 <div className="vfl-triplet-numbers"><Typography variant="bodySmall" tone="muted">欧氏距离示意：同人 {ap.toFixed(2)} · 异人 {an.toFixed(2)} · m = 1.50</Typography><Typography variant="h3" tone={loss<.001?'accent':'warning'}>L = {loss.toFixed(2)}</Typography></div>
 </section>
 <Typography variant="bodySmall" tone="muted">三张照片经过同一个特征提取器；训练调整的是网络参数。</Typography>
 </div>
 <section className="vfl-triplet-space" aria-label="特征空间中的可控动画">
 <div className="vfl-triplet-space-title"><Typography variant="h3" tone="accent">在特征空间中的效果</Typography><Typography variant="bodySmall" tone="muted">特征距离的二维示意</Typography></div>
 <div className="vfl-triplet-plot"><svg viewBox="0 0 520 400" aria-label="绿色照片靠近锚点，红色照片远离锚点"><path d="M20 15V390H505" fill="none" stroke="#bed0e9" strokeWidth="2"/>
 {time>=6&&<g className="vfl-triplet-margin-ring"><circle cx={a.x} cy={a.y} r={ring} fill="#fff3cb" fillOpacity=".22" stroke="#dfad37" strokeWidth="2" strokeDasharray="7 7"/><path d={`M${a.x-ring} ${a.y-7}v14m0 -7h${margin*scale}m0 -7v14`} fill="none" stroke="#dfad37" strokeWidth="3"/><foreignObject x={a.x-ring} y={a.y-48} width="115" height="38"><Typography variant="bodySmall" tone="warning">间隔 m</Typography></foreignObject></g>}
 <circle cx={a.x} cy={a.y} r={ap*scale} fill="#eaf8f0" fillOpacity=".45" stroke="#85c7a4" strokeDasharray="5 7"/>
 <line x1={a.x} y1={a.y} x2={p.x} y2={p.y} stroke="#40a779" strokeWidth={phase===1?5:3}/><line x1={a.x} y1={a.y} x2={n.x} y2={n.y} stroke="#ed746e" strokeWidth={phase===2?5:3}/>
 {[a,p,n].map((pos,i)=><foreignObject key={i} x={pos.x-36} y={pos.y-36} width="72" height="72"><div className={`vfl-triplet-point point-${i}`}><Portrait index={i}/></div></foreignObject>)}
 </svg><div className="vfl-triplet-plot-legend"><Typography variant="bodySmall" tone="accent">蓝：锚点</Typography><Typography variant="bodySmall" className="positive" tone="inherit">绿：同人</Typography><Typography variant="bodySmall" className="negative" tone="inherit">红：异人</Typography></div></div>
 <div className="vfl-triplet-stage" aria-live="polite"><Typography variant="body" tone="accent">{phases[phase]}</Typography></div>
 <div className="vfl-triplet-controls"><Button variant="primary" onClick={()=>{if(time>=10)setTime(0);setPlaying(v=>!v);}}>{playing?'暂停':'播放动画'}</Button><Button onClick={next} disabled={time>=10}>下一步</Button><Button onClick={()=>{setPlaying(false);setTime(0);}}>重播</Button></div>
 <RangeControl label="演示进度" min={0} max={10} step={.05} value={time} formatValue={v=>`${Math.round(Number(v)*10)}%`} onChange={e=>{setPlaying(false);setTime(Number(e.currentTarget.value));}}/>
 <div className="vfl-triplet-condition"><MathFormulaBlock><MathFormulaStatic latex={String.raw`d(a,n)\ge d(a,p)+m`}/></MathFormulaBlock><Typography variant="bodySmall" tone="muted">满足后，这一组不再贡献损失。</Typography></div>
 </section></div></ContentBlock>;
}

