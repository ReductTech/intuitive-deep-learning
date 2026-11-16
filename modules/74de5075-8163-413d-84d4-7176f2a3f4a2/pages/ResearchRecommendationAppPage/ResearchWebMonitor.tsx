import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import {useRef,useState} from 'react';
import {ArrowLeft,Bookmark,Heart,Search,X,Star,BookOpen} from 'lucide-react';
import { Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import papers from './webPapers.json';
import './ResearchWebMonitor.css';
import {useAmbientFeedScroll} from './useAmbientFeedScroll';

type WebPaper=typeof papers[number];
// Bundled snapshot: this demo contains no iframe, remote image URL, fetch, or production login.
export function ResearchWebMonitor(){
 const [tab,setTab]=useState('首页'),[saved,setSaved]=useState<string[]>([]),[likes,setLikes]=useState<string[]>([]);
 const [query,setQuery]=useState(''),[detail,setDetail]=useState<WebPaper|null>(null),[notice,setNotice]=useState('');
 const viewport=useRef<HTMLDivElement>(null);
 useAmbientFeedScroll(viewport, 'desktop');
 function changeTab(value:string){setTab(value);setDetail(null);setNotice('');setQuery('');viewport.current?.scrollTo({top:0})}
 function toggle(id:string,values:string[],set:(v:string[])=>void){set(values.includes(id)?values.filter(v=>v!==id):[...values,id])}
 const visible=papers.filter(p=>(tab!=='论文收藏'||saved.includes(p.id))&&`${p.title} ${p.abstract} ${p.category}`.toLowerCase().includes(query.toLowerCase()));
 function open(p:WebPaper){setDetail(p);viewport.current?.scrollTo({top:0})}
 return <div shuku-edit-id="e-db830491-5b13-4c49-8950-d62338e5cf00" className="rw-monitor" aria-label="网页版科研信息服务演示" onWheel={e=>e.stopPropagation()} onPointerDown={e=>e.stopPropagation()} onKeyDown={e=>e.stopPropagation()}>
  <img shuku-edit-id="e-83116d42-a47f-4df9-84d2-8bfd8f88f5a6" className="rw-device-photo" src={moduleAssetUrl('images/recommendation-app/monitor-photoreal.png')} alt="" draggable={false} aria-hidden="true"/>
  <div shuku-edit-id="e-5fac7dff-e1a2-47d8-9170-a90236b85854" className="rw-case"><i shuku-edit-id="e-f4bf6aa6-d7d6-46e4-9d46-86d16c6c5f45" className="rw-camera"/>
   <div shuku-edit-id="e-f682adc2-0b7e-4a75-a441-2df64e10e78d" className="rw-display" data-feed-screen="desktop" data-ppt-viewport="电脑内的本地网站视口">
    <div shuku-edit-id="e-8e893834-bf93-4b5f-823b-0c7a82c2a442" className="rw-website">
     <header shuku-edit-id="e-c86e681d-a2e6-433e-8127-8236a0d04e62" className="rw-nav">
      <button shuku-edit-id="e-e9388b93-9725-4511-a411-e417e892b2a3" className="rw-logo" aria-label="网站首页" onClick={()=>changeTab('首页')}><img shuku-edit-id="e-edeaa29a-71bf-45a5-a9cc-16069b589024" src={moduleAssetUrl('images/recommendation-app/reduct-official-logo.png')} alt="减论科技"/></button>
      <nav shuku-edit-id="e-1b65ffa7-d626-4352-8db0-3bee4fdc4b8b" aria-label="网页版导航">{['首页','热点','论文收藏'].map(t=><button shuku-edit-id="e-c31c4f98-3470-44d7-8d83-f08390e255ac" key={t} className={tab===t?'active':''} onClick={()=>changeTab(t)}><Typography shuku-edit-id="e-c687326b-4a50-43b5-ac09-8632230d5909" as="span" variant="bodySmall" tone="inherit">{t}</Typography></button>)}<button shuku-edit-id="e-c4c3d341-b4fa-4609-858d-2fc64fd7e3d0" onClick={()=>setNotice('新芽计划：连接科研学习、实践培养与导师指导。')}>新芽计划⌄</button><button shuku-edit-id="e-c3125cd5-50f9-41e2-90ef-ecf88c13e722" onClick={()=>setNotice('优博之路：关注科研成长与学术交流。')}>优博之路⌄</button></nav>
      <button shuku-edit-id="e-f4bbd2c5-2d2f-4fbd-846a-625d57676cd6" className="rw-login" onClick={()=>setNotice('当前展示论文发现与阅读体验，可直接浏览和收藏。')}>登录</button>
     </header>
     <div shuku-edit-id="e-7a548d37-a815-4d3a-bd2e-97a3963294c0" className="rw-scroll" ref={viewport} data-ppt-viewport="网页版论文列表和详情滚动区"><div shuku-edit-id="e-b7d5496f-c12c-4e6a-b30d-6cb8add135a0" data-ambient-feed-content>
      {notice&&<div shuku-edit-id="e-b9c89d39-ab7e-4059-b25b-d59d03d5165f" className="rw-notice" role="status"><Typography shuku-edit-id="e-76a7c5ef-63f5-4aed-8f37-c411a88a309e" variant="bodySmall" tone="inherit">{notice}</Typography><button shuku-edit-id="e-65da3e8a-2353-4ca8-8bf2-f7ebf91ed541" aria-label="关闭网站提示" onClick={()=>setNotice('')}><X size={17}/></button></div>}
      {detail?<div shuku-edit-id="e-50eda9a8-c465-4e9f-891d-9c45df81abb4" className="rw-detail">
       <button shuku-edit-id="e-7be9209d-5ab0-4d9a-9888-f523968e8b60" className="rw-back" onClick={()=>{setDetail(null);viewport.current?.scrollTo({top:0})}}><ArrowLeft size={16}/> 返回论文列表</button>
       <Typography shuku-edit-id="e-9d592445-a0fd-4de3-8692-67cd6930da36" variant="h2" tone="inherit">{detail.title}</Typography>
       <Typography shuku-edit-id="e-2edd8b2f-9451-4895-8b46-8bd7f6b0fb6c" className="rw-authors" variant="bodySmall" tone="inherit">{detail.authors}</Typography>
       <div shuku-edit-id="e-b190630d-53fb-4f14-af78-4a21ef17ca11" className="rw-detail-meta"><Typography shuku-edit-id="e-d941af28-adac-48f0-80ca-9428811fa759" variant="bodySmall" tone="inherit">{detail.category} · {detail.date}</Typography><button shuku-edit-id="e-824106e3-0474-4646-bf5f-5bc888636861" className={saved.includes(detail.id)?'chosen':''} onClick={()=>toggle(detail.id,saved,setSaved)}><Bookmark size={17}/>{saved.includes(detail.id)?'已收藏':'收藏论文'}</button></div>
       <Typography shuku-edit-id="e-e734363a-4653-4984-bf23-a8cebf924eef" variant="h3" tone="inherit">研究概览</Typography><Typography shuku-edit-id="e-71ca2d6c-f3f8-4fc8-92a3-3ae754473d1a" variant="body" tone="inherit">{detail.abstract}</Typography>
       <img shuku-edit-id="e-19eba8ee-5168-4f04-bdcd-b12a290712ba" className="rw-detail-image" src={moduleAssetUrl(detail.image)} alt={`${detail.title} 论文配图`}/>
       <Typography shuku-edit-id="e-c41a1de1-084a-46ec-a5e0-a7f2dc2e2bbb" variant="bodySmall" tone="muted">结合论文图文概览，了解研究问题、方法与主要内容。</Typography>
      </div>:<>
       <div shuku-edit-id="e-bc12a2e4-438f-4acb-90a6-696287be4b6a" className="rw-page-heading"><Typography shuku-edit-id="e-4436aee8-1819-4932-acfa-4be187fabca7" variant="h2" tone="inherit">{tab==='论文收藏'?'我的论文收藏':tab==='热点'?'全球科研热点':'今日减论热点'}</Typography><Typography shuku-edit-id="e-beeb4053-177e-4976-b556-e1645632cd5f" variant="bodySmall" tone="inherit">{tab==='论文收藏'?'Saved Papers':'Global Trending Research'}</Typography></div>
       <label shuku-edit-id="e-9f7cabb6-5609-4f69-9fd5-39283f909b57" className="rw-search"><Search size={16}/><input shuku-edit-id="e-ce234a0b-ca09-4caf-a392-52f4e4b4b235" aria-label="网页版搜索论文" placeholder="搜索论文或研究关键词" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button shuku-edit-id="e-87786e42-e96c-4936-9bba-4bd6fc28b451" aria-label="清空网站搜索" onClick={()=>setQuery('')}><X size={15}/></button>}</label>
       <div shuku-edit-id="e-9ecbe0e6-70f3-4168-a0ae-c4ba7d8fe317" className="rw-paper-list">{visible.map((p,i)=><article shuku-edit-id="e-e414553f-ecd3-49eb-9a54-d863866af92a" className="rw-paper" key={p.id}>
        <Typography shuku-edit-id="e-7b5ffb63-2a9e-46ea-a761-edd58918a82b" className={`rw-rank rw-rank-${Math.min(i,2)}`} variant="h2" tone="inherit">{String(i+1).padStart(2,'0')}</Typography>
        <button shuku-edit-id="e-0a5ee83d-5b38-43b7-919c-bdb26cd7b907" className="rw-thumb" aria-label={`网页版查看配图 ${p.id}`} onClick={()=>open(p)}><img shuku-edit-id="e-7daf809e-4e9a-4225-bd74-9199a9771e66" src={moduleAssetUrl(p.image)} alt={`${p.title} 论文配图`}/></button>
        <div shuku-edit-id="e-1335cf91-c18e-455b-a8bb-1a06a626c1c4" className="rw-paper-content">
         <button shuku-edit-id="e-c634105e-717d-4c43-95db-15ddc2712793" className="rw-title" aria-label={`网页版阅读 ${p.id}`} onClick={()=>open(p)}><Typography shuku-edit-id="e-3b3720c8-8a18-486b-8166-1cf9b8b6e37a" variant="h3" tone="inherit">{p.title}</Typography></button>
         <Typography shuku-edit-id="e-818489e5-fcbd-4847-9cbc-53597e35ac9e" className="rw-authors" variant="bodySmall" tone="inherit">{p.authors}</Typography>
         <Typography shuku-edit-id="e-2a6c365b-6420-4f48-926a-71a9469f93cd" className="rw-abstract" variant="bodySmall" tone="inherit">{p.abstract}</Typography>
         <div shuku-edit-id="e-3c41d7fa-c6a4-4170-8e03-a14123670fa4" className="rw-paper-footer"><div shuku-edit-id="e-e88e31b0-4def-440e-8dba-e5eeb00413bd"><Typography shuku-edit-id="e-02ef2ceb-fe24-41d8-b556-3c8ca120221d" as="span" className="rw-category" variant="bodySmall" tone="inherit">{p.category}</Typography><Typography shuku-edit-id="e-7ca5f2f6-5a81-4668-a6e9-0152698275b6" as="span" variant="bodySmall" tone="inherit">发布于 {p.date}</Typography></div><div shuku-edit-id="e-4d5a40ae-efc3-4c62-998a-082257e6ed6e" className="rw-actions"><span shuku-edit-id="e-fb557b25-fb4a-484a-ad9e-9d33d0c75ca1" className="rw-stars"><Star size={13}/>{p.stars}</span><button shuku-edit-id="e-0d787946-d19e-4bb4-a73f-8e8f9ac0c032" aria-label={`网页版点赞 ${p.id}`} aria-pressed={likes.includes(p.id)} onClick={()=>toggle(p.id,likes,setLikes)}><Heart size={16}/>{p.likes+Number(likes.includes(p.id))}</button><button shuku-edit-id="e-e8bea1c9-f27c-48df-8f4d-e2e28afa679d" aria-label={`网页版收藏 ${p.id}`} aria-pressed={saved.includes(p.id)} onClick={()=>toggle(p.id,saved,setSaved)}><Bookmark size={16}/>{p.saves+Number(saved.includes(p.id))}</button></div></div>
        </div>
       </article>)}{!visible.length&&<div shuku-edit-id="e-cbfd4029-efe3-415d-9473-446b07618a17" className="rw-empty"><BookOpen/><Typography shuku-edit-id="e-c7c5373c-7b49-4a6f-b0f5-1711694db83c" variant="h3" tone="inherit">{tab==='论文收藏'?'收藏值得深入阅读的论文':'没有找到相关论文'}</Typography><Typography shuku-edit-id="e-b774466a-c7b0-4084-9c80-7f7fc0c4071f" variant="bodySmall" tone="inherit">{tab==='论文收藏'?'点击论文卡片的收藏图标，即可在这里回看。':'试试其他题目或关键词。'}</Typography><button shuku-edit-id="e-e6e56aed-883d-44c0-85ec-a47cf198977c" onClick={()=>changeTab('首页')}>浏览推荐论文</button></div>}</div>
      </>}
     </div></div>
    </div>
   </div>
   <div shuku-edit-id="e-2442cb10-d844-4b05-942f-7856b0d7e88a" className="rw-chin"/>
  </div>
  <div shuku-edit-id="e-c1198319-3a04-46a4-b5f8-253b6ad6e862" className="rw-stand"/><div shuku-edit-id="e-17fd657b-1963-4b3b-8f60-dcb9b55f71dd" className="rw-foot"/>
 </div>
}
