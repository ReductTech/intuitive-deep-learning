import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from 'react';
import { emitTelemetry, getTelemetryState } from '../shared/react';
import { neuronCourse } from './course';
import { NeuronLessonProvider } from './model/NeuronLessonContext';
import { notesForScene, type SpeakerNote } from './speakerNotes';
import '../shared/react/styles.css';
import '../shared/react/ui-kit.css';
import './pages/shared.css';
import './SceneDeck.css';

const SCENE_WIDTH = 1600;
const SCENE_HEIGHT = 900;
const LESSON_MODULE_ID = 'neuron-guide';
const LESSON_KEY = 'neuron-guide-expanded-v6';
const PROGRESS_KEY = 'lesson-flow:' + LESSON_KEY;

type LessonContext = { complete: () => void; reset: () => void; isComplete: boolean };
interface LessonProgressState { completedIds?: string[]; visibleCount?: number; completed?: boolean; }
interface SceneDefinition { id: string; title: string; section: string; render: (context: LessonContext) => ReactNode; }
interface DeckDefinition { id: string; title: string; subtitle: string; scenes: SceneDefinition[]; }

export const sceneDeckScenes: SceneDefinition[] = neuronCourse
  .filter((item) => item.showInPpt !== false)
  .map(({ id, title, section, component }) => ({ id, title, section, render: component }));

/** A data-driven catalog leaves room for additional courses without changing the workspace. */
export const sceneDeckCatalog: DeckDefinition[] = [
  { id: 'neuron-guide', title: '认识人工神经元', subtitle: '神经网络基础 · 17 页', scenes: sceneDeckScenes },
];

function sceneIndexFromUrl() {
  const requested = new URLSearchParams(window.location.search).get('slide');
  const index = requested ? sceneDeckScenes.findIndex((scene) => scene.id === requested) : 0;
  return index >= 0 ? index : 0;
}

function readProgress() {
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    const state = raw ? JSON.parse(raw) as LessonProgressState : null;
    return Array.isArray(state?.completedIds) ? state.completedIds : [];
  } catch { return []; }
}

function useSceneScale(viewportRef: RefObject<HTMLDivElement | null>) {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const update = () => {
      const width = viewport.clientWidth;
      const height = viewport.clientHeight;
      if (!width || !height) return;
      setScale(Math.min(1, width / SCENE_WIDTH, height / SCENE_HEIGHT));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [viewportRef]);
  return scale;
}

