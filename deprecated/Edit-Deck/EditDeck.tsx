import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { SCENE_WIDTH, SCENE_HEIGHT, useSceneScale } from '../modules/shared/react/presentation/canvas';
import { request } from './api';
import { authorSlide } from './agent';
import { compileSlide, downloadFile, previewDocument } from './runtime';
import type { Project, PublicConfig, Selection, Slide } from './types';
import './EditDeck.css';

const newSlide = (): Slide => ({ id: crypto.randomUUID(), title: '未命名页面', prompt: '' });
const newProject = (): Project => ({ id: crypto.randomUUID(), title: '未命名课件', slides: [newSlide()], updatedAt: new Date().toISOString() });
const errorText = (error: unknown) => error instanceof Error ? error.message : '操作失败，请重试';
const icons = {
  logo: 'M4 4h12v12H4zM9 9h12v12H9', plus: 'M12 5v14M5 12h14', arrow: 'M12 19V5m-6 6 6-6 6 6',
  spark: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z',
  image: 'M3 4h18v16H3zM3 16l5-5 5 5 3-3 5 5M15 8h.01',
  play: 'm9 5 11 7-11 7z', check: 'm5 12 4 4L19 6', close: 'm6 6 12 12M6 18 18 6',
  undo: 'm8 4-5 5 5 5M3 9h11a6 6 0 0 1 0 12', redo: 'm16 4 5 5-5 5M21 9H10a6 6 0 0 0 0 12',
  settings: 'M4 7h16M4 17h16M8 4v6M16 14v6', code: 'm8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18',
  pointer: 'm5 3 14 10-7 1-3 7z', trash: 'M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7',
  duplicate: 'M9 9h12v12H9zM15 5V3H3v12h2', left: 'm15 5-7 7 7 7', right: 'm9 5 7 7-7 7',
  download: 'M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4', refresh: 'M20 10a8 8 0 1 0-1 8M20 3v7h-7',
} as const;
function Icon({ name }: { name: keyof typeof icons }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={icons[name]} /></svg>; }

function SlidePreview({ slide, picking, onSelect, onError }: { slide: Slide; picking: boolean; onSelect: (selection: Selection) => void; onError: (error: string) => void }) {
  const [html, setHtml] = useState('');
  const iframe = useRef<HTMLIFrameElement>(null);
  const [channel] = useState(() => crypto.randomUUID());
  useEffect(() => {
    let active = true; setHtml('');
    if (slide.source) compileSlide(slide.source).then(code => { if (active) setHtml(previewDocument(code, channel, picking, slide.image)); }).catch(error => { if (active) onError(errorText(error)); });
    return () => { active = false; };
  }, [slide.source, slide.image, channel, picking, onError]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== iframe.current?.contentWindow || event.data?.channel !== channel) return;
      if (event.data.kind === 'select') {
        const value = event.data.value;
        if (value && ['tag', 'text', 'html', 'selector'].every(key => typeof value[key] === 'string' && value[key].length <= 2000)) onSelect(value);
      }
      if (event.data.kind === 'error') onError(String(event.data.value));
    };
    window.addEventListener('message', receive); return () => window.removeEventListener('message', receive);
  }, [channel, onSelect, onError]);
  return html ? <iframe ref={iframe} title="Web PPT 画布" sandbox="allow-scripts" srcDoc={html} /> : <div className="ed-compiling"><span className="ed-spinner" />正在编译预览…</div>;
}

