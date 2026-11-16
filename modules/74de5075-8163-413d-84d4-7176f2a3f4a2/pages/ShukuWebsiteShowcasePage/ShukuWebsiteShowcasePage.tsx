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
const cover=(index:number)=>moduleAssetUrl(`research-foundation/showcase/library-covers/course-${index+1}.jpg`);

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
 return <section shuku-edit-id="e-f401d88a-e13e-4809-b17d-82a8ca770942" ref={root} className="rf-page rf-shuku-website rf-recording-demo" aria-label="术库课程图书馆本地交互演示">
  <div shuku-edit-id="e-a1e30d50-d34d-4ee7-93da-feaf6587959a" className="rf-library-shell">
   <header shuku-edit-id="e-64d44c13-4fe1-403e-bd10-bd87df47719c" className="rf-library-header"><div shuku-edit-id="e-829807c6-e7b7-430c-8047-8071586d064e" className="rf-library-brand"><BookOpen/><Typography shuku-edit-id="e-a6ce0d8e-997c-4b6a-9f04-0a456edb0948" variant="h3">术库</Typography></div><Typography shuku-edit-id="e-80e41e2e-1137-490c-8c92-84a0327c25d9" variant="body" className="rf-library-current">探索课程</Typography><Typography shuku-edit-id="e-30e58b55-a899-4a6c-8c53-f720a8b3c9e9" variant="body" tone="muted">个人中心</Typography><Typography shuku-edit-id="e-114d96cb-2c5b-4572-945d-0a92c917d277" variant="body" tone="muted">课程创作</Typography><Typography shuku-edit-id="e-a23be89a-9c47-4c10-92ab-8963364658a1" className="rf-library-demo-label" variant="bodySmall" tone="muted">交互演示</Typography></header>
   <div shuku-edit-id="e-1a3d75e0-6735-40eb-af76-c8946fe53268" className="rf-library-layout">
    <aside shuku-edit-id="e-7d451152-957d-4357-bfa7-96de47ef4725" className="rf-library-sidebar"><Typography shuku-edit-id="e-b43ddefd-b95e-4c3c-96c6-06fcbd0893f9" variant="bodySmall" tone="muted">课程图书馆</Typography><nav shuku-edit-id="e-b1c314b9-118f-4085-a152-fdcc5c578eff" aria-label="课程分类">{topics.map(({name,Icon})=><button shuku-edit-id="e-6d4006eb-d28b-4039-a3ec-17bdb5533cb3" key={name} data-topic={name} aria-pressed={topic===name} onClick={()=>{setTopic(name);setSelected(null);}}><Icon/><Typography shuku-edit-id="e-6c37ab27-88eb-4ff9-b1a8-1e279def9c88" variant="bodySmall" tone="inherit">{name}</Typography></button>)}</nav><div shuku-edit-id="e-37ac432f-8154-41d3-9d94-ca71b1c2ca12" className="rf-library-community"><Sparkles/><Typography shuku-edit-id="e-a9422dcb-9781-4e19-9e6d-8e619813e029" variant="bodySmall">让知识在共创中进化</Typography><Typography shuku-edit-id="e-8519b63b-c796-4370-892f-669e46803249" variant="bodySmall" tone="muted">分享一种理解，一起完善一门课程。</Typography></div></aside>
    <main shuku-edit-id="e-a54dd57b-ef2b-4c3b-8b86-5871f8ec2be8" className="rf-library-main" data-ppt-viewport="本地模拟课程库滚动区域">
     <label shuku-edit-id="e-66816d71-4573-4a44-8d7d-2d1c057b7b28" className="rf-library-search"><Search/><input shuku-edit-id="e-5790d1fe-f911-41fa-b171-1ad40a71ad4c" aria-label="搜索课程" value={query} onChange={e=>setQuery(e.target.value)} placeholder="想了解什么？搜索课程或知识点…"/></label>
     <div shuku-edit-id="e-5d54b0eb-9a97-46bf-9e9a-0c72160d12cd" className="rf-library-toolbar"><div shuku-edit-id="e-5f204607-d955-48b7-90be-095911122945">{['全部','入门','进阶'].map(l=><button shuku-edit-id="e-826913ce-8fcd-4fb6-abe0-c6d17b716546" key={l} aria-pressed={level===l} onClick={()=>setLevel(l)}><Typography shuku-edit-id="e-768f85f4-9b68-48d0-a4b3-2cff5f740dc2" variant="bodySmall" tone="inherit">{l}</Typography></button>)}</div><Typography shuku-edit-id="e-97d85be6-db30-478d-a989-6ed6195062d9" variant="bodySmall" tone="muted">{visible.length} 门示例课程</Typography></div>
     <div shuku-edit-id="e-9f0b234c-7359-4b7c-a893-798653d8609f" className="rf-library-grid">{visible.map(c=><article shuku-edit-id="e-95521b28-7a87-41eb-be5f-3d5a5925960e" className="rf-library-card" key={c.index}>
      <button shuku-edit-id="e-51a55411-1f03-4d7d-95f8-e7d6ade81004" className="rf-library-cover" data-course={c.index} aria-label={`查看${c.title}`} onClick={()=>open(c.index)}><img shuku-edit-id="e-137047e9-fc27-41fa-a439-cb82787187a5" src={cover(c.index)} alt={`${c.title}课程预览`} loading={c.index<3?'eager':'lazy'}/><Typography shuku-edit-id="e-8fa1a75e-4c7b-4ea4-98d3-1f7d832d0b3b" as="span" variant="bodySmall">{c.pages} 页</Typography></button>
      <div shuku-edit-id="e-24748788-02de-45c6-8cc5-47b57cffc1d8" className="rf-library-card-copy"><div shuku-edit-id="e-1fa99f6d-b8fd-4d4e-9634-b100225af4e8" className="rf-library-meta"><Typography shuku-edit-id="e-c3b6d95a-457d-4a58-ae39-8d7ade3c5b39" variant="bodySmall" tone="muted">{c.topic} · {c.level}</Typography><button shuku-edit-id="e-42037286-d051-492d-92ce-5642ef663c0c" aria-label={`收藏${c.title}`} aria-pressed={saved.includes(c.index)} onClick={()=>setSaved(s=>s.includes(c.index)?s.filter(i=>i!==c.index):[...s,c.index])}><Bookmark/></button></div><Typography shuku-edit-id="e-e03ed8d0-b671-4b25-bbba-ccf99e3b5004" variant="h3">{c.title}</Typography><Typography shuku-edit-id="e-f436d918-b1aa-4424-9fac-2a55e82fa274" className="rf-library-description" variant="bodySmall" tone="muted">{c.description}</Typography><div shuku-edit-id="e-56e76cfa-0d68-423a-bb37-ac374f6df730" className="rf-library-actions"><button shuku-edit-id="e-f21a2172-4ba9-4b48-a0ef-ba519f5cbb16" onClick={()=>open(c.index)}><BookOpen/><Typography shuku-edit-id="e-9760e5e8-a064-4c7f-8010-1234e001fcba" variant="bodySmall" tone="inherit">自学互动</Typography></button><button shuku-edit-id="e-d005154f-005d-4b99-8fd0-5a3ac46e695b" onClick={()=>open(c.index,'教学展示模式')}><Play/><Typography shuku-edit-id="e-c2a4ff18-1e7a-47f2-87ea-bc91a016bc2d" variant="bodySmall" tone="inherit">教学展示</Typography></button></div></div>
     </article>)}</div>{!visible.length&&<Typography shuku-edit-id="e-97e0629f-2eab-4858-bebc-5e332763840f" className="rf-library-empty" variant="body" tone="muted">没有匹配的示例课程，试试其他关键词。</Typography>}
    </main>
   </div>
   {selected!==null&&<div shuku-edit-id="e-5b8803ad-0529-4f78-94fa-fb3e0b571615" className="rf-library-detail-backdrop"><section shuku-edit-id="e-77b67764-107a-4778-88df-55183d6dd13e" className="rf-library-detail" role="dialog" aria-label="课程体验预览" aria-modal="true"><div shuku-edit-id="e-35f0ba8d-5845-44fd-ab23-0c0abf1b5dd6" className="rf-library-detail-top"><button shuku-edit-id="e-c832e3fe-6942-4d07-93f8-7fac26e73a3a" aria-label="返回课程库" onClick={()=>setSelected(null)}><ArrowLeft/><Typography shuku-edit-id="e-441996b9-d38a-4852-b4c2-679c635aee7d" variant="bodySmall">返回课程库</Typography></button><button shuku-edit-id="e-9eba1ab5-040a-4fcc-9c10-0cea1a7b30de" aria-label="关闭课程预览" onClick={()=>setSelected(null)}><X/></button></div><div shuku-edit-id="e-18c3926a-c3b5-4f36-a144-703eb0ddcf13" className="rf-library-detail-content"><img shuku-edit-id="e-fa87b809-c5ca-485e-a08e-716e1c68aa2d" src={cover(selected)} alt={`${courses[selected].title}课件预览`}/><div shuku-edit-id="e-fd3d6c47-85b8-4e97-9a8c-78c872daff26"><Typography shuku-edit-id="e-74842471-5030-4210-a81a-760b73da9b54" variant="bodySmall" tone="muted">{courses[selected].topic} · {courses[selected].pages} 页</Typography><Typography shuku-edit-id="e-68ba0c01-dcd9-496a-8e0d-9e2fbb47e08b" variant="h2">{courses[selected].title}</Typography><Typography shuku-edit-id="e-1e422cc3-87ec-4de4-81c6-77e134b34d8c" variant="body" tone="muted">{courses[selected].description}</Typography><div shuku-edit-id="e-78705ba5-22b9-4a9b-8d01-d9158c38024a" className="rf-library-modes">{['自学互动模式','教学展示模式'].map(m=><button shuku-edit-id="e-fe4cceb4-b483-4e8e-a9f0-030f970c4e38" data-mode={m} key={m} aria-pressed={mode===m} onClick={()=>setMode(m)}><Typography shuku-edit-id="e-3679282f-055e-464f-8132-eb19c5c5775f" variant="bodySmall" tone="inherit">{m}</Typography></button>)}</div><Typography shuku-edit-id="e-c95497d6-ba13-4305-a0f6-330793a70c9c" className="rf-library-mode-description" variant="bodySmall">{mode==='自学互动模式'?'按自己的节奏探索：观察现象、调整参数、逐步理解。':'面向课堂讲解：聚焦知识主线，配合交互示例展开说明。'}</Typography></div></div></section></div>}
  </div>
 </section>;
}
