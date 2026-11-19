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
 return <div shuku-edit-id="e-567ce9ac-0b69-40a0-8150-89f2576d6f54" ref={root} className="ra-sprout" data-sprout-program data-phase="intro" data-playing="false">
  <div shuku-edit-id="e-f9d690c7-0554-4809-988e-57323963ae90" ref={viewport} className="ra-sprout-scroll" data-ppt-viewport="新芽训练营滚动页面：简介、阶段、奖励、案例及默认虚拟头像导师目录">
   <div shuku-edit-id="e-b21cb5f5-6a90-4ed6-bec6-7c9060e172b6" className="ra-sprout-banner" data-sprout-section="intro"><img shuku-edit-id="e-ad186e49-d341-47d3-b9ce-10b2780af981" src={moduleAssetUrl("images/recommendation-app/sprout-banner.webp")} alt="新芽训练营"/></div>
   <section shuku-edit-id="e-ec6b9a42-5d35-4e32-9ba1-498501d50921" className="ra-sprout-section"><Typography shuku-edit-id="e-5c61bdc4-f473-4710-a0af-064c10342970" as="h3" variant="h3">简介</Typography><Typography shuku-edit-id="e-26a1af96-dca3-4863-b4e2-caf5cbff08b4" variant="bodySmall">新芽训练营是一项连接科研训练与升学、职业发展的长期服务项目，现已正式升级为付费项目。本训练营面向有保研、考研及就业发展需求的学员，提供系统、持续的科研训练与资源对接服务。</Typography><div shuku-edit-id="e-57dced7f-31c6-4294-a9e3-c52a7b431557" className="ra-sprout-intro-list"><Typography shuku-edit-id="e-9b3ba72a-c8d8-42ae-86f5-d9bc48caedf7" variant="bodySmall">在这里，您可以：</Typography><ol shuku-edit-id="e-ed9d8def-07ee-49ed-977d-faca5c8805c3"><li shuku-edit-id="e-1fdb1b1d-1727-4fc9-9622-6fc1147b4e93">接触智能体时代的科研学习与知识循环模式；</li><li shuku-edit-id="e-d0c522ef-8bea-495f-8ec3-0729995c696a">提升使用 AI 开展科研、解决实际问题的能力；</li><li shuku-edit-id="e-c27c0283-5165-4fb1-b986-21a4292765fc">培养动手实践及知识成果表达、传播能力；</li><li shuku-edit-id="e-48ce9f08-6c3e-4c00-8a79-91d506c7dec8">有机会接受心仪导师（组）的指导。</li></ol></div></section>
   <section shuku-edit-id="e-ed7ddc78-5fa0-4941-a8b9-f821dd183a8d" className="ra-sprout-section" data-sprout-section="stages"><Typography shuku-edit-id="e-8a6a8029-54e7-4de2-9d05-b9bf47a67363" as="h3" variant="h3">新芽阶段</Typography><div shuku-edit-id="e-d222ff5f-2c15-4f92-b69b-e3c534535e11" className="ra-sprout-timeline">{[{title:'播种期',lines:['夯实基础、主题选择、持之以恒']},{title:'培育期',lines:['基础拔高、主题实现、开源复现']},{title:'成长期',lines:['多维选择（AI竞赛、科研成果等）','入组培养（对接主题关联课题组）','成功收获（竞赛获奖、论文发表）']}].map(p=><div shuku-edit-id="e-58eca1b5-960a-4dd1-bf32-261cc8f7dd6c" key={p.title}><Typography shuku-edit-id="e-98a929c4-3ffc-4122-b478-2c2b5f135a46" variant="body"><strong shuku-edit-id="e-4e910658-fffc-4884-9fb6-937beb87774d">{p.title}</strong></Typography>{p.lines.map(line=><Typography shuku-edit-id="e-5c8afbd7-a087-4518-9b1d-ea66bdcff2e8" key={line} variant="bodySmall">{line}</Typography>)}</div>)}</div></section>
   <section shuku-edit-id="e-469c193d-36f0-415c-a43c-7546e8eecba0" className="ra-sprout-section" data-sprout-section="rewards"><Typography shuku-edit-id="e-f276c9e0-ece0-44c5-b3c8-2c6c6930e7be" as="h3" variant="h3">新芽奖励</Typography><Typography shuku-edit-id="e-00b79519-00b3-4a1c-9588-a4ad5d3a2411" variant="bodySmall">新芽培育期间获得优秀的同学，可获得包括国内多个顶尖课题组的直通保研面试最终轮的绿色通道。目前战略合作及认可院校涵盖：清华大学、上海交通大学、南开大学、天津大学、中山大学、国防科技大学、西北工业大学、四川大学、西安交通大学、华东师范大学、中国农业大学、北京邮电大学等。</Typography></section>
   <section shuku-edit-id="e-f91a3847-518c-4db7-a162-9a6228da84f4" className="ra-sprout-section" data-sprout-section="cases"><Typography shuku-edit-id="e-3f79af2d-aba8-482f-b346-68b94bbf516d" as="h3" variant="h3">新芽优秀案例</Typography><div shuku-edit-id="e-2adadd9c-d1f0-4ba8-86f1-1361da0f4bd6" className="ra-sprout-case"><img shuku-edit-id="e-86d0c094-9adb-4798-81e2-8150be13599d" src={moduleAssetUrl("images/recommendation-app/sprout-case-paper.webp")} alt="截图中的新芽优秀论文案例 K-LoRA"/><div shuku-edit-id="e-054f0bd6-9a59-4edd-bda4-cccf0eb83e44" className="ra-sprout-case-dots" aria-hidden="true"><i shuku-edit-id="e-f08f6a50-cb7f-4ba3-98c5-104b9d934fd1"/><i shuku-edit-id="e-cd632685-580a-49ec-a3d3-0bfbdd5c2b64"/><i shuku-edit-id="e-504db281-dc9d-495e-80bb-6ebca77df8d4"/><i shuku-edit-id="e-f9df9c9e-e532-4e3a-a7d2-3df0c3a620fd"/></div></div>

   </section>
   <form shuku-edit-id="e-0faa2fdd-80f7-401b-ada3-dfcd1efa5bfc" className="ra-sprout-filter" onSubmit={e=>{e.preventDefault();setSubmitted(query.trim())}}><label shuku-edit-id="e-ddc229e7-e166-4e4e-93f8-6c135a439498"><select shuku-edit-id="e-6a16c3b6-ae60-419a-b841-05e9b13bf26d" aria-label="导师筛选类型" value={field} onChange={e=>setField(e.target.value)}>{['学校','课题组','导师'].map(v=><option shuku-edit-id="e-5b2c7bb1-0a53-4697-beab-8226a32cb38a" key={v}>{v}</option>)}</select><ChevronDown/></label><input shuku-edit-id="e-f099a797-6a8f-49be-a309-b46c8985de76" aria-label="搜索新芽导师" placeholder="请输入" value={query} onChange={e=>{setQuery(e.target.value);if(!e.target.value)setSubmitted('')}}/><button shuku-edit-id="e-e3b21765-f1a2-4141-bb94-aac2620a20e8" type="submit">搜索</button></form>
   <section shuku-edit-id="e-c041168f-dd7e-4673-a796-b6f8871566b4" className="ra-sprout-section ra-sprout-directory" data-sprout-section="mentors"><Typography shuku-edit-id="e-2395afc7-96a3-42c0-a6d6-766f755d0b5b" as="h3" variant="h3">新芽导师</Typography>{filtered.map(s=><details shuku-edit-id="e-4cb54d0e-6923-45a7-980e-05694cbc837e" className="ra-sprout-school" key={s.name} open><summary shuku-edit-id="e-5bf2b0d1-888b-49f5-bbd8-1bac2787241b">{s.name}<ChevronDown/></summary>{s.groups.map(g=><details shuku-edit-id="e-b1566f28-d227-438f-bc9e-b7db5b6c7179" className="ra-sprout-group" key={g.name} open><summary shuku-edit-id="e-fe29e2b1-730d-4960-a787-53a57e57da2b">{g.name}<ChevronDown/></summary>{g.people.length>0&&<div shuku-edit-id="e-0ec1f7d0-da99-4478-9d15-935d51b8c34d" className="ra-sprout-people">{g.people.map((name,index)=><div shuku-edit-id="e-c3934bce-f7b5-4298-b7f4-8678e48aa42b" className={g.people.length>4&&index===0?'ra-sprout-lead':''} key={name}><span shuku-edit-id="e-ea67a284-ac58-4744-86ee-a5abfc255e77" role="img" aria-label="默认导师头像" data-default-avatar className="ra-sprout-default-avatar"><UserRound aria-hidden="true"/></span><Typography shuku-edit-id="e-b55ccd88-9a12-4d53-8bae-c08cc1660737" variant="bodySmall">{name}</Typography></div>)}</div>}</details>)}</details>)}{!filtered.length&&<div shuku-edit-id="e-c346d131-29ce-4b29-9326-febaf226e9a0" className="ra-sprout-no-results"><Search/><Typography shuku-edit-id="e-74da5da0-8840-459e-8cef-58851ca11524" variant="bodySmall">没有找到匹配的导师，请调整关键词</Typography></div>}</section>
  </div>
 </div>;
}
