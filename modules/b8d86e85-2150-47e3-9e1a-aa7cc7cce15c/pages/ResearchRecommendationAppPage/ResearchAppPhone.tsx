import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Menu, Search, ThumbsUp, Star, MessageSquare, Share2, ChevronLeft, X, SlidersHorizontal, Wifi, Signal, BatteryMedium, Bell, UserRound, Users, Newspaper, BookOpen, Check, ArrowUpRight } from 'lucide-react';
import { Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import { papers, type Paper } from './paperFeedData';
import './ResearchRecommendationAppPage.css';
import {useAmbientFeedScroll} from './useAmbientFeedScroll';

// Reuse only paper figures from the supplied screenshot; feed text and controls remain interactive DOM.
function Figure({paper}:{paper:Paper}) {
 const [x,y,w,h]=paper.crop;
 return <div shuku-edit-id="e-3bbe6fdf-2fe5-46e4-b644-50de435432c7" className="ra-figure" data-ppt-viewport="论文配图裁切窗口" style={{aspectRatio:`${w}/${h}`}}><img shuku-edit-id="e-d1d5df5d-9c0a-4cb3-a0c2-37eba09710ad" alt={`${paper.title} 论文配图`} draggable={false} src={moduleAssetUrl('images/recommendation-app/feed-reference.jpg')} style={{width:`${1129/w*100}%`,left:`${-x/w*100}%`,top:`${-y/h*100}%`}}/></div>;
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
 return <Typography shuku-edit-id="e-b86622f5-6cc9-4426-b289-cbf61943c8a2" as="span" variant="bodySmall" tone="inherit" aria-label="浏览器本地时间">{time}</Typography>;
}
import { SproutProgramPage } from './SproutProgramPage';

// Both slide entries share the same app data, while each opens its requested route.
function sharedAppState<T>(initial:T) {
 let value=initial;
 const listeners=new Set<()=>void>();
 const subscribe=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener)}};
 const snapshot=()=>value;
 const set=(next:T)=>{value=next;listeners.forEach(listener=>listener())};
 return ()=>[useSyncExternalStore(subscribe,snapshot,snapshot),set] as const;
}
const useAppLikes=sharedAppState<string[]>(['wflow']);
const useAppSaves=sharedAppState<string[]>([]);
const useAppFollowing=sharedAppState<string[]>([]);
const useAppComments=sharedAppState<Record<string,string[]>>({});

