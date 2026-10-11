import {useEffect,useState,type CSSProperties} from 'react';
import {fictionalNames} from './randomNames';
import {ContentBlock,MathFormulaBlock,MathFormulaStatic,Typography,moduleAssetUrl} from '../../../shared/react';
import './OpenIdentityPage.css';

const asset=(file:string)=>moduleAssetUrl('80396753-7fc8-4f55-9188-bddbdb828169',`open-identity/${file}`);
function Portrait({file,label}:{file:string;label:string}){return <div role="img" aria-label={label} className={`vfl-open-portrait ${file==='luxun-1933.jpg'?'is-standing':file==='luxun-1930.jpg'?'is-luxun':''}`} style={{'--vfl-open-photo':`url(${asset(file)})`} as CSSProperties}/>;}
function Vector({index}:{index:number}){
 return <div className="vfl-open-vector"><MathFormulaBlock><MathFormulaStatic latex={`f_${index}`}/></MathFormulaBlock><div className="vfl-open-vector-cells" aria-label="特征向量的结构示意">{Array.from({length:8},(_,i)=>i===4?<Typography as="span" key={i} variant="bodySmall" tone="accent">…</Typography>:<span key={i} style={{opacity:.38+((i*3+index)%5)*.13}}/>)}</div></div>;
}

export function OpenIdentityPage(){
 const [names]=useState(()=>{
  const pool=[...fictionalNames];
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  return ['鲁迅','周树人',...pool.slice(0,13),'…'];
 });
 const [visibleCount,setVisibleCount]=useState(1);
 useEffect(()=>{
  let visible=1;
  const timer=setInterval(()=>{
   visible++;setVisibleCount(visible);
   if(visible>=names.length)clearInterval(timer);
  },420);
  return()=>clearInterval(timer);
 },[names]);
 return <ContentBlock className="vfl-open-page" headingLevel={1} title="开放集身份识别与人脸验证" subtitle="开放集中的身份可能超出预设类别；人脸验证通过特征距离判断身份是否一致。">
 <div className="vfl-open-body">
  <div className="vfl-open-main">
   <section className="vfl-open-fixed" aria-label="姓名标签从左上到右下逐个出现，最后为省略号；包含鲁迅及其本名周树人，其余姓名为虚构">
    <div className="vfl-open-panel-title"><Typography variant="h3" tone="accent">候选身份不限于预设类别</Typography></div>
    <div className="vfl-open-animation-photo"><Portrait file="luxun-1930.jpg" label="鲁迅的历史照片"/></div>
    <div className="vfl-open-name-cloud" aria-hidden="true">{names.map((name,index)=><div className="vfl-open-name-slot" key={name}><div className={`vfl-open-name${index<visibleCount?' is-visible':''}${name==='…'?' is-ellipsis':''}`}><Typography as="span" variant="body" tone="inherit">{name}</Typography></div></div>)}</div>
   </section>

   <div className="vfl-open-transition"><Typography variant="h3" tone="warning">开放集<br/>身份识别</Typography><svg viewBox="0 0 210 90" aria-hidden="true"><defs><linearGradient id="vfl-open-arrow"><stop stopColor="#e7f0fd"/><stop offset="1" stopColor="#4e8cda"/></linearGradient></defs><path d="M8 26H133V5L199 45L133 85V64H8Z" fill="url(#vfl-open-arrow)"/></svg><Typography variant="bodySmall" tone="accent">从类别判别<br/>转向特征比较</Typography></div>

   <section className="vfl-open-verification" aria-label="开放身份任务：人脸验证">
    <div className="vfl-open-panel-title"><Typography variant="h3" tone="accent">基于特征距离的人脸验证</Typography></div>
    <div className="vfl-open-pair"><div><Portrait file="luxun-1930.jpg" label="鲁迅第一张照片的正方形人脸特写"/><Typography variant="bodySmall" tone="accent">鲁迅 · 照片 1</Typography></div><div><Portrait file="luxun-1933.jpg" label="鲁迅第二张照片的正方形人脸特写"/><Typography variant="bodySmall" tone="accent">鲁迅 · 照片 2</Typography></div></div>
    <svg className="vfl-open-photo-links" viewBox="0 0 600 24" preserveAspectRatio="none" aria-hidden="true"><path d="M150 0V20M450 0V20" stroke="#7898c4" strokeWidth="2"/><path d="M144 15L150 22L156 15M444 15L450 22L456 15" fill="none" stroke="#7898c4" strokeWidth="2"/></svg>
    <div className="vfl-open-backbone"><Typography variant="h3" tone="accent">共享特征提取器</Typography><Typography variant="bodySmall" tone="muted">两幅图像采用同一网络提取特征</Typography></div>
    <div className="vfl-open-features"><div><span className="vfl-open-stem"/><Vector index={1}/></div><div><span className="vfl-open-stem"/><Vector index={2}/></div></div>
    <svg className="vfl-open-merge" viewBox="0 0 600 26" preserveAspectRatio="none" aria-hidden="true"><path d="M150 0V10Q150 15 155 15H445Q450 15 450 10V0M300 15V25" stroke="#7898c4" strokeWidth="2" fill="none"/></svg>
    <div className="vfl-open-distance">
     <MathFormulaBlock><MathFormulaStatic latex={String.raw`D=d(f_1,f_2)`}/></MathFormulaBlock>
     <div className="vfl-open-decisions"><MathFormulaBlock><MathFormulaStatic latex={String.raw`D<\tau\Rightarrow\text{判定为同一身份}`}/></MathFormulaBlock><MathFormulaBlock><MathFormulaStatic latex={String.raw`D\ge\tau\Rightarrow\text{判定为不同身份}`}/></MathFormulaBlock></div>
     <Typography as="div" variant="bodySmall" tone="accent">τ 为距离判定阈值，通过验证集校准。</Typography>
    </div>
   </section>
  </div>
  <div className="vfl-open-takeaway"><Typography variant="h3" tone="accent">候选身份不限于预设类别；身份验证依据特征距离进行判定。</Typography></div>
 </div></ContentBlock>;
}
