import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search, UserRound } from 'lucide-react';
import { Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import './SproutProgramPage.css';

const schools = [
 {name:'清华大学',groups:[{name:'T-STAR',people:['董胤蓬']}]},
 {name:'南开大学',groups:[{name:'媒体计算实验室',people:['程明明','戴一弨','丁宁','范登平','郭春乐','郭青','侯涣彬','黄川','姜智卓','刘夏雷','刘云','李翔','李重仪','任博','孙国磊','杨飞']},{name:'计算机视觉课题组',people:['时晶磊']}]},
 {name:'北京中关村学院',groups:[{name:'徐良',people:['徐良']}]},
 {name:'北京邮电大学',groups:[{name:'北京邮电大学计算摄像小组',people:['郭亨']},{name:'智能感知与计算教研中心',people:[]}]},
 {name:'中国农业大学',groups:[{name:'中农北斗',people:['翟卫欣','傅咸']}]},
 {name:'天津大学',groups:[{name:'多模态视觉处理实验室',people:[]},{name:'机器学习与数据挖掘实验室',people:['曹兵']},{name:'智能与计算学部视觉智能实验室',people:[]},{name:'智绘视觉实验室',people:['任冬伟']}]},
 {name:'天津工业大学',groups:[{name:'智能视觉',people:['宋丽梅']}]},
 {name:'天津理工大学',groups:[{name:'IMAC Lab（智能媒体分析与计算实验室）',people:['余璐']}]},
 {name:'上海交通大学',groups:[{name:'ScaleLab',people:[]},{name:'VisionXLab',people:['杨学']},{name:'协同智能研究组',people:[]}]},
 {name:'华东师范大学',groups:[{name:'DREAMS',people:['周越']}]},
 {name:'中山大学',groups:[{name:'ISEE（智能科学与系统实验室）',people:[]},{name:'空间智能实验室',people:['郭裕兰','汪汉云','张瑞茂']},{name:'创新中心',people:['王维']},{name:'知行Bot 实验室',people:['姬艳丽']}]},
 {name:'西安交通大学',groups:[{name:'IID科研小组',people:['岳宗胜']},{name:'数学机理驱动的生成式智能科学建模团队',people:['崔琼杰','杨燕']}]},
 {name:'四川大学',groups:[{name:'机器学习与工业智能应用教育部工程研究中心',people:['黄树东']}]},
 {name:'西北工业大学',groups:[{name:'计算机视觉与机器人研究组',people:[]},{name:'西安智能嵌入式软件重点实验室',people:['干红平']},{name:'信息融合技术教育部重点实验室',people:['王秉路']}]},
 {name:'国防科技大学',groups:[{name:'某探测技术创新中心',people:[]},{name:'态势综合感知教研室',people:[]}]},
];

export function SproutProgramPage({autoPlay=false}:{autoPlay?:boolean}) {
 const root=useRef<HTMLDivElement>(null),viewport=useRef<HTMLDivElement>(null),manual=useRef(false);
 const [query,setQuery]=useState(''),[submitted,setSubmitted]=useState(''),[field,setField]=useState('学校');
 useEffect(()=>{
  if(!autoPlay||manual.current||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const element=root.current,scroll=viewport.current;if(!element||!scroll)return;
  let frame=0,elapsed=0,last=performance.now(),visible=false,position=scroll.scrollTop,loops=0;
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;last=performance.now()});observer.observe(element);
  const pause=()=>{manual.current=true;element.dataset.playing='false';cancelAnimationFrame(frame)};
  element.addEventListener('pointerdown',pause);element.addEventListener('wheel',pause,{passive:true});element.addEventListener('keydown',pause);
  const tick=(now:number)=>{
   const active=visible&&!document.hidden,delta=Math.min(100,Math.max(0,now-last));last=now;
   if(active){
    elapsed+=delta;
    const maximum=Math.max(0,scroll.scrollHeight-scroll.clientHeight);
    if(maximum>0){
     position+=delta*.042;
     if(position>=maximum){position%=maximum;loops++}
     scroll.scrollTop=position;
    }
   }
   const sections=Array.from(scroll.querySelectorAll<HTMLElement>('[data-sprout-section]'));
   const section=[...sections].reverse().find(section=>section.offsetTop<=scroll.scrollTop+20);
   element.dataset.time=String(Math.round(elapsed));element.dataset.phase=section?.dataset.sproutSection??'intro';
   element.dataset.loops=String(loops);element.dataset.playing=String(active);
   if(!manual.current)frame=requestAnimationFrame(tick);
  };frame=requestAnimationFrame(tick);
  return()=>{cancelAnimationFrame(frame);observer.disconnect();element.removeEventListener('pointerdown',pause);element.removeEventListener('wheel',pause);element.removeEventListener('keydown',pause)};
 },[autoPlay]);
 const filtered=schools.map(s=>({...s,groups:s.groups.filter(g=>!submitted||(field==='学校'?s.name:field==='课题组'?g.name:g.people.join(' ')).includes(submitted))})).filter(s=>s.groups.length);
 return <div ref={root} className="ra-sprout" data-sprout-program data-phase="intro" data-playing="false">
  <div ref={viewport} className="ra-sprout-scroll" data-ppt-viewport="新芽训练营滚动页面：简介、阶段、奖励、案例及默认虚拟头像导师目录">
   <div className="ra-sprout-banner" data-sprout-section="intro"><img src={moduleAssetUrl(outline.moduleIdentity.id,'images/recommendation-app/sprout-banner.png')} alt="新芽训练营"/></div>
   <section className="ra-sprout-section"><Typography as="h3" variant="h3">简介</Typography><Typography variant="bodySmall">新芽训练营是一项连接科研训练与升学、职业发展的长期服务项目，现已正式升级为付费项目。本训练营面向有保研、考研及就业发展需求的学员，提供系统、持续的科研训练与资源对接服务。</Typography><div className="ra-sprout-intro-list"><Typography variant="bodySmall">在这里，您可以：</Typography><ol><li>接触智能体时代的科研学习与知识循环模式；</li><li>提升使用 AI 开展科研、解决实际问题的能力；</li><li>培养动手实践及知识成果表达、传播能力；</li><li>有机会接受心仪导师（组）的指导。</li></ol></div></section>
   <section className="ra-sprout-section" data-sprout-section="stages"><Typography as="h3" variant="h3">新芽阶段</Typography><div className="ra-sprout-timeline">{[{title:'播种期',lines:['夯实基础、主题选择、持之以恒']},{title:'培育期',lines:['基础拔高、主题实现、开源复现']},{title:'成长期',lines:['多维选择（AI竞赛、科研成果等）','入组培养（对接主题关联课题组）','成功收获（竞赛获奖、论文发表）']}].map(p=><div key={p.title}><Typography variant="body"><strong>{p.title}</strong></Typography>{p.lines.map(line=><Typography key={line} variant="bodySmall">{line}</Typography>)}</div>)}</div></section>
   <section className="ra-sprout-section" data-sprout-section="rewards"><Typography as="h3" variant="h3">新芽奖励</Typography><Typography variant="bodySmall">新芽培育期间获得优秀的同学，可获得包括国内多个顶尖课题组的直通保研面试最终轮的绿色通道。目前战略合作及认可院校涵盖：清华大学、上海交通大学、南开大学、天津大学、中山大学、国防科技大学、西北工业大学、四川大学、西安交通大学、华东师范大学、中国农业大学、北京邮电大学等。</Typography></section>
   <section className="ra-sprout-section" data-sprout-section="cases"><Typography as="h3" variant="h3">新芽优秀案例</Typography><div className="ra-sprout-case"><img src={moduleAssetUrl(outline.moduleIdentity.id,'images/recommendation-app/sprout-case-paper.png')} alt="截图中的新芽优秀论文案例 K-LoRA"/><div className="ra-sprout-case-dots" aria-hidden="true"><i/><i/><i/><i/></div></div>

   </section>
   <form className="ra-sprout-filter" onSubmit={e=>{e.preventDefault();setSubmitted(query.trim())}}><label><select aria-label="导师筛选类型" value={field} onChange={e=>setField(e.target.value)}>{['学校','课题组','导师'].map(v=><option key={v}>{v}</option>)}</select><ChevronDown/></label><input aria-label="搜索新芽导师" placeholder="请输入" value={query} onChange={e=>{setQuery(e.target.value);if(!e.target.value)setSubmitted('')}}/><button type="submit">搜索</button></form>
   <section className="ra-sprout-section ra-sprout-directory" data-sprout-section="mentors"><Typography as="h3" variant="h3">新芽导师</Typography>{filtered.map(s=><details className="ra-sprout-school" key={s.name} open><summary>{s.name}<ChevronDown/></summary>{s.groups.map(g=><details className="ra-sprout-group" key={g.name} open><summary>{g.name}<ChevronDown/></summary>{g.people.length>0&&<div className="ra-sprout-people">{g.people.map((name,index)=><div className={g.people.length>4&&index===0?'ra-sprout-lead':''} key={name}><span role="img" aria-label="默认导师头像" data-default-avatar className="ra-sprout-default-avatar"><UserRound aria-hidden="true"/></span><Typography variant="bodySmall">{name}</Typography></div>)}</div>}</details>)}</details>)}{!filtered.length&&<div className="ra-sprout-no-results"><Search/><Typography variant="bodySmall">没有找到匹配的导师，请调整关键词</Typography></div>}</section>
  </div>
 </div>;
}