export function ResearchAppPhone({ initialEntry='research', autoPlaySprout=true }: { initialEntry?: 'research'|'sprout'; autoPlaySprout?: boolean }) {
 const [entry,setEntry]=useState<'research'|'sprout'>(initialEntry);
 const [area,setArea]=useState<'research'|'community'>(initialEntry==='sprout'?'community':'research');
 const [communityTab,setCommunityTab]=useState('新芽');
 const [tab,setTab]=useState('发现'),[nav,setNav]=useState('科技'),[english,setEnglish]=useState(false);
 const [liked,setLiked]=useAppLikes(),[saved,setSaved]=useAppSaves(),[following,setFollowing]=useAppFollowing();
 const [query,setQuery]=useState(''),[searching,setSearching]=useState(false),[sheet,setSheet]=useState(''),[detail,setDetail]=useState<Paper|null>(null);
 const [toast,setToast]=useState(''),[comment,setComment]=useState(''),[comments,setComments]=useAppComments();
 const feed=useRef<HTMLDivElement>(null);
 useAmbientFeedScroll(feed, 'phone', entry === 'research');
 useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),2000);return()=>clearTimeout(timer)},[toast]);
 function toggle(id:string,list:string[],set:(v:string[])=>void){set(list.includes(id)?list.filter(i=>i!==id):[...list,id])}
 function resetFeed(){feed.current?.scrollTo({top:0,behavior:'smooth'})}
 const filtered=papers.filter(p=>(!query||`${p.title} ${p.summary} ${p.category}`.toLowerCase().includes(query.toLowerCase()))&&(nav!=='我的'||saved.includes(p.id))&&(tab!=='关注'||following.includes(p.category)));
 const visible=tab==='热点'?[...filtered].sort((a,b)=>b.likes-a.likes):filtered;
 function openPaper(p:Paper,kind='detail'){setDetail(p);setSheet(kind)}
 function card(p:Paper){return <article shuku-edit-id="e-dcb461bb-6125-4082-81a7-0f2d6bcde282" className="ra-card" key={p.id}>
  <div shuku-edit-id="e-770d4440-d21a-4bfd-ac5d-5dec140e5059" className="ra-card-top"><span shuku-edit-id="e-a46604f1-a429-493b-add5-818341158ae7" className="ra-arxiv">arXiv</span><Typography shuku-edit-id="e-377937ea-b300-45cd-a2ad-43e88433ab5a" as="span" variant="bodySmall">{p.category}</Typography><button shuku-edit-id="e-45c2f29a-ed4e-4560-bd8f-d617e36f2480" className="ra-follow" aria-label={`关注 ${p.category}`} onClick={()=>toggle(p.category,following,setFollowing)}>{following.includes(p.category)?'已关注':'关注'}</button><span shuku-edit-id="e-c2831b41-7164-469e-bb2d-5f62e21f80af" className="ra-quick"><button shuku-edit-id="e-3722ff17-0aa5-480c-b7dd-84282ac80210" onClick={()=>openPaper(p)}>一代读</button><button shuku-edit-id="e-e2af9a96-0ff9-4122-9e54-6e25fe151a67" onClick={()=>openPaper(p,'figure')}>一作图</button></span></div>
  <button shuku-edit-id="e-d245a388-e789-4c73-8fa2-72aabcfe269b" className="ra-paper-title" onClick={()=>openPaper(p)}><Typography shuku-edit-id="e-3986a6b7-c13a-4d32-8aa1-630df5b81974" as="h3" variant="h3" tone="inherit" align="center">{p.title}</Typography></button>
  <Typography shuku-edit-id="e-fd31a993-af02-465b-a637-e204494ca0aa" className="ra-authors" variant="bodySmall" align="center" tone="inherit">{p.authors}</Typography>
  <div shuku-edit-id="e-8fa5cbf6-bd82-4f25-b859-1c3cb5f2134a" className="ra-meta"><Typography shuku-edit-id="e-cccc82af-e61a-4d06-a56b-126dcf89bb1f" as="span" variant="bodySmall" tone="inherit">开源: {p.url?p.url.replace('https://',''):'论文学习与讨论'}</Typography><Typography shuku-edit-id="e-f0ab2454-00b9-4a53-824b-305e6534ebcb" as="time" variant="bodySmall" tone="inherit">{p.date}</Typography></div>
  <Typography shuku-edit-id="e-e8f0721c-4e34-41e1-809d-04c72c12747b" className="ra-summary" variant="bodySmall" tone="inherit">{english?p.english:p.summary}</Typography>
  <button shuku-edit-id="e-0dd9c810-048e-4284-8712-8338835a783f" className="ra-figure-button" aria-label={`查看 ${p.id} 配图`} onClick={()=>openPaper(p,'figure')}><Figure paper={p}/></button>
  <div shuku-edit-id="e-4e2ea9c2-fd0b-43e9-bbca-e48bc2f1a32c" className="ra-actions">
   <button shuku-edit-id="e-b8b35695-a923-4440-9340-cc89cfae966f" aria-label={`点赞 ${p.id}`} aria-pressed={liked.includes(p.id)} onClick={()=>toggle(p.id,liked,setLiked)}><ThumbsUp/><Typography shuku-edit-id="e-b04f25c0-4851-4b53-a08f-be18ca71afe5" as="span" variant="bodySmall" tone="inherit">{p.likes+Number(liked.includes(p.id))}</Typography></button>
   <button shuku-edit-id="e-4f26f029-7f23-4b98-b5fa-40104ead38a2" aria-label={`收藏 ${p.id}`} aria-pressed={saved.includes(p.id)} onClick={()=>{toggle(p.id,saved,setSaved);setToast(saved.includes(p.id)?'已取消收藏':'已加入我的收藏')}}><Star/><Typography shuku-edit-id="e-44d80f06-0a7d-47e6-bac7-ed90dd40af07" as="span" variant="bodySmall" tone="inherit">{p.saves+Number(saved.includes(p.id))}</Typography></button>
   <button shuku-edit-id="e-d08dd13a-83f5-4c41-a120-3eb2278e1c2e" aria-label={`阅读 ${p.id}`} onClick={()=>openPaper(p)}><BookOpen/><Typography shuku-edit-id="e-24997f1f-4411-4698-9032-efd3111a7241" as="span" variant="bodySmall" tone="inherit">读论文</Typography></button>
   <button shuku-edit-id="e-4ee96bce-0413-44a7-9beb-00ec125f3b33" aria-label={`评论 ${p.id}`} onClick={()=>openPaper(p,'comments')}><MessageSquare/><Typography shuku-edit-id="e-49850a23-a0da-4bcb-9304-fae3c614206c" as="span" variant="bodySmall" tone="inherit">{comments[p.id]?.length||'评论'}</Typography></button>
   <button shuku-edit-id="e-25ca4748-4505-4e56-9ed4-43ab760d5f54" aria-label={`分享 ${p.id}`} onClick={async()=>{try{await navigator.clipboard.writeText(p.url||p.title);setToast('论文信息已复制')}catch{setToast('请在论文详情中选择并复制')}}}><Share2/><Typography shuku-edit-id="e-dd2ef517-f093-46d6-adbd-36852f7067b1" as="span" variant="bodySmall" tone="inherit">分享</Typography></button>
  </div>
 </article>}
 return (
  <div shuku-edit-id="e-be7469d6-ff5e-4fa5-9522-eb903ea31486" className="ra-phone ra-phone--photo" data-app-entry={entry} data-app-area={area} onWheel={e=>e.stopPropagation()} onPointerDown={e=>e.stopPropagation()} onKeyDown={e=>e.stopPropagation()}>
   <img shuku-edit-id="e-efd0ca30-cc97-44cf-956e-726e9b3a1376" className="ra-device-photo" src={moduleAssetUrl('images/recommendation-app/phone-photoreal.png')} alt="" draggable={false} aria-hidden="true"/>
   <div shuku-edit-id="e-1b76d12e-4c1d-496e-9e1e-8830a2a2ba7a" className="ra-screen" data-feed-screen="phone">
    <div shuku-edit-id="e-ed4e1c95-17b1-49d2-9ba6-26b3c60d49ca" className="ra-status"><PhoneTime/><div shuku-edit-id="e-3bace341-b076-482f-acb6-1b858459b36a" className="ra-island"/><div shuku-edit-id="e-266cd13e-d278-41aa-8f3b-a77cf305f35d" className="ra-status-icons"><Signal/><Wifi/><BatteryMedium/></div></div>
    <header shuku-edit-id="e-6deba32a-66af-43b6-aa90-b4d1bdfb4f0f" className="ra-header"><button shuku-edit-id="e-9472e091-7884-4ed9-9243-374f086bdeaa" aria-label="打开菜单" onClick={()=>setSheet('menu')}><Menu/></button><div shuku-edit-id="e-29af210d-1e66-43c7-a637-6cd4f499aca9" className="ra-tabs">{(area==='community'?['发现','关注','新芽','会议']:['热点','发现','关注']).map(t=><button shuku-edit-id="e-894be025-c67b-4540-a284-52b2009db45b" key={t} className={(area==='community'?communityTab===t:tab===t)?'active':''} onClick={()=>{setSheet('');setSearching(false);if(area==='community'){setCommunityTab(t);setEntry(t==='新芽'?'sprout':'research');setNav(t==='会议'?'会议':'社区')}else{setEntry('research');setTab(t);setNav('科技');resetFeed()}}}><Typography shuku-edit-id="e-876e13ef-e777-41ad-90ef-8157f2cd3b32" as="span" variant="body" tone="inherit">{t}</Typography></button>)}</div><button shuku-edit-id="e-7613072b-41af-4fe6-9b5d-4bcef2a2957b" aria-label="搜索论文" onClick={()=>{setArea('research');setEntry('research');setSearching(!searching)}}><Search/></button></header>
    {entry === 'sprout' ? <SproutProgramPage autoPlay={autoPlaySprout}/> : <>

    {searching?<div shuku-edit-id="e-5f3d844c-1068-4f2a-930c-8b8f6d078d30" className="ra-search"><Search size={16}/><input shuku-edit-id="e-9bd681c5-f021-44aa-a6f9-86f5e8226034" autoFocus aria-label="搜索题目或关键词" value={query} placeholder="搜索论文 / 关键词" onChange={e=>setQuery(e.target.value)}/><button shuku-edit-id="e-ee570ca4-be64-49b9-a09c-7bc8c429edfb" aria-label="关闭搜索" onClick={()=>{setSearching(false);setQuery('')}}><X size={16}/></button></div>:<div shuku-edit-id="e-90a36311-8273-4af2-8e22-583de3800bad" className="ra-subheader"><Typography shuku-edit-id="e-d23ffd42-d066-407f-9b29-34c475316997" as="strong" variant="bodySmall" tone="inherit">{nav==='我的'?'我的收藏':tab}</Typography><div shuku-edit-id="e-737eb259-980c-459b-b7b3-0facd2193a5e"><button shuku-edit-id="e-67dcdc46-6853-4737-8046-3ea4656688a5" className={english?'selected':''} onClick={()=>setEnglish(true)}>English</button><span shuku-edit-id="e-24b4c01e-5220-498a-8a32-d7c1ca41a9f6"> | </span><button shuku-edit-id="e-c8884624-8231-4feb-834d-44151ce7698f" className={!english?'selected':''} onClick={()=>setEnglish(false)}>中文</button><button shuku-edit-id="e-e411410d-b230-413b-b392-9dfe5cd71847" aria-label="筛选关注领域" onClick={()=>setSheet('filter')}>筛选 <SlidersHorizontal size={11}/></button></div></div>}
    <div shuku-edit-id="e-c41b53d2-b3c3-4e35-a5db-fdacf406d956" ref={feed} className="ra-feed" data-ppt-viewport="手机内可滚动论文推荐流"><div shuku-edit-id="e-7c30481d-67f8-46a7-a4e9-baaf4edaabe6" data-ambient-feed-content>
     {nav==='会议'?<div shuku-edit-id="e-5d5e00a7-f28d-49c9-b491-36b0b3aeb150" className="ra-empty"><BookOpen/><Typography shuku-edit-id="e-63476d0c-7606-4242-885f-bfe21bb31c66" variant="h3">会议</Typography><Typography shuku-edit-id="e-6f5d771b-5b12-4512-81eb-06d83f84d2b5" variant="bodySmall">暂无会议动态</Typography></div>:nav==='消息'?<div shuku-edit-id="e-1fc17658-f066-4932-bc09-6d7849409c4e" className="ra-empty"><Bell/><Typography shuku-edit-id="e-e89235a1-af94-4b8d-beb8-c741422e23d9" variant="h3">消息</Typography><Typography shuku-edit-id="e-22cbafc1-d50a-4f2c-9a48-fa1b5692fa22" variant="bodySmall">暂无新消息</Typography></div>:nav==='社区'?<div shuku-edit-id="e-2268823b-4113-4187-bd61-a0ca7c25ed87" className="ra-empty"><Users/><Typography shuku-edit-id="e-88fabc51-6568-40ec-ad43-c42e0c38ca2f" variant="h3">一起读论文</Typography><Typography shuku-edit-id="e-94e7ad39-c38d-4d04-a6f1-d6de9f24e359" variant="bodySmall">打开论文卡片，留下你的思考。</Typography><button shuku-edit-id="e-576499e8-430a-45c0-9487-899a9ace9299" className="ra-primary" onClick={()=>{setArea('research');setEntry('research');setNav('科技');setTab('发现')}}>去发现论文</button></div>:<>{visible.map(card)}{!visible.length&&<div shuku-edit-id="e-15ec1c95-fc16-4200-b543-3cbec6f7f109" className="ra-empty"><Star/><Typography shuku-edit-id="e-bd130418-47e9-45c3-b138-20e219946203" variant="h3">{nav==='我的'?'还没有收藏论文':tab==='关注'?'发现你的研究兴趣':'没有找到相关论文'}</Typography><Typography shuku-edit-id="e-64697238-e8c7-4e04-a53f-7daa629709f3" variant="bodySmall">{nav==='我的'?'点击论文下方的星标，即可在这里回看。':'试试调整关键词，或关注感兴趣的领域。'}</Typography><button shuku-edit-id="e-7ca10248-48cf-4c59-9d58-1a822e2496fa" className="ra-primary" onClick={()=>{setNav('科技');setTab('发现');setQuery('')}}>浏览推荐</button></div>}<Typography shuku-edit-id="e-3515f8a6-84b5-48ec-8e01-5cc1b64be39c" className="ra-feed-end" variant="bodySmall" align="center" tone="muted">已展示全部示例论文</Typography></>}
    </div></div>
    </>}
    {sheet&&<div shuku-edit-id="e-42711be8-680a-4a6f-a0c8-cc2a9e7ac457" className="ra-sheet" role="dialog" aria-label={sheet==='filter'?'关注领域':sheet==='menu'?'应用菜单':detail?.title}>
     <div shuku-edit-id="e-54edb9f9-c6aa-474c-94fb-047a6fb6eb64" className="ra-sheet-header"><button shuku-edit-id="e-ad376a39-f48c-4a01-aa7e-64344160673c" aria-label="返回推荐流" onClick={()=>{setSheet('');setComment('')}}><ChevronLeft/></button><Typography shuku-edit-id="e-f9c62647-3904-42f6-99be-4d505b17cd15" variant="body" tone="inherit">{sheet==='filter'?'我的关注':sheet==='menu'?'研究助手':sheet==='comments'?'论文讨论':sheet==='figure'?'论文配图':'论文速读'}</Typography><button shuku-edit-id="e-f83691eb-0c1f-4cc9-af05-f7fe928a2791" aria-label="关闭详情" onClick={()=>setSheet('')}><X size={19}/></button></div>
     <div shuku-edit-id="e-f18ab651-2721-4bd6-bcb2-5034aee9bfb0" className="ra-sheet-content" data-ppt-viewport="手机内详情与设置视口">
      {(sheet==='menu'||sheet==='filter')?<><Typography shuku-edit-id="e-750e0b7a-3eec-424d-a55f-a473d64e6f9d" variant="h2">{sheet==='menu'?'你的科研信息，随身相伴。':'关注感兴趣的领域'}</Typography><Typography shuku-edit-id="e-5755078e-02a9-409e-b03f-bf9f0e5e6f1c" variant="bodySmall" tone="muted">{sheet==='menu'?'从论文发现到阅读收藏。':'选择后，在「关注」中查看相应论文。'}</Typography><div shuku-edit-id="e-d6eb7fbc-69e7-4338-9db2-6cb004e640df" className="ra-interest-list">{['cs.CV','cs.LG','cs.AI','cs.CL'].map(c=><button shuku-edit-id="e-de48fc58-1ca2-4394-b569-adeabc119807" key={c} aria-pressed={following.includes(c)} onClick={()=>toggle(c,following,setFollowing)}><Typography shuku-edit-id="e-bafb9bd1-d013-4561-807e-af9e33a1d052" variant="body">{c}</Typography>{following.includes(c)&&<Check size={18}/>}</button>)}</div><button shuku-edit-id="e-cc6a46db-8ce7-4e22-b92c-462165bc5e37" className="ra-primary" onClick={()=>{setSheet('');setArea('research');setEntry('research');setTab('关注');setNav('科技');resetFeed()}}>查看关注</button>{sheet==='menu'&&<button shuku-edit-id="e-0e5325a2-ff4e-4b93-b9fd-cbbc60621a9d" className="ra-menu-saved" onClick={()=>{setSheet('');setArea('research');setEntry('research');setNav('我的')}}><Star size={17}/> 我的收藏 · {saved.length}</button>}</>:detail&&<><Typography shuku-edit-id="e-49eebc47-7f96-4470-9ccc-f14eb0785fe9" variant="h2">{detail.title}</Typography><Typography shuku-edit-id="e-0013da75-1fd0-4b68-9e06-6f5c316faad1" className="ra-authors" variant="bodySmall" tone="muted">{detail.authors}</Typography>{sheet==='comments'?<><Typography shuku-edit-id="e-a0361720-2752-48b0-a338-5f27ff9efa1b" variant="bodySmall" tone="muted">交流对论文的理解，记录阅读中的问题。</Typography>{(comments[detail.id]||[]).map((c,i)=><div shuku-edit-id="e-3f30a307-a8b4-405c-866c-fd3ced9ea380" className="ra-comment" key={i}><UserRound size={18}/><Typography shuku-edit-id="e-23ab7743-98c4-4be5-86ce-f266e1030a18" variant="bodySmall">{c}</Typography></div>)}<textarea shuku-edit-id="e-2c346424-501e-40df-bfd9-10c282446a25" aria-label="输入论文评论" value={comment} placeholder="写下你的思考…" onChange={e=>setComment(e.target.value)}/><button shuku-edit-id="e-40beedfc-5892-4fe4-b183-ca9ae3bcd723" className="ra-primary" disabled={!comment.trim()} onClick={()=>{setComments({...comments,[detail.id]:[...(comments[detail.id]||[]),comment.trim()]});setComment('');setToast('已添加到本次演示')}}>发布评论</button></>:<><Typography shuku-edit-id="e-34489fa6-a510-4ed3-a7c0-c47d1f368709" variant="bodySmall">{english?detail.english:detail.summary}</Typography><Figure paper={detail}/>{sheet==='detail'&&<><Typography shuku-edit-id="e-7f77c938-a6a6-42df-bb76-6bd3265247fa" variant="h3">阅读线索</Typography><Typography shuku-edit-id="e-309b99e7-cf0e-42f8-824a-127a8ca04115" variant="bodySmall">从研究问题出发，结合论文配图理解方法，再回到原文核对结论与适用条件。</Typography>{detail.url&&<a shuku-edit-id="e-d5a05b2f-b8db-4a66-a92d-2a48a738248b" href={detail.url} target="_blank" rel="noreferrer" className="ra-paper-link">打开项目页面 <ArrowUpRight size={14}/></a>}<button shuku-edit-id="e-7233ad88-7f91-42a3-8379-dfd0b08443d6" className="ra-primary" onClick={()=>{toggle(detail.id,saved,setSaved);setToast(saved.includes(detail.id)?'已取消收藏':'已加入我的收藏')}}>{saved.includes(detail.id)?'取消收藏':'收藏，稍后阅读'}</button></>}</>}</>}
     </div>
    </div>}
    {toast&&<div shuku-edit-id="e-caf99edc-101c-4f18-b9b4-dac17820ff44" className="ra-toast" role="status"><Typography shuku-edit-id="e-5b301518-bb45-4961-bd72-c9a94f210bbd" variant="bodySmall" tone="inherit">{toast}</Typography></div>}
    <nav shuku-edit-id="e-189b9d47-6106-4b9c-ab9d-84ed9400f15f" className="ra-bottom" aria-label="应用导航">{[{name:'科技',icon:Newspaper},{name:'社区',icon:Users},{name:'发现论文',icon:BookOpen},{name:'消息',icon:Bell},{name:'我的',icon:UserRound}].map(({name,icon:Icon},i)=><button shuku-edit-id="e-fb696884-0f50-4490-9a0a-de4f8edf625e" key={name} aria-label={name} className={`${(area==='community'?name==='社区':nav===name)?'active':''} ${i===2?'ra-brand':''}`} onClick={()=>{setSheet('');setQuery('');setSearching(false);if(name==='社区'){setArea('community');setCommunityTab('新芽');setEntry('sprout');setNav('社区')}else{setArea('research');setEntry('research');setNav(i===2?'科技':name);if(i===0||i===2)setTab('发现');resetFeed()}}}><>{i===2?<span shuku-edit-id="e-ac30c407-93d9-4989-93fa-f40b8b6df26f" className="ra-brand-mark"><img shuku-edit-id="e-3066d333-3d72-47e3-b280-bbda660703e0" src={moduleAssetUrl('images/recommendation-app/reduct-mark-white.svg')} alt="减论"/></span>:<Icon/>}</><Typography shuku-edit-id="e-0f417af4-fdbd-4ef2-ac82-8365bc48ed8b" as="span" variant="bodySmall" tone="inherit">{i===2?'':name}</Typography>{name==='消息'&&<i shuku-edit-id="e-4fa67d59-b96d-43c1-a21b-e3ffbb8a3dc5"/>}</button>)}</nav>
    <div shuku-edit-id="e-8f090fad-6084-4e3c-b337-b42d54516dab" className="ra-home"><i shuku-edit-id="e-800b2098-82af-4ee0-9e7c-6ec3c750dc7e"/></div>
   </div>
  </div>
 );
}
