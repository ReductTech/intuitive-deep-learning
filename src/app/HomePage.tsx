import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { moduleAssetUrl } from '../../modules/shared/react/assets';
import { activeModules, type ActiveModule } from './modules';
import './HomePage.css';

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
const courses = activeModules.filter(module => module.pptDeck).sort((a, b) => {
  const rank = (id: string) => order.includes(id) ? order.indexOf(id) : order.length;
  return rank(a.id) - rank(b.id);
});
function info(module: ActiveModule) {
  return editorial[module.id] ?? { title: module.title, summary: module.description, topic: '神经网络', color: '#e8f0ff' };
}
function presentationHref(module: ActiveModule, pageId?: string) {
  return `/scenedeck/?deck=${encodeURIComponent(module.pptDeck!.id)}${pageId ? `&slide=${encodeURIComponent(pageId)}` : ''}`;
}
function readSaved<T,>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; } catch { return fallback; }
}
function Cover({ module }: { module: ActiveModule }) {
  const [failed, setFailed] = useState(false);
  const meta = info(module);
  const cover = meta.cover ?? module.pptDeck?.scenes[0]?.id;
  return <div className="sd-library-cover" style={{ '--cover-color': meta.color } as CSSProperties}>
    {failed || !cover ? <div className="sd-library-cover-fallback"><Icon name={topics.find(topic => topic.name === meta.topic)?.icon ?? 'book'} /><span>{meta.topic}</span></div>
      : <img src={moduleAssetUrl(module.assetId, `scenedeck-thumbnails/${cover}.png`)} alt={`${meta.title}课件预览`} loading="lazy" onError={() => setFailed(true)} />}
    <span className="sd-library-cover-count">{module.pages.length} 页</span>
  </div>;
}

