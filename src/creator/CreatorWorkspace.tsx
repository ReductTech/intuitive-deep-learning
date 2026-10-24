import { useEffect, useRef, useState, type ReactNode } from 'react';
import { TextPage } from '../shuku/TextPage';
import '../shuku/RuntimePlayer.css';
import { activeModules } from '../app/modules';
import { moduleAssetUrl } from '../../modules/shared/react/assets';
import { Typography } from '../../modules/shared/react/typography';
import { QuestionModeProvider } from '../../modules/shared/react/learning/QuestionMode';
import { useSceneScale } from '../../modules/shared/react/presentation/canvas';
import { createProject, isProject, simulateRevision, snapshot, primaryActionFor, preserveExistingWebPages, applyPageOutline, type CreatorPage, type CreatorProject } from './model';
import { generatePageDesign } from './designGeneration';
import { PageNavigator } from './PageNavigator';
import { PageProperties } from './PageProperties';
import { useSourceTextEditing } from './useSourceTextEditing';
import { readDesignImage } from './designImages';
import { packProject, unpackProject } from './projectImages';
import './CreatorWorkspace.css';

const courses = activeModules.filter(module => module.pptDeck);
const key = (courseId: string) => `scenedeck:creator:v1:${courseId}`;
function load(courseId: string) {
  const module = courses.find(item => item.id === courseId || item.pptDeck?.id === courseId) ?? courses[0];
  try { const stored: unknown = JSON.parse(localStorage.getItem(key(module.id)) ?? 'null'); if (isProject(stored, module.id)) return preserveExistingWebPages(stored, module); } catch { /* A fresh copy remains available. */ }
  return createProject(module);
}
const paths = { spark: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z', play: 'm9 5 11 7-11 7z', plus: 'M12 5v14M5 12h14', send: 'm4 4 17 8-17 8 4-8zM8 12h13', back: 'm9 5-7 7 7 7M2 12h17', check: 'm5 12 4 4L19 6', close: 'm6 6 12 12M6 18 18 6', download: 'M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4', settings: 'M4 7h16M4 17h16M8 4v6M16 14v6' };
function Icon({ name }: { name: keyof typeof paths }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>; }
function download(name: string, value: string, type = 'application/json') { const url = URL.createObjectURL(new Blob([value], { type })); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
const escape = (text: string) => text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function CreatorWorkspace({initialProject,managed}:{initialProject?:CreatorProject;managed?:{status:string;actions:ReactNode;onChange:(project:CreatorProject)=>void}}={}) {
  const [project, setProject] = useState(() => initialProject ?? load(new URLSearchParams(location.search).get('deck') ?? 'neuron-guide'));
  const [activeId, setActiveId] = useState(() => { const requested = new URLSearchParams(location.search).get('slide'); return project.pages.find(item => item.id === requested)?.id ?? project.pages[0].id; });
  const [mode, setMode] = useState<'edit' | 'preview' | 'present'>(managed?'edit':'preview');
  const [view, setView] = useState<'design' | 'web'>(() => project.pages.find(item => item.id === activeId)?.designImageId && !project.pages.find(item => item.id === activeId)?.ready ? 'design' : 'web');
  const [panel, setPanel] = useState<'settings' | 'notes' | null>(null);
  const [prompt, setPrompt] = useState('');
  const [feedback, setFeedback] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(''), [notice, setNotice] = useState(''), [saved, setSaved] = useState('已保存到此浏览器');
  const [chatOpen, setChatOpen] = useState(false);
  const [designImage, setDesignImage] = useState<string | undefined>();
  const [imageError, setImageError] = useState('');
  const [propertiesId, setPropertiesId] = useState<string | null>(null);
  const [history, setHistory] = useState<CreatorProject[]>([]), [future, setFuture] = useState<CreatorProject[]>([]);
  const [completed, setCompleted] = useState<string[]>([]);
  const viewport = useRef<HTMLDivElement>(null), log = useRef<HTMLDivElement>(null), importInput = useRef<HTMLInputElement>(null);
  const nativeRoot = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imageAbort = useRef<AbortController | null>(null);
  const presentationReturnMode = useRef<'edit' | 'preview'>('preview');
  const wasFullscreen = useRef(false);
  const [fullscreenScale, setFullscreenScale] = useState<number | null>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const fittedScale = useSceneScale(viewport);
  const scale = fullscreenScale ?? fittedScale;
  const module = courses.find(item => item.id === project.courseId)!;
  const page = project.pages.find(item => item.id === activeId) ?? project.pages[0];
  const index = project.pages.indexOf(page);
  const native = module.pptDeck!.scenes.find(item => item.id === page.nativeId);
  const thumbnail = page.nativeId ? moduleAssetUrl(module.assetId, `scenedeck-thumbnails/${page.nativeId}.png`) : '';
  const editing = mode === 'edit';
  useSourceTextEditing(nativeRoot, !managed && editing && Boolean(native) && view === 'web', page.id, setNotice);

  useEffect(() => { setProject(current => preserveExistingWebPages(current, module)); }, [module]);
  useEffect(() => {
    const id = project.pages.some(item => item.id === activeId) ? activeId : project.pages[0].id;
    if (id !== activeId) setActiveId(id);
    const url = new URL(location.href);
    const requested = url.searchParams.get('slide');
    if (requested && !project.pages.some(item => item.id === requested)) {
      url.searchParams.set('slide', id);
      window.history.replaceState(null, '', url);
    }
  }, [project.pages, activeId]);

  function commit(next: CreatorProject) { setHistory(items => [...items.slice(-19), project]); setFuture([]); setProject(next); }
  function patchPage(patch: Partial<CreatorPage>) { commit({ ...project, pages: project.pages.map(item => item.id === page.id ? { ...item, ...patch } : item) }); }
  function select(id: string) { setActiveId(id); setView(project.pages.find(item => item.id === id)?.designImageId && !project.pages.find(item => item.id === id)?.ready ? 'design' : 'web'); setPrompt(''); setFeedback(''); setActionError(''); const url = new URL(location.href); url.searchParams.set('deck', module.pptDeck!.id); url.searchParams.set('slide', id); window.history.replaceState(null, '', url); }
  function step(delta: number) { select(project.pages[Math.max(0, Math.min(project.pages.length - 1, index + delta))].id); }
  useEffect(() => { document.title = `术库 · ${project.title}`; if(managed){managed.onChange(project);return;} setSaved('保存中…'); try { localStorage.setItem(key(project.courseId), JSON.stringify(project)); setSaved('已保存到此浏览器'); } catch { setSaved('保存失败，请导出项目备份'); } }, [project]);
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight }); }, [page.messages, busy, chatOpen]);
  useEffect(() => {
    let active = true; setDesignImage(undefined); setImageError('');
    if (page.designImageId) readDesignImage(page.designImageId).then(image => { if (!active) return; setDesignImage(image); if (!image) setImageError('设计图数据缺失，请导入完整项目备份或重新生成。'); }).catch(error => { if (active) setImageError(error instanceof Error ? error.message : '无法加载设计图'); });
    return () => { active = false; };
  }, [page.designImageId]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); imageAbort.current?.abort(); }, []);
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      const element = viewport.current;
      if (element && document.fullscreenElement === element) setFullscreenScale(Math.min(element.clientWidth / 1600, element.clientHeight / 900));
    };
    const change = () => {
      if (document.fullscreenElement === viewport.current) {
        wasFullscreen.current = true; setMode('present'); measure(); frame = requestAnimationFrame(measure);
      } else if (wasFullscreen.current) {
        wasFullscreen.current = false; setFullscreenScale(null); setMode(presentationReturnMode.current);
      }
    };
    document.addEventListener('fullscreenchange', change); window.addEventListener('resize', measure);
    return () => { cancelAnimationFrame(frame); document.removeEventListener('fullscreenchange', change); window.removeEventListener('resize', measure); };
  }, []);
  async function present() {
    const element = viewport.current;
    if (!element?.requestFullscreen) { setNotice('当前浏览器不支持全屏演示，请使用 Chrome 或 Edge。'); return; }
    presentationReturnMode.current = mode === 'preview' ? 'preview' : 'edit';
    if (page.ready || native) setView('web');
    try { await element.requestFullscreen({ navigationUI: 'hide' }); }
    catch { setNotice('浏览器未能进入全屏，请再次点击「演示」。'); }
  }
  async function exitPresentation() {
    if (document.fullscreenElement === viewport.current) { try { await document.exitFullscreen(); } catch { setNotice('请按 Esc 退出全屏。'); } }
    else setMode(presentationReturnMode.current);
  }
  useEffect(() => {
    if (!panel) return;
    const previous = document.activeElement as HTMLElement | null;
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const controls = [...(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,textarea,select') ?? [])];
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener('keydown', trap); return () => { window.removeEventListener('keydown', trap); previous?.focus(); };
  }, [panel]);
  useEffect(() => { if (!notice) return; const id = setTimeout(() => setNotice(''), 4500); return () => clearTimeout(id); }, [notice]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { if (mode === 'present') void exitPresentation(); else if (panel) setPanel(null); else { setMode('preview'); setView('web'); } return; }
      if ((event.target as HTMLElement).closest('input,textarea,select,[contenteditable]') || panel || busy) return;
      if (!editing && ['ArrowRight', 'PageDown', 'ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); step(['ArrowRight', 'PageDown'].includes(event.key) ? 1 : -1); }
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  });
  function switchCourse(id: string) { const next = load(id); setProject(next); setActiveId(next.pages[0].id); setHistory([]); setFuture([]); setCompleted([]); setPrompt(''); setFeedback(''); setActionError(''); setView(next.pages[0].designImageId && !next.pages[0].ready ? 'design' : 'web'); const url = new URL(location.href); url.searchParams.set('deck', courses.find(c => c.id === id)!.pptDeck!.id); url.searchParams.delete('slide'); window.history.replaceState(null, '', url); }
  function addPage() { if (project.pages.length >= 100) { setNotice('原型最多支持 100 页'); return; } const item: CreatorPage = { id: crypto.randomUUID(), title: '新的教学页面', goal: '这一页希望学生理解什么？', summary: '在大纲中补充教学内容，再与创作助手讨论设计。', ...(managed?{format:'text' as const}:{}), designed: Boolean(managed), ready: Boolean(managed), note: '', revisions: [], messages: [] }; commit({ ...project, outlineConfirmed: false, pages: [...project.pages, item] }); setActiveId(item.id); setView('design'); setFeedback(''); setActionError(''); setPrompt(''); }
  function move(from: number, delta: number) { const to = from + delta; if (to < 0 || to >= project.pages.length) return; const pages = [...project.pages]; [pages[from], pages[to]] = [pages[to], pages[from]]; commit({ ...project, pages }); }
  function simulate(instruction = prompt) {
    if (!instruction.trim() || busy) return;
    setPrompt(''); setBusy('正在模拟修改页面…');
    timer.current = setTimeout(() => { commit({ ...project, pages: project.pages.map(item => item.id === page.id ? simulateRevision(item, instruction.trim()) : item) }); setView('web'); setBusy(''); setFeedback('已完成模拟修改，继续输入即可调整。'); timer.current = null; }, 850);
  }
  function generate() { if (busy) return; setBusy('正在模拟生成交互网页…'); timer.current = setTimeout(() => { patchPage({ designed: true, ready: true, revisions: [...page.revisions, snapshot(page)], messages: [...page.messages, { role: 'assistant', text: '模拟网页已就绪。点击「预览」体验示例交互；你也可以继续修改或恢复上一版。' }] }); setBusy(''); setView('web'); setFeedback('网页预览已就绪，可以直接预览或继续修改。'); timer.current = null; }, 1000); }
  function restoreProject(next: CreatorProject) { next = preserveExistingWebPages(next, module); const current = next.pages.find(item => item.id === page.id) ?? next.pages[0]; setProject(next); setActiveId(current.id); setView(current.designImageId && !current.ready ? 'design' : 'web'); setActionError(''); setFeedback(''); }
  function undo() { if (!history.length) return; setFuture(items => [project, ...items]); restoreProject(history[history.length - 1]); setHistory(items => items.slice(0, -1)); }
  function redo() { if (!future.length) return; setHistory(items => [...items, project]); restoreProject(future[0]); setFuture(items => items.slice(1)); }
  async function exportProject() {
    try { download(`${project.title}.scenedeck.json`, await packProject(project)); return true; }
    catch (error) { setNotice(error instanceof Error ? error.message : '项目备份失败'); return false; }
  }
  async function design(useReference = true) {
    if (busy) return;
    const controller = new AbortController(); imageAbort.current = controller;
    setBusy(useReference && page.designImageId ? '正在修改设计图…' : '正在生成设计图…'); setActionError('');
    const instruction = prompt;
    try {
      const id = await generatePageDesign(project, page, instruction, controller.signal, useReference);
      if (controller.signal.aborted) return;
      patchPage({ designImageId: id, designed: true, ready: Boolean(native) || page.ready, note: instruction, revisions: [...page.revisions, snapshot(page)] });
      setView('design'); setPrompt(''); setFeedback('设计图已更新。继续输入修改意见，或制作成网页。');
    } catch (error) { if (!controller.signal.aborted) setActionError(error instanceof Error ? error.message : '生成失败，请重试。'); }
    finally { if (imageAbort.current === controller) { imageAbort.current = null; setBusy(''); } }
  }
  function stop() { imageAbort.current?.abort(); if (timer.current) { clearTimeout(timer.current); timer.current = null; } setBusy(''); setFeedback('已停止，上一版内容保留。'); }
  const showingImage = Boolean(page.designImageId && view === 'design');
  const primary = primaryActionFor(page, view, prompt);
  const primaryLabel = primary.label;
  function primaryAction() {
    if (busy) return;
    setActionError('');
    if (primary.kind === 'image') void design();
    else if (primary.kind === 'edit') simulate();
    else if (primary.kind === 'build') generate();
    else { setView('web'); setMode('preview'); setCompleted([]); }
  }
  function reorder(fromId: string, toId: string) {
    if (fromId === toId) return;
    const pages = [...project.pages], from = pages.findIndex(item => item.id === fromId), to = pages.findIndex(item => item.id === toId);
    if (from < 0 || to < 0) return;
    pages.splice(to, 0, ...pages.splice(from, 1)); commit({ ...project, pages });
  }
  function duplicate(id: string) { const source = project.pages.find(item => item.id === id)!; const copy = { ...source, id: crypto.randomUUID(), title: `${source.title} 副本` }; const pages = [...project.pages]; pages.splice(pages.indexOf(source) + 1, 0, copy); commit({ ...project, pages }); setActiveId(copy.id); setView(copy.designImageId && !copy.ready ? 'design' : 'web'); setPrompt(''); setFeedback(''); }
  function deletePage(id: string) {
    if (project.pages.length === 1) return;
    const pages = project.pages.filter(item => item.id !== id); commit({ ...project, pages });
    if (page.id === id) { const next = pages[Math.min(index, pages.length - 1)]; setActiveId(next.id); setView(next.designImageId && !next.ready ? 'design' : 'web'); setPrompt(''); setFeedback(''); }
  }
  async function newBlankProject() {
    if (!await exportProject()) return;
    const item: CreatorPage = { id: crypto.randomUUID(), title: '新的教学页面', goal: '这一页希望学生理解什么？', summary: '在大纲中补充教学内容，再与创作助手讨论设计。', ...(managed?{format:'text' as const}:{}), designed: Boolean(managed), ready: Boolean(managed), note: '', revisions: [], messages: [] };
    commit({ ...project, id: crypto.randomUUID(), title: '未命名课件', outlineConfirmed: false, pages: [item] }); setActiveId(item.id); setView('design'); setPanel('settings');
  }
  async function exportOffline() {
    setBusy('正在准备离线课件…');
    try {
      const slides = await Promise.all(project.pages.map(async item => {
        if (item.designImageId && !item.nativeId) {
          const image = await readDesignImage(item.designImageId);
          if (!image) throw new Error('设计图缺失，离线导出未完成。请导入完整备份或重新生成。');
          return `<section><img alt="${escape(item.title)}" src="${image}"><p class="caption">${escape(item.title)} · 设计图快照</p></section>`;
        }
        if (item.nativeId) {
          const response = await fetch(moduleAssetUrl(module.assetId, `scenedeck-thumbnails/${item.nativeId}.png`)); if (!response.ok) throw new Error(`第 ${project.pages.indexOf(item) + 1} 页缺少快照，离线导出未完成`);
          const blob = await response.blob(); const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob); });
          return `<section><img alt="${escape(item.title)}" src="${data}"><p class="caption">${escape(item.title)} · 原课程快照（交互需在线打开）</p></section>`;
        }
        return `<section><article><small>教学设计 · ${escape(project.style)}</small><h1>${escape(item.title)}</h1><h2>${escape(item.goal)}</h2><p>${escape(item.summary)}</p>${item.note ? `<blockquote>本版调整：${escape(item.note)}</blockquote>` : ''}<button onclick="this.textContent='✓ 已完成思考'">我已经理解，标记完成</button></article></section>`;
      }));
      download(`${project.title}-离线演示.html`, `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(project.title)}</title><style>*{box-sizing:border-box}body{margin:0;background:#eef2f8;color:#19345e;font:20px system-ui}header{height:70px;padding:16px 4vw;background:white;display:flex;justify-content:space-between;align-items:center}button{padding:10px 18px;border:1px solid #ccd8ef;border-radius:8px;cursor:pointer;background:white;color:#245ce8}section{display:none;height:calc(100vh - 100px);padding:20px 4vw;text-align:center}section.active{display:flex;flex-direction:column;align-items:center;justify-content:center}img{max-width:100%;max-height:82%;object-fit:contain}article{background:white;width:min(1200px,100%);padding:6%;text-align:left;border-radius:16px}h1{font-size:clamp(28px,4vw,55px)}p,h2{line-height:1.6}.caption{font-size:14px}</style><header><strong>${escape(project.title)}</strong><div><button id="prev">← 上一页</button> <span id="count"></span> <button id="next">下一页 →</button></div></header>${slides.join('')}<script>let i=0;const s=[...document.querySelectorAll('section')];function show(n){i=Math.max(0,Math.min(s.length-1,n));s.forEach((e,j)=>e.classList.toggle('active',j===i));document.getElementById('count').textContent=(i+1)+' / '+s.length;document.getElementById('prev').disabled=i===0;document.getElementById('next').disabled=i===s.length-1}document.getElementById('prev').onclick=()=>show(i-1);document.getElementById('next').onclick=()=>show(i+1);document.onkeydown=e=>{if(e.key==='ArrowRight')show(i+1);if(e.key==='ArrowLeft')show(i-1)};show(0)</script></html>`, 'text/html');
      setNotice('离线 HTML 已导出：原课程为缩略图快照，模拟页面为基础网页。');
    } catch (error) { setNotice(error instanceof Error ? error.message : '离线导出失败，请重试'); } finally { setBusy(''); }
  }
  const mock = !native;
  const hint = feedback || (showingImage ? '直接描述想改哪里；满意后制作成网页。' : page.ready ? '描述这一页想怎么改，或直接预览。' : '写下这一页的内容和要求，生成第一版设计。');
  return <div className={`cw-app cw-streamlined ${editing ? 'cw-editing' : 'cw-viewing'} ${mode === 'present' ? 'cw-presenting' : ''}`}>
    <header className="cw-topbar">
      <a href="/" className="cw-brand"><span><Icon name="spark" /></span><div><strong>术库</strong><small>课件创作</small></div></a>
      {managed?<strong className="cw-managed-title">{project.title}</strong>:<select aria-label="切换课程" value={project.courseId} disabled={Boolean(busy)} onChange={event => switchCourse(event.target.value)}>{courses.map(c => <option key={c.id} value={c.id}>{c.id === project.courseId ? project.title : c.title}</option>)}</select>}
      <span className="cw-save">{managed?managed.status:`✓ ${saved}`}</span>
      <div className="cw-actions">{managed?.actions}
        {editing ? <>
          <button title="撤销" aria-label="撤销" disabled={!history.length || Boolean(busy)} onClick={undo}>↶</button><button title="重做" aria-label="重做" disabled={!future.length || Boolean(busy)} onClick={redo}>↷</button>
          {!managed&&<details className="cw-file-menu"><summary>文件</summary><div onClick={event => { if ((event.target as HTMLElement).closest('button')) event.currentTarget.parentElement?.removeAttribute('open'); }}><button disabled={Boolean(busy)} onClick={newBlankProject}>新建课件（先备份当前）</button><button disabled={Boolean(busy)} onClick={() => importInput.current?.click()}>导入项目</button><button disabled={Boolean(busy)} onClick={exportProject}>导出可编辑项目</button><button disabled={Boolean(busy)} onClick={exportOffline}>离线演示（快照版）</button><button disabled={Boolean(busy)} onClick={() => setPanel('settings')}>课程设置</button></div></details>}
        </> : <><span className="cw-prototype">{mode === 'preview' ? '页面预览' : '演示模式'}</span><button onClick={() => setPanel('notes')}>讲稿</button></>}
        {managed&&editing&&<button onClick={()=>setPropertiesId(page.id)}>编辑内容</button>}
         {mode !== 'present' && <button className="cw-edit-toggle" aria-pressed={editing} disabled={Boolean(busy)} title={editing ? '退出编辑，恢复页面交互（Esc）' : '进入编辑模式，修改文字和页面属性'} onClick={() => { setMode(editing ? 'preview' : 'edit'); setView('web'); setPanel(null); setPropertiesId(null); }}>{editing ? '✓ 完成编辑' : '✎ 编辑'}</button>}
        {mode !== 'present' && <button className="cw-present-button" disabled={Boolean(busy)} onClick={present}><Icon name="play" />演示</button>}
      </div>
    </header>
    <PageNavigator pages={project.pages} activeId={page.id} busy={Boolean(busy)} editable={editing} thumbnail={item => item.nativeId ? moduleAssetUrl(module.assetId, `scenedeck-thumbnails/${item.nativeId}.png`) : undefined} onSelect={select} onReorder={reorder} onAdd={addPage} onProperties={setPropertiesId} />
    <main className="cw-main">
      <header className="cw-page-heading"><div><span>{String(index + 1).padStart(2, '0')}</span><strong>{page.title}</strong><small>{showingImage ? '设计图' : page.ready ? '网页' : '待设计'}</small>{editing && <span className="cw-edit-indicator">{managed?'编辑模式':'编辑模式 · 双击文字修改'}</span>}</div>{editing && <details className="cw-canvas-menu"><summary aria-label="当前页更多操作">···</summary><div onClick={event => { if ((event.target as HTMLElement).closest('button')) event.currentTarget.parentElement?.removeAttribute('open'); }}>{page.designImageId && page.ready && <button disabled={Boolean(busy)} onClick={() => setView(showingImage ? 'web' : 'design')}>{showingImage ? '查看网页' : '查看设计图'}</button>}<button disabled={Boolean(busy)} onClick={() => void design(false)}>{page.designImageId ? '重新生成设计图' : '生成设计图'}</button>{page.revisions.length > 0 && <button disabled={Boolean(busy)} onClick={() => { const previous = page.revisions[page.revisions.length - 1]; patchPage({ ...previous, ready: Boolean(native) || previous.ready, revisions: page.revisions.slice(0, -1) }); setView(previous.designImageId && !previous.ready && !native ? 'design' : 'web'); setFeedback('已恢复上一版。'); }}>恢复上一版</button>}<button disabled={Boolean(busy)} onClick={() => setPanel('notes')}>查看讲稿</button></div></details>}</header>
      <div className="cw-viewport" ref={viewport}><div className="cw-slide-wrap" style={{ width: 1600 * scale, height: 900 * scale }}><div className="cw-slide course-shell ng-ppt-slide-surface" style={{ transform: `scale(${scale})` }}>
        {page.format==='text' ? <TextPage key={page.id} title={project.title} page={page}/>:!page.ready && !page.designed ? <div className="cw-empty-slide"><Typography variant="bodySmall">新的教学页面</Typography><Typography variant="h1">{page.title}</Typography><Typography variant="subtitle">{page.goal}</Typography><Typography variant="bodySmall" tone="muted">在下方描述这一页，生成第一版设计。</Typography></div> : page.designImageId && view === 'design' ? designImage ? <img className="cw-design-image" src={designImage} alt={`${page.title}生成的设计图`} /> : <div className="cw-image-loading">{imageError || '正在加载设计图…'}</div> : mock ? <div className={`cw-mock-slide ${project.style === '温暖叙事' ? 'warm' : project.style === '深色科技' ? 'dark' : ''}`}><Typography variant="bodySmall" tone="inherit">{project.title} / {String(index + 1).padStart(2, '0')}</Typography><Typography variant="h1" tone="inherit">{page.title}</Typography><div className="cw-mock-content"><div><Typography variant="h3" tone="inherit">从一个问题开始</Typography><Typography variant="subtitle" tone="inherit">{page.goal}</Typography><div className="cw-concept"><span /><span /><span /><span /><span /></div></div><div><Typography variant="h3" tone="inherit">观察 · 思考 · 理解</Typography><Typography variant="body" tone="inherit">{page.summary}</Typography>{page.note && <div className="cw-note"><Typography variant="bodySmall" tone="inherit">本版调整</Typography><Typography variant="body" tone="inherit">{page.note}</Typography></div>}{!editing && page.ready && <button className="cw-demo-answer" onClick={() => setCompleted(ids => ids.includes(page.id) ? ids : [...ids, page.id])}>{completed.includes(page.id) ? '✓ 已完成思考' : '我已经理解，标记完成'}</button>}</div></div><Typography variant="bodySmall" tone="inherit">{view === 'design' && editing ? '模拟设计方案 · 确认后制作网页' : '模拟网页 · 示例交互'}</Typography></div>
          : editing && view === 'design' ? <img className="cw-design-image" src={thumbnail} alt={`${page.title}设计参考快照`} /> : <div ref={nativeRoot} className={`cw-native course-page-surface ppt-slide-surface${editing ? ' cw-text-editing' : ''}`} key={`${page.id}:${mode}`}><QuestionModeProvider mode="ppt">{native.render({ complete: () => setCompleted(ids => ids.includes(page.id) ? ids : [...ids, page.id]), reset: () => setCompleted(ids => ids.filter(id => id !== page.id)), isComplete: completed.includes(page.id) })}</QuestionModeProvider></div>}

      </div></div>{mode === 'present' && <div className="cw-fullscreen-controls"><button aria-label="上一页" disabled={index === 0} onClick={() => step(-1)}>←</button><span>{index + 1} / {project.pages.length}</span><button aria-label="下一页" disabled={index === project.pages.length - 1} onClick={() => step(1)}>→</button><button onClick={exitPresentation}>退出全屏 · Esc</button></div>}</div>
      <div className="cw-view-footer"><span>{index + 1} / {project.pages.length} · {Math.round(scale * 100)}%</span>{page.designImageId && page.ready && editing && <button onClick={() => setView(showingImage ? 'web' : 'design')}>{showingImage ? '查看网页' : '查看设计图'}</button>}{!editing && <div><button aria-label="上一页" disabled={index === 0} onClick={() => step(-1)}>←</button><button aria-label="下一页" disabled={index === project.pages.length - 1} onClick={() => step(1)}>→</button></div>}</div>
      {editing && !managed && <section className="cw-composer" aria-label="当前页创作">
        {chatOpen && <div className="cw-conversation" ref={log}>{page.messages.map((message, i) => <p key={i} className={message.role}><span>{message.role === 'user' ? '你' : '助手'}</span>{message.text}</p>)}{!page.messages.length && <p>还没有修改记录。</p>}</div>}
        <div className="cw-composer-hint"><span aria-live="polite">{busy || hint}</span>{page.messages.length > 0 && <button onClick={() => setChatOpen(!chatOpen)}>{chatOpen ? '收起记录' : '修改记录'}</button>}</div>
        {actionError && <div className="cw-action-error" role="alert">{actionError}<button onClick={() => setPanel('settings')}>课程设置</button></div>}
        <form onSubmit={event => { event.preventDefault(); primaryAction(); }}><textarea aria-label="当前页修改要求" rows={2} maxLength={2000} disabled={Boolean(busy)} value={prompt} onChange={event => setPrompt(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); primaryAction(); } }} placeholder={showingImage ? '例如：减少文字，把右侧关系画得更直观…' : page.ready ? '例如：把这一页的标题缩短，增加一个思考问题…' : '这一页要讲什么？希望画面是什么样？'} />{busy ? <button type="button" onClick={stop}>停止</button> : <button className="cw-primary" type="submit">{primaryLabel}<span>↗</span></button>}</form>
        <footer><span>{showingImage || !page.ready ? '设计图修改' : native && import.meta.env.DEV ? '双击文字直接修改 · 保存到 TSX' : '网页修改 · 模拟演示'} · 自动保存</span><span>Enter 发送 · Shift Enter 换行</span></footer>
      </section>}
    </main>
    {propertiesId && (() => { const target = project.pages.find(item => item.id === propertiesId); if (!target) return null; return <PageProperties key={target.id} page={target} index={project.pages.indexOf(target)} count={project.pages.length} onClose={() => setPropertiesId(null)} onSave={outline => commit({ ...project, pages: project.pages.map(item => item.id === target.id ? applyPageOutline(item, outline) : item) })} onMove={delta => move(project.pages.indexOf(target), delta)} onDuplicate={() => duplicate(target.id)} onDelete={() => deletePage(target.id)} />; })()}
    <input ref={importInput} hidden type="file" accept=".json" onChange={async event => { const file = event.target.files?.[0]; if (!file) return; try { const value: unknown = JSON.parse(await file.text()); if (!isProject(value, project.courseId)) throw new Error('项目格式无效，或不属于当前课程。请先切换到对应课程。'); const restored = preserveExistingWebPages(await unpackProject(value), module); commit(restored); setActiveId(restored.pages[0].id); setView(restored.pages[0].designImageId && !restored.pages[0].ready ? 'design' : 'web'); setFeedback('项目已导入。'); } catch (error) { setNotice(error instanceof Error ? error.message : '导入失败'); } event.target.value = ''; }} />
    {panel && <div className="cw-backdrop" onClick={event => { if (event.target === event.currentTarget) setPanel(null); }}><section ref={dialogRef} className="cw-dialog" role="dialog" aria-modal="true" aria-labelledby="cw-dialog-title"><header><h2 id="cw-dialog-title">{panel === 'notes' ? '本页讲稿' : '课程设置'}</h2><button autoFocus aria-label="关闭面板" onClick={() => setPanel(null)}>×</button></header>
      {panel === 'notes' ? <div className="cw-settings"><p>{(typeof page.outline?.snippet === 'string' ? [{ text: page.outline.snippet }] : module.getPptNotes?.(page.nativeId ?? ''))?.map(note => note.text).filter(Boolean).join('\n') || page.summary || '本页暂无讲稿。'}</p></div> : <div className="cw-settings"><label>课件名称<input value={project.title} onChange={event => commit({ ...project, title: event.target.value })} /></label><label>演讲时长<select value={project.duration} onChange={event => commit({ ...project, duration: Number(event.target.value) })}>{[5, 10, 30, 45, 60].map(n => <option key={n} value={n}>{n} 分钟</option>)}</select></label><p>建议约 {Math.max(3, Math.round(project.duration * .5))}–{Math.max(5, Math.round(project.duration * .8))} 页。当前 {project.pages.length} 页。</p><label>视觉风格<select value={project.style} onChange={event => commit({ ...project, style: event.target.value })}>{['简洁教学', '温暖叙事', '深色科技'].map(style => <option key={style}>{style}</option>)}</select></label><a href="/edit-deck/legacy" target="_blank" rel="noreferrer">生图接口配置 ↗</a><button className="cw-primary" onClick={() => setPanel(null)}>完成</button></div>}
    </section></div>}
    {notice && <div className="cw-toast" role="status">{notice}</div>}
  </div>;
}









