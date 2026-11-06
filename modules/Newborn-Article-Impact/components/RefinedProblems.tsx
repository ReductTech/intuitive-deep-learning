import { useState } from 'react';
import { Button, Typography } from '../../shared/react';
import { RefinedStage } from './RefinedStage';
import { imageUrl } from './Stage';
import './RefinedProblems.css';
type Problem='external'|'published'|'target';
const items:Record<Problem,{label:string;image:string;detail:string;subtitle:string}>={
 external:{label:'过度依赖外部数据',image:'s4-shape3.png',detail:'作者、机构、发表渠道和引用网络，都可能成为预测的前提。',subtitle:'问题一：过度依赖外部数据'},
 published:{label:'新论文缺少历史记录',image:'s4-shape10.png',detail:'刚出现的论文，尚未积累足够的收录、引用与传播记录。',subtitle:'问题二：新论文缺少历史记录'},
 target:{label:'预测目标存在争议',image:'s4-shape20.png',detail:'直接比较引用次数，会受到研究领域与发表时间的影响。',subtitle:'问题三：预测目标存在争议'}
};
function sector(start:number,end:number){const p=(r:number,a:number)=>[500+r*Math.cos(a*Math.PI/180),470-r*Math.sin(a*Math.PI/180)].join(' ');return `M${p(340,start)} A340 340 0 0 1 ${p(340,end)} L${p(220,end)} A220 220 0 0 0 ${p(220,start)} Z`;}
export function RefinedProblems({focus,summary=false}:{focus?:Problem;summary?:boolean}){
 const [selected,setSelected]=useState<Problem | null>(summary?null:(focus??'external'));
 return <RefinedStage title="现有方法的问题" subtitle={summary?'三个限制，共同影响预测的性能与应用范围':items[selected!].subtitle} className={'naipq-page'+(summary?' naipq-summary':'')}><div className="naipq-board"><svg className="naipq-arch" viewBox="0 0 1000 520" aria-hidden="true">{(['external','published','target'] as const).map((id,i)=><path key={id} d={sector(180-i*60,120-i*60)} fill={id===selected?'var(--ui-accent-alt)':'var(--ui-border)'} fillOpacity={id===selected?.28:.85} stroke="var(--ui-bg-card)" strokeWidth="7"/>)}<path d="M292 470A208 208 0 0 1 708 470" fill="none" stroke="var(--ui-border)" strokeWidth="9"/><path d="M60 470H940" stroke="var(--ui-border)" strokeWidth="2"/><circle cx="60" cy="470" r="4" fill="var(--ui-border)"/><circle cx="940" cy="470" r="4" fill="var(--ui-border)"/></svg>{(['external','published','target'] as const).map(id=><Button key={id} className={'naipq-choice naipq-choice--'+id} onClick={()=>setSelected(id)} aria-pressed={selected===id} aria-label={'查看问题：'+items[id].label}><Typography variant={id===selected?'h2':'h3'} tone="inherit" className="naipq-label">{items[id].label}</Typography><img src={imageUrl(items[id].image)} alt="" className="naipq-face"/></Button>)}</div>{summary?<div className="naipq-conclusion"><Typography variant="h2" tone="accent" align="center">性能与应用范围都受到限制</Typography><Typography variant="bodySmall" tone="muted" align="center" aria-live="polite">{selected?items[selected].detail:'下一步：寻找更可比的文章影响力指标'}</Typography></div>:<Typography variant="body" tone="accent" align="center" className="naipq-explanation" aria-live="polite">{items[selected!].detail}</Typography>}</RefinedStage>;
}
