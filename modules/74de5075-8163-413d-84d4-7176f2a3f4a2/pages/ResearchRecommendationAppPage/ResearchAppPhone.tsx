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
 return <div shuku-edit-id="e-335aa182-1478-46f8-9e4b-ac42ee8064ad" className="ra-figure" data-ppt-viewport="论文配图裁切窗口" style={{aspectRatio:`${w}/${h}`}}><img shuku-edit-id="e-3fddbb88-f8c0-4db0-93d2-d106a3f12fb0" alt={`${paper.title} 论文配图`} draggable={false} src={moduleAssetUrl("images/recommendation-app/feed-reference.webp")} style={{width:`${1129/w*100}%`,left:`${-x/w*100}%`,top:`${-y/h*100}%`}}/></div>;
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
 return <Typography shuku-edit-id="e-b5b7b25e-5e40-4094-8983-673b7058d081" as="span" variant="bodySmall" tone="inherit" aria-label="浏览器本地时间">{time}</Typography>;
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
 function card(p:Paper){return <article shuku-edit-id="e-9c7b1f3a-fb0e-46ab-b541-1710f79af7ad" className="ra-card" key={p.id}>
  <div shuku-edit-id="e-3aa95f4d-f906-4097-a678-52c38afd109d" className="ra-card-top"><span shuku-edit-id="e-5a6f5891-a8d9-45b7-9d9e-7899f3335229" className="ra-arxiv">arXiv</span><Typography shuku-edit-id="e-521091d2-50ff-44db-8ff0-c0d697c0c2d6" as="span" variant="bodySmall">{p.category}</Typography><button shuku-edit-id="e-ac0bdb84-49b9-458c-bd0a-319c4dfb5ff7" className="ra-follow" aria-label={`关注 ${p.category}`} onClick={()=>toggle(p.category,following,setFollowing)}>{following.includes(p.category)?'已关注':'关注'}</button><span shuku-edit-id="e-33948f1f-834c-4d20-be6a-4ddfcd375bad" className="ra-quick"><button shuku-edit-id="e-2ff73b29-abc4-4d18-a9c8-5fa3cac6dc6a" onClick={()=>openPaper(p)}>一代读</button><button shuku-edit-id="e-4b43f83f-98c9-4ae9-b69e-cd3416081fe2" onClick={()=>openPaper(p,'figure')}>一作图</button></span></div>
  <button shuku-edit-id="e-0b22e9f6-b46a-44b4-92a6-ead34f567038" className="ra-paper-title" onClick={()=>openPaper(p)}><Typography shuku-edit-id="e-da8fb97f-ce51-4c52-b10b-f90629396ec9" as="h3" variant="h3" tone="inherit" align="center">{p.title}</Typography></button>
  <Typography shuku-edit-id="e-6eab0e9a-7a85-47cb-abd6-7747afa3dd45" className="ra-authors" variant="bodySmall" align="center" tone="inherit">{p.authors}</Typography>
  <div shuku-edit-id="e-e1f2f7be-8bbc-43ab-9cf7-a7da976297ee" className="ra-meta"><Typography shuku-edit-id="e-49a69ecf-e227-4c4d-a170-d085e87d245a" as="span" variant="bodySmall" tone="inherit">开源: {p.url?p.url.replace('https://',''):'论文学习与讨论'}</Typography><Typography shuku-edit-id="e-66400fd4-d219-4526-8e29-dfd13f7f1a57" as="time" variant="bodySmall" tone="inherit">{p.date}</Typography></div>
  <Typography shuku-edit-id="e-d3fd0855-8c40-4ac7-9935-92d30674ff85" className="ra-summary" variant="bodySmall" tone="inherit">{english?p.english:p.summary}</Typography>
  <button shuku-edit-id="e-2c71c10c-16bd-4ea7-aed1-a858ace2d78a" className="ra-figure-button" aria-label={`查看 ${p.id} 配图`} onClick={()=>openPaper(p,'figure')}><Figure paper={p}/></button>
  <div shuku-edit-id="e-bb0391a5-d50d-4938-aca1-2199f8f79719" className="ra-actions">
   <button shuku-edit-id="e-87f7d54c-014f-42f5-bdf1-112bc32257cb" aria-label={`点赞 ${p.id}`} aria-pressed={liked.includes(p.id)} onClick={()=>toggle(p.id,liked,setLiked)}><ThumbsUp/><Typography shuku-edit-id="e-260d549c-dbea-4057-91a8-2904b31fddbf" as="span" variant="bodySmall" tone="inherit">{p.likes+Number(liked.includes(p.id))}</Typography></button>
   <button shuku-edit-id="e-e4ed1aa5-7b2d-4e89-933d-8b04b70d06cb" aria-label={`收藏 ${p.id}`} aria-pressed={saved.includes(p.id)} onClick={()=>{toggle(p.id,saved,setSaved);setToast(saved.includes(p.id)?'已取消收藏':'已加入我的收藏')}}><Star/><Typography shuku-edit-id="e-627ac529-b7d3-4b89-a828-df4afdbd0461" as="span" variant="bodySmall" tone="inherit">{p.saves+Number(saved.includes(p.id))}</Typography></button>
   <button shuku-edit-id="e-95e08865-751e-4408-8933-44bafad5f638" aria-label={`阅读 ${p.id}`} onClick={()=>openPaper(p)}><BookOpen/><Typography shuku-edit-id="e-a686a86f-40ce-4db2-b4ba-0c9924a85e5e" as="span" variant="bodySmall" tone="inherit">读论文</Typography></button>
   <button shuku-edit-id="e-26175062-8881-4949-9426-e2fd82791b9c" aria-label={`评论 ${p.id}`} onClick={()=>openPaper(p,'comments')}><MessageSquare/><Typography shuku-edit-id="e-d1daf5e5-01a1-4ba0-851a-acfd18a3e51a" as="span" variant="bodySmall" tone="inherit">{comments[p.id]?.length||'评论'}</Typography></button>
   <button shuku-edit-id="e-fd208efd-3fdb-4878-b722-a30a5d3b5dfd" aria-label={`分享 ${p.id}`} onClick={async()=>{try{await navigator.clipboard.writeText(p.url||p.title);setToast('论文信息已复制')}catch{setToast('请在论文详情中选择并复制')}}}><Share2/><Typography shuku-edit-id="e-53df3d33-ef9e-4f20-85d4-69f0c5b9f5f7" as="span" variant="bodySmall" tone="inherit">分享</Typography></button>
  </div>
 </article>}
 return (
  <div shuku-edit-id="e-1e7abfa0-46ec-4a5c-89af-b1243f36bc65" className="ra-phone ra-phone--photo" data-app-entry={entry} data-app-area={area} onWheel={e=>e.stopPropagation()} onPointerDown={e=>e.stopPropagation()} onKeyDown={e=>e.stopPropagation()}>
   <img shuku-edit-id="e-130c4917-a1ff-499c-895f-26cdb5c39b3e" className="ra-device-photo" src={moduleAssetUrl("images/recommendation-app/phone-photoreal.webp")} alt="" draggable={false} aria-hidden="true"/>
   <div shuku-edit-id="e-0efd6ac3-c7c9-4a0c-b442-b7a6efa3799f" className="ra-screen" data-feed-screen="phone">
    <div shuku-edit-id="e-3e4b3243-fa16-4452-bb8e-eda0011853d2" className="ra-status"><PhoneTime/><div shuku-edit-id="e-6e6d60af-45d1-400e-b8d9-634cac974104" className="ra-island"/><div shuku-edit-id="e-1625e56c-7419-493e-9ad9-017ac9c7d353" className="ra-status-icons"><Signal/><Wifi/><BatteryMedium/></div></div>
    <header shuku-edit-id="e-b670680f-34c4-4112-8813-0b609da04d33" className="ra-header"><button shuku-edit-id="e-2df60252-c43c-4376-9345-cbf452ba2f18" aria-label="打开菜单" onClick={()=>setSheet('menu')}><Menu/></button><div shuku-edit-id="e-4f5d3342-ec84-4a0c-895c-f1483a82c09d" className="ra-tabs">{(area==='community'?['发现','关注','新芽','会议']:['热点','发现','关注']).map(t=><button shuku-edit-id="e-dfc6c879-690c-4905-8b7e-4f85976eb98b" key={t} className={(area==='community'?communityTab===t:tab===t)?'active':''} onClick={()=>{setSheet('');setSearching(false);if(area==='community'){setCommunityTab(t);setEntry(t==='新芽'?'sprout':'research');setNav(t==='会议'?'会议':'社区')}else{setEntry('research');setTab(t);setNav('科技');resetFeed()}}}><Typography shuku-edit-id="e-f2644f65-ccae-4873-b773-f8c438f3af4e" as="span" variant="body" tone="inherit">{t}</Typography></button>)}</div><button shuku-edit-id="e-35cb89a2-d6b7-4dff-9ba2-09b6d0b3a1e6" aria-label="搜索论文" onClick={()=>{setArea('research');setEntry('research');setSearching(!searching)}}><Search/></button></header>
    {entry === 'sprout' ? <SproutProgramPage autoPlay={autoPlaySprout}/> : <>

    {searching?<div shuku-edit-id="e-871dc261-f646-4fcc-a302-265d757734aa" className="ra-search"><Search size={16}/><input shuku-edit-id="e-ee7b587f-21bc-4584-934e-4e082e720985" autoFocus aria-label="搜索题目或关键词" value={query} placeholder="搜索论文 / 关键词" onChange={e=>setQuery(e.target.value)}/><button shuku-edit-id="e-72eed954-41ff-4615-b616-f6d8295b6b77" aria-label="关闭搜索" onClick={()=>{setSearching(false);setQuery('')}}><X size={16}/></button></div>:<div shuku-edit-id="e-6519cb4f-18be-4477-be5e-c2c089edd04d" className="ra-subheader"><Typography shuku-edit-id="e-feb01245-00d3-4082-96e7-8e54d41c2bf7" as="strong" variant="bodySmall" tone="inherit">{nav==='我的'?'我的收藏':tab}</Typography><div shuku-edit-id="e-84955dae-b240-4ba4-a017-bdd2023c1182"><button shuku-edit-id="e-a24fbfcc-999b-4d76-af69-01d603780bd6" className={english?'selected':''} onClick={()=>setEnglish(true)}>English</button><span shuku-edit-id="e-2ffd15f6-9c21-407d-8589-68f6b77cc018"> | </span><button shuku-edit-id="e-042d8bd4-8ece-4312-b325-aa274a5ae69f" className={!english?'selected':''} onClick={()=>setEnglish(false)}>中文</button><button shuku-edit-id="e-8bd849cc-60f1-4fc4-bfdd-5f0ce8e81d9b" aria-label="筛选关注领域" onClick={()=>setSheet('filter')}>筛选 <SlidersHorizontal size={11}/></button></div></div>}
    <div shuku-edit-id="e-75a9752d-56c5-4a96-8784-d5aa8235b703" ref={feed} className="ra-feed" data-ppt-viewport="手机内可滚动论文推荐流"><div shuku-edit-id="e-8ea94467-f7b8-4813-9f47-1c44ca187982" data-ambient-feed-content>
     {nav==='会议'?<div shuku-edit-id="e-0cbb8e3d-d1be-4420-aae9-43fc98f49ca5" className="ra-empty"><BookOpen/><Typography shuku-edit-id="e-668ae42a-0f27-4a6a-8440-b766ed93eaca" variant="h3">会议</Typography><Typography shuku-edit-id="e-fb6a8497-7cc6-4803-8c18-c06d32cd5259" variant="bodySmall">暂无会议动态</Typography></div>:nav==='消息'?<div shuku-edit-id="e-58a3e898-f0e5-4452-9137-e89df6dc1763" className="ra-empty"><Bell/><Typography shuku-edit-id="e-a857ade3-740b-4c4f-9d8a-674b011aa377" variant="h3">消息</Typography><Typography shuku-edit-id="e-125fafc4-d5d6-4258-acd9-e6f07724aaee" variant="bodySmall">暂无新消息</Typography></div>:nav==='社区'?<div shuku-edit-id="e-e4f0a946-a040-4b4b-bea4-212a29051b9a" className="ra-empty"><Users/><Typography shuku-edit-id="e-12b3502d-8185-4580-8c34-f02053aae5a4" variant="h3">一起读论文</Typography><Typography shuku-edit-id="e-0a33af15-634f-48f9-93a4-fde3b5908711" variant="bodySmall">打开论文卡片，留下你的思考。</Typography><button shuku-edit-id="e-01226f62-aabe-4f55-883c-4e0f98eca8b1" className="ra-primary" onClick={()=>{setArea('research');setEntry('research');setNav('科技');setTab('发现')}}>去发现论文</button></div>:<>{visible.map(card)}{!visible.length&&<div shuku-edit-id="e-80d06bb6-a77b-46c4-acaf-2dc7330f29f2" className="ra-empty"><Star/><Typography shuku-edit-id="e-78e65557-6809-4060-8c15-169dcce8fbd6" variant="h3">{nav==='我的'?'还没有收藏论文':tab==='关注'?'发现你的研究兴趣':'没有找到相关论文'}</Typography><Typography shuku-edit-id="e-e52d2b15-89ae-4ca6-8ad0-c7347ab54fce" variant="bodySmall">{nav==='我的'?'点击论文下方的星标，即可在这里回看。':'试试调整关键词，或关注感兴趣的领域。'}</Typography><button shuku-edit-id="e-02ab3382-e7f0-4900-bcba-ed525d0bbd2e" className="ra-primary" onClick={()=>{setNav('科技');setTab('发现');setQuery('')}}>浏览推荐</button></div>}<Typography shuku-edit-id="e-e371b597-405f-4979-8cf8-c196d4704717" className="ra-feed-end" variant="bodySmall" align="center" tone="muted">已展示全部示例论文</Typography></>}
    </div></div>
    </>}
    {sheet&&<div shuku-edit-id="e-5aa9eceb-fac9-4368-a42e-940817efcb28" className="ra-sheet" role="dialog" aria-label={sheet==='filter'?'关注领域':sheet==='menu'?'应用菜单':detail?.title}>
     <div shuku-edit-id="e-8383e39c-178a-4595-acee-b6c971c859b7" className="ra-sheet-header"><button shuku-edit-id="e-b04fc312-3ea6-4cec-9f80-ef5a96feeb49" aria-label="返回推荐流" onClick={()=>{setSheet('');setComment('')}}><ChevronLeft/></button><Typography shuku-edit-id="e-9a424f31-c0b0-4db3-b2b3-fd7546595e0b" variant="body" tone="inherit">{sheet==='filter'?'我的关注':sheet==='menu'?'研究助手':sheet==='comments'?'论文讨论':sheet==='figure'?'论文配图':'论文速读'}</Typography><button shuku-edit-id="e-75860fe8-9e66-4ea7-ba74-45d110d20de6" aria-label="关闭详情" onClick={()=>setSheet('')}><X size={19}/></button></div>
     <div shuku-edit-id="e-dce9b5c4-adbf-4b4c-88ab-e4bc6104e50a" className="ra-sheet-content" data-ppt-viewport="手机内详情与设置视口">
      {(sheet==='menu'||sheet==='filter')?<><Typography shuku-edit-id="e-407fdc92-cd5c-46ab-988b-5b44e92a605c" variant="h2">{sheet==='menu'?'你的科研信息，随身相伴。':'关注感兴趣的领域'}</Typography><Typography shuku-edit-id="e-3102cf42-4d6e-4b55-8a74-e4ddb956c157" variant="bodySmall" tone="muted">{sheet==='menu'?'从论文发现到阅读收藏。':'选择后，在「关注」中查看相应论文。'}</Typography><div shuku-edit-id="e-dc8681f6-ef42-4727-80b5-d2ef13b939c1" className="ra-interest-list">{['cs.CV','cs.LG','cs.AI','cs.CL'].map(c=><button shuku-edit-id="e-793f6b8a-6254-4def-a4b8-726d984e5206" key={c} aria-pressed={following.includes(c)} onClick={()=>toggle(c,following,setFollowing)}><Typography shuku-edit-id="e-a999a2d0-f302-453f-969b-2da683d822d6" variant="body">{c}</Typography>{following.includes(c)&&<Check size={18}/>}</button>)}</div><button shuku-edit-id="e-ed2039ac-efa5-4c5a-be59-1d30957e1359" className="ra-primary" onClick={()=>{setSheet('');setArea('research');setEntry('research');setTab('关注');setNav('科技');resetFeed()}}>查看关注</button>{sheet==='menu'&&<button shuku-edit-id="e-eb9f6b32-9655-40fc-b164-22fc312655e8" className="ra-menu-saved" onClick={()=>{setSheet('');setArea('research');setEntry('research');setNav('我的')}}><Star size={17}/> 我的收藏 · {saved.length}</button>}</>:detail&&<><Typography shuku-edit-id="e-bd0b6cb7-b98b-4217-9790-b81c666c10ca" variant="h2">{detail.title}</Typography><Typography shuku-edit-id="e-62a84772-54c5-4297-9166-3619c8fa39dd" className="ra-authors" variant="bodySmall" tone="muted">{detail.authors}</Typography>{sheet==='comments'?<><Typography shuku-edit-id="e-86a09eae-ccdf-4946-b0c1-b5815c47a64d" variant="bodySmall" tone="muted">交流对论文的理解，记录阅读中的问题。</Typography>{(comments[detail.id]||[]).map((c,i)=><div shuku-edit-id="e-3e4237e4-4e4c-4a21-8bb8-2c5dc5593fec" className="ra-comment" key={i}><UserRound size={18}/><Typography shuku-edit-id="e-116bf996-1b1b-4db6-8a56-6d0d90079b9d" variant="bodySmall">{c}</Typography></div>)}<textarea shuku-edit-id="e-b12f4951-9273-4b17-ab0d-a1dce4e617e1" aria-label="输入论文评论" value={comment} placeholder="写下你的思考…" onChange={e=>setComment(e.target.value)}/><button shuku-edit-id="e-42eff84c-3674-421d-9c32-e04974c36efe" className="ra-primary" disabled={!comment.trim()} onClick={()=>{setComments({...comments,[detail.id]:[...(comments[detail.id]||[]),comment.trim()]});setComment('');setToast('已添加到本次演示')}}>发布评论</button></>:<><Typography shuku-edit-id="e-846e350c-853a-4ac2-bff3-0d9f9dea0264" variant="bodySmall">{english?detail.english:detail.summary}</Typography><Figure paper={detail}/>{sheet==='detail'&&<><Typography shuku-edit-id="e-e859ad4f-b1c4-4069-a4dc-e0bb9b3e043a" variant="h3">阅读线索</Typography><Typography shuku-edit-id="e-4c57beb6-368d-49f6-a58f-25cf9e0e7d05" variant="bodySmall">从研究问题出发，结合论文配图理解方法，再回到原文核对结论与适用条件。</Typography>{detail.url&&<a shuku-edit-id="e-49e15240-3555-42b3-bea7-b5285be9416f" href={detail.url} target="_blank" rel="noreferrer" className="ra-paper-link">打开项目页面 <ArrowUpRight size={14}/></a>}<button shuku-edit-id="e-4e47880d-4c0e-4971-94b5-54fffdc5b4a3" className="ra-primary" onClick={()=>{toggle(detail.id,saved,setSaved);setToast(saved.includes(detail.id)?'已取消收藏':'已加入我的收藏')}}>{saved.includes(detail.id)?'取消收藏':'收藏，稍后阅读'}</button></>}</>}</>}
     </div>
    </div>}
    {toast&&<div shuku-edit-id="e-7a8d017c-4a46-43d1-a77b-4d2319da539a" className="ra-toast" role="status"><Typography shuku-edit-id="e-d79a7784-e4e7-427d-ac53-4d49e831b8fc" variant="bodySmall" tone="inherit">{toast}</Typography></div>}
    <nav shuku-edit-id="e-4676a6f3-852a-4bda-a015-4f0f0293fd7f" className="ra-bottom" aria-label="应用导航">{[{name:'科技',icon:Newspaper},{name:'社区',icon:Users},{name:'发现论文',icon:BookOpen},{name:'消息',icon:Bell},{name:'我的',icon:UserRound}].map(({name,icon:Icon},i)=><button shuku-edit-id="e-bfd158cc-f1bb-4ee5-a833-64c3aeb227b7" key={name} aria-label={name} className={`${(area==='community'?name==='社区':nav===name)?'active':''} ${i===2?'ra-brand':''}`} onClick={()=>{setSheet('');setQuery('');setSearching(false);if(name==='社区'){setArea('community');setCommunityTab('新芽');setEntry('sprout');setNav('社区')}else{setArea('research');setEntry('research');setNav(i===2?'科技':name);if(i===0||i===2)setTab('发现');resetFeed()}}}><>{i===2?<span shuku-edit-id="e-af84b5e4-c2e6-40eb-bd3d-d5dd868e4bbc" className="ra-brand-mark"><img shuku-edit-id="e-042da931-cf22-40b3-b7b7-3d4ffe2e5705" src={moduleAssetUrl('images/recommendation-app/reduct-mark-white.svg')} alt="减论"/></span>:<Icon/>}</><Typography shuku-edit-id="e-9309c20e-035a-4fd8-aefb-142fda93909e" as="span" variant="bodySmall" tone="inherit">{i===2?'':name}</Typography>{name==='消息'&&<i shuku-edit-id="e-2bc7dd53-0e06-44a1-9f45-0afb1771e167"/>}</button>)}</nav>
    <div shuku-edit-id="e-1eff7f91-74e9-4153-a41d-d6d2c432a450" className="ra-home"><i shuku-edit-id="e-a0c7e5ed-201e-4e72-a0e9-438b8b718135"/></div>
   </div>
  </div>
 );
}