export function SceneDeck() {
  const appRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [activeDeck, setActiveDeck] = useState<DeckDefinition>(sceneDeckCatalog[0]);
  const [sceneIndex, setSceneIndex] = useState(sceneIndexFromUrl);
  const [completedIds, setCompletedIds] = useState<string[]>(readProgress);
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteIndex, setNoteIndex] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(272);
  const [inspectorWidth, setInspectorWidth] = useState(326);
  const [courseMenuOpen, setCourseMenuOpen] = useState(false);
  const [toolNotice, setToolNotice] = useState('');
  const [isPresenting, setIsPresenting] = useState(false);
  const scenes = activeDeck.scenes;
  const scene = scenes[sceneIndex] ?? scenes[0];
  const notes = useMemo(() => notesForScene(scene.id), [scene.id]);
  const scale = useSceneScale(viewportRef);

  useEffect(() => setNoteIndex(0), [scene.id]);

  useEffect(() => {
    let active = true;
    void getTelemetryState<LessonProgressState>(PROGRESS_KEY, LESSON_MODULE_ID).then((entry) => {
      if (!active || !entry?.state || readProgress().length) return;
      const ids = Array.isArray(entry.state.completedIds) ? entry.state.completedIds : [];
      setCompletedIds(ids.filter((id) => scenes.some((item) => item.id === id)));
    });
    return () => { active = false; };
  }, [scenes]);

  const persistProgress = useCallback((ids: string[], visibleCount: number) => {
    const state = { completedIds: ids, visibleCount, completed: ids.length === scenes.length };
    try { window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(state)); } catch { /* telemetry fallback */ }
    emitTelemetry('lesson_progress', null, { state_key: PROGRESS_KEY, state });
  }, [scenes.length]);

  const navigate = useCallback((requestedIndex: number) => {
    const nextIndex = Math.min(scenes.length - 1, Math.max(0, requestedIndex));
    setSceneIndex(nextIndex);
    const url = new URL(window.location.href);
    url.searchParams.set('slide', scenes[nextIndex].id);
    window.history.replaceState(null, '', url);
  }, [scenes]);

  const complete = useCallback(() => {
    if (completedIds.includes(scene.id)) return;
    const ids = completedIds.concat(scene.id);
    setCompletedIds(ids);
    persistProgress(ids, Math.min(scenes.length, sceneIndex + 2));
  }, [completedIds, persistProgress, scene.id, sceneIndex, scenes.length]);

  const reset = useCallback(() => {
    const ids = completedIds.filter((id) => id !== scene.id);
    setCompletedIds(ids);
    persistProgress(ids, Math.max(1, sceneIndex + 1));
  }, [completedIds, persistProgress, scene.id, sceneIndex]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
      if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') { event.preventDefault(); navigate(sceneIndex + 1); }
      else if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); navigate(sceneIndex - 1); }
      else if (event.key === 'Home') navigate(0);
      else if (event.key === 'End') navigate(scenes.length - 1);
      else if (event.key.toLowerCase() === 'f') void document.documentElement.requestFullscreen?.();
      else if (event.key.toLowerCase() === 'n') setNotesOpen((open) => !open);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate, sceneIndex, scenes.length]);

  useEffect(() => {
    if (!toolNotice) return;
    const timer = window.setTimeout(() => setToolNotice(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toolNotice]);

  const showDummyNotice = useCallback((label: string) => {
    setToolNotice(label + '已准备（演示占位）');
  }, []);

  const selectDeck = useCallback((deck: DeckDefinition) => {
    setActiveDeck(deck);
    setSceneIndex(0);
    setCompletedIds([]);
    setNoteIndex(0);
    setCourseMenuOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('slide');
    url.searchParams.set('deck', deck.id);
    window.history.replaceState(null, '', url);
  }, []);

  useEffect(() => {
    document.body.classList.add('ppt-body');
    document.title = 'SceneDeck · ' + (sceneIndex + 1) + '. ' + scene.title;
    return () => document.body.classList.remove('ppt-body');
  }, [scene.title, sceneIndex]);

  useEffect(() => {
    const onFullscreenChange = () => setIsPresenting(document.fullscreenElement === appRef.current);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const togglePresentation = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen?.();
    } else {
      void appRef.current?.requestFullscreen?.();
    }
  }, []);

  return <div ref={appRef} className={'scenedeck-app' + (isPresenting ? ' is-presenting' : '')} data-ppt-react-slide data-scene-deck>
    <header className="scenedeck-toolbar" aria-label="SceneDeck 工具栏">
      <div className="scenedeck-toolbar__leading">
        <div className="scenedeck-mark" aria-hidden="true"><span /><span /><span /></div>
        <strong>SceneDeck</strong>
        <span className="scenedeck-toolbar__divider" />
        <div className="scenedeck-course-picker">
          <button className="scenedeck-course-button" type="button" onClick={() => setCourseMenuOpen((open) => !open)} aria-expanded={courseMenuOpen} aria-haspopup="menu">▣ <span>打开课件</span><small>⌄</small></button>
          {courseMenuOpen && <div className="scenedeck-course-menu" role="menu" aria-label="选择课件">
            <div className="scenedeck-course-menu__label">选择一个课件</div>
            {sceneDeckCatalog.map((deck) => <button key={deck.id} className={'scenedeck-course-option' + (deck.id === activeDeck.id ? ' is-selected' : '')} type="button" role="menuitem" onClick={() => selectDeck(deck)}><span className="scenedeck-course-option__icon">▤</span><span><strong>{deck.title}</strong><small>{deck.subtitle}</small></span><i>{deck.id === activeDeck.id ? '✓' : ''}</i></button>)}
          </div>}
        </div>
      </div>
      <div className="scenedeck-toolbar__tools" aria-label="编辑工具">
        <button className="scenedeck-tool" type="button" onClick={() => showDummyNotice('保存')}><span aria-hidden="true">↥</span><span>保存</span></button>
        <button className="scenedeck-tool scenedeck-tool--icon" type="button" onClick={() => showDummyNotice('撤销')} aria-label="撤销">↶</button>
        <button className="scenedeck-tool scenedeck-tool--icon" type="button" onClick={() => showDummyNotice('重做')} aria-label="重做">↷</button>
        <span className="scenedeck-toolbar__divider" />
        <button className="scenedeck-tool" type="button" onClick={() => showDummyNotice('布局')}><span aria-hidden="true">⌗</span><span>布局</span></button>
        <button className="scenedeck-tool" type="button" onClick={() => showDummyNotice('标注')}><span aria-hidden="true">✎</span><span>标注</span></button>
        <button className={'scenedeck-tool' + (notesOpen ? ' is-active' : '')} type="button" onClick={() => setNotesOpen((open) => !open)} aria-pressed={notesOpen}><span aria-hidden="true">✦</span><span>智能讲稿</span></button>
        <button className="scenedeck-tool" type="button" onClick={togglePresentation}><span aria-hidden="true">⛶</span><span>演示</span></button>
        <button className="scenedeck-tool scenedeck-tool--icon" type="button" onClick={() => showDummyNotice('更多')} aria-label="更多工具">···</button>
      </div>
    </header>
    <div className="scenedeck-layout" style={{ gridTemplateColumns: sidebarWidth + 'px 8px minmax(0, 1fr)' }}>
      <aside className="scenedeck-sidebar" aria-label="幻灯片缩略图"><div className="scenedeck-sidebar__head"><span>幻灯片</span><span>{scenes.length}</span></div><div className="scenedeck-sidebar__list">{scenes.map((item, index) => <Thumbnail key={item.id} item={item} index={index} active={index === sceneIndex} complete={completedIds.includes(item.id)} onClick={() => navigate(index)} />)}</div></aside>
      <PanelResizeHandle label="调整缩略图栏宽度" onDelta={(delta) => setSidebarWidth((width) => clamp(width + delta, 190, 430))} />
      <main className="scenedeck-workspace"><div className="scenedeck-stage-row" style={{ gridTemplateColumns: notesOpen ? 'minmax(0, 1fr) 8px ' + inspectorWidth + 'px' : 'minmax(0, 1fr)' }}><div className="scenedeck-stage-viewport" ref={viewportRef}><div className="scenedeck-stage-grid" aria-hidden="true" /><div className="ppt-canvas scenedeck-stage guide-shell" data-ppt-canvas style={{ transform: 'translate(-50%, -50%) scale(' + scale + ')' }}><div className="course-page-surface ppt-slide-surface"><NeuronLessonProvider>{scene.render({ complete, reset, isComplete: completedIds.includes(scene.id) })}</NeuronLessonProvider></div></div></div>{notesOpen && <><PanelResizeHandle label="调整智能讲稿栏宽度" onDelta={(delta) => setInspectorWidth((width) => clamp(width - delta, 270, 520))} /><SpeakerNotesPanel notes={notes} noteIndex={noteIndex} onChange={setNoteIndex} /></>}</div></main>
    </div>
    {toolNotice && <div className="scenedeck-toast" role="status">{toolNotice}</div>}
  </div>;
}

