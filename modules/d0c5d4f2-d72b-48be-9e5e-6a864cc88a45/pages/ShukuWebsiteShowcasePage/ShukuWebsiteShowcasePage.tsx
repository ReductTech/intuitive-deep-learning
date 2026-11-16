import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useRef, useState } from 'react';
import { BookOpen, Search, Grid2X2, Brain, Image, Sparkles, Bookmark, Play, X, ArrowLeft } from 'lucide-react';
import { Typography } from "@shuku/course-style/react";
import { moduleIdentity } from '../../outlines.json';
import { useRecordingDemo } from '../../components/RecordingDemo';
import { shukuScrollAt } from './shukuNarration';
import './ShukuWebsiteShowcasePage.css';

const courses = [
 {title:'认识人工神经元',topic:'神经网络',level:'入门',pages:18,description:'从一次真实决策出发，看懂输入、权重与激活函数。'},
 {title:'卷积基础',topic:'计算机视觉',level:'进阶',pages:24,description:'从五子棋到图像，亲手探索卷积怎样提取局部特征。'},
 {title:'数字图像入门',topic:'计算机视觉',level:'入门',pages:24,description:'从一颗拼豆开始，理解像素、颜色与图像的数字表达。'},
 {title:'回归与损失',topic:'数学与优化',level:'入门',pages:18,description:'从曹冲称象到模型拟合，理解误差、损失与最优解。'},
 {title:'视觉特征学习',topic:'计算机视觉',level:'进阶',pages:25,description:'观察神经网络如何从图像中逐步学习特征。'},
 {title:'视觉生成：从噪声到图像',topic:'生成模型',level:'进阶',pages:31,description:'从 GAN 到 Diffusion，探索一张图像如何被生成。'},
];
const topics=[{name:'全部课程',Icon:Grid2X2},{name:'神经网络',Icon:Brain},{name:'计算机视觉',Icon:Image},{name:'数学与优化',Icon:Sparkles},{name:'生成模型',Icon:Sparkles}];
const cover=(index:number)=>moduleAssetUrl(`showcase/library-covers/course-${index+1}.jpg`);

