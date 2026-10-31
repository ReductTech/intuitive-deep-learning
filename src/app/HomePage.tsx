import {ErrorPage} from './ErrorPage';
import {isGuestMode,requestSignIn} from '../shuku/guest';
import {CoCreateButton} from '../shuku/Collaboration';
import { SiteHeader } from '../shuku/SiteHeader';
import {usePersonal,studyHref} from '../shuku/personal';
import { api } from '../shuku/client';
import '../shuku/shuku.css';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { moduleAssetUrl } from '../../modules/shared/react/assets';
import { activeModules, type ActiveModule } from './modules';
import './HomePage.css';
import { isLocalPreview,isPublicPreview } from './runtimeMode';

type IconName = 'grid' | 'search' | 'brain' | 'image' | 'spark' | 'book' | 'play' | 'arrow' | 'bookmark' | 'code' | 'close' | 'clock';
function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, string> = {
    grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
    search: 'M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15ZM16 16l5 5',
    brain: 'M12 4v16M12 6C6 0 1 7 5 10c-5 4-1 11 4 9l3 1M12 6c6-6 11 1 7 4 5 4 1 11-4 9l-3 1M5 10l4 2M19 10l-4 2',
    image: 'M3 3h18v18H3zM3 17l6-6 4 4 3-3 5 5M15 7h.01',
    spark: 'm12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3z',
    book: 'M12 5C8 2 4 3 2 4v16c4-2 7-1 10 1 3-2 6-3 10-1V4c-2-1-6-2-10 1ZM12 5v16',
    play: 'M8 4v16l12-8z', arrow: 'M4 12h16M14 6l6 6-6 6',
    bookmark: 'M6 3h12v18l-6-4-6 4z', code: 'm8 6-6 6 6 6M16 6l6 6-6 6M14 3l-4 18',
    close: 'm6 6 12 12M18 6 6 18', clock: 'M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}

const topics: { name: string; icon: IconName }[] = [
  { name: '全部课程', icon: 'grid' }, { name: '数学与优化', icon: 'spark' },
  { name: '神经网络', icon: 'brain' }, { name: '计算机视觉', icon: 'image' },
  { name: '生成模型', icon: 'spark' }, { name: '课件创作', icon: 'book' },
];
const editorial: Record<string, { title: string; summary: string; topic: string; cover?: string; color: string }> = {
  'neuron-guide': { title: '认识人工神经元', summary: '从一次真实决策出发，看懂输入、权重与激活函数。', topic: '神经网络', cover: 'activation-catalog', color: '#e8f0ff' },
  'convolution-kernel-intro': { title: '卷积基础', summary: '从五子棋到图像，亲手探索卷积怎样提取局部特征。', topic: '计算机视觉', cover: 'common-kernels', color: '#e5f4f0' },
  'digital-image-intro': { title: '数字图像入门', summary: '从一颗拼豆开始，理解像素、颜色与图像的数字表达。', topic: '计算机视觉', color: '#fff0e1' },
  'regression-loss': { title: '回归与损失', summary: '从曹冲称象到模型拟合，理解误差、损失与最优解。', topic: '数学与优化', cover: '07', color: '#e9e7fa' },
  'visual-feature-learning': { title: '视觉特征学习', summary: '从手写数字到人脸验证，观察神经网络如何学习特征。', topic: '计算机视觉', cover: 'assemble-train-digit-network', color: '#e4eff8' },
  'visual-generation-guide': { title: '视觉生成：从噪声到图像', summary: '从 GAN 到 Diffusion，探索一张图像如何被生成。', topic: '生成模型', color: '#eee9fc' },
  'creator-guide': { title: '课件创作指南', summary: '与 AI 一起，把教学想法变成可以探索的交互课件。', topic: '课件创作', cover: 'frontend-journey', color: '#e6efff' },
  'multilayer-perceptron': { title: '多层感知机', summary: '从泰坦尼克号存活预测，走进分类概率与参数学习。', topic: '神经网络', color: '#e1f3ef' },
  'gradient-descent': { title: '梯度下降与优化器', summary: '先体验禁区撤离，再追问怎样找到更安全的方向。', topic: '数学与优化', color: '#eee9e3' },
  'Linear-Regression-Loss': { title: '从身高遗传到线性回归', summary: '观察身高数据的趋势，亲手调整一条预测直线。', topic: '数学与优化', cover: 'uncertainty-opening', color: '#faeee3' },
};
const order = Object.keys(editorial);
const courses = activeModules.filter(module => module.pptDeck || module.catalogListed).sort((a, b) => {
  const rank = (id: string) => order.includes(id) ? order.indexOf(id) : order.length;
  return rank(a.id) - rank(b.id);
});
export interface LibraryCourse {course_id?:string;revision_id?:string;kind:'library';id:string;module_id:string;alias:string;title:string;description:string;category:string;difficulty:string;page_count:number;cover_url:string|null;repository:string;source_commit:string;github_url:string;version:string}
export type CatalogModule = ActiveModule & {catalog?:LibraryCourse};
export function info(module: CatalogModule) {
  if(module.catalog)return {title:module.catalog.title,summary:module.catalog.description,topic:module.catalog.category,color:'#e8f0ff',cover:undefined};
  return editorial[module.id] ?? { title: module.title, summary: module.description, topic: '神经网络', color: '#e8f0ff' };
}
function presentationHref(module: ActiveModule, pageId?: string) {
  return `/study?module=${encodeURIComponent(module.id)}&mode=ppt${pageId ? `&page=${encodeURIComponent(pageId)}` : ''}`;
}
export function Cover({ module }: { module: CatalogModule }) {
  const [failed, setFailed] = useState(false);
  const meta = info(module);
  const cover = meta.cover ?? module.pptDeck?.scenes[0]?.id;
  return <div className="sd-library-cover" style={{ '--cover-color': meta.color } as CSSProperties}>
    {failed || (!cover && !module.catalog?.cover_url) ? <div className="sd-library-cover-fallback"><Icon name={topics.find(topic => topic.name === meta.topic)?.icon ?? 'book'} /><span>{meta.topic}</span></div>
      : <img src={module.catalog?.cover_url || moduleAssetUrl(module.assetId, `scenedeck-thumbnails/${cover}.png`)} alt={`${meta.title}课件预览`} loading="lazy" onError={() => setFailed(true)} />}
    <span className="sd-library-cover-count">{module.catalog?.page_count??module.pages.length} 页</span>
  </div>;
}

export function HomePage() {
  type PublishedCourse={id:string;title:string;description:string;category:string;version:string;revision_id:string;kind?:undefined};
  const [catalog,setCatalog]=useState<(PublishedCourse|LibraryCourse)[]>([]),[catalogError,setCatalogError]=useState<Error|null>(null),[loading,setLoading]=useState(!isLocalPreview);
  useEffect(()=>{if(isLocalPreview)return;let active=true;api<{courses:(PublishedCourse|LibraryCourse)[]}>('/public/courses').then(r=>{if(active){setCatalog(r.courses);setCatalogError(null);}}).catch(e=>{if(active)setCatalogError(e);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
  const published=catalog.filter((c):c is PublishedCourse=>c.kind!=='library');
  // Bundled components render courses; they no longer determine the public catalog.
  const remoteCourses=catalog.filter((c):c is LibraryCourse=>c.kind==='library');
  const listedCourses:CatalogModule[]=isLocalPreview?courses:remoteCourses.flatMap(c=>{const module=activeModules.find(m=>m.id===c.alias&&m.assetId===c.module_id&&(m.pptDeck||m.catalogListed));return module?[{...module,title:c.title,description:c.description,difficulty:c.difficulty as ActiveModule['difficulty'],catalog:c}]:[];});
  const catalogTopics=[{name:'全部课程',icon:'grid' as IconName},...Array.from(new Set([...listedCourses.map(m=>info(m).topic),...published.map(c=>c.category)].filter(Boolean))).map(name=>({name,icon:(topics.find(t=>t.name===name)?.icon||'book') as IconName}))];
  const [topic, setTopic] = useState('全部课程');
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('全部');
  const [tab, setTab] = useState(new URLSearchParams(location.search).get('view')==='saved'?'saved':new URLSearchParams(location.search).get('view')==='history'?'history':'courses');
  const [sort, setSort] = useState('default');
  const personal=usePersonal(),saved=personal.data.favorites;
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => { document.title = '术库 · 探索交互课程'; }, []);
  function favoriteKey(module:CatalogModule){return saved.includes('module:'+module.id)?'module:'+module.id:module.catalog?.course_id?'course:'+module.catalog.course_id:'module:'+module.id;}
  function detailsHref(module:CatalogModule){return module.catalog?.course_id?'/course?course='+module.catalog.course_id:'/course?module='+encodeURIComponent(module.id);}
  function learnHref(module:CatalogModule,mode:string){if(!module.pptDeck)return module.path;return module.catalog?.revision_id?'/learn?revision='+module.catalog.revision_id+'&mode='+mode:'/study?module='+encodeURIComponent(module.id)+'&mode='+mode;}
  function toggleSaved(module:CatalogModule){void personal.favorite(favoriteKey(module));}
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filtered = listedCourses.filter(module => {
    const meta = info(module);
    const text = [meta.title, meta.summary, meta.topic, module.title, ...module.pages.map(page => `${page.title} ${page.goal ?? ''}`)].join(' ').toLocaleLowerCase();
    return (topic === '全部课程' || meta.topic === topic) && (!normalizedQuery || text.includes(normalizedQuery))
      && (tab !== 'saved' || saved.includes(favoriteKey(module)))
      && (level === '全部' || (level === '入门' ? module.difficulty === 'introductory' : ['intermediate', 'advanced'].includes(module.difficulty ?? '')));
  }).sort((a, b) => sort === 'pages' ? (a.catalog?.page_count??a.pages.length) - (b.catalog?.page_count??b.pages.length) : sort === 'name' ? info(a).title.localeCompare(info(b).title, 'zh-CN') : 0);
  const recentCourse=personal.data.history[0];
  const knownPublished=[...published,...personal.data.favorite_courses.filter(c=>!published.some(other=>other.id===c.id))].filter(c=>!listedCourses.some(m=>m.catalog?.course_id===c.id));
  const visiblePublished=(tab==='saved'?knownPublished:published).filter(c=>(tab!=='saved'||saved.includes('course:'+c.id))&&(!query||[c.title,c.description].join(' ').includes(query))&&(topic==='全部课程'||c.category===topic));
  const unavailableFavorites=tab==='saved'?saved.filter(key=>!listedCourses.some(m=>'module:'+m.id===key||'course:'+m.catalog?.course_id===key)&&!knownPublished.some(c=>'course:'+c.id===key)):[];
  function reset() { setQuery(''); setTopic('全部课程'); setLevel('全部'); setTab('courses'); }
  if(catalogError&&!catalog.length)return <ErrorPage error={catalogError}/>;
  return <div className={'sd-library'+(tab==='history'?' sd-personal-history':'')}>
    <a className="sd-library-skip" href="#sd-library-main">跳到课程</a>
    <SiteHeader section={tab==='saved'?'saved':tab==='history'?'history':'courses'} savedCount={saved.length} onBrowse={value=>{setTab(value);const url=new URL(location.href);if(value==='saved')url.searchParams.set('view','saved');else url.searchParams.delete('view');history.replaceState(null,'',url);}}/>
    <aside className="sd-library-sidebar" aria-label="课程分类">
      <p className="sd-library-nav-label">课程图书馆</p>
      <div className="sd-library-topics">{catalogTopics.map(item => <button key={item.name} aria-pressed={topic === item.name} className={topic === item.name ? 'is-active' : ''} onClick={() => setTopic(item.name)}><Icon name={item.icon} /><span>{item.name}</span><small>{item.name === '全部课程' ? listedCourses.length+published.length : listedCourses.filter(module => info(module).topic === item.name).length+published.filter(c=>c.category===item.name).length}</small></button>)}</div>
      <div className="sd-library-sidebar-bottom"><div className="sd-library-mode-note"><span className="sd-library-note-icon"><Icon name="spark" /></span><strong>让知识在共创中进化</strong><p>分享一种理解，<br />一起完善一门课程。</p></div><details className="sd-library-tools"><summary><Icon name="code" />开发工具<span>＋</span></summary><a href="/shared/ui-kit">Shared UI Kit <span>↗</span></a>{activeModules.filter(module => !module.pptDeck).map(module => <a href={module.path} key={module.id}>{module.badge === '接口联调' || module.id === 'memory-test' ? '接口联调' : '可编辑画布'}<span>↗</span></a>)}</details></div>
    </aside>
    <main id="sd-library-main" className="sd-library-main">
      {tab !== 'courses' && <div className="sd-library-heading"><div><p className="sd-library-eyebrow">EXPLORE · INTERACT · UNDERSTAND</p><h1>{tab === 'history'?'继续你的学习':tab === 'saved' ? '留住你的好奇心' : '下一次理解，从这里开始'}<span>。</span></h1><p>{tab === 'saved' ? '感兴趣的课程，随时回来继续探索。' : '从真实问题出发，在交互中建立直觉。'}</p></div><span className="sd-library-heading-mark" aria-hidden="true">✳</span></div>}
      {loading&&<p role="status">正在加载课程…</p>}{catalogError&&<p role="alert">{catalogError?.message} <button onClick={()=>location.reload()}>重新加载</button></p>}{!isLocalPreview&&remoteCourses.length>listedCourses.length&&<p role="status">部分课程正在更新，请稍后刷新。</p>}
      {personal.error&&<p role="alert">{personal.error}</p>}{!personal.authenticated&&tab!=='courses'&&<p>登录后查看您的收藏和学习记录。 <a onClick={event=>{if(isGuestMode()){event.preventDefault();requestSignIn();}}} href={'/my-courses?next='+encodeURIComponent('/?view='+tab)}>登录</a></p>}{recentCourse?.available&&tab!=='history'&&<a className="sd-library-recent" href={studyHref(recentCourse)}><Icon name="clock"/><span>最近学习<strong>{recentCourse.title}</strong></span><span>继续学习 <Icon name="arrow"/></span></a>}
      <div className="sd-library-search"><Icon name="search" /><input ref={searchRef} type="search" value={query} onChange={event => setQuery(event.target.value)} aria-label="搜索课程、知识点或页面" placeholder="想了解什么？搜索课程、知识点或页面…" />{query && <button aria-label="清空搜索" onClick={() => {setQuery(''); searchRef.current?.focus();}}><Icon name="close" /></button>}</div>
      <div className="sd-library-filterbar"><div className="sd-library-levels" aria-label="课程难度">{['全部', '入门', '进阶'].map(item => <button key={item} aria-pressed={level === item} className={level === item ? 'is-active' : ''} onClick={() => setLevel(item)}>{item}</button>)}</div><div className="sd-library-results"><span aria-live="polite">{tab==='history'?personal.data.history.length:filtered.length+visiblePublished.length+unavailableFavorites.length} 门课程</span><select aria-label="课程排序" value={sort} onChange={event => setSort(event.target.value)}><option value="default">推荐顺序</option><option value="pages">页数从少到多</option><option value="name">课程名称</option></select></div></div>
      <div className="sd-library-grid">{tab!=='history'&&visiblePublished.map(c=><article className="sd-library-card" key={c.id}><a className="sd-library-cover-button" href={"/course?course="+c.id} aria-label={c.title+"课程详情"}><div className="sd-library-cover" style={{background:'var(--ui-accent-soft)'}}><div className="sd-library-cover-fallback"><Icon name="book"/><span>{c.category||'课程'}</span></div></div></a><div className="sd-library-card-copy"><div className="sd-library-card-meta"><span>{c.category}</span><span>v{c.version}</span><button disabled={isPublicPreview||personal.busy} aria-label={(saved.includes('course:'+c.id)?'取消收藏':'收藏')+c.title} aria-pressed={saved.includes('course:'+c.id)} onClick={()=>void personal.favorite('course:'+c.id)}><Icon name="bookmark"/></button></div><h2><a href={"/course?course="+c.id}>{c.title}</a></h2><p>{c.description}</p><div className="sd-library-card-actions"><a href={'/learn?revision='+c.revision_id}>开始学习 <Icon name="arrow"/></a><CoCreateButton courseId={c.id}/></div></div></article>)}{tab==='saved'&&unavailableFavorites.map(key=><article className="sd-library-card" key={key}><div className="sd-library-card-copy"><h2>课程暂不可访问</h2><button disabled={isPublicPreview||personal.busy} onClick={()=>void personal.favorite(key)}>取消收藏</button></div></article>)}{tab==='history'?personal.data.history.map(record=><article className="sd-library-card" key={record.resource}><div className="sd-library-card-copy"><h2>{record.title}</h2><p>{record.version_label} · {record.mode==='guide'?'自学互动':'教学展示'} · 已学 {record.completed.length} / {record.page_count} 页</p>{record.available?<a href={studyHref(record)}>继续学习 →</a>:<p>课程暂不可访问</p>}</div></article>):filtered.map(module => {
        const meta = info(module);
        return <article className="sd-library-card" key={module.id} aria-label={meta.title}>
          <a className="sd-library-cover-button" href={detailsHref(module)} aria-label={`${meta.title}课程详情`}><Cover module={module} /><span className="sd-library-cover-overlay">查看课程详情 <Icon name="arrow" /></span></a>
          <div className="sd-library-card-copy"><div className="sd-library-card-meta"><span>{meta.topic}</span><span className="sd-library-difficulty">{module.difficulty === 'introductory' ? '入门' : module.difficulty === 'advanced' ? '高级' : module.difficulty === 'intermediate' ? '进阶' : '探索'}</span><button className={saved.includes(favoriteKey(module)) ? 'is-saved' : ''} onClick={() => toggleSaved(module)} aria-label={`${saved.includes(favoriteKey(module)) ? '取消收藏' : '收藏'}${meta.title}`} disabled={isPublicPreview||personal.busy} aria-pressed={saved.includes(favoriteKey(module))}><Icon name="bookmark" /></button></div>
            <h2><a href={detailsHref(module)}>{meta.title}</a></h2><p>{meta.summary}</p>
            <div className="sd-library-card-actions"><a href={learnHref(module,'guide')}><Icon name="book" />{module.pptDeck?'自学互动模式':'打开互动课程'}</a>{module.pptDeck&&<a href={learnHref(module,'ppt')}><Icon name="play" />教学展示模式</a>}</div>
          </div>
        </article>;
      })}</div>
      {tab==='history'&&personal.authenticated&&!personal.data.history.length&&<p>还没有学习记录，<a href="/">选择一门课程开始学习</a>。</p>}{tab==='history'&&personal.data.next_cursor&&<button disabled={isPublicPreview||personal.busy} onClick={()=>void personal.more()}>更多学习记录</button>}{!loading&&!catalogError&&tab!=='history'&&!filtered.length&&!visiblePublished.length&&!unavailableFavorites.length && <div className="sd-library-empty"><Icon name={tab === 'saved' && !saved.length ? 'bookmark' : 'search'} /><h2>{tab === 'saved' && !saved.length ? '把感兴趣的课程收在这里' : '暂时没有找到相关课程'}</h2><p>{tab === 'saved' && !saved.length ? '点击课程卡片上的收藏图标，下次更容易找到。' : '试试其他关键词，或放宽分类与难度筛选。'}</p><button onClick={reset}>浏览全部课程 <Icon name="arrow" /></button></div>}
      <footer className="sd-library-footer"><span>术库</span><p>不止于看见，更在于理解。</p><span>自主探索 · 课堂展示</span></footer>
    </main>
  </div>;
}
