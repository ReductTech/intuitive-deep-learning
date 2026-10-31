import { useRef, useState } from 'react';
import { BookOpen, Search, Grid2X2, Brain, Image, Sparkles, Bookmark, Play, X, ArrowLeft } from 'lucide-react';
import { Typography, moduleAssetUrl } from '../../../shared/react';
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
const cover=(index:number)=>moduleAssetUrl(moduleIdentity.id,`showcase/library-covers/course-${index+1}.jpg`);

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
 return <section ref={root} className="rf-page rf-shuku-website rf-recording-demo" aria-label="术库课程图书馆本地交互演示">
  <div className="rf-library-shell">
   <header className="rf-library-header"><div className="rf-library-brand"><BookOpen/><Typography variant="h3">术库</Typography></div><Typography variant="body" className="rf-library-current">探索课程</Typography><Typography variant="body" tone="muted">个人中心</Typography><Typography variant="body" tone="muted">课程创作</Typography><Typography className="rf-library-demo-label" variant="bodySmall" tone="muted">交互演示</Typography></header>
   <div className="rf-library-layout">
    <aside className="rf-library-sidebar"><Typography variant="bodySmall" tone="muted">课程图书馆</Typography><nav aria-label="课程分类">{topics.map(({name,Icon})=><button key={name} data-topic={name} aria-pressed={topic===name} onClick={()=>{setTopic(name);setSelected(null);}}><Icon/><Typography variant="bodySmall" tone="inherit">{name}</Typography></button>)}</nav><div className="rf-library-community"><Sparkles/><Typography variant="bodySmall">让知识在共创中进化</Typography><Typography variant="bodySmall" tone="muted">分享一种理解，一起完善一门课程。</Typography></div></aside>
    <main className="rf-library-main" data-ppt-viewport="本地模拟课程库滚动区域">
     <label className="rf-library-search"><Search/><input aria-label="搜索课程" value={query} onChange={e=>setQuery(e.target.value)} placeholder="想了解什么？搜索课程或知识点…"/></label>
     <div className="rf-library-toolbar"><div>{['全部','入门','进阶'].map(l=><button key={l} aria-pressed={level===l} onClick={()=>setLevel(l)}><Typography variant="bodySmall" tone="inherit">{l}</Typography></button>)}</div><Typography variant="bodySmall" tone="muted">{visible.length} 门示例课程</Typography></div>
     <div className="rf-library-grid">{visible.map(c=><article className="rf-library-card" key={c.index}>
      <button className="rf-library-cover" data-course={c.index} aria-label={`查看${c.title}`} onClick={()=>open(c.index)}><img src={cover(c.index)} alt={`${c.title}课程预览`} loading={c.index<3?'eager':'lazy'}/><Typography as="span" variant="bodySmall">{c.pages} 页</Typography></button>
      <div className="rf-library-card-copy"><div className="rf-library-meta"><Typography variant="bodySmall" tone="muted">{c.topic} · {c.level}</Typography><button aria-label={`收藏${c.title}`} aria-pressed={saved.includes(c.index)} onClick={()=>setSaved(s=>s.includes(c.index)?s.filter(i=>i!==c.index):[...s,c.index])}><Bookmark/></button></div><Typography variant="h3">{c.title}</Typography><Typography className="rf-library-description" variant="bodySmall" tone="muted">{c.description}</Typography><div className="rf-library-actions"><button onClick={()=>open(c.index)}><BookOpen/><Typography variant="bodySmall" tone="inherit">自学互动</Typography></button><button onClick={()=>open(c.index,'教学展示模式')}><Play/><Typography variant="bodySmall" tone="inherit">教学展示</Typography></button></div></div>
     </article>)}</div>{!visible.length&&<Typography className="rf-library-empty" variant="body" tone="muted">没有匹配的示例课程，试试其他关键词。</Typography>}
    </main>
   </div>
   {selected!==null&&<div className="rf-library-detail-backdrop"><section className="rf-library-detail" role="dialog" aria-label="课程体验预览" aria-modal="true"><div className="rf-library-detail-top"><button aria-label="返回课程库" onClick={()=>setSelected(null)}><ArrowLeft/><Typography variant="bodySmall">返回课程库</Typography></button><button aria-label="关闭课程预览" onClick={()=>setSelected(null)}><X/></button></div><div className="rf-library-detail-content"><img src={cover(selected)} alt={`${courses[selected].title}课件预览`}/><div><Typography variant="bodySmall" tone="muted">{courses[selected].topic} · {courses[selected].pages} 页</Typography><Typography variant="h2">{courses[selected].title}</Typography><Typography variant="body" tone="muted">{courses[selected].description}</Typography><div className="rf-library-modes">{['自学互动模式','教学展示模式'].map(m=><button data-mode={m} key={m} aria-pressed={mode===m} onClick={()=>setMode(m)}><Typography variant="bodySmall" tone="inherit">{m}</Typography></button>)}</div><Typography className="rf-library-mode-description" variant="bodySmall">{mode==='自学互动模式'?'按自己的节奏探索：观察现象、调整参数、逐步理解。':'面向课堂讲解：聚焦知识主线，配合交互示例展开说明。'}</Typography></div></div></section></div>}
  </div>
 </section>;
}
