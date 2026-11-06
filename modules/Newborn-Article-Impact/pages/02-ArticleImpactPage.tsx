import { ArrowRight, Bookshelf, BuildingFour, ChartLine, DegreeHat, FileEditing } from '@icon-park/react';
import { useState, type ReactNode } from 'react';
import { Button, Typography } from '../../shared/react';
import { RefinedStage } from '../components/RefinedStage';
import './ArticleImpactPage.css';
function Feature({children,label,detail}:{children:ReactNode;label:string;detail?:string}){
 return <div className="naipr-feature"><div className="naipr-feature-icons" aria-hidden="true">{children}</div><div><Typography variant="body">{label}</Typography>{detail&&<Typography variant="bodySmall" tone="muted">{detail}</Typography>}</div></div>;
}
function Column({title,children,className=''}:{title:string;children:ReactNode;className?:string}){
 return <section className={`naipr-column ${className}`} aria-label={title}><div className="naipr-column-heading"><Typography variant="h3" tone="accent">{title}</Typography></div><div className="naipr-column-content">{children}</div></section>;
}
function MethodIcon({kind}:{kind:'tree'|'svm'|'network'}){
 return <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{kind==='tree'?<><path d="M40 15V29M40 29L15 49V64M40 29V64M40 29L65 49V64"/>{[[40,12],[15,65],[40,65],[65,65]].map(([x,y])=><circle key={x+','+y} cx={x} cy={y} r="7" fill="var(--ui-bg-card)"/>)}</>:kind==='svm'?<><path d="M13 70L67 10"/>{[[17,18],[17,36],[32,21]].map(([x,y])=><circle key={x+','+y} cx={x} cy={y} r="4" fill="currentColor"/>)}{[[49,57],[64,43],[65,66]].map(([x,y])=><circle key={x+','+y} cx={x} cy={y} r="4"/>)}</>:<>{[17,40,63].flatMap(y=>[26,54].map(z=><path key={y+','+z} d={`M12 ${y}L40 ${z}L68 ${y}`}/>))}{[[12,17],[12,40],[12,63],[40,26],[40,54],[68,17],[68,40],[68,63]].map(([x,y])=><circle key={x+','+y} cx={x} cy={y} r="5" fill="var(--ui-bg-card)"/>)}</>}</svg>;
}
function FlowArrow(){return <div className="naipr-flow-arrow" aria-hidden="true"><ArrowRight theme="outline" size={48} fill="currentColor" strokeWidth={3}/></div>}
export function Page(){const [target,setTarget]=useState<'count'|'class'>('count');return <RefinedStage title="什么是文章影响力预测" subtitle="根据已知信息，预测论文未来可能获得的学术影响力" className="naipr-page"><div className="naipr-diagram" aria-label="输入特征经过预测方法，得到影响力预测结果">
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
 <Column title="预测目标" className="naipr-targets"><div className="naipr-target-tabs" aria-label="切换预测任务"><Button active={target==='count'} aria-pressed={target==='count'} onClick={()=>setTarget('count')}>引用次数</Button><Button active={target==='class'} aria-pressed={target==='class'} onClick={()=>setTarget('class')}>高被引分类</Button></div><div className="naipr-target" aria-live="polite"><Typography as="p" variant="display" tone="accent">{target==='count'?'97':'1'}</Typography><Typography variant="body">{target==='count'?'回归：预测引用次数':'分类：预测为高被引'}</Typography><Typography variant="bodySmall" tone="muted">{target==='count'?'输出一个数值':'输出类别：0 = 否，1 = 是'}</Typography></div><Typography variant="bodySmall" tone="muted" align="center">示例输出，用于理解任务形式，非真实模型计算。</Typography></Column>
 </div></RefinedStage>}
