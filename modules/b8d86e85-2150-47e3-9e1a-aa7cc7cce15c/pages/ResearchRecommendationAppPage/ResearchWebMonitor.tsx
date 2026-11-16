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
 return <div shuku-edit-id="e-02a86366-06b8-43d8-8221-cf8bbf2395fe" className="rw-monitor" aria-label="网页版科研信息服务演示" onWheel={e=>e.stopPropagation()} onPointerDown={e=>e.stopPropagation()} onKeyDown={e=>e.stopPropagation()}>
  <img shuku-edit-id="e-22e14be3-a3a8-434c-b69d-ba570d2dd966" className="rw-device-photo" src={moduleAssetUrl('images/recommendation-app/monitor-photoreal.png')} alt="" draggable={false} aria-hidden="true"/>
  <div shuku-edit-id="e-7ebe7077-5ac7-4e63-9730-f06cdff42a54" className="rw-case"><i shuku-edit-id="e-0702bbe5-ad03-40f0-b3a4-ef9ffa7183bb" className="rw-camera"/>
   <div shuku-edit-id="e-be0a87ee-3e69-4187-9678-ffec20ac3c62" className="rw-display" data-feed-screen="desktop" data-ppt-viewport="电脑内的本地网站视口">
    <div shuku-edit-id="e-105eaeb5-b4f6-4847-922f-c9df1bd6e428" className="rw-website">
     <header shuku-edit-id="e-51a5ca90-1803-4992-853a-1c710ab8ed56" className="rw-nav">
      <button shuku-edit-id="e-c30fd956-6446-4e38-8184-bdf65f359502" className="rw-logo" aria-label="网站首页" onClick={()=>changeTab('首页')}><img shuku-edit-id="e-b645d84a-a5b5-4112-9744-9e2ce925df88" src={moduleAssetUrl('images/recommendation-app/reduct-official-logo.png')} alt="减论科技"/></button>
      <nav shuku-edit-id="e-5878dc84-e619-4148-910b-7737e642c82b" aria-label="网页版导航">{['首页','热点','论文收藏'].map(t=><button shuku-edit-id="e-8a0854a9-3670-4293-aa2c-1abf9b36b001" key={t} className={tab===t?'active':''} onClick={()=>changeTab(t)}><Typography shuku-edit-id="e-c322ab02-1fad-4305-a1ee-ebff350513eb" as="span" variant="bodySmall" tone="inherit">{t}</Typography></button>)}<button shuku-edit-id="e-a01c5c80-210c-4bbf-9353-15177d994898" onClick={()=>setNotice('新芽计划：连接科研学习、实践培养与导师指导。')}>新芽计划⌄</button><button shuku-edit-id="e-0e1f17a4-e80f-4a3f-a866-08b3b7e82f8a" onClick={()=>setNotice('优博之路：关注科研成长与学术交流。')}>优博之路⌄</button></nav>
      <button shuku-edit-id="e-e793e8fa-181c-4099-a418-ff1c0657d155" className="rw-login" onClick={()=>setNotice('当前展示论文发现与阅读体验，可直接浏览和收藏。')}>登录</button>
     </header>
     <div shuku-edit-id="e-98fa3b80-baf9-427e-aca8-cb7cd36d9e3c" className="rw-scroll" ref={viewport} data-ppt-viewport="网页版论文列表和详情滚动区"><div shuku-edit-id="e-f97326e0-4f2e-468f-8acc-6f56e2c3ec0f" data-ambient-feed-content>
      {notice&&<div shuku-edit-id="e-4aebadce-6eed-4db8-ae68-12b1a76488dc" className="rw-notice" role="status"><Typography shuku-edit-id="e-d5b8d5ba-45fd-4883-9430-9eff9ac41028" variant="bodySmall" tone="inherit">{notice}</Typography><button shuku-edit-id="e-abe97d7b-83f0-4d74-8c8f-f9bc510ccf4a" aria-label="关闭网站提示" onClick={()=>setNotice('')}><X size={17}/></button></div>}
      {detail?<div shuku-edit-id="e-f329184a-2aca-424d-a672-275980492fdb" className="rw-detail">
       <button shuku-edit-id="e-5907bc5b-362e-4171-a045-18e376a2a134" className="rw-back" onClick={()=>{setDetail(null);viewport.current?.scrollTo({top:0})}}><ArrowLeft size={16}/> 返回论文列表</button>
       <Typography shuku-edit-id="e-62778ca1-4be2-42e2-8d51-91530030de3c" variant="h2" tone="inherit">{detail.title}</Typography>
       <Typography shuku-edit-id="e-20070570-5015-4ac4-8ed2-438f36a39274" className="rw-authors" variant="bodySmall" tone="inherit">{detail.authors}</Typography>
       <div shuku-edit-id="e-cbd41b44-b289-4062-a86c-122bb4a9d35c" className="rw-detail-meta"><Typography shuku-edit-id="e-713dd14a-e1f8-4c83-a35e-d1329f8bce6c" variant="bodySmall" tone="inherit">{detail.category} · {detail.date}</Typography><button shuku-edit-id="e-68fbbd69-93e7-4070-866f-93fdba48ee4c" className={saved.includes(detail.id)?'chosen':''} onClick={()=>toggle(detail.id,saved,setSaved)}><Bookmark size={17}/>{saved.includes(detail.id)?'已收藏':'收藏论文'}</button></div>
       <Typography shuku-edit-id="e-b2ae245e-96b5-4e6f-bb6c-af1f9b4e10da" variant="h3" tone="inherit">研究概览</Typography><Typography shuku-edit-id="e-8ab3d5f3-890b-41c3-a9d5-6fea0eee03f0" variant="body" tone="inherit">{detail.abstract}</Typography>
       <img shuku-edit-id="e-38552ef5-53c8-4a1e-afc4-2096b87ae988" className="rw-detail-image" src={moduleAssetUrl(detail.image)} alt={`${detail.title} 论文配图`}/>
       <Typography shuku-edit-id="e-95eb3ffa-0ca5-4967-9fea-81391bf49546" variant="bodySmall" tone="muted">结合论文图文概览，了解研究问题、方法与主要内容。</Typography>
      </div>:<>
       <div shuku-edit-id="e-5ee45c4f-5d93-4376-b9d3-f60eb224fd72" className="rw-page-heading"><Typography shuku-edit-id="e-5014a7c5-dd89-4dca-859a-14a86a6d2274" variant="h2" tone="inherit">{tab==='论文收藏'?'我的论文收藏':tab==='热点'?'全球科研热点':'今日减论热点'}</Typography><Typography shuku-edit-id="e-b022a03e-25fb-4aef-b0c8-ee889091bf9c" variant="bodySmall" tone="inherit">{tab==='论文收藏'?'Saved Papers':'Global Trending Research'}</Typography></div>
       <label shuku-edit-id="e-ddd08094-4e5e-40b5-83e3-ce05a1d68586" className="rw-search"><Search size={16}/><input shuku-edit-id="e-a5b95969-59fb-4c26-a901-ba1dda5981b0" aria-label="网页版搜索论文" placeholder="搜索论文或研究关键词" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button shuku-edit-id="e-ff6582e0-605b-46f9-80d5-aebb546dec97" aria-label="清空网站搜索" onClick={()=>setQuery('')}><X size={15}/></button>}</label>
       <div shuku-edit-id="e-f4594224-07d4-4be8-a8c5-4523adc9a927" className="rw-paper-list">{visible.map((p,i)=><article shuku-edit-id="e-5651d0fc-a321-4459-8b2a-ace948c05e41" className="rw-paper" key={p.id}>
        <Typography shuku-edit-id="e-4748e820-9a22-494f-880d-6013e619c018" className={`rw-rank rw-rank-${Math.min(i,2)}`} variant="h2" tone="inherit">{String(i+1).padStart(2,'0')}</Typography>
        <button shuku-edit-id="e-4fe03a0e-e9d3-4958-91fa-d2aaf925cd9f" className="rw-thumb" aria-label={`网页版查看配图 ${p.id}`} onClick={()=>open(p)}><img shuku-edit-id="e-a4ba9f59-8cd0-4034-b9f8-5412b903f025" src={moduleAssetUrl(p.image)} alt={`${p.title} 论文配图`}/></button>
        <div shuku-edit-id="e-5e014755-fab7-4897-80f1-c64dc77680db" className="rw-paper-content">
         <button shuku-edit-id="e-24fcfe70-8ad8-48d7-b306-7f452e6c51eb" className="rw-title" aria-label={`网页版阅读 ${p.id}`} onClick={()=>open(p)}><Typography shuku-edit-id="e-282ad1a7-17fd-4c6b-80f6-cbb4e8b116bf" variant="h3" tone="inherit">{p.title}</Typography></button>
         <Typography shuku-edit-id="e-31b18a0b-8442-4244-a409-7a6ba517548e" className="rw-authors" variant="bodySmall" tone="inherit">{p.authors}</Typography>
         <Typography shuku-edit-id="e-5815815a-ceff-49ff-a8d0-c25cdc0d79d5" className="rw-abstract" variant="bodySmall" tone="inherit">{p.abstract}</Typography>
         <div shuku-edit-id="e-9d0eacad-76c0-4728-b58f-3ec897c5eaac" className="rw-paper-footer"><div shuku-edit-id="e-e5253b9a-bc60-4006-a182-2c4ea68c260f"><Typography shuku-edit-id="e-5a3ac12c-da19-4c9c-b0e5-73e1b0731d76" as="span" className="rw-category" variant="bodySmall" tone="inherit">{p.category}</Typography><Typography shuku-edit-id="e-98411f01-75da-4fd2-87a8-f41eaf420f56" as="span" variant="bodySmall" tone="inherit">发布于 {p.date}</Typography></div><div shuku-edit-id="e-7da7d9b8-680d-41c9-8f40-35f4129a89a3" className="rw-actions"><span shuku-edit-id="e-614b7687-8284-498e-8194-2e2f18e77824" className="rw-stars"><Star size={13}/>{p.stars}</span><button shuku-edit-id="e-c22f3846-ccd9-4370-b341-e8b012ca59a5" aria-label={`网页版点赞 ${p.id}`} aria-pressed={likes.includes(p.id)} onClick={()=>toggle(p.id,likes,setLikes)}><Heart size={16}/>{p.likes+Number(likes.includes(p.id))}</button><button shuku-edit-id="e-cc9073be-44e9-4fe7-a5c1-b872cb6bfbb7" aria-label={`网页版收藏 ${p.id}`} aria-pressed={saved.includes(p.id)} onClick={()=>toggle(p.id,saved,setSaved)}><Bookmark size={16}/>{p.saves+Number(saved.includes(p.id))}</button></div></div>
        </div>
       </article>)}{!visible.length&&<div shuku-edit-id="e-6d874c22-c573-45ae-aa20-eca99eac21d4" className="rw-empty"><BookOpen/><Typography shuku-edit-id="e-a9b84a5f-8334-4c12-ba22-7fc1896036cb" variant="h3" tone="inherit">{tab==='论文收藏'?'收藏值得深入阅读的论文':'没有找到相关论文'}</Typography><Typography shuku-edit-id="e-6081f4b3-6f42-4421-97eb-4ffefb33c86e" variant="bodySmall" tone="inherit">{tab==='论文收藏'?'点击论文卡片的收藏图标，即可在这里回看。':'试试其他题目或关键词。'}</Typography><button shuku-edit-id="e-0cee7497-a5af-4dbe-98cf-d5b96bcbbbe8" onClick={()=>changeTab('首页')}>浏览推荐论文</button></div>}</div>
      </>}
     </div></div>
    </div>
   </div>
   <div shuku-edit-id="e-e7cf4477-a4bc-4c60-9003-838740148c0f" className="rw-chin"/>
  </div>
  <div shuku-edit-id="e-66ec8f15-6069-4fa8-9d14-5e1b8e41daf2" className="rw-stand"/><div shuku-edit-id="e-ae94564a-2335-4fba-a9df-2500c99dd436" className="rw-foot"/>
 </div>
}