export function HomePage() {
  const [topic, setTopic] = useState('全部课程');
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('全部');
  const [tab, setTab] = useState('courses');
  const [sort, setSort] = useState('default');
  const [saved, setSaved] = useState<string[]>(() => readSaved<unknown[]>('scenedeck:saved-courses', []).filter((id): id is string => typeof id === 'string'));
  const [recent] = useState(() => readSaved<string>('scenedeck:recent-course', ''));
  const [preview, setPreview] = useState<ActiveModule | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => { document.title = 'SceneDeck · 探索交互课程'; }, []);
  useEffect(() => { try { localStorage.setItem('scenedeck:saved-courses', JSON.stringify(saved)); } catch { /* Browsing also works without storage. */ } }, [saved]);
  useEffect(() => {
    if (preview) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [preview]);
  function remember(module: ActiveModule) { try { localStorage.setItem('scenedeck:recent-course', JSON.stringify(module.id)); } catch { /* Storage is optional. */ } }
  function toggleSaved(id: string) { setSaved(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]); }
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filtered = courses.filter(module => {
    const meta = info(module);
    const text = [meta.title, meta.summary, meta.topic, module.title, ...module.pages.map(page => `${page.title} ${page.goal ?? ''}`)].join(' ').toLocaleLowerCase();
    return (topic === '全部课程' || meta.topic === topic) && (!normalizedQuery || text.includes(normalizedQuery))
      && (tab !== 'saved' || saved.includes(module.id))
      && (level === '全部' || (level === '入门' ? module.difficulty === 'introductory' : ['intermediate', 'advanced'].includes(module.difficulty ?? '')));
  }).sort((a, b) => sort === 'pages' ? a.pages.length - b.pages.length : sort === 'name' ? info(a).title.localeCompare(info(b).title, 'zh-CN') : 0);
  const recentCourse = courses.find(module => module.id === recent);
  function reset() { setQuery(''); setTopic('全部课程'); setLevel('全部'); setTab('courses'); }
  return <div className="sd-library">
    <a className="sd-library-skip" href="#sd-library-main">跳到课程</a>
    <header className="sd-library-topbar">
      <a href="/" className="sd-library-brand" aria-label="SceneDeck 首页"><span className="sd-library-logo"><Icon name="book" /></span><span>SceneDeck<span className="sd-library-brand-dot">.</span></span></a>
      <nav aria-label="主导航"><button className={tab === 'courses' ? 'is-active' : ''} onClick={() => setTab('courses')}>探索课程</button><button className={tab === 'saved' ? 'is-active' : ''} onClick={() => setTab('saved')}>我的收藏<span>{saved.length || ''}</span></button></nav>
      <span className="sd-library-topnote"><span />让知识可以被探索</span>
      <a className="sd-library-create" href="/edit-deck">✧ 创作课件</a>
    </header>
    <aside className="sd-library-sidebar" aria-label="课程分类">
      <p className="sd-library-nav-label">课程图书馆</p>
      <div className="sd-library-topics">{topics.map(item => <button key={item.name} aria-pressed={topic === item.name} className={topic === item.name ? 'is-active' : ''} onClick={() => setTopic(item.name)}><Icon name={item.icon} /><span>{item.name}</span><small>{item.name === '全部课程' ? courses.length : courses.filter(module => info(module).topic === item.name).length}</small></button>)}</div>
      <div className="sd-library-sidebar-bottom"><div className="sd-library-mode-note"><span className="sd-library-note-icon"><Icon name="spark" /></span><strong>同一份知识，两种体验</strong><p>自己动手探索，<br />也能带进课堂讲授。</p></div><details className="sd-library-tools"><summary><Icon name="code" />开发工具<span>＋</span></summary><a href="/shared/ui-kit">Shared UI Kit <span>↗</span></a>{activeModules.filter(module => !module.pptDeck).map(module => <a href={module.path} key={module.id}>{module.badge === '接口联调' || module.id === 'memory-test' ? '接口联调' : '可编辑画布'}<span>↗</span></a>)}</details></div>
    </aside>
    <main id="sd-library-main" className="sd-library-main">
      <div className="sd-library-heading"><div><p className="sd-library-eyebrow">EXPLORE · INTERACT · UNDERSTAND</p><h1>{tab === 'saved' ? '留住你的好奇心' : '下一次理解，从这里开始'}<span>。</span></h1><p>{tab === 'saved' ? '感兴趣的课程，随时回来继续探索。' : '从真实问题出发，在交互中建立直觉。'}</p></div><span className="sd-library-heading-mark" aria-hidden="true">✳</span></div>
      {recentCourse && <button className="sd-library-recent" onClick={() => setPreview(recentCourse)}><Icon name="clock" /><span>最近浏览<strong>{info(recentCourse).title}</strong></span><span>继续浏览 <Icon name="arrow" /></span></button>}
      <div className="sd-library-search"><Icon name="search" /><input ref={searchRef} type="search" value={query} onChange={event => setQuery(event.target.value)} aria-label="搜索课程、知识点或页面" placeholder="想了解什么？搜索课程、知识点或页面…" />{query && <button aria-label="清空搜索" onClick={() => {setQuery(''); searchRef.current?.focus();}}><Icon name="close" /></button>}</div>
      <div className="sd-library-filterbar"><div className="sd-library-levels" aria-label="课程难度">{['全部', '入门', '进阶'].map(item => <button key={item} aria-pressed={level === item} className={level === item ? 'is-active' : ''} onClick={() => setLevel(item)}>{item}</button>)}</div><div className="sd-library-results"><span aria-live="polite">{filtered.length} 门课程</span><select aria-label="课程排序" value={sort} onChange={event => setSort(event.target.value)}><option value="default">推荐顺序</option><option value="pages">页数从少到多</option><option value="name">课程名称</option></select></div></div>
      <div className="sd-library-grid">{filtered.map(module => {
        const meta = info(module);
        return <article className="sd-library-card" key={module.id} aria-label={meta.title}>
          <button className="sd-library-cover-button" onClick={() => {remember(module); setPreview(module);}} aria-label={`浏览${meta.title}目录`}><Cover module={module} /><span className="sd-library-cover-overlay">浏览课程目录 <Icon name="arrow" /></span></button>
          <div className="sd-library-card-copy"><div className="sd-library-card-meta"><span>{meta.topic}</span><span className="sd-library-difficulty">{module.difficulty === 'introductory' ? '入门' : module.difficulty === 'advanced' ? '高级' : module.difficulty === 'intermediate' ? '进阶' : '探索'}</span><button className={saved.includes(module.id) ? 'is-saved' : ''} onClick={() => toggleSaved(module.id)} aria-label={`${saved.includes(module.id) ? '取消收藏' : '收藏'}${meta.title}`} aria-pressed={saved.includes(module.id)}><Icon name="bookmark" /></button></div>
            <h2><button onClick={() => { remember(module); setPreview(module); }}>{meta.title}</button></h2><p>{meta.summary}</p>
            <div className="sd-library-card-actions"><a href={module.path} onClick={() => remember(module)}><Icon name="book" />自学互动模式</a><a href={presentationHref(module)} onClick={() => remember(module)}><Icon name="play" />教学展示模式</a></div>
          </div>
        </article>;
      })}</div>
      {!filtered.length && <div className="sd-library-empty"><Icon name={tab === 'saved' && !saved.length ? 'bookmark' : 'search'} /><h2>{tab === 'saved' && !saved.length ? '把感兴趣的课程收在这里' : '暂时没有找到相关课程'}</h2><p>{tab === 'saved' && !saved.length ? '点击课程卡片上的收藏图标，下次更容易找到。' : '试试其他关键词，或放宽分类与难度筛选。'}</p><button onClick={reset}>浏览全部课程 <Icon name="arrow" /></button></div>}
      <footer className="sd-library-footer"><span>SceneDeck</span><p>不止于看见，更在于理解。</p><span>自主探索 · 课堂展示</span></footer>
    </main>
    <dialog className="sd-library-dialog" ref={dialogRef} onCancel={() => setPreview(null)} onClick={event => {if (event.target === event.currentTarget) setPreview(null);}} aria-labelledby="sd-library-dialog-title">
      {preview && <><header><div><span className="sd-library-eyebrow">{info(preview).topic} · {preview.pages.length} 页</span><h2 id="sd-library-dialog-title">{info(preview).title}</h2><p>{info(preview).summary}</p></div><button className="sd-library-dialog-close" autoFocus aria-label="关闭课程目录" onClick={() => setPreview(null)}><Icon name="close" /></button></header><div className="sd-library-dialog-modes sd-library-card-actions"><a href={preview.path} onClick={() => remember(preview)}><Icon name="book" />自学互动模式</a><a href={presentationHref(preview)} onClick={() => remember(preview)}><Icon name="play" />教学展示模式</a></div><ol className="sd-library-directory">{preview.pages.map((page, index) => <li key={page.id}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{page.title}</h3><p>{page.goal ?? page.summary}</p></div><a href={presentationHref(preview, page.id)} onClick={() => remember(preview)} aria-label={`教学展示：${page.title}`}><Icon name="arrow" /></a></li>)}</ol></>}
    </dialog>
  </div>;
}
