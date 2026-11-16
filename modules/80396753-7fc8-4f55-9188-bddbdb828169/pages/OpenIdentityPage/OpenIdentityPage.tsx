import {useEffect,useState,type CSSProperties} from 'react';
import {celebrityNames} from './celebrityNames';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import {identityExamples,identityPhotoUrl} from '../../components/identityExamples';
import './OpenIdentityPage.css';

function Portrait({index}:{index:number}){const photo=identityExamples[index];return <div shuku-edit-id="e-a7e9ba9c-f6e5-4a55-8d30-73c6fc83b5f5" role="img" aria-label={photo.name} className="vfl-open-portrait" style={{'--vfl-open-photo':`url(${identityPhotoUrl(photo.file)})`} as CSSProperties}/>;}
function Vector({index}:{index:number}){
 return <div shuku-edit-id="e-59f7a6e5-9c63-410d-91c3-9702892539c4" className="vfl-open-vector"><MathFormulaBlock><MathFormulaStatic latex={`f_${index}`}/></MathFormulaBlock><div shuku-edit-id="e-2c1b4939-1a63-42a5-88ce-6f0d3b344ab9" className="vfl-open-vector-cells" aria-label="特征向量的结构示意">{Array.from({length:8},(_,i)=>i===4?<Typography shuku-edit-id="e-4eb9f332-ae1b-402a-945c-e78b4d6c5e98" as="span" key={i} variant="bodySmall" tone="accent">…</Typography>:<span shuku-edit-id="e-d77874c8-feca-4564-bc95-60154fd11b5f" key={i} style={{opacity:.38+((i*3+index)%5)*.13}}/>)}</div></div>;
}

