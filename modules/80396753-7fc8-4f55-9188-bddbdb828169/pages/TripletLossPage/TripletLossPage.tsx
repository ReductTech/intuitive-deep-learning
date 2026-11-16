import {useEffect,useState} from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import {identityExamples,identityPhotoUrl} from '../../components/identityExamples';
import './TripletLossPage.css';

const labels=['锚点 a','正样本 p','负样本 n'];
const phases=['训练前 · 距离关系尚未满足要求','同时拉近正样本、推远负样本','已满足距离间隔，损失为 0'];
function Portrait({index}:{index:number}){const photo=identityExamples[index];return <img shuku-edit-id="e-f29917c3-9f52-4d25-b1f5-71ed1d47ded8" alt={photo.name} className={`vfl-triplet-portrait photo-${index}`} src={identityPhotoUrl(photo.file)}/>;}
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
 return <ContentBlock shuku-edit-id="e-03a2cb1d-64f4-4811-b040-88bf3574b193" className="vfl-triplet-page" headingLevel={1} title="三元组损失：让特征适合比较身份" subtitle="以锚点为参照，同时减小正样本距离、增大负样本距离，并保留间隔。">
 <div shuku-edit-id="e-f0225e46-7e79-43d9-9a42-ebadc05fa1f4" className={`vfl-triplet-body phase-${phase} ${playing?'is-playing':'is-paused'}`}>
 <section shuku-edit-id="e-819a2068-dbc5-4fde-9e33-a788c948536f" className="vfl-triplet-samples" aria-label="锚点和正样本为杰森·斯坦森，负样本为郭达">
 <Typography shuku-edit-id="e-1fccac12-257e-4d29-b17b-7c16465ef0e0" variant="h3" tone="accent">一组训练样本</Typography>
 <div shuku-edit-id="e-7dab5db1-c74d-4d0d-b1d1-3a38c84d6f2e" className="vfl-triplet-sample-row">{identityExamples.map((photo,i)=><div shuku-edit-id="e-b39687be-6c58-4469-a6c6-e46fd5663a01" key={photo.file} className={`vfl-triplet-sample sample-${i}`}><div shuku-edit-id="e-a02db7f2-8cf5-481f-b84b-aff2c3abacd1" className="vfl-triplet-label"><span shuku-edit-id="e-2cca30a0-62f0-48b2-8b91-27c1417287ae"/><Typography shuku-edit-id="e-f7098982-c631-42bc-a67d-36ab40193663" variant="bodySmall" tone="inherit">{labels[i]}</Typography></div><Portrait index={i}/><Typography shuku-edit-id="e-8d5ede38-cbee-4e2a-a1e6-67594fa58ea9" variant="bodySmall" tone="accent">{i===2?'郭达':'斯坦森'}</Typography></div>)}</div>
 <div shuku-edit-id="e-d06b41d3-1ecc-4d6d-b5c3-f65e66774bb0" className="vfl-triplet-sample-cues"><div shuku-edit-id="e-aeaef19e-35cd-4b50-ba16-75657b5fe984" className="positive"><span shuku-edit-id="e-fbd9b1b0-453b-4699-a705-4ceca3d86fb4"/><Typography shuku-edit-id="e-9b3c7f39-1cc6-4567-a81f-a62459702054" variant="body" tone="inherit">同一人 · 拉近</Typography></div><div shuku-edit-id="e-8f811ab2-93ae-407e-854f-2eee5126834b" className="negative"><span shuku-edit-id="e-b2e34d61-be78-405a-bb5d-de8ebba9e17e"/><Typography shuku-edit-id="e-9ee024cc-c379-4f98-aa9e-a99a75f188cb" variant="body" tone="inherit">不同人 · 推远</Typography></div></div>
 </section>
 <section shuku-edit-id="e-7d30aa3f-fec4-4d92-aee1-6eb15b73b3f6" className="vfl-triplet-space" aria-label="特征空间中的可控动画">
 <div shuku-edit-id="e-69e34d32-42b7-496d-be2b-5facede226db" className="vfl-triplet-space-title"><Typography shuku-edit-id="e-23b6cb39-827a-4429-824f-1c4ddf5cd757" variant="h3" tone="accent">特征空间</Typography><Typography shuku-edit-id="e-3c5c05f6-b1e9-4c3b-a902-dafd5d67bf3a" variant="bodySmall" tone="muted">距离变化示意</Typography></div>
 <div shuku-edit-id="e-3163cb8b-0084-4a10-b1ee-dbf77b7ba000" className="vfl-triplet-plot" data-ap={ap} data-an={an} data-loss={loss}><svg shuku-edit-id="e-800b8b57-e795-494a-b3b9-bf4a9aa4fb09" viewBox="0 0 860 360" aria-label="绿色照片靠近锚点，红色照片远离锚点">
 <defs shuku-edit-id="e-4e65e924-813d-46d8-a68b-a692d901314b"><pattern shuku-edit-id="e-7c2b9eb3-a1b2-48f7-a53d-9fd9bb95d0f1" id="vfl-triplet-dots" width="64" height="64" patternUnits="userSpaceOnUse"><circle shuku-edit-id="e-8b86387e-70a4-462e-9922-35292d4ebf2f" cx="32" cy="32" r="1.5" fill="#c4d8f2"/></pattern><marker shuku-edit-id="e-029f659f-2b53-4539-af70-8ad8707f44f2" id="vfl-triplet-green-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path shuku-edit-id="e-b5ccaea7-c162-4960-a161-ae9ae8e3bae8" d="M0 0L10 5L0 10Z" fill="#269465"/></marker><marker shuku-edit-id="e-36858761-e289-4568-b84e-703c3e2b4ff1" id="vfl-triplet-red-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path shuku-edit-id="e-1be33898-2657-474b-ae29-4f8394815281" d="M0 0L10 5L0 10Z" fill="#ed746e"/></marker></defs>
 <rect shuku-edit-id="e-3a79979e-8335-48fa-8d40-a21da58e2519" x="24" y="12" width="812" height="328" fill="url(#vfl-triplet-dots)"/>
 <path shuku-edit-id="e-16c4dee1-513d-4f6f-a2ce-3e9a3c6c8cb0" d="M20 15V340H840m-825 -318l5 -7l5 7m808 313l7 5l-7 5" fill="none" stroke="#adbed6" strokeWidth="2"/>
 <line shuku-edit-id="e-b196c03f-2cfc-4673-8e3d-905c6bf3aac6" data-relationship="positive" x1={p.x-pd.x*44} y1={p.y-pd.y*44} x2={a.x+pd.x*44} y2={a.y+pd.y*44} stroke="#269465" strokeWidth="3" markerEnd="url(#vfl-triplet-green-arrow)"/><line shuku-edit-id="e-d451ae8c-979c-4354-a24b-06fb2b863b50" data-relationship="negative" x1={a.x+nd.x*44} y1={a.y+nd.y*44} x2={n.x-nd.x*44} y2={n.y-nd.y*44} stroke="#ed746e" strokeWidth="3" markerEnd="url(#vfl-triplet-red-arrow)"/>
 <foreignObject shuku-edit-id="e-32f24024-3c74-450b-b744-6512ba7cce32" x="150" y="240" width="235" height="60"><div shuku-edit-id="e-0a71e3bd-a1cc-487c-a81d-0aba4a2b5a7e" className="vfl-triplet-distance-label positive"><MathFormulaBlock><MathFormulaStatic latex={`{\\color{#26764f}d(a,p)=${ap.toFixed(2)}}`}/></MathFormulaBlock></div></foreignObject>
 <foreignObject shuku-edit-id="e-5ce9ab6d-6b11-4303-ae9c-8b603f2bb4ce" x="200" y="15" width="235" height="60"><div shuku-edit-id="e-18652650-036e-4a28-be4c-d5afcd689fbb" className="vfl-triplet-distance-label negative"><MathFormulaBlock><MathFormulaStatic latex={`{\\color{#b64742}d(a,n)=${an.toFixed(2)}}`}/></MathFormulaBlock></div></foreignObject>
 <foreignObject shuku-edit-id="e-6d5a0b4f-3dfb-408c-9dde-b7c2e65a2d7d" x={a.x-142} y={a.y-22} width="100" height="60"><Typography shuku-edit-id="e-24de87b6-8b10-4039-8f7b-0e2c199ee86f" className="vfl-triplet-node-label anchor" variant="bodySmall" tone="inherit">a 锚点</Typography></foreignObject>
 <foreignObject shuku-edit-id="e-fabbc027-08bb-40da-99d8-13ace88a3ff9" x={p.x+44} y={p.y-8} width="150" height="60"><Typography shuku-edit-id="e-82375da7-843a-4fc1-a96a-6ed4af309453" className="vfl-triplet-node-label positive" variant="bodySmall" tone="inherit">p 正样本</Typography></foreignObject>
 <foreignObject shuku-edit-id="e-7e225598-a869-4742-9920-8d9ac13aa835" x={n.x+15} y={n.y-78} width="150" height="60"><Typography shuku-edit-id="e-0c42f849-340c-417a-af9c-822c79c17438" className="vfl-triplet-node-label negative" variant="bodySmall" tone="inherit">n 负样本</Typography></foreignObject>
 {[a,p,n].map((pos,i)=><foreignObject shuku-edit-id="e-099f186e-8036-42bb-a7f6-174cb60c41d1" key={i} x={pos.x-36} y={pos.y-36} width="72" height="72"><div shuku-edit-id="e-e8b86b93-e378-44e1-8e0e-2a5fcb730ab0" className={`vfl-triplet-point point-${i}`}><Portrait index={i}/></div></foreignObject>)}
 </svg></div>
 <div shuku-edit-id="e-e455ad90-767c-4e4f-a48b-29cf1b50a8a6" className="vfl-triplet-playbar"><div shuku-edit-id="e-420df8db-0611-4b68-94b4-49d5a836668f" className="vfl-triplet-stage" aria-live="polite"><Typography shuku-edit-id="e-a9227044-aee5-457b-9e19-7e555d33df90" variant="bodySmall" tone="accent">{phases[phase]}</Typography></div>
 <div shuku-edit-id="e-97cf7675-6891-4573-9277-01e6a01c3871" className="vfl-triplet-controls"><Button variant="primary" onClick={()=>{if(time>=10)setTime(0);setPlaying(v=>!v);}}>{playing?'暂停':'播放缓存'}</Button><Button onClick={next} disabled={time>=10}>下一步</Button><Button onClick={()=>{setPlaying(false);setTime(0);}}>重播</Button></div>
 </div></section>
 <section shuku-edit-id="e-43ed84ce-9d6e-4df4-9776-f67a94869b4e" className="vfl-triplet-calculation" aria-label="实时三元组损失">
 <div shuku-edit-id="e-c038f2da-dfa9-46b5-8578-8e49c8dca233" className="vfl-triplet-formula-panel"><Typography shuku-edit-id="e-d39b968d-4799-45e3-8161-5e1f98138e6b" variant="h3" tone="accent">三元组损失</Typography><div shuku-edit-id="e-fe76215c-6946-4128-8e8b-81a5b7d8a430" className="vfl-triplet-formula-content">
 <MathFormulaBlock ariaLabel="损失等于正样本距离减负样本距离加间隔，与零取最大值"><MathFormulaStatic latex={String.raw`L=\max\bigl(0,\,{\color{#26764f}d(a,p)}-{\color{#b64742}d(a,n)}+{\color{#987019}m}\bigr)`}/></MathFormulaBlock>
 <div shuku-edit-id="e-b076ca8c-2533-4d83-95e3-176990ff7703" className="vfl-triplet-numbers"><Typography shuku-edit-id="e-983a8ed6-ef66-48de-9f64-4266918cb64d" variant="bodySmall" tone="muted">正样本 {ap.toFixed(2)}</Typography><Typography shuku-edit-id="e-8215470a-4220-4d5e-a9f8-b1665a34a52b" variant="bodySmall" tone="muted">负样本 {an.toFixed(2)}</Typography><Typography shuku-edit-id="e-fdac92f1-e515-4025-94c7-46ffed48def5" variant="bodySmall" tone="muted">间隔 m = 1.50</Typography></div>
 </div></div><div shuku-edit-id="e-9a94e6e8-bbff-45ec-9b27-71706b7656fd" className="vfl-triplet-result"><div shuku-edit-id="e-f7d0d9d4-1797-452b-ba32-7ec8877d1e7f" className="vfl-triplet-loss"><Typography shuku-edit-id="e-333861ee-85f9-42e6-bd6b-0119ff0ddd08" variant="h3" tone="accent">当前损失</Typography><Typography shuku-edit-id="e-3ab34130-bb17-4708-b2bc-da91922beaea" variant="h1" tone={loss<.001?'accent':'warning'}>{loss.toFixed(2)}</Typography></div><div shuku-edit-id="e-5ccd9266-5cbc-4932-bb0e-c88be2799a74" className="vfl-triplet-condition"><MathFormulaBlock><MathFormulaStatic latex={String.raw`d(a,n)\ge d(a,p)+m`}/></MathFormulaBlock><Typography shuku-edit-id="e-00c33309-f7ae-4eaf-991e-b3ce8481e65b" variant="bodySmall" tone="muted">满足间隔后，损失为 0</Typography></div></div>
 </section></div></ContentBlock>;
}