function ConfigDialog({ config, onChange, onClose }: { config: PublicConfig | null; onChange: (config: PublicConfig) => void; onClose: () => void }) {
  const [values, setValues] = useState(() => ({
    llm: { baseUrl: config?.llm.baseUrl || '', model: config?.llm.model || '', apiKey: '' },
    image: { baseUrl: config?.image.baseUrl || '', model: config?.image.model || '', apiKey: '' },
  }));
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const load = async () => {
    setBusy(true); setError('');
    try {
      const next = await request<PublicConfig>('/config'); onChange(next);
      setValues({ llm: { ...next.llm, apiKey: '' }, image: { ...next.image, apiKey: '' } }); setNotice('已从本机文件读取配置');
    } catch (error) { setError(errorText(error)); } finally { setBusy(false); }
  };
  const save = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try { const next = await request<PublicConfig>('/config', 'PUT', values); onChange(next); setNotice('配置已保存到用户目录'); setValues(current => ({ llm: { ...current.llm, apiKey: '' }, image: { ...current.image, apiKey: '' } })); }
    catch (error) { setError(errorText(error)); } finally { setBusy(false); }
  };
  return <div className="ed-modal-backdrop" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="ed-config" role="dialog" aria-modal="true" aria-labelledby="ed-config-title">
      <header><div><span className="ed-eyebrow">LOCAL WORKSPACE</span><h2 id="ed-config-title">接口配置</h2><p>连接你的模型，让想法在画布上发生。</p></div><button className="ed-icon-button" aria-label="关闭接口配置" onClick={onClose}><Icon name="close" /></button></header>
      <div className="ed-config-file"><Icon name="settings" /><div><strong>本机配置文件</strong><code>{config?.path || '用户目录 / .edit-deck / interfaces.json'}</code></div><button onClick={load} disabled={busy}><Icon name="refresh" />一键读取</button></div>
      <form onSubmit={save}>
        {(['llm', 'image'] as const).map(kind => <fieldset key={kind}><legend><Icon name={kind === 'llm' ? 'code' : 'image'} />{kind === 'llm' ? 'LLM · 课件生成与修改' : '生图 · 页面视觉草稿'}<span>{config?.[kind].configured ? '已配置' : '待配置'}</span></legend>
          <label>Base URL<input autoFocus={kind === 'llm'} type="url" value={values[kind].baseUrl} placeholder="https://your-provider.example/v1" onChange={event => setValues(current => ({ ...current, [kind]: { ...current[kind], baseUrl: event.target.value } }))} /></label>
          <div className="ed-config-row"><label>模型名称<input value={values[kind].model} placeholder={kind === 'llm' ? '支持图片输入的模型' : '你的生图模型'} onChange={event => setValues(current => ({ ...current, [kind]: { ...current[kind], model: event.target.value } }))} /></label><label>API Key<input type="password" autoComplete="new-password" value={values[kind].apiKey} placeholder={config?.[kind].configured ? '已保存 · 留空保持原密钥' : '输入 API Key'} onChange={event => setValues(current => ({ ...current, [kind]: { ...current[kind], apiKey: event.target.value } }))} /></label></div>
        </fieldset>)}
        <p className="ed-config-help">使用 OpenAI 兼容接口根地址（通常以 /v1 结尾）。LLM 需支持图片输入；生图需支持 Images API。密钥由本机转发使用，不随课件导出。</p>
        {error && <p className="ed-form-error" role="alert">{error}</p>}{notice && <p className="ed-form-success" role="status">{notice}</p>}
        <footer><button type="button" onClick={onClose}>完成</button><button className="ed-primary" disabled={busy} type="submit">{busy ? '处理中…' : '保存配置'}</button></footer>
      </form>
    </section>
  </div>;
}