/** Lightweight local library simulation: no iframe, app bootstrap, API, or live course player. */
export function ShukuWebsiteShowcasePage() {
 const root=useRef<HTMLElement>(null);
 const [topic,setTopic]=useState('全部课程'),[level,setLevel]=useState('全部'),[query,setQuery]=useState('');
 const [selected,setSelected]=useState<number|null>(null),[mode,setMode]=useState('自学互动模式');
 const [saved,setSaved]=useState<number[]>([]);
 const visible=courses.map((course,index)=>({...course,index})).filter(c=>(topic==='全部课程'||c.topic===topic)&&(level==='全部'||c.level===level)&&`${c.title}${c.description}`.includes(query));
 useRecordingDemo(root,async demo=>{
  const find=(selector:string)=>root.current!.querySelector<HTMLElement>(selector)!;
  await demo.moveTo(demo.point(find('[data-topic="全部课程"]')),0);
  await demo.wait(450);await demo.click(find('[data-topic="计算机视觉"]'),400);
  await demo.wait(500);await demo.click(find('[data-topic="全部课程"]'),350);await demo.wait(200);
  const viewport=find('.rf-library-main');
  await demo.moveTo(demo.point(viewport,.82,.65),450);
  const destination=Math.max(0,viewport.scrollHeight-viewport.clientHeight);
  await demo.animate(2850,t=>{viewport.scrollTop=shukuScrollAt(2.79+t*2.85,destination);});
  await demo.wait(1360);
 },{ready:()=>Array.from(root.current?.querySelectorAll<HTMLImageElement>('.rf-library-cover img[loading="eager"]')??[]).every(image=>image.complete&&image.naturalWidth>0)});
 function open(index:number,nextMode='自学互动模式'){setSelected(index);setMode(nextMode);}
 return <section shuku-edit-id="e-cddd344b-5d5c-4493-9d7b-d7d14a761537" ref={root} className="rf-page rf-shuku-website rf-recording-demo" aria-label="术库课程图书馆本地交互演示">
  <div shuku-edit-id="e-dbfc02cd-1a87-4836-b306-3a2fb9246b4a" className="rf-library-shell">
   <header shuku-edit-id="e-9ffccfc5-e2c1-4b80-9894-7e8c0d041cd5" className="rf-library-header"><div shuku-edit-id="e-a746c284-d7ae-465c-bf35-a723743a7634" className="rf-library-brand"><BookOpen/><Typography shuku-edit-id="e-50f2d6a8-ad16-4596-9c03-6fe587e1f178" variant="h3">术库</Typography></div><Typography shuku-edit-id="e-92f05357-1d0b-457f-8c7c-27071a14c01b" variant="body" className="rf-library-current">探索课程</Typography><Typography shuku-edit-id="e-60e32beb-a433-4da3-93a2-23b74f3e401c" variant="body" tone="muted">个人中心</Typography><Typography shuku-edit-id="e-2de87c2d-846f-485b-b6c0-2f8ed3da3efa" variant="body" tone="muted">课程创作</Typography><Typography shuku-edit-id="e-bcfbfa44-bb3a-46b0-99f9-2913604079d1" className="rf-library-demo-label" variant="bodySmall" tone="muted">交互演示</Typography></header>
   <div shuku-edit-id="e-4ffe136d-b527-49bd-a094-be01c922f059" className="rf-library-layout">
    <aside shuku-edit-id="e-8f739305-6767-438c-b81f-aecc5f24ea95" className="rf-library-sidebar"><Typography shuku-edit-id="e-30f3ba80-b4c9-4d66-a005-420855cd414f" variant="bodySmall" tone="muted">课程图书馆</Typography><nav shuku-edit-id="e-16941a90-ecac-4b77-9802-a6690ddba4c9" aria-label="课程分类">{topics.map(({name,Icon})=><button shuku-edit-id="e-65af778c-4b50-4121-b71a-8193dd7c619c" key={name} data-topic={name} aria-pressed={topic===name} onClick={()=>{setTopic(name);setSelected(null);}}><Icon/><Typography shuku-edit-id="e-9f3f1143-dd1e-4fd6-b97e-dbcd1cf68439" variant="bodySmall" tone="inherit">{name}</Typography></button>)}</nav><div shuku-edit-id="e-1747b885-089f-411f-bc3c-8cbbf6900fc4" className="rf-library-community"><Sparkles/><Typography shuku-edit-id="e-3621996c-dfe1-48ed-8f04-bffeb3d6f783" variant="bodySmall">让知识在共创中进化</Typography><Typography shuku-edit-id="e-60daadc3-4726-400e-aeb4-0152418f9c8a" variant="bodySmall" tone="muted">分享一种理解，一起完善一门课程。</Typography></div></aside>
    <main shuku-edit-id="e-12ab9a87-0ed7-424e-9c5e-f3cec8b73e78" className="rf-library-main" data-ppt-viewport="本地模拟课程库滚动区域">
     <label shuku-edit-id="e-e2abbd9c-2b4a-422b-84e7-4ed6211ae4da" className="rf-library-search"><Search/><input shuku-edit-id="e-eb013b93-d7e8-406f-9e3a-7395a9acfd54" aria-label="搜索课程" value={query} onChange={e=>setQuery(e.target.value)} placeholder="想了解什么？搜索课程或知识点…"/></label>
     <div shuku-edit-id="e-6dc47bf0-3390-4492-8f07-b26f6fc38abf" className="rf-library-toolbar"><div shuku-edit-id="e-80f32c28-1594-4151-ac4f-598cf1850665">{['全部','入门','进阶'].map(l=><button shuku-edit-id="e-97d731e4-ac8e-4ed0-bc9b-51183f37fa11" key={l} aria-pressed={level===l} onClick={()=>setLevel(l)}><Typography shuku-edit-id="e-55b4f9ce-4bd5-45ff-9905-d06db09c0cde" variant="bodySmall" tone="inherit">{l}</Typography></button>)}</div><Typography shuku-edit-id="e-504a4028-270f-4926-baff-aac30fe5170b" variant="bodySmall" tone="muted">{visible.length} 门示例课程</Typography></div>
     <div shuku-edit-id="e-9fb491fd-8047-434f-a245-18236c1428fc" className="rf-library-grid">{visible.map(c=><article shuku-edit-id="e-3646befd-ec4c-4eb5-8386-83d090a6f4ba" className="rf-library-card" key={c.index}>
      <button shuku-edit-id="e-71c2cdc7-5529-4c95-b8ba-96764158ed5f" className="rf-library-cover" data-course={c.index} aria-label={`查看${c.title}`} onClick={()=>open(c.index)}><img shuku-edit-id="e-9c393225-302c-4e3b-982b-5852e0a17849" src={cover(c.index)} alt={`${c.title}课程预览`} loading={c.index<3?'eager':'lazy'}/><Typography shuku-edit-id="e-aa4201f2-866e-4468-81c3-74a8319f4d79" as="span" variant="bodySmall">{c.pages} 页</Typography></button>
      <div shuku-edit-id="e-9f00a013-e942-46dd-a351-db12707daa3c" className="rf-library-card-copy"><div shuku-edit-id="e-d081a05f-09d6-4215-9d5e-ac4821413310" className="rf-library-meta"><Typography shuku-edit-id="e-3ad7e04d-d4d5-443f-9cb3-91145868a155" variant="bodySmall" tone="muted">{c.topic} · {c.level}</Typography><button shuku-edit-id="e-2277fcb7-6ded-4812-9533-e4813e1beab9" aria-label={`收藏${c.title}`} aria-pressed={saved.includes(c.index)} onClick={()=>setSaved(s=>s.includes(c.index)?s.filter(i=>i!==c.index):[...s,c.index])}><Bookmark/></button></div><Typography shuku-edit-id="e-c5a9585e-2759-4e3e-903e-a7f686346382" variant="h3">{c.title}</Typography><Typography shuku-edit-id="e-409e516d-6bde-4fac-8fba-1ca8859ca9ee" className="rf-library-description" variant="bodySmall" tone="muted">{c.description}</Typography><div shuku-edit-id="e-c2dc1e26-26a3-4ad4-a2ef-685241201db8" className="rf-library-actions"><button shuku-edit-id="e-fb455dcd-7707-41b7-8f05-aa74672dfcb9" onClick={()=>open(c.index)}><BookOpen/><Typography shuku-edit-id="e-4501a776-06c4-434c-b90e-5eeececa5b58" variant="bodySmall" tone="inherit">自学互动</Typography></button><button shuku-edit-id="e-06233e0e-bd7f-4d14-87af-3f06c2fb317c" onClick={()=>open(c.index,'教学展示模式')}><Play/><Typography shuku-edit-id="e-59033227-e458-484c-8a27-4fadc5a4bada" variant="bodySmall" tone="inherit">教学展示</Typography></button></div></div>
     </article>)}</div>{!visible.length&&<Typography shuku-edit-id="e-93bbe952-16a3-42c1-a455-e1e797a404b5" className="rf-library-empty" variant="body" tone="muted">没有匹配的示例课程，试试其他关键词。</Typography>}
    </main>
   </div>
   {selected!==null&&<div shuku-edit-id="e-45d1f7e3-2d11-4cd7-b5be-c251ae7a8c0d" className="rf-library-detail-backdrop"><section shuku-edit-id="e-3b948e6a-bbed-4011-abdc-5401238d3993" className="rf-library-detail" role="dialog" aria-label="课程体验预览" aria-modal="true"><div shuku-edit-id="e-f0adba89-f2b3-4405-9b65-7c3179e07111" className="rf-library-detail-top"><button shuku-edit-id="e-084f9f57-ef37-4938-b56b-99b910678eb5" aria-label="返回课程库" onClick={()=>setSelected(null)}><ArrowLeft/><Typography shuku-edit-id="e-3f5725bc-78f8-4708-8ae4-22c0f3b811fa" variant="bodySmall">返回课程库</Typography></button><button shuku-edit-id="e-14369133-7bf2-4518-a0f4-1c94f2d0c14d" aria-label="关闭课程预览" onClick={()=>setSelected(null)}><X/></button></div><div shuku-edit-id="e-18c0aaed-08bd-4111-87f7-c79336f49e35" className="rf-library-detail-content"><img shuku-edit-id="e-34b10a5e-22fc-48a5-9f1f-9fbfc9ed3d44" src={cover(selected)} alt={`${courses[selected].title}课件预览`}/><div shuku-edit-id="e-44fe7684-243a-4217-919d-2c4fbfa44572"><Typography shuku-edit-id="e-b1233ab7-473c-4add-b692-bed1efdeab0f" variant="bodySmall" tone="muted">{courses[selected].topic} · {courses[selected].pages} 页</Typography><Typography shuku-edit-id="e-91a9190a-30a4-420d-a2e3-bf54809536f6" variant="h2">{courses[selected].title}</Typography><Typography shuku-edit-id="e-7b93406a-7bc8-40c3-ba41-56eed2630b2c" variant="body" tone="muted">{courses[selected].description}</Typography><div shuku-edit-id="e-7d3806dc-6e32-4d5d-b7b3-77d36dd00fa5" className="rf-library-modes">{['自学互动模式','教学展示模式'].map(m=><button shuku-edit-id="e-aea70009-cdd4-44e6-83d9-f662679b2a48" data-mode={m} key={m} aria-pressed={mode===m} onClick={()=>setMode(m)}><Typography shuku-edit-id="e-c0a4a6df-403a-481a-bcb6-1bd3f86eea9a" variant="bodySmall" tone="inherit">{m}</Typography></button>)}</div><Typography shuku-edit-id="e-8b81011f-463d-453f-86be-1dff077ffc0d" className="rf-library-mode-description" variant="bodySmall">{mode==='自学互动模式'?'按自己的节奏探索：观察现象、调整参数、逐步理解。':'面向课堂讲解：聚焦知识主线，配合交互示例展开说明。'}</Typography></div></div></section></div>}
  </div>
 </section>;
}