function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }

function PanelResizeHandle({ label, onDelta }: { label: string; onDelta: (delta: number) => void }) {
  const startX = useRef(0);
  const active = useRef(false);
  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    startX.current = event.clientX;
    active.current = true;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    document.body.classList.add('scenedeck-is-resizing');
    const move = (moveEvent: PointerEvent) => { if (active.current) onDelta(moveEvent.clientX - startX.current); startX.current = moveEvent.clientX; };
    const up = () => { active.current = false; document.body.classList.remove('scenedeck-is-resizing'); window.removeEventListener('pointermove', move); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
  };
  return <button className="scenedeck-panel-resize" type="button" aria-label={label} onPointerDown={onPointerDown}><span /></button>;
}

function Thumbnail({ item, index, active, complete, onClick }: { item: SceneDefinition; index: number; active: boolean; complete: boolean; onClick: () => void }) {
  return <div className={'scenedeck-thumbnail' + (active ? ' is-active' : '')} role="button" tabIndex={0} onClick={onClick} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onClick(); } }} aria-current={active ? 'page' : undefined}>
    <span className="scenedeck-thumbnail__index">{String(index + 1).padStart(2, '0')}</span>
    <span className="scenedeck-thumbnail__card">
      <span className="scenedeck-thumbnail__preview">
        <span className="scenedeck-thumbnail__surface course-page-surface ppt-slide-surface guide-shell" aria-hidden="true">
          <NeuronLessonProvider>{item.render({ complete: () => undefined, reset: () => undefined, isComplete: complete })}</NeuronLessonProvider>
        </span>
      </span>
      <span className="scenedeck-thumbnail__title">{item.title}</span>
    </span>
    {complete && <span className="scenedeck-thumbnail__check">✓</span>}
  </div>;
}

function SpeakerNotesPanel({ notes, noteIndex, onChange }: { notes: SpeakerNote[]; noteIndex: number; onChange: (index: number) => void }) {
  const note = notes[noteIndex];
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  useLayoutEffect(() => {
    const update = () => { const stage = document.querySelector('[data-ppt-canvas]'); const target = stage ? note.selectors.map((selector) => stage.querySelector(selector)).find(Boolean) : null; setTargetRect(target?.getBoundingClientRect() ?? null); };
    update();
    const timer = window.setInterval(update, 240);
    window.addEventListener('resize', update);
    return () => { window.clearInterval(timer); window.removeEventListener('resize', update); };
  }, [note]);
  return <aside className="scenedeck-inspector" aria-label="智能讲稿检查器">{targetRect && <div className="scenedeck-focus-ring" style={{ top: targetRect.top - 7, left: targetRect.left - 7, width: targetRect.width + 14, height: targetRect.height + 14 }} aria-hidden="true" />}<div className="scenedeck-inspector__head"><div><span>SMART SCRIPT</span><h2>智能讲稿</h2></div><button type="button" onClick={() => onChange(0)} aria-label="重置讲稿">↺</button></div><div className="scenedeck-inspector__hint">讲到这一步时，SceneDeck 会自动聚焦页面中的相关区域。</div><div className="scenedeck-inspector__step"><strong>{String(noteIndex + 1).padStart(2, '0')}</strong> / {String(notes.length).padStart(2, '0')}</div><p>{note.text}</p><div className="scenedeck-inspector__target"><span />正在聚焦页面区域</div><div className="scenedeck-inspector__actions"><button type="button" disabled={noteIndex === 0} onClick={() => onChange(noteIndex - 1)}>上一段</button><button className="is-primary" type="button" disabled={noteIndex === notes.length - 1} onClick={() => onChange(noteIndex + 1)}>下一段</button></div></aside>;
}
