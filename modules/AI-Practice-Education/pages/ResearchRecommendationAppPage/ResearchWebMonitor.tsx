import {useRef,useState} from 'react';
import {ArrowLeft,Bookmark,Heart,Search,X,Star,BookOpen} from 'lucide-react';
import {Typography,moduleAssetUrl} from '../../../shared/react';
import outline from '../../outlines.json';
import papers from './webPapers.json';
import './ResearchWebMonitor.css';

type WebPaper=typeof papers[number];
// Bundled snapshot: this demo contains no iframe, remote image URL, fetch, or production login.
export function ResearchWebMonitor(){
 const [tab,setTab]=useState('首页'),[saved,setSaved]=useState<string[]>([]),[likes,setLikes]=useState<string[]>([]);
 const [query,setQuery]=useState(''),[detail,setDetail]=useState<WebPaper|null>(null),[notice,setNotice]=useState('');
 const viewport=useRef<HTMLDivElement>(null);
 function changeTab(value:string){setTab(value);setDetail(null);setNotice('');setQuery('');viewport.current?.scrollTo({top:0})}
 function toggle(id:string,values:string[],set:(v:string[])=>void){set(values.includes(id)?values.filter(v=>v!==id):[...values,id])}
 const visible=papers.filter(p=>(tab!=='论文收藏'||saved.includes(p.id))&&`${p.title} ${p.abstract} ${p.category}`.toLowerCase().includes(query.toLowerCase()));
 function open(p:WebPaper){setDetail(p);viewport.current?.scrollTo({top:0})}
 return <div className="rw-monitor" aria-label="网页版科研信息服务演示" onWheel={e=>e.stopPropagation()} onPointerDown={e=>e.stopPropagation()} onKeyDown={e=>e.stopPropagation()}>
  <div className="rw-case"><i className="rw-camera"/>
   <div className="rw-display" data-ppt-viewport="电脑内的本地网站视口">
    <div className="rw-website">
     <header className="rw-nav">
      <button className="rw-logo" aria-label="网站首页" onClick={()=>changeTab('首页')}><img src={moduleAssetUrl(outline.moduleIdentity.id,'images/recommendation-app/reduct-mark-white.svg')} alt=""/><Typography as="span" variant="h3" tone="inherit">减论科技</Typography></button>
      <nav aria-label="网页版导航">{['首页','热点','论文收藏'].map(t=><button key={t} className={tab===t?'active':''} onClick={()=>changeTab(t)}><Typography as="span" variant="bodySmall" tone="inherit">{t}</Typography></button>)}<button onClick={()=>setNotice('新芽计划：连接科研学习、实践培养与导师指导。')}>新芽计划⌄</button><button onClick={()=>setNotice('优博之路：关注科研成长与学术交流。')}>优博之路⌄</button></nav>
      <button className="rw-login" onClick={()=>setNotice('当前展示论文发现与阅读体验，可直接浏览和收藏。')}>登录</button>
     </header>
     <div className="rw-scroll" ref={viewport} data-ppt-viewport="网页版论文列表和详情滚动区">
      {notice&&<div className="rw-notice" role="status"><Typography variant="bodySmall" tone="inherit">{notice}</Typography><button aria-label="关闭网站提示" onClick={()=>setNotice('')}><X size={17}/></button></div>}
      {detail?<div className="rw-detail">
       <button className="rw-back" onClick={()=>{setDetail(null);viewport.current?.scrollTo({top:0})}}><ArrowLeft size={16}/> 返回论文列表</button>
       <Typography variant="h2" tone="inherit">{detail.title}</Typography>
       <Typography className="rw-authors" variant="bodySmall" tone="inherit">{detail.authors}</Typography>
       <div className="rw-detail-meta"><Typography variant="bodySmall" tone="inherit">{detail.category} · {detail.date}</Typography><button className={saved.includes(detail.id)?'chosen':''} onClick={()=>toggle(detail.id,saved,setSaved)}><Bookmark size={17}/>{saved.includes(detail.id)?'已收藏':'收藏论文'}</button></div>
       <Typography variant="h3" tone="inherit">研究概览</Typography><Typography variant="body" tone="inherit">{detail.abstract}</Typography>
       <img className="rw-detail-image" src={moduleAssetUrl(outline.moduleIdentity.id,detail.image)} alt={`${detail.title} 论文配图`}/>
       <Typography variant="bodySmall" tone="muted">结合论文图文概览，了解研究问题、方法与主要内容。</Typography>
      </div>:<>
       <div className="rw-page-heading"><Typography variant="h2" tone="inherit">{tab==='论文收藏'?'我的论文收藏':tab==='热点'?'全球科研热点':'今日减论热点'}</Typography><Typography variant="bodySmall" tone="inherit">{tab==='论文收藏'?'Saved Papers':'Global Trending Research'}</Typography></div>
       <label className="rw-search"><Search size={16}/><input aria-label="网页版搜索论文" placeholder="搜索论文或研究关键词" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button aria-label="清空网站搜索" onClick={()=>setQuery('')}><X size={15}/></button>}</label>
       <div className="rw-paper-list">{visible.map((p,i)=><article className="rw-paper" key={p.id}>
        <Typography className={`rw-rank rw-rank-${Math.min(i,2)}`} variant="h2" tone="inherit">{String(i+1).padStart(2,'0')}</Typography>
        <button className="rw-thumb" aria-label={`网页版查看配图 ${p.id}`} onClick={()=>open(p)}><img src={moduleAssetUrl(outline.moduleIdentity.id,p.image)} alt={`${p.title} 论文配图`}/></button>
        <div className="rw-paper-content">
         <button className="rw-title" aria-label={`网页版阅读 ${p.id}`} onClick={()=>open(p)}><Typography variant="h3" tone="inherit">{p.title}</Typography></button>
         <Typography className="rw-authors" variant="bodySmall" tone="inherit">{p.authors}</Typography>
         <Typography className="rw-abstract" variant="bodySmall" tone="inherit">{p.abstract}</Typography>
         <div className="rw-paper-footer"><div><Typography as="span" className="rw-category" variant="bodySmall" tone="inherit">{p.category}</Typography><Typography as="span" variant="bodySmall" tone="inherit">发布于 {p.date}</Typography></div><div className="rw-actions"><span className="rw-stars"><Star size={13}/>{p.stars}</span><button aria-label={`网页版点赞 ${p.id}`} aria-pressed={likes.includes(p.id)} onClick={()=>toggle(p.id,likes,setLikes)}><Heart size={16}/>{p.likes+Number(likes.includes(p.id))}</button><button aria-label={`网页版收藏 ${p.id}`} aria-pressed={saved.includes(p.id)} onClick={()=>toggle(p.id,saved,setSaved)}><Bookmark size={16}/>{p.saves+Number(saved.includes(p.id))}</button></div></div>
        </div>
       </article>)}{!visible.length&&<div className="rw-empty"><BookOpen/><Typography variant="h3" tone="inherit">{tab==='论文收藏'?'收藏值得深入阅读的论文':'没有找到相关论文'}</Typography><Typography variant="bodySmall" tone="inherit">{tab==='论文收藏'?'点击论文卡片的收藏图标，即可在这里回看。':'试试其他题目或关键词。'}</Typography><button onClick={()=>changeTab('首页')}>浏览推荐论文</button></div>}</div>
      </>}
     </div>
    </div>
   </div>
   <div className="rw-chin"/>
  </div>
  <div className="rw-stand"/><div className="rw-foot"/>
 </div>
}
