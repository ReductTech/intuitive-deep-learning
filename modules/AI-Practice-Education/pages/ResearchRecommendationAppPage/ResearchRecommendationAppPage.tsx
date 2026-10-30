import { useEffect, useRef, useState } from 'react';
import { Menu, Search, ThumbsUp, Star, MessageSquare, Share2, ChevronLeft, X, SlidersHorizontal, Wifi, Signal, BatteryMedium, Bell, UserRound, Users, Newspaper, BookOpen, Check, ArrowUpRight } from 'lucide-react';
import { Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import { papers, type Paper } from './paperFeedData';
import './ResearchRecommendationAppPage.css';
import {ResearchWebMonitor} from './ResearchWebMonitor';

// Reuse only paper figures from the supplied screenshot; feed text and controls remain interactive DOM.
function Figure({paper}:{paper:Paper}) {
 const [x,y,w,h]=paper.crop;
 return <div className="ra-figure" data-ppt-viewport="论文配图裁切窗口" style={{aspectRatio:`${w}/${h}`}}><img alt={`${paper.title} 论文配图`} draggable={false} src={moduleAssetUrl(outline.moduleIdentity.id,'images/recommendation-app/feed-reference.jpg')} style={{width:`${1129/w*100}%`,left:`${-x/w*100}%`,top:`${-y/h*100}%`}}/></div>;
}
function browserTime() {
 const now=new Date();
 return `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
}
function PhoneTime() {
 const [time,setTime]=useState(browserTime);
 useEffect(()=>{
  const update=()=>setTime(browserTime());
  const timer=window.setInterval(update,1000);
  document.addEventListener('visibilitychange',update);
  window.addEventListener('focus',update);
  return()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',update);window.removeEventListener('focus',update)};
 },[]);
 return <Typography as="span" variant="bodySmall" tone="inherit" aria-label="浏览器本地时间">{time}</Typography>;
}
export function ResearchRecommendationAppPage(){
 const [tab,setTab]=useState('发现'),[nav,setNav]=useState('科技'),[english,setEnglish]=useState(false);
 const [liked,setLiked]=useState<string[]>(['wflow']),[saved,setSaved]=useState<string[]>([]),[following,setFollowing]=useState<string[]>([]);
 const [query,setQuery]=useState(''),[searching,setSearching]=useState(false),[sheet,setSheet]=useState(''),[detail,setDetail]=useState<Paper|null>(null);
 const [toast,setToast]=useState(''),[comment,setComment]=useState(''),[comments,setComments]=useState<Record<string,string[]>>({});
 const feed=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),2000);return()=>clearTimeout(timer)},[toast]);
 function toggle(id:string,list:string[],set:(v:string[])=>void){set(list.includes(id)?list.filter(i=>i!==id):[...list,id])}
 function resetFeed(){feed.current?.scrollTo({top:0,behavior:'smooth'})}
 const filtered=papers.filter(p=>(!query||`${p.title} ${p.summary} ${p.category}`.toLowerCase().includes(query.toLowerCase()))&&(nav!=='我的'||saved.includes(p.id))&&(tab!=='关注'||following.includes(p.category)));
 const visible=tab==='热点'?[...filtered].sort((a,b)=>b.likes-a.likes):filtered;
 function openPaper(p:Paper,kind='detail'){setDetail(p);setSheet(kind)}
 function card(p:Paper){return <article className="ra-card" key={p.id}>
  <div className="ra-card-top"><span className="ra-arxiv">arXiv</span><Typography as="span" variant="bodySmall">{p.category}</Typography><button className="ra-follow" aria-label={`关注 ${p.category}`} onClick={()=>toggle(p.category,following,setFollowing)}>{following.includes(p.category)?'已关注':'关注'}</button><span className="ra-quick"><button onClick={()=>openPaper(p)}>一代读</button><button onClick={()=>openPaper(p,'figure')}>一作图</button></span></div>
  <button className="ra-paper-title" onClick={()=>openPaper(p)}><Typography as="h3" variant="h3" tone="inherit" align="center">{p.title}</Typography></button>
  <Typography className="ra-authors" variant="bodySmall" align="center" tone="inherit">{p.authors}</Typography>
  <div className="ra-meta"><Typography as="span" variant="bodySmall" tone="inherit">开源: {p.url?p.url.replace('https://',''):'论文学习与讨论'}</Typography><Typography as="time" variant="bodySmall" tone="inherit">{p.date}</Typography></div>
  <Typography className="ra-summary" variant="bodySmall" tone="inherit">{english?p.english:p.summary}</Typography>
  <button className="ra-figure-button" aria-label={`查看 ${p.id} 配图`} onClick={()=>openPaper(p,'figure')}><Figure paper={p}/></button>
  <div className="ra-actions">
   <button aria-label={`点赞 ${p.id}`} aria-pressed={liked.includes(p.id)} onClick={()=>toggle(p.id,liked,setLiked)}><ThumbsUp/><Typography as="span" variant="bodySmall" tone="inherit">{p.likes+Number(liked.includes(p.id))}</Typography></button>
   <button aria-label={`收藏 ${p.id}`} aria-pressed={saved.includes(p.id)} onClick={()=>{toggle(p.id,saved,setSaved);setToast(saved.includes(p.id)?'已取消收藏':'已加入我的收藏')}}><Star/><Typography as="span" variant="bodySmall" tone="inherit">{p.saves+Number(saved.includes(p.id))}</Typography></button>
   <button aria-label={`阅读 ${p.id}`} onClick={()=>openPaper(p)}><BookOpen/><Typography as="span" variant="bodySmall" tone="inherit">读论文</Typography></button>
   <button aria-label={`评论 ${p.id}`} onClick={()=>openPaper(p,'comments')}><MessageSquare/><Typography as="span" variant="bodySmall" tone="inherit">{comments[p.id]?.length||'评论'}</Typography></button>
   <button aria-label={`分享 ${p.id}`} onClick={async()=>{try{await navigator.clipboard.writeText(p.url||p.title);setToast('论文信息已复制')}catch{setToast('请在论文详情中选择并复制')}}}><Share2/><Typography as="span" variant="bodySmall" tone="inherit">分享</Typography></button>
  </div>
 </article>}
 return <section className="research-app-page" aria-label="个性化论文推荐 APP">
  <div className="rw-intro">
   <Typography className="rw-headline" variant="display" tone="inherit"><Typography as="span" className="rw-headline-context" variant="display" tone="inherit">科研信息供给的</Typography><Typography as="span" className="rw-headline-focus" variant="display" tone="inherit">全平台解决方案</Typography></Typography>
  </div>
  <ResearchWebMonitor/>
  <div className="ra-phone" onWheel={e=>e.stopPropagation()} onPointerDown={e=>e.stopPropagation()} onKeyDown={e=>e.stopPropagation()}>
   <i className="ra-side ra-side-left"/><i className="ra-side ra-side-right"/>
   <div className="ra-screen">
    <div className="ra-status"><PhoneTime/><div className="ra-island"/><div className="ra-status-icons"><Signal/><Wifi/><BatteryMedium/></div></div>
    <header className="ra-header"><button aria-label="打开菜单" onClick={()=>setSheet('menu')}><Menu/></button><div className="ra-tabs">{['热点','发现','关注'].map(t=><button key={t} className={tab===t&&nav==='科技'?'active':''} onClick={()=>{setTab(t);setNav('科技');resetFeed()}}><Typography as="span" variant="body" tone="inherit">{t}</Typography></button>)}</div><button aria-label="搜索论文" onClick={()=>setSearching(!searching)}><Search/></button></header>
    {searching?<div className="ra-search"><Search size={16}/><input autoFocus aria-label="搜索题目或关键词" value={query} placeholder="搜索论文 / 关键词" onChange={e=>setQuery(e.target.value)}/><button aria-label="关闭搜索" onClick={()=>{setSearching(false);setQuery('')}}><X size={16}/></button></div>:<div className="ra-subheader"><Typography as="strong" variant="bodySmall" tone="inherit">{nav==='我的'?'我的收藏':tab}</Typography><div><button className={english?'selected':''} onClick={()=>setEnglish(true)}>English</button><span> | </span><button className={!english?'selected':''} onClick={()=>setEnglish(false)}>中文</button><button aria-label="筛选关注领域" onClick={()=>setSheet('filter')}>筛选 <SlidersHorizontal size={11}/></button></div></div>}
    <div ref={feed} className="ra-feed" data-ppt-viewport="手机内可滚动论文推荐流">
     {nav==='消息'?<div className="ra-empty"><Bell/><Typography variant="h3">消息</Typography><Typography variant="bodySmall">暂无新消息</Typography></div>:nav==='社区'?<div className="ra-empty"><Users/><Typography variant="h3">一起读论文</Typography><Typography variant="bodySmall">打开论文卡片，留下你的思考。</Typography><button className="ra-primary" onClick={()=>{setNav('科技');setTab('发现')}}>去发现论文</button></div>:<>{visible.map(card)}{!visible.length&&<div className="ra-empty"><Star/><Typography variant="h3">{nav==='我的'?'还没有收藏论文':tab==='关注'?'发现你的研究兴趣':'没有找到相关论文'}</Typography><Typography variant="bodySmall">{nav==='我的'?'点击论文下方的星标，即可在这里回看。':'试试调整关键词，或关注感兴趣的领域。'}</Typography><button className="ra-primary" onClick={()=>{setNav('科技');setTab('发现');setQuery('')}}>浏览推荐</button></div>}<Typography className="ra-feed-end" variant="bodySmall" align="center" tone="muted">已展示全部示例论文</Typography></>}
    </div>
    <nav className="ra-bottom" aria-label="应用导航">{[{name:'科技',icon:Newspaper},{name:'社区',icon:Users},{name:'发现论文',icon:BookOpen},{name:'消息',icon:Bell},{name:'我的',icon:UserRound}].map(({name,icon:Icon},i)=><button key={name} aria-label={name} className={`${nav===name?'active':''} ${i===2?'ra-brand':''}`} onClick={()=>{setNav(i===2?'科技':name);if(i===2)setTab('发现');setQuery('');setSearching(false);resetFeed()}}><>{i===2?<span className="ra-brand-mark"><img src={moduleAssetUrl(outline.moduleIdentity.id,'images/recommendation-app/reduct-mark-white.svg')} alt="减论"/></span>:<Icon/>}</><Typography as="span" variant="bodySmall" tone="inherit">{i===2?'':name}</Typography>{name==='消息'&&<i/>}</button>)}</nav>
    <div className="ra-home"><i/></div>
    {sheet&&<div className="ra-sheet" role="dialog" aria-label={sheet==='filter'?'关注领域':sheet==='menu'?'应用菜单':detail?.title}>
     <div className="ra-sheet-header"><button aria-label="返回推荐流" onClick={()=>{setSheet('');setComment('')}}><ChevronLeft/></button><Typography variant="body" tone="inherit">{sheet==='filter'?'我的关注':sheet==='menu'?'研究助手':sheet==='comments'?'论文讨论':sheet==='figure'?'论文配图':'论文速读'}</Typography><button aria-label="关闭详情" onClick={()=>setSheet('')}><X size={19}/></button></div>
     <div className="ra-sheet-content" data-ppt-viewport="手机内详情与设置视口">
      {(sheet==='menu'||sheet==='filter')?<><Typography variant="h2">{sheet==='menu'?'你的科研信息，随身相伴。':'关注感兴趣的领域'}</Typography><Typography variant="bodySmall" tone="muted">{sheet==='menu'?'从论文发现到阅读收藏。':'选择后，在「关注」中查看相应论文。'}</Typography><div className="ra-interest-list">{['cs.CV','cs.LG','cs.AI','cs.CL'].map(c=><button key={c} aria-pressed={following.includes(c)} onClick={()=>toggle(c,following,setFollowing)}><Typography variant="body">{c}</Typography>{following.includes(c)&&<Check size={18}/>}</button>)}</div><button className="ra-primary" onClick={()=>{setSheet('');setTab('关注');setNav('科技');resetFeed()}}>查看关注</button>{sheet==='menu'&&<button className="ra-menu-saved" onClick={()=>{setSheet('');setNav('我的')}}><Star size={17}/> 我的收藏 · {saved.length}</button>}</>:detail&&<><Typography variant="h2">{detail.title}</Typography><Typography className="ra-authors" variant="bodySmall" tone="muted">{detail.authors}</Typography>{sheet==='comments'?<><Typography variant="bodySmall" tone="muted">交流对论文的理解，记录阅读中的问题。</Typography>{(comments[detail.id]||[]).map((c,i)=><div className="ra-comment" key={i}><UserRound size={18}/><Typography variant="bodySmall">{c}</Typography></div>)}<textarea aria-label="输入论文评论" value={comment} placeholder="写下你的思考…" onChange={e=>setComment(e.target.value)}/><button className="ra-primary" disabled={!comment.trim()} onClick={()=>{setComments({...comments,[detail.id]:[...(comments[detail.id]||[]),comment.trim()]});setComment('');setToast('已添加到本次演示')}}>发布评论</button></>:<><Typography variant="bodySmall">{english?detail.english:detail.summary}</Typography><Figure paper={detail}/>{sheet==='detail'&&<><Typography variant="h3">阅读线索</Typography><Typography variant="bodySmall">从研究问题出发，结合论文配图理解方法，再回到原文核对结论与适用条件。</Typography>{detail.url&&<a href={detail.url} target="_blank" rel="noreferrer" className="ra-paper-link">打开项目页面 <ArrowUpRight size={14}/></a>}<button className="ra-primary" onClick={()=>{toggle(detail.id,saved,setSaved);setToast(saved.includes(detail.id)?'已取消收藏':'已加入我的收藏')}}>{saved.includes(detail.id)?'取消收藏':'收藏，稍后阅读'}</button></>}</>}</>}
     </div>
    </div>}
    {toast&&<div className="ra-toast" role="status"><Typography variant="bodySmall" tone="inherit">{toast}</Typography></div>}
   </div>
  </div>
 </section>
}
