import { ArrowRight, Bookshelf, BuildingFour, ChartLine, DegreeHat, FileEditing } from '@icon-park/react';
import { useState, type ReactNode } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import { RefinedStage } from '../components/RefinedStage';
import './ArticleImpactPage.css';
function Feature({children,label,detail}:{children:ReactNode;label:string;detail?:string}){
 return <div shuku-edit-id="e-288bcd05-72bf-490f-951d-bc8d7f3f4834" className="naipr-feature"><div shuku-edit-id="e-6ba80c04-3748-43b1-a7e5-35cac8d0cef2" className="naipr-feature-icons" aria-hidden="true">{children}</div><div shuku-edit-id="e-0374dba5-b31a-48d3-b1c2-f779e9a1480c"><Typography shuku-edit-id="e-ca9a0121-4d86-4304-a8de-d42af62d82d4" variant="body">{label}</Typography>{detail&&<Typography shuku-edit-id="e-647c2d6c-aaf8-4675-96c3-c784e35153c1" variant="bodySmall" tone="muted">{detail}</Typography>}</div></div>;
}
function Column({title,children,className=''}:{title:string;children:ReactNode;className?:string}){
 return <section shuku-edit-id="e-37add02b-ece9-40ef-a247-6e237c2290b8" className={`naipr-column ${className}`} aria-label={title}><div shuku-edit-id="e-46e2f0db-c0b5-4917-8a8b-3536fea17d3e" className="naipr-column-heading"><Typography shuku-edit-id="e-ab11c9d9-c3ee-435b-add6-9081727e89a1" variant="h3" tone="accent">{title}</Typography></div><div shuku-edit-id="e-33d0e407-c924-464f-a130-431a971818b5" className="naipr-column-content">{children}</div></section>;
}
function MethodIcon({kind}:{kind:'tree'|'svm'|'network'}){
 return <svg shuku-edit-id="e-7946980b-c024-4b59-b937-ce9ecfb83858" viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{kind==='tree'?<><path shuku-edit-id="e-37804589-51e7-42ba-adfd-fbcddb2bd106" d="M40 15V29M40 29L15 49V64M40 29V64M40 29L65 49V64"/>{[[40,12],[15,65],[40,65],[65,65]].map(([x,y])=><circle shuku-edit-id="e-f05c56f8-413a-434b-bba2-de9bac9439a6" key={x+','+y} cx={x} cy={y} r="7" fill="var(--ui-bg-card)"/>)}</>:kind==='svm'?<><path shuku-edit-id="e-2030795d-0b35-4429-ae8c-5866ea116417" d="M13 70L67 10"/>{[[17,18],[17,36],[32,21]].map(([x,y])=><circle shuku-edit-id="e-3e31ba1f-14b3-4bee-9b24-a54f1ba6f9a1" key={x+','+y} cx={x} cy={y} r="4" fill="currentColor"/>)}{[[49,57],[64,43],[65,66]].map(([x,y])=><circle shuku-edit-id="e-a0fd3dfc-fa25-4fc0-bda3-3a0a078b19a1" key={x+','+y} cx={x} cy={y} r="4"/>)}</>:<>{[17,40,63].flatMap(y=>[26,54].map(z=><path shuku-edit-id="e-6239b576-bde5-4618-a869-06e12e64755e" key={y+','+z} d={`M12 ${y}L40 ${z}L68 ${y}`}/>))}{[[12,17],[12,40],[12,63],[40,26],[40,54],[68,17],[68,40],[68,63]].map(([x,y])=><circle shuku-edit-id="e-f613b865-9c9a-498e-9c43-54452420bbdc" key={x+','+y} cx={x} cy={y} r="5" fill="var(--ui-bg-card)"/>)}</>}</svg>;
}
function FlowArrow(){return <div shuku-edit-id="e-a5e84603-f033-4eb8-ba1d-af564e063e1a" className="naipr-flow-arrow" aria-hidden="true"><ArrowRight theme="outline" size={48} fill="currentColor" strokeWidth={3}/></div>}
export function Page(){const [target,setTarget]=useState<'count'|'class'>('count');return <RefinedStage title="什么是文章影响力预测" subtitle="根据已知信息，预测论文未来可能获得的学术影响力" className="naipr-page"><div shuku-edit-id="e-a9942924-8dd4-438f-8e8a-0a792dab2771" className="naipr-diagram" aria-label="输入特征经过预测方法，得到影响力预测结果">
 <Column title="输入特征" className="naipr-inputs">
  <Feature label="引用与发表渠道特征"><ChartLine size={52} strokeWidth={2}/><Bookshelf size={48} strokeWidth={2}/></Feature>
  <Feature label="作者与所属机构声誉"><DegreeHat size={52} strokeWidth={2}/><BuildingFour size={48} strokeWidth={2}/></Feature>
  <Feature label="文章内容"><FileEditing size={64} strokeWidth={2}/></Feature>
 </Column><FlowArrow/>
 <Column title="预测方法" className="naipr-methods">
  <Feature label="决策树"><MethodIcon kind="tree"/></Feature>
  <Feature label="支持向量机" detail="SVM"><MethodIcon kind="svm"/></Feature>
  <Feature label="神经网络"><MethodIcon kind="network"/></Feature>
 </Column><FlowArrow/>
 <Column title="预测目标" className="naipr-targets"><div shuku-edit-id="e-2b6fc519-57b4-4e7d-9d35-d6a1341b36a3" className="naipr-target-tabs" aria-label="切换预测任务"><Button active={target==='count'} aria-pressed={target==='count'} onClick={()=>setTarget('count')}>引用次数</Button><Button active={target==='class'} aria-pressed={target==='class'} onClick={()=>setTarget('class')}>高被引分类</Button></div><div shuku-edit-id="e-2ebb7195-e709-41da-9fc2-0b4ec296b3ca" className="naipr-target" aria-live="polite"><Typography shuku-edit-id="e-3c57deb7-ff17-4ee7-a51d-f76a7bfa6a70" as="p" variant="display" tone="accent">{target==='count'?'97':'1'}</Typography><Typography shuku-edit-id="e-2a2cddde-e5a7-4bce-82c6-fdff52092a10" variant="body">{target==='count'?'回归：预测引用次数':'分类：预测为高被引'}</Typography><Typography shuku-edit-id="e-119c50b2-c333-4dcf-ad6f-02d5314476de" variant="bodySmall" tone="muted">{target==='count'?'输出一个数值':'输出类别：0 = 否，1 = 是'}</Typography></div><Typography shuku-edit-id="e-e1e5e2dd-d708-4576-9baf-ff9c3a312bbd" variant="bodySmall" tone="muted" align="center">示例输出，用于理解任务形式，非真实模型计算。</Typography></Column>
 </div></RefinedStage>}