export function OpenIdentityPage(){
 const [names]=useState(()=>{
  const pool=[...celebrityNames];
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  return ['斯坦森',...pool,'…'];
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
 return <ContentBlock shuku-edit-id="e-99a0d9ec-20bb-49f2-b771-759356f51421" className="vfl-open-page" headingLevel={1} title="开放集身份识别与人脸验证" subtitle="开放集中的身份可能超出预设类别；人脸验证通过特征距离判断身份是否一致。">
 <div shuku-edit-id="e-21318af8-e7f5-469c-ad35-0b0009d80d74" className="vfl-open-body">
  <div shuku-edit-id="e-5d8ba31c-9d51-4fb9-a708-2a8b3bd52425" className="vfl-open-main">
   <section shuku-edit-id="e-61254e8c-9a84-4a51-9e1f-61a1067de390" className="vfl-open-fixed" aria-label="欧美明星姓名逐个出现，包含杰森·斯坦森（简称斯坦森），最后以省略号表示更多候选身份">
    <div shuku-edit-id="e-fa4bad58-6543-4f1b-b788-9b2d79f05102" className="vfl-open-panel-title"><Typography shuku-edit-id="e-2c86ea3e-d2ba-414b-8d71-95954efb567c" variant="h3" tone="accent">候选身份不限于预设类别</Typography></div>
    <div shuku-edit-id="e-eddfcfd0-b790-4714-9fc2-4a0f28e678de" className="vfl-open-animation-photo"><Portrait index={0}/></div>
    <div shuku-edit-id="e-6d5b5e35-8e0f-43c1-b631-3312b898c686" className="vfl-open-name-cloud" aria-hidden="true">{names.map((name,index)=><div shuku-edit-id="e-349de071-dda7-4b81-9bbf-c1f55e295c0a" className="vfl-open-name-slot" key={name}><div shuku-edit-id="e-baac96d2-d1b8-48aa-9c62-530950ebddf6" className={`vfl-open-name${index<visibleCount?' is-visible':''}${name==='…'?' is-ellipsis':''}`}><Typography shuku-edit-id="e-5cc84793-605b-4704-875d-c47b286f581e" as="span" variant="bodySmall" tone="inherit">{name}</Typography></div></div>)}</div>
   </section>

   <div shuku-edit-id="e-c79a7990-8da7-45fb-b76b-2adbfd85cd2a" className="vfl-open-transition"><Typography shuku-edit-id="e-6ddc1d98-fca6-438d-b1ed-68234437fd48" variant="h3" tone="warning">开放集<br shuku-edit-id="e-8bcff775-5e4b-4596-bf38-62aeb662eafc"/>身份识别</Typography><svg shuku-edit-id="e-9c404bee-d4d2-4fed-b948-1045d8e2a118" viewBox="0 0 210 90" aria-hidden="true"><defs shuku-edit-id="e-306ba158-8fd0-4c62-80d2-4767c0c2ace0"><linearGradient shuku-edit-id="e-e7e9e12c-fc86-40dc-95a2-e0680b492603" id="vfl-open-arrow"><stop shuku-edit-id="e-720aed49-657a-4074-bb9f-60a764b829ec" stopColor="#e7f0fd"/><stop shuku-edit-id="e-07d4a3a7-11cd-470d-9ffb-a629decc9ca2" offset="1" stopColor="#4e8cda"/></linearGradient></defs><path shuku-edit-id="e-05c85b92-d9c4-4979-b7b9-f81b1d26c471" d="M8 26H133V5L199 45L133 85V64H8Z" fill="url(#vfl-open-arrow)"/></svg><Typography shuku-edit-id="e-d340697e-4cd0-492b-bf88-49212c4f08a7" variant="bodySmall" tone="accent">从类别判别<br shuku-edit-id="e-b34bed8d-5569-40d3-8c93-c12dc02637c9"/>转向特征比较</Typography></div>

   <section shuku-edit-id="e-0d27db7c-c85b-4df7-aeae-aa03fa09f1dd" className="vfl-open-verification" aria-label="开放身份任务：人脸验证">
    <div shuku-edit-id="e-f201b1a1-55fa-42a6-8935-c92e3583c4bb" className="vfl-open-panel-title"><Typography shuku-edit-id="e-cc388e43-e0ba-4238-b308-9e07635ef51a" variant="h3" tone="accent">基于特征距离的人脸验证</Typography></div>
    <div shuku-edit-id="e-fb5103fd-3a58-4ee8-a82b-b7e5dcaca7dc" className="vfl-open-pair">{identityExamples.slice(0,2).map((photo,index)=><div shuku-edit-id="e-37c359dc-1a9f-4420-a607-49e05f0425b7" key={photo.file}><Portrait index={index}/><Typography shuku-edit-id="e-8d42c250-e1e0-4aad-bc40-37f37e305f68" variant="bodySmall" tone="accent">{photo.shortName}</Typography></div>)}</div>
    <svg shuku-edit-id="e-09175412-48dc-4fec-bb39-d95e64b598c1" className="vfl-open-photo-links" viewBox="0 0 600 24" preserveAspectRatio="none" aria-hidden="true"><path shuku-edit-id="e-dcdd2a2e-d0f2-41fa-9cb2-fa276f28afb3" d="M150 0V20M450 0V20" stroke="#7898c4" strokeWidth="2"/><path shuku-edit-id="e-0a15ba13-f695-4e8b-a880-ca639900956e" d="M144 15L150 22L156 15M444 15L450 22L456 15" fill="none" stroke="#7898c4" strokeWidth="2"/></svg>
    <div shuku-edit-id="e-0a95fac2-1fda-49a6-8f0e-4cb4c0ef8527" className="vfl-open-backbone"><Typography shuku-edit-id="e-1af553bf-193a-40e5-8520-d209fc8003db" variant="h3" tone="accent">共享特征提取器</Typography><Typography shuku-edit-id="e-527950c4-9fbd-4c0b-968a-f5bfd17cabcc" variant="bodySmall" tone="muted">两幅图像采用同一网络提取特征</Typography></div>
    <div shuku-edit-id="e-9a2d35a5-9885-47dd-a07f-dff70537d5e3" className="vfl-open-features"><div shuku-edit-id="e-f9c989d4-6b54-4d3e-9e51-9c06201eb526"><span shuku-edit-id="e-a2c07fc3-1554-437d-8c2e-761375058ce1" className="vfl-open-stem"/><Vector index={1}/></div><div shuku-edit-id="e-0305102f-4b64-47f1-80ca-6da614b31fb9"><span shuku-edit-id="e-548236dd-cdc0-48aa-bd2a-238920332013" className="vfl-open-stem"/><Vector index={2}/></div></div>
    <svg shuku-edit-id="e-f0108665-3b72-47fe-adaf-fa8bd8098188" className="vfl-open-merge" viewBox="0 0 600 26" preserveAspectRatio="none" aria-hidden="true"><path shuku-edit-id="e-c34c1af2-7bf8-47c0-b9f8-c8d4d941ec50" d="M150 0V10Q150 15 155 15H445Q450 15 450 10V0M300 15V25" stroke="#7898c4" strokeWidth="2" fill="none"/></svg>
    <div shuku-edit-id="e-392a4674-ee31-49b3-93a7-997a072eed50" className="vfl-open-distance">
     <MathFormulaBlock><MathFormulaStatic latex={String.raw`D=d(f_1,f_2)`}/></MathFormulaBlock>
     <div shuku-edit-id="e-074e4487-d4d5-498c-a4b0-924f78145bb2" className="vfl-open-decisions"><MathFormulaBlock><MathFormulaStatic latex={String.raw`D<\tau\Rightarrow\text{判定为同一身份}`}/></MathFormulaBlock><MathFormulaBlock><MathFormulaStatic latex={String.raw`D\ge\tau\Rightarrow\text{判定为不同身份}`}/></MathFormulaBlock></div>
     <Typography shuku-edit-id="e-c682e903-1975-46f2-8f2d-6edc3a33933b" as="div" variant="bodySmall" tone="accent">τ 为距离判定阈值，通过验证集校准。</Typography>
    </div>
   </section>
  </div>
  <div shuku-edit-id="e-1a92383f-e1f5-464c-a12e-0c261e799d0b" className="vfl-open-takeaway"><Typography shuku-edit-id="e-783645e0-406d-4e55-8627-b6560946f857" variant="h3" tone="accent">候选身份不限于预设类别；身份验证依据特征距离进行判定。</Typography></div>
 </div></ContentBlock>;
}
