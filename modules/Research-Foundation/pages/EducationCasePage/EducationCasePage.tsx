import { useEffect, useState } from 'react';
import { GraduationCap, Sprout, BookOpen, Layers, Database, MonitorSmartphone } from 'lucide-react';
import { ContentBlock, Button, Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import { PlaybackBar, usePlayback } from '../../Playback';
import './EducationCasePage.css';

const stages=[{name:'播种期',text:'兴趣启蒙 · 方向探索'},{name:'培育期',text:'持续学习 · 能力积累'},{name:'成长周期',text:'成果整理 · 发展规划'}];
const foundations=[{Icon:Database,name:'算法积累',text:'文献处理与知识评价'},{Icon:Layers,name:'交互内容',text:'可观察、可比较的原型'},{Icon:MonitorSmartphone,name:'平台与用户',text:'科研信息与学习入口'},{Icon:GraduationCap,name:'教育场景',text:'研究生培养实践'}];
export function EducationCasePage(){
 const p=usePlayback(3,6200),[evidence,setEvidence]=useState(false),[tab,setTab]=useState('新芽育才'),[stage,setStage]=useState(0),[foundation,setFoundation]=useState(0);
 useEffect(()=>{setEvidence(false);setTab('新芽育才');setStage(p.step===1?1:0);setFoundation(0)},[p.step,p.revision]);
 return <ContentBlock className="rf-page rf-case" title={outline.pages[8].title}>
  <div className="rf-case-main"><section className="rf-case-evidence">
    {p.step<2?<div className="rf-case-focus rf-fade"><Typography variant="bodySmall" tone="muted">2026 天津市典型案例</Typography><Typography variant="display">个人智能体<br/>重构人才培养范式</Typography><Typography variant="body" tone="muted">南开大学 · 程明明</Typography><Button onClick={()=>setEvidence(true)}>查看入选名单</Button></div>:<div className="rf-foundations rf-fade"><Typography variant="h2">已有研究基础</Typography><div className="rf-foundation-tabs">{foundations.map(({Icon,name},i)=><Button key={name} active={foundation===i} onClick={()=>setFoundation(i)}><Icon size={23}/>{name}</Button>)}</div><Typography variant="body" tone="muted">{foundations[foundation].text}</Typography></div>}
   </section><aside className="rf-education-phone"><div className="rf-edu-device"><div className="rf-edu-status"><Typography variant="bodySmall">11:14</Typography><i/><Typography variant="bodySmall">5G ▰</Typography></div><div className="rf-edu-brand"><GraduationCap size={25}/><Typography variant="bodySmall">研究生培养场景</Typography></div><div className="rf-edu-banner"><Sprout size={40}/><Typography variant="h3">新芽训练营</Typography><Typography variant="bodySmall">培养场景示意</Typography></div><div className="rf-edu-tabs">{['新芽导师','新芽育才'].map(t=><Button key={t} active={t===tab} onClick={()=>setTab(t)}>{t}</Button>)}</div><div className="rf-edu-content"><Typography variant="h3">简介</Typography><Typography variant="bodySmall">{tab==='新芽导师'?'面向科研指导，组织研究方向与学习支持。':'面向研究生成长，组织学习内容与阶段任务。'}</Typography><Typography variant="h3">新芽阶段</Typography><div className="rf-edu-stages">{stages.map(({name},i)=><button key={name} aria-pressed={stage===i} onClick={()=>setStage(i)} className={stage===i?'active':''}><Sprout size={18}/><Typography variant="bodySmall">{name}</Typography></button>)}</div><div className="rf-edu-stage-detail rf-fade" key={`${tab}-${stage}`}><Typography variant="h3">{stages[stage].name}</Typography><Typography variant="bodySmall">{stages[stage].text}</Typography></div></div><div className="rf-edu-home"/></div><Typography variant="bodySmall" tone="muted" align="center">依据材料中的培养场景重构</Typography></aside></div>
  <PlaybackBar playback={p} label="讲解案例与研究基础" hint="案例入选不等于教学效果结论"/>
  {evidence&&<div className="rf-case-source-overlay" role="dialog" aria-label="入选名单"><div className="rf-document" data-ppt-viewport="原始典型案例完整名单截图"><img src={moduleAssetUrl(outline.moduleIdentity.id,'evidence/education-case-source.png')} alt="2026年天津市典型案例名单；首行南开大学，个人智能体重构人才培养范式，负责人程明明"/></div><Button onClick={()=>setEvidence(false)}>关闭名单</Button></div>}
 </ContentBlock>;
}
