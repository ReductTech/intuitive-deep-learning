import React, {useState, type ComponentType} from 'react';
import {createRoot} from 'react-dom/client';
import courses from 'virtual:preview-catalog';
import './styles.css';

const root = createRoot(document.getElementById('root')!);
const params = new URLSearchParams(location.search);

function Catalog() {
  const [search, setSearch] = useState('');
  const visible = courses.filter(course => `${course.title} ${course.id}`.toLowerCase().includes(search.toLowerCase()));
  return <main className="preview-catalog">
    <header><span className="preview-eyebrow">术库 / 本地开发</span><h1>课程播放器预览</h1>
      <p>选择本地课程查看效果。课程与素材读取 IDL 的 modules 目录，播放器使用本目录中的副本。</p>
      <a className="preview-demo" href="?demo=1">打开播放器交互演示 →</a>
    </header>
    <label className="preview-search">查找课程<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="输入课程名称或 UUID" /></label>
    <p className="preview-count">共 {visible.length} 门课程</p>
    <div className="preview-grid">{visible.map(course => <article key={course.id}>
      <span className="preview-eyebrow">{course.badge || '教学课程'} · {course.pages.length} 页</span>
      <h2>{course.title}</h2><p>{course.description || '本地课件预览'}</p>
      <footer>{course.ppt?.entry && <a href={`?course=${course.id}&view=ppt`}>播放课件 →</a>}
        {course.entry && <a href={`?course=${course.id}&view=guide`}>课程导览</a>}
        {!course.entry && !course.ppt?.entry && <span>尚无可预览入口</span>}</footer>
    </article>)}</div>
    {!visible.length && <p>没有匹配的课程。</p>}
  </main>;
}

async function openCourse(id: string) {
  const course = courses.find(course => course.id === id);
  if (!course) throw Error('没有找到课程：' + id);
  document.title = course.title + ' · 本地预览';
  Reflect.set(globalThis, '__SHUKU_COURSE_ID__', course.assetId);
  Reflect.set(globalThis, '__SHUKU_ASSET_BASE__', location.origin + '/');
  Reflect.set(globalThis, '__SHUKU_PAGE_CATALOG__', course);
  // Load only the selected course. Full page navigation keeps course CSS and state isolated.
  const module = await import(/* @vite-ignore */ `/@id/__x00__virtual:preview-course:${course.id}`);
  const {SceneDeck} = await import('@preview/runtime');
  await import('@preview/runtime-styles');
  const deck = module.presentation?.deck;
  const Guide = module.guide?.[module.guideExport] as ComponentType | undefined;
  const Ppt = module.presentation?.[module.pptExport] as ComponentType | undefined;
  const notes = (id: string) => {
    const page = course.pages.find(page => page.id === id);
    return typeof page?.snippet === 'string' ? [{text: page.snippet, selectors: []}] : module.presentation?.getPptNotes?.(id) || [];
  };
  if (params.get('view') === 'guide' && Guide) root.render(<Guide />);
  else if (deck) root.render(<SceneDeck catalog={[{...deck, id: course.id}]} moduleId={course.id}
    assetId={course.assetId} progressKey={'idl-preview:' + course.id} getNotes={notes} />);
  else if (Ppt) root.render(<Ppt />);
  else if (Guide) root.render(<Guide />);
  else throw Error('这门课程还没有可预览入口。');

  // Keep legacy links in this local preview, including links between different courses.
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
    if (!link || link.target || link.hasAttribute('download')) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return;
    const isPpt = ['/scenedeck/', '/web_ppt/', '/web_ppt/slide.html'].includes(url.pathname);
    const moduleId = url.pathname.match(/^\/modules\/([^/]+)/)?.[1];
    if (!isPpt && !moduleId) return;
    const targetId = moduleId || url.searchParams.get('deck');
    const target = courses.find(item => item.id === targetId || item.alias === targetId) || course;
    event.preventDefault();
    url.pathname = '/'; url.searchParams.set('course', target.id); url.searchParams.set('view', isPpt ? 'ppt' : 'guide');
    location.assign(url.href);
  });
}

if (params.has('demo')) {
  import('./demo').then(({Demo}) => root.render(<Demo />));
} else if (params.has('course')) {
  root.render(<p className="preview-status">正在加载课程…</p>);
  openCourse(params.get('course')!).catch(error => root.render(<main className="preview-status" role="alert">
    <h1>课程加载失败</h1><p>{String(error.message || error)}</p><p>详细信息可查看终端和浏览器控制台。</p><a href="/">返回课程列表</a>
  </main>));
} else root.render(<Catalog />);