export function EditDeck() {
  const [project, setProject] = useState<Project>(newProject);
  const [activeId, setActiveId] = useState('');
  const [past, setPast] = useState<Project[]>([]), [future, setFuture] = useState<Project[]>([]);
  const [ready, setReady] = useState(false), [config, setConfig] = useState<PublicConfig | null>(null);
  const [configOpen, setConfigOpen] = useState(false), [sourceOpen, setSourceOpen] = useState(false);
  const [mode, setMode] = useState<'image' | 'web'>('image');
  const [prompt, setPrompt] = useState(''), [composer, setComposer] = useState(false);
  const [busy, setBusy] = useState(''), [error, setError] = useState(''), [saveState, setSaveState] = useState('正在读取…');
  const [runtimeError, setRuntimeError] = useState(''), [picking, setPicking] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null), [presenting, setPresenting] = useState(false);
  const viewport = useRef<HTMLDivElement>(null), abort = useRef<AbortController | null>(null);
  const fileInput = useRef<HTMLInputElement>(null), imageInput = useRef<HTMLInputElement>(null);
  const scale = useSceneScale(viewport);
  const slide = project.slides.find(item => item.id === activeId) || project.slides[0];
  const index = project.slides.indexOf(slide);
  const hasContent = Boolean(slide?.image || slide?.source);
  const references = slide?.references ?? (slide?.image ? [slide.image] : []);
  const canImage = Boolean(config?.image.configured), canLlm = Boolean(config?.llm.configured);
  const change = useCallback((next: Project) => {
    setPast(items => [...items.slice(-14), project]); setFuture([]);
    setProject({ ...next, updatedAt: new Date().toISOString() });
  }, [project]);
  const updateSlide = (patch: Partial<Slide>) => change({ ...project, slides: project.slides.map(item => item.id === slide.id ? { ...item, ...patch } : item) });
  const load = useCallback(async () => {
    setError('');
    try {
      const [saved, settings] = await Promise.all([request<Project | null>('/project'), request<PublicConfig>('/config')]);
      if (saved && Array.isArray(saved.slides) && saved.slides.length) { setProject(saved); setActiveId(saved.slides[0].id); }
      setConfig(settings); setReady(true); setSaveState('已保存到本机');
    } catch (error) { setError(errorText(error)); setSaveState('未连接本机工作区'); }
  }, []);
  useEffect(() => { document.title = 'Edit Deck · 让想法成为一页'; void load(); }, [load]);
  useEffect(() => {
    if (!ready) return;
    setSaveState('等待保存…');
    let current = true;
    const timer = setTimeout(() => {
      setSaveState('保存中…');
      request('/project', 'PUT', project).then(() => { if (current) setSaveState('已保存到本机'); }).catch(error => { if (current) { setSaveState('保存失败'); setError(errorText(error)); } });
    }, 650);
    return () => { current = false; clearTimeout(timer); };
  }, [project, ready]);
  useEffect(() => {
    setSelection(null); setPrompt(''); setComposer(false); setRuntimeError(''); setPicking(false);
    setMode(slide?.source ? 'web' : 'image');
  }, [slide?.id, Boolean(slide?.source)]);
  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (ready && saveState !== '已保存到本机') event.preventDefault();
    };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [ready, saveState]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setPresenting(false); setConfigOpen(false); setSourceOpen(false); setComposer(false); setPicking(false); }
      if ((event.target as HTMLElement).matches('input,textarea,select,[contenteditable]')) return;
      if (presenting && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault(); setActiveId(project.slides[Math.max(0, Math.min(project.slides.length - 1, index + (event.key === 'ArrowRight' ? 1 : -1)))].id);
      }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [presenting, project.slides, index]);
  const select = useCallback((value: Selection) => { setSelection(value); setComposer(true); }, []);
  const previewError = useCallback((value: string) => setRuntimeError(value), []);
  function choose(item: Slide) { if (!busy) setActiveId(item.id); }
  function add() { const item = newSlide(); change({ ...project, slides: [...project.slides, item] }); setActiveId(item.id); }
  function duplicate() { const item = { ...slide, id: crypto.randomUUID(), title: slide.title + ' 副本' }; const slides = [...project.slides]; slides.splice(index + 1, 0, item); change({ ...project, slides }); setActiveId(item.id); }
  function remove() {
    const slides = project.slides.filter(item => item.id !== slide.id);
    if (!slides.length) slides.push(newSlide());
    change({ ...project, slides }); setActiveId(slides[Math.min(index, slides.length - 1)].id);
  }
  function undo() { if (!past.length || busy) return; setFuture(items => [project, ...items]); setProject(past[past.length - 1]); setPast(items => items.slice(0, -1)); }
  function redo() { if (!future.length || busy) return; setPast(items => [...items, project]); setProject(future[0]); setFuture(items => items.slice(1)); }
  async function run(kind: 'generate' | 'convert' | 'modify', instruction = prompt) {
    if (busy || !ready) return;
    if ((kind === 'generate' && !canImage) || (kind !== 'generate' && !canLlm)) { setConfigOpen(true); return; }
    if (kind !== 'convert' && !instruction.trim()) return;
    setError(''); setRuntimeError(''); const controller = new AbortController(); abort.current = controller;
    try {
      if (kind === 'generate') {
        setBusy('正在生成页面视觉草稿…');
        const description = slide.prompt && slide.image ? `${slide.prompt}\n调整要求：${instruction}` : instruction;
        const result = await request<{ image: string }>('/image', 'POST', {
          prompt: `为一张 16:9 教学幻灯片生成完整设计效果图，清晰中文、合理留白、明确视觉层次，无外围设备边框。${description}`, images: references,
        }, controller.signal);
        if (controller.signal.aborted) return;
        updateSlide({ image: result.image, references: undefined, prompt: description, title: slide.title === '未命名页面' ? instruction.slice(0, 26) : slide.title }); setMode('image');
      } else {
        const output = await authorSlide({ prompt: kind === 'convert' ? slide.prompt || '按照图片还原页面' : instruction, image: slide.image || '', source: kind === 'modify' ? slide.source || '' : '', selection: kind === 'modify' ? selection : null }, controller.signal, setBusy);
        if (controller.signal.aborted) return;
        updateSlide({ source: output }); setMode('web'); setPicking(false); setSelection(null);
      }
      setComposer(false); setPrompt('');
    } catch (error) { if (!controller.signal.aborted) setError(errorText(error)); }
    finally { setBusy(''); if (abort.current === controller) abort.current = null; }
  }
  async function save() {
    try { await request('/project', 'PUT', project); setSaveState('已保存到本机'); }
    catch (error) { setSaveState('保存失败'); setError(errorText(error)); }
  }
  async function exportSlide() {
    if (!slide.source) return;
    try { const code = await compileSlide(slide.source); downloadFile(`${slide.title}.html`, previewDocument(code, '', false, slide.image), 'text/html'); }
    catch (error) { setError(errorText(error)); }
  }
  async function importProject(file?: File) {
    if (!file) return;
    try {
      const value = JSON.parse(await file.text()) as Project;
      if (!Array.isArray(value.slides) || !value.slides.length || value.slides.length > 100 || typeof value.title !== 'string' || value.slides.some(item => typeof item.id !== 'string' || typeof item.title !== 'string' || typeof item.prompt !== 'string' || (item.references !== undefined && (!Array.isArray(item.references) || item.references.length > 8 || item.references.some(image => typeof image !== 'string' || !/^data:image\/(png|jpeg|webp);base64,/.test(image)))) || (item.source !== undefined && typeof item.source !== 'string') || (item.image !== undefined && (typeof item.image !== 'string' || !/^data:image\/(png|jpeg|webp|gif);base64,/.test(item.image))))) throw new Error('不是有效的 Edit Deck 项目');
      change(value); setActiveId(value.slides[0].id);
    } catch (error) { setError(errorText(error)); }
  }
  async function importImages(files: FileList | null) {
    if (!files?.length) return;
    const selected = Array.from(files);
    if (selected.some(file => !/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 20 * 1024 * 1024)) { setError('请选择小于 20 MB 的 PNG、JPEG 或 WebP'); return; }
    const existing = slide.image ? references : [];
    if (existing.length + selected.length > 8) { setError('最多支持 8 张参考图，请先移除部分图片'); return; }
    if (selected.reduce((sum, file) => sum + file.size, 0) > 25 * 1024 * 1024) { setError('一次添加的参考图总大小不能超过 25 MB'); return; }
    try {
      const images = await Promise.all(selected.map(file => new Promise<string>((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('读取参考图失败')); reader.readAsDataURL(file);
      })));
      updateSlide({ image: slide.image || images[0], references: [...existing, ...images], title: slide.title === '未命名页面' ? selected[0].name.replace(/\.[^.]+$/, '') : slide.title });
      setMode('image'); setComposer(true); setError('');
    } catch (error) { setError(errorText(error)); }
  }
  function moveSlide(from: string, to: string) {
    const slides = [...project.slides]; const origin = slides.findIndex(item => item.id === from), target = slides.findIndex(item => item.id === to);
    if (origin < 0 || target < 0 || origin === target || busy) return;
    const [item] = slides.splice(origin, 1); slides.splice(target, 0, item); change({ ...project, slides });
  }
  return <div className={`ed-app${presenting ? ' is-presenting' : ''}`}>
    <header className="ed-topbar">
      <a className="ed-brand" href="/edit-deck"><Icon name="logo" />Edit Deck<span className="ed-beta">LAB</span></a>
      <span className="ed-divider" />
      <input className="ed-project-title" aria-label="课件名称" value={project.title} disabled={Boolean(busy) || !ready} onChange={event => change({ ...project, title: event.target.value })} />
      <span className="ed-save-state"><Icon name="check" />{saveState}</span>
      <div className="ed-history"><button className="ed-icon-button" title="撤销" aria-label="撤销" disabled={!past.length || Boolean(busy)} onClick={undo}><Icon name="undo" /></button><button className="ed-icon-button" title="重做" aria-label="重做" disabled={!future.length || Boolean(busy)} onClick={redo}><Icon name="redo" /></button></div>
      <div className="ed-top-actions"><button className={`ed-config-trigger${canImage && canLlm ? ' is-configured' : ''}`} onClick={() => setConfigOpen(true)}><Icon name="settings" /><span>接口配置</span><i /></button><button disabled={!hasContent} onClick={() => { setPresenting(true); setPicking(false); }}><Icon name="play" />预览</button><button className="ed-dark" disabled={!ready} onClick={save}>保存</button><details className="ed-file-menu"><summary aria-label="文件菜单">···</summary><div><button disabled={Boolean(busy) || !ready} onClick={() => { downloadFile(`${project.title}.editdeck.json`, JSON.stringify(project, null, 2)); }}>导出项目</button><button disabled={Boolean(busy) || !ready} onClick={() => fileInput.current?.click()}>导入项目</button><button disabled={!slide.source} onClick={exportSlide}>导出本页 HTML</button><button disabled={Boolean(busy) || !ready} onClick={() => { downloadFile(`${project.title}.editdeck.json`, JSON.stringify(project, null, 2)); const next = newProject(); change(next); setActiveId(next.slides[0].id); }}>新建项目（先备份当前）</button></div></details></div>
    </header>
    <div className="ed-pagebar"><div><span>第 {index + 1} 页</span><span className="ed-pagebar-chevron">›</span><span className="ed-status-pill">{!hasContent ? '空白页' : mode === 'web' ? 'Web PPT' : '图片草稿'}</span></div>{hasContent && <div className="ed-mode-switch"><button className={mode === 'image' ? 'is-active' : ''} disabled={!slide.image} onClick={() => { setMode('image'); setComposer(false); setSelection(null); }}><Icon name="image" />图片草稿</button><button className={mode === 'web' ? 'is-active' : ''} disabled={!slide.source} onClick={() => { setMode('web'); setComposer(false); }}><Icon name="code" />Web PPT</button></div>}<span className="ed-zoom">{Math.round(scale * 100)}%<span>适应画布</span></span></div>
    <main className="ed-workspace">
      {hasContent && !presenting && <div className="ed-context-toolbar">
        {mode === 'image' ? <><button disabled={Boolean(busy)} onClick={() => { setComposer(current => !current); setPrompt(''); }}><Icon name="spark" />调整图片</button><span /><button disabled={Boolean(busy)} onClick={() => void run('generate', slide.prompt || '重新设计这一页')}><Icon name="refresh" />重新生成</button><span /><button className="ed-primary" disabled={Boolean(busy)} onClick={() => void run('convert')}><Icon name="code" />{slide.source ? '重新转为 Web PPT' : '转为 Web PPT'}</button></>
          : <><button className={picking ? 'is-selected' : ''} disabled={Boolean(busy)} onClick={() => { setPicking(current => !current); setComposer(false); setSelection(null); }}><Icon name="pointer" />{picking ? '正在点选元素' : '选择元素'}</button><span /><button disabled={Boolean(busy)} onClick={() => { setSelection(null); setComposer(current => !current); }}><Icon name="spark" />调整整页</button><span /><button disabled={Boolean(busy)} onClick={() => setSourceOpen(true)}><Icon name="code" />源码</button></>}
      </div>}
      {hasContent && !presenting && <div className="ed-toolrail"><button className={picking ? 'is-active' : ''} aria-label="选择元素" title="选择元素" disabled={mode !== 'web'} onClick={() => setPicking(current => !current)}><Icon name="pointer" /></button><button aria-label="导入图片" title="导入图片" disabled={Boolean(busy)} onClick={() => imageInput.current?.click()}><Icon name="image" /></button><span /><button aria-label="复制页面" title="复制页面" disabled={Boolean(busy)} onClick={duplicate}><Icon name="duplicate" /></button><button aria-label="删除页面" title="删除页面" disabled={Boolean(busy)} onClick={remove}><Icon name="trash" /></button></div>}
      <div ref={viewport} className="ed-viewport">
        <div className={`ed-slide-frame${hasContent ? ' has-content' : ' is-empty'}`} style={hasContent ? { width: SCENE_WIDTH * scale, height: SCENE_HEIGHT * scale } : { width: '100%', height: '100%' }}>
          <div className="ed-slide-surface" style={hasContent ? { width: SCENE_WIDTH, height: SCENE_HEIGHT, transform: `scale(${scale})` } : { width: '100%', height: '100%' }}>
            {!hasContent ? presenting ? <div style={{ width: '100%', height: '100%', background: '#fff' }} /> : <div className="ed-empty"><div className="ed-empty-mark"><Icon name="logo" /></div><span className="ed-eyebrow">A THOUGHT. A SLIDE. A START.</span><h1>这一页，你想讲什么？</h1><p>先把想法变成一张图，再让它成为可以交互的课件。</p>
              <form className="ed-start-form" onSubmit={event => { event.preventDefault(); void run('generate'); }}><textarea aria-label="描述新页面" value={prompt} onChange={event => setPrompt(event.target.value)} placeholder="例如：做一页介绍梯度下降的课件，左边画山谷和小球，右边解释学习率。" disabled={Boolean(busy) || !ready} /><footer><button type="button" disabled={Boolean(busy) || !ready} onClick={() => imageInput.current?.click()}><Icon name="image" />导入参考图</button><button className="ed-primary" type="submit" disabled={!prompt.trim() || Boolean(busy) || !ready}><Icon name="spark" />生成图片草稿</button></footer></form>
              <div className="ed-start-examples">{['解释一个概念', '设计一场互动实验', '把知识画出来'].map((text, i) => <button key={text} disabled={Boolean(busy)} onClick={() => setPrompt(['用山谷和小球解释梯度下降，简洁、直观，适合本科生。', '设计一页探索学习率的互动实验，包含曲线、参数滑杆和运行按钮。', '用清晰的流程图介绍从像素到图像分类的过程。'][i])}>{text}<span>↗</span></button>)}</div>
              {!canImage && ready && <button className="ed-connect-hint" onClick={() => setConfigOpen(true)}><i />开始之前，连接你的模型接口<Icon name="right" /></button>}
            </div> : mode === 'web' && slide.source ? <SlidePreview key={slide.id} slide={slide} picking={picking && !presenting} onSelect={select} onError={previewError} /> : <img className="ed-draft-image" src={slide.image} alt={slide.title} />}
          </div>
          {hasContent && mode === 'image' && !presenting && <>{[0, 1, 2, 3].map(corner => <i key={corner} className={`ed-handle ed-handle-${corner}`} />)}</>}
        </div>
      </div>
      {composer && hasContent && !busy && !presenting && <form className="ed-floating-prompt" onSubmit={event => { event.preventDefault(); void run(mode === 'image' ? 'generate' : 'modify'); }}><header><span>{selection ? `修改选中的 ${selection.tag} · ${selection.text.slice(0, 26)}` : mode === 'web' ? '调整当前页面' : '调整当前图片'}</span><button type="button" className="ed-icon-button" aria-label="关闭修改" onClick={() => { setComposer(false); setSelection(null); }}><Icon name="close" /></button></header>{mode === 'image' && references.length > 0 && <section className="ed-reference-list" aria-label="参考图片">{references.map((image, i) => <span key={i}><img src={image} alt={`参考图 ${i + 1}`} /><b>{i + 1}</b><button type="button" aria-label={`移除参考图 ${i + 1}`} onClick={() => updateSlide({ references: references.filter((_, index) => index !== i) })}><Icon name="close" /></button></span>)}<button type="button" onClick={() => imageInput.current?.click()} aria-label="添加更多参考图"><Icon name="plus" /></button></section>}<div><Icon name="spark" /><input autoFocus aria-label="修改要求" value={prompt} onChange={event => setPrompt(event.target.value)} placeholder={mode === 'image' ? '例如：把山谷画得更平缓，保留现在的配色' : '描述这一处想怎么改…'} /><button className="ed-send" disabled={!prompt.trim()} aria-label="执行修改"><Icon name="arrow" /></button></div></form>}
      {busy && <div className="ed-progress" role="status"><span className="ed-spinner" /><span>{busy}</span><button onClick={() => abort.current?.abort()}>取消</button></div>}
      {(error || runtimeError) && <div className="ed-error" role="alert"><span>{error || `预览运行出错：${runtimeError}`}</span>{!ready && <button onClick={load}>重新连接</button>}{runtimeError && !busy && <button onClick={() => void run('modify', `修复页面运行错误：${runtimeError}`)}>修复</button>}<button className="ed-icon-button" aria-label="关闭错误提示" onClick={() => { setError(''); setRuntimeError(''); }}><Icon name="close" /></button></div>}
      {!presenting && <div className="ed-canvas-caption">{hasContent ? <><Icon name={mode === 'web' ? 'pointer' : 'image'} />{mode === 'web' ? picking ? '点击画布中的文字或组件，直接描述修改要求' : '真实 React 课件 · 点击选择元素开始编辑' : '图片草稿 · 确认视觉后，转换为可编辑的课件'}</> : <span>在空白里，开始下一次理解。</span>}</div>}
      {presenting && <div className="ed-presentation-controls"><button aria-label="上一页" disabled={index === 0} onClick={() => choose(project.slides[index - 1])}><Icon name="left" /></button><span>{index + 1} / {project.slides.length}</span><button aria-label="下一页" disabled={index === project.slides.length - 1} onClick={() => choose(project.slides[index + 1])}><Icon name="right" /></button><button onClick={() => setPresenting(false)}>退出预览 <kbd>Esc</kbd></button></div>}
    </main>
    <footer className="ed-filmstrip"><div className="ed-thumbnails">{project.slides.map((item, i) => <button key={item.id} className={`ed-thumbnail${item.id === slide.id ? ' is-active' : ''}`} disabled={Boolean(busy)} draggable={!busy} onDragStart={event => event.dataTransfer.setData('text/plain', item.id)} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); moveSlide(event.dataTransfer.getData('text/plain'), item.id); }} onClick={() => choose(item)} aria-label={`第 ${i + 1} 页：${item.title}`} aria-pressed={item.id === slide.id}><div>{item.image ? <img src={item.image} alt="" /> : <span className="ed-thumbnail-blank"><Icon name={item.source ? 'code' : 'logo'} /></span>}</div><span><b>{String(i + 1).padStart(2, '0')}</b><small>{item.source ? 'Web PPT' : item.image ? '图片草稿' : '空白页'}</small></span></button>)}<button className="ed-add-slide" disabled={Boolean(busy) || !ready} onClick={add}><Icon name="plus" /><span>新建一页</span></button></div><div className="ed-bottomline"><span>{project.slides.length} 页</span><span>拖动缩略图调整顺序<span className="ed-bottom-dot">·</span>想法就在画布上</span></div></footer>
    <input ref={fileInput} type="file" accept=".json" hidden onChange={event => { void importProject(event.target.files?.[0]); event.target.value = ''; }} /><input ref={imageInput} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={event => { void importImages(event.target.files); event.target.value = ''; }} />
    {configOpen && <ConfigDialog config={config} onChange={setConfig} onClose={() => setConfigOpen(false)} />}
    {sourceOpen && <SourceDialog source={slide.source || ''} onClose={() => setSourceOpen(false)} onSave={async source => { await compileSlide(source); updateSlide({ source }); setRuntimeError(''); setSourceOpen(false); }} />}
  </div>;
}

function SourceDialog({ source, onSave, onClose }: { source: string; onSave: (source: string) => Promise<void>; onClose: () => void }) {
  const [value, setValue] = useState(source), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  return <div className="ed-modal-backdrop"><section className="ed-source" role="dialog" aria-modal="true" aria-labelledby="ed-source-title"><header><div><span className="ed-eyebrow">REACT · TSX</span><h2 id="ed-source-title">当前页源码</h2></div><button className="ed-icon-button" aria-label="关闭源码" onClick={onClose}><Icon name="close" /></button></header><textarea spellCheck={false} aria-label="React 源码" value={value} onChange={event => setValue(event.target.value)} />{error && <p role="alert" className="ed-form-error">{error}</p>}<footer><button onClick={() => downloadFile('Slide.tsx', value, 'text/plain')}><Icon name="download" />导出 TSX</button><button className="ed-primary" disabled={busy} onClick={async () => { setBusy(true); try { await onSave(value); } catch (error) { setError(errorText(error)); } finally { setBusy(false); } }}>{busy ? '编译中…' : '应用到画布'}</button></footer></section></div>;
}
