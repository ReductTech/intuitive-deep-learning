import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search, UserRound } from 'lucide-react';
import { Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './SproutProgramPage.css';

const schools = [
 {name:'清华大学',groups:[{name:'T-STAR',people:['董胤蓬']}]},
 {name:'南开大学',groups:[{name:'媒体计算实验室',people:['程明明','戴一冕','范登平','郭春乐','郭青','侯淇彬','黄川','姜智卓','刘夏雷','刘云','李翔','李重仪','任博','孙国磊','杨飞']},{name:'计算机视觉课题组',people:['时晶磊']}]},
 {name:'北京中关村学院',groups:[{name:'徐良',people:['徐良']}]},
 {name:'北京邮电大学',groups:[{name:'北京邮电大学计算摄像小组',people:['郭亨']},{name:'智能感知与计算教研中心',people:[]}]},
 {name:'中国农业大学',groups:[{name:'中农北斗',people:['翟卫欣','傅成']}]},
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
 return <div shuku-edit-id="e-73f479f5-1924-4ef8-952f-08e86c07e6c7" ref={root} className="ra-sprout" data-sprout-program data-phase="intro" data-playing="false">
  <div shuku-edit-id="e-e981658a-af9e-4dff-8681-05e99b4505d6" ref={viewport} className="ra-sprout-scroll" data-ppt-viewport="新芽训练营滚动页面：简介、阶段、奖励、案例及默认虚拟头像导师目录">
   <div shuku-edit-id="e-a046999d-96f3-463e-92c3-4c0584f9780d" className="ra-sprout-banner" data-sprout-section="intro"><img shuku-edit-id="e-a42b2a55-e091-4ff3-b955-8e4b575bd8af" src={moduleAssetUrl("images/recommendation-app/sprout-banner.webp")} alt="新芽训练营"/></div>
   <section shuku-edit-id="e-673d64df-fb78-42d1-bb6a-14955a606469" className="ra-sprout-section"><Typography shuku-edit-id="e-ae59b645-9fc8-447f-85fb-7df9f40758b3" as="h3" variant="h3">简介</Typography><Typography shuku-edit-id="e-2511084b-e13c-49db-9f64-7bf91b25816d" variant="bodySmall">新芽训练营是一项连接科研训练与升学、职业发展的长期服务项目，现已正式升级为付费项目。本训练营面向有保研、考研及就业发展需求的学员，提供系统、持续的科研训练与资源对接服务。</Typography><div shuku-edit-id="e-5bc33db0-d09f-4def-b7eb-86c85831c667" className="ra-sprout-intro-list"><Typography shuku-edit-id="e-2974bdf5-3932-4ecf-97c0-6ce4c1fd8849" variant="bodySmall">在这里，您可以：</Typography><ol shuku-edit-id="e-5205f811-8b12-432c-bd66-1857f5983ae5"><li shuku-edit-id="e-b23f4d93-0df4-4f63-9da8-32db9fe3c54d">接触智能体时代的科研学习与知识循环模式；</li><li shuku-edit-id="e-df97c37a-552d-4d66-aa3d-4d017d22e0e5">提升使用 AI 开展科研、解决实际问题的能力；</li><li shuku-edit-id="e-091bff26-1306-4d4d-adc8-151d3ad4566e">培养动手实践及知识成果表达、传播能力；</li><li shuku-edit-id="e-49924c90-d57a-41ef-8e66-82eb808b1cbe">有机会接受心仪导师（组）的指导。</li></ol></div></section>
   <section shuku-edit-id="e-14f71eb8-da5c-40f7-8a9b-edea1fc049bd" className="ra-sprout-section" data-sprout-section="stages"><Typography shuku-edit-id="e-fc21a3f4-1c4a-417a-860c-7ea132bc7a22" as="h3" variant="h3">新芽阶段</Typography><div shuku-edit-id="e-9bb3e740-576f-4499-8d7f-93e4290c4aac" className="ra-sprout-timeline">{[{title:'播种期',lines:['夯实基础、主题选择、持之以恒']},{title:'培育期',lines:['基础拔高、主题实现、开源复现']},{title:'成长期',lines:['多维选择（AI竞赛、科研成果等）','入组培养（对接主题关联课题组）','成功收获（竞赛获奖、论文发表）']}].map(p=><div shuku-edit-id="e-6c533714-e5c7-45a9-a3ae-a09516e5a6a5" key={p.title}><Typography shuku-edit-id="e-7dc603b4-b0aa-4a9a-8cd4-35b421097862" variant="body"><strong shuku-edit-id="e-e0c311c9-0212-4546-bceb-c77db04cda7c">{p.title}</strong></Typography>{p.lines.map(line=><Typography shuku-edit-id="e-0614200c-99ff-412f-8e6d-d93ab8cb5ba1" key={line} variant="bodySmall">{line}</Typography>)}</div>)}</div></section>
   <section shuku-edit-id="e-73799d21-5cf6-4081-8527-026d487a8232" className="ra-sprout-section" data-sprout-section="rewards"><Typography shuku-edit-id="e-3fb417aa-3baf-4dd4-84f2-e5c677c96eca" as="h3" variant="h3">新芽奖励</Typography><Typography shuku-edit-id="e-4a79e00c-207a-45a0-9d71-ec5197e17671" variant="bodySmall">新芽培育期间获得优秀的同学，可获得包括国内多个顶尖课题组的直通保研面试最终轮的绿色通道。目前战略合作及认可院校涵盖：清华大学、上海交通大学、南开大学、天津大学、中山大学、国防科技大学、西北工业大学、四川大学、西安交通大学、华东师范大学、中国农业大学、北京邮电大学等。</Typography></section>
   <section shuku-edit-id="e-b3e0bbbb-d6de-410c-b901-5a6f077ef66b" className="ra-sprout-section" data-sprout-section="cases"><Typography shuku-edit-id="e-6633232d-487d-42ed-b7c7-85ef10322c94" as="h3" variant="h3">新芽优秀案例</Typography><div shuku-edit-id="e-f93764d8-d234-4dd2-aa1a-b4ce2b25cb68" className="ra-sprout-case"><img shuku-edit-id="e-61811135-8fc2-45bb-bd20-2139aca6570e" src={moduleAssetUrl("images/recommendation-app/sprout-case-paper.webp")} alt="截图中的新芽优秀论文案例 K-LoRA"/><div shuku-edit-id="e-8c554005-7ed2-4da4-be3e-0faf3d943fee" className="ra-sprout-case-dots" aria-hidden="true"><i shuku-edit-id="e-ddb5396e-562d-41d6-a473-c6956b20e374"/><i shuku-edit-id="e-64909f6e-c9f4-47a9-8128-b5cf82466ceb"/><i shuku-edit-id="e-065992cc-6685-4ff4-bac1-f6af46babf8c"/><i shuku-edit-id="e-927036d2-b490-4587-8b8c-ffe18c46a5e8"/></div></div>

   </section>
   <form shuku-edit-id="e-1c74cb03-76af-48e0-8a31-6107e9b548ff" className="ra-sprout-filter" onSubmit={e=>{e.preventDefault();setSubmitted(query.trim())}}><label shuku-edit-id="e-c90dc9da-2cae-4595-862f-dc295738fc7c"><select shuku-edit-id="e-53a38223-4d65-499b-93e5-4a13064a1f56" aria-label="导师筛选类型" value={field} onChange={e=>setField(e.target.value)}>{['学校','课题组','导师'].map(v=><option shuku-edit-id="e-47fc2888-74f0-4024-be42-629fa8cc3733" key={v}>{v}</option>)}</select><ChevronDown/></label><input shuku-edit-id="e-1374ef33-1a6e-48ad-b224-32d5405b66e5" aria-label="搜索新芽导师" placeholder="请输入" value={query} onChange={e=>{setQuery(e.target.value);if(!e.target.value)setSubmitted('')}}/><button shuku-edit-id="e-dc86387c-d7a3-4850-91e9-62d905cf3125" type="submit">搜索</button></form>
   <section shuku-edit-id="e-c814972b-041f-4039-8d05-f35b2b2b946a" className="ra-sprout-section ra-sprout-directory" data-sprout-section="mentors"><Typography shuku-edit-id="e-65b87ee0-daea-46df-aeed-b2fc497cc1ba" as="h3" variant="h3">新芽导师</Typography>{filtered.map(s=><details shuku-edit-id="e-50941775-eda2-4b4d-96a0-6fb6bdd26c93" className="ra-sprout-school" key={s.name} open><summary shuku-edit-id="e-ed1c0916-ddef-4755-808a-b733d72b8f61">{s.name}<ChevronDown/></summary>{s.groups.map(g=><details shuku-edit-id="e-4eb73e2b-a0e9-4fc3-93bb-ba0cfd968a96" className="ra-sprout-group" key={g.name} open><summary shuku-edit-id="e-b9f03326-49da-40a2-bde9-71e74bc1c6c4">{g.name}<ChevronDown/></summary>{g.people.length>0&&<div shuku-edit-id="e-1f57de99-77a2-4157-bc32-1860fb7967b2" className="ra-sprout-people">{g.people.map((name,index)=><div shuku-edit-id="e-fc4b91ed-f9fd-47fa-8099-02014d8ec3be" className={g.people.length>4&&index===0?'ra-sprout-lead':''} key={name}><span shuku-edit-id="e-f0acee92-38b6-4e55-a027-a23a5c0a08cf" role="img" aria-label="默认导师头像" data-default-avatar className="ra-sprout-default-avatar"><UserRound aria-hidden="true"/></span><Typography shuku-edit-id="e-656acdfe-2124-49c5-b036-cf3c0e645572" variant="bodySmall">{name}</Typography></div>)}</div>}</details>)}</details>)}{!filtered.length&&<div shuku-edit-id="e-7f207091-e9d5-4089-83be-b06f8f033974" className="ra-sprout-no-results"><Search/><Typography shuku-edit-id="e-3ebaa5e1-1249-4a66-ac15-55d85e7a7f4b" variant="bodySmall">没有找到匹配的导师，请调整关键词</Typography></div>}</section>
  </div>
 </div>;
}
