import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import { Typography } from '../typography';
import { emitTelemetry, getTelemetryState } from '../telemetry';
import type { DeckDefinition, LessonContext, SceneDeckProps, SceneDefinition, SpeakerNote } from './types';
import '../styles.css';
import '../ui-kit.css';
import '../presentation.css';
import './SceneDeck.css';

const SCENE_WIDTH = 1600;
const SCENE_HEIGHT = 900;
interface LessonProgressState { completedIds?: string[]; visibleCount?: number; completed?: boolean; }
export type { DeckDefinition, LessonContext, SceneDeckProps, SceneDefinition, SpeakerNote } from './types';

function sceneIndexFromUrl(scenes: SceneDefinition[]) {
  const requested = new URLSearchParams(window.location.search).get('slide');
  const index = requested ? scenes.findIndex((scene) => scene.id === requested) : 0;
  return index >= 0 ? index : 0;
}

function deckFromUrl(catalog: SceneDeckProps['catalog']) {
  const requested = new URLSearchParams(window.location.search).get('deck');
  return catalog.find((deck) => deck.id === requested) ?? catalog[0];
}

function deckValue(value: string | ((deckId: string) => string), deckId: string) {
  return typeof value === 'function' ? value(deckId) : value;
}

function readProgress(progressKey: string) {
  try {
    const raw = window.localStorage.getItem(progressKey);
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
      if (document.fullscreenElement === viewport) return;
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

function requestStageFullscreen(viewport: HTMLDivElement | null) {
  if (!viewport?.requestFullscreen) return;
  const fullscreenScale = Math.min(window.screen.width / SCENE_WIDTH, window.screen.height / SCENE_HEIGHT);
  viewport.style.setProperty('--scenedeck-fullscreen-scale', String(fullscreenScale));
  void viewport.requestFullscreen({ navigationUI: 'hide' });
}

const ICON_PATHS = {
  sparkle: 'M12 3.6l1.85 4.75L18.6 10.2l-4.75 1.85L12 16.8l-1.85-4.75L5.4 10.2l4.75-1.85zM18.4 15.4l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z',
  save: 'M12 3.8v9.4M8.4 10 12 13.6 15.6 10M5 15.4v2.2a2.4 2.4 0 0 0 2.4 2.4h9.2a2.4 2.4 0 0 0 2.4-2.4v-2.2',
  undo: 'M8.6 6.6 4.2 11l4.4 4.4M4.6 11h8.4a5.4 5.4 0 0 1 0 10.8h-1.4',
  redo: 'M15.4 6.6 19.8 11l-4.4 4.4M19.4 11h-8.4a5.4 5.4 0 0 0 0 10.8h1.4',
  layout: 'M4.4 4.4h6.2v6.2H4.4zM13.4 4.4h6.2v6.2h-6.2zM4.4 13.4h6.2v6.2H4.4zM13.4 13.4h6.2v6.2h-6.2z',
  annotate: 'M4.6 19.4l.9-3.9L15.9 5.1a2.2 2.2 0 0 1 3.1 3.1L8.6 18.5zM14.4 6.6l3 3',
  present: 'M3.6 5.4h16.8v11.2H3.6zM10 9.2l4.4 2.6-4.4 2.6zM12 16.6V20',
  more: 'M6.2 12h.01M12 12h.01M17.8 12h.01',
  close: 'M6.5 6.5l11 11M17.5 6.5l-11 11',
  layers: 'M12 3.8 3.8 8.4 12 13l8.2-4.6zM3.8 12.4 12 17l8.2-4.6M3.8 16.4 12 21l8.2-4.6',
  chevronDown: 'M7 10l5 5 5-5',
  chevronLeft: 'M14.4 6.6 9 12l5.4 5.4',
  chevronRight: 'M9.6 6.6 15 12l-5.4 5.4',
  check: 'M5.4 12.6 9.8 17 18.6 7.4',
  play: 'M8.6 5.2 18.8 12 8.6 18.8z',
  pause: 'M9.2 5.8h2.6v12.4H9.2zM14.2 5.8h2.6v12.4h-2.6z',
  stop: 'M8.6 6.6h6.8a2 2 0 0 1 2 2v6.8a2 2 0 0 1-2 2H8.6a2 2 0 0 1-2-2V8.6a2 2 0 0 1 2-2z',
} as const;

type IconName = keyof typeof ICON_PATHS;
const FILLED_ICONS = new Set<IconName>(['play', 'pause', 'stop']);

function Icon({ name, className }: { name: IconName; className?: string }) {
  const filled = FILLED_ICONS.has(name);
  return <svg className={'scenedeck-icon' + (className ? ' ' + className : '')} viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'} strokeWidth={name === 'more' ? 2.6 : filled ? 0 : 1.7} strokeLinecap="round" strokeLinejoin="round"><path d={ICON_PATHS[name]} /></svg>;
}

/** Thumbnails render a real 1600x900 scene; the scale follows the sidebar width. */
function useThumbnailScale(listRef: RefObject<HTMLDivElement | null>) {
  const [scale, setScale] = useState(0.125);
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const update = () => {
      const width = list.querySelector<HTMLElement>('.scenedeck-thumbnail__preview')?.clientWidth ?? 0;
      if (width > 40) setScale(width / SCENE_WIDTH);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(list);
    return () => observer.disconnect();
  }, [listRef]);
  return scale;
}

export function SceneDeck({ catalog, moduleId, progressKey, getNotes }: SceneDeckProps) {
  const appRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const sidebarListRef = useRef<HTMLDivElement>(null);
  const initialDeck = useMemo(() => deckFromUrl(catalog), [catalog]);
  const [activeDeck, setActiveDeck] = useState<DeckDefinition>(initialDeck);
  const [sceneIndex, setSceneIndex] = useState(() => sceneIndexFromUrl(initialDeck.scenes));
  const [completedIds, setCompletedIds] = useState<string[]>(() => readProgress(deckValue(progressKey, initialDeck.id)));
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteIndex, setNoteIndex] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(272);
  const [inspectorWidth, setInspectorWidth] = useState(326);
  const [courseMenuOpen, setCourseMenuOpen] = useState(false);
  const [toolNotice, setToolNotice] = useState('');
  const scenes = activeDeck.scenes;
  const scene = scenes[sceneIndex] ?? scenes[0];
  const activeModuleId = deckValue(moduleId, activeDeck.id);
  const activeProgressKey = deckValue(progressKey, activeDeck.id);
  const notes = useMemo(() => getNotes?.(scene.id, activeDeck.id) ?? [], [activeDeck.id, getNotes, scene.id]);
  const scale = useSceneScale(viewportRef);
  const thumbnailScale = useThumbnailScale(sidebarListRef);

  useLayoutEffect(() => setNoteIndex(0), [scene.id]);

  useEffect(() => {
    let active = true;
    void getTelemetryState<LessonProgressState>(activeProgressKey, activeModuleId).then((entry) => {
      if (!active || !entry?.state || readProgress(activeProgressKey).length) return;
      const ids = Array.isArray(entry.state.completedIds) ? entry.state.completedIds : [];
      setCompletedIds(ids.filter((id) => scenes.some((item) => item.id === id)));
    });
    return () => { active = false; };
  }, [activeModuleId, activeProgressKey, scenes]);

  const persistProgress = useCallback((ids: string[], visibleCount: number) => {
    const state = { completedIds: ids, visibleCount, completed: ids.length === scenes.length };
    try { window.localStorage.setItem(activeProgressKey, JSON.stringify(state)); } catch { /* telemetry fallback */ }
    emitTelemetry('lesson_progress', null, { state_key: activeProgressKey, state });
  }, [activeProgressKey, scenes.length]);

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
      else if (event.key.toLowerCase() === 'f') requestStageFullscreen(viewportRef.current);
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
    setCompletedIds(readProgress(deckValue(progressKey, deck.id)));
    setNoteIndex(0);
    setCourseMenuOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('slide');
    url.searchParams.set('deck', deck.id);
    window.history.replaceState(null, '', url);
  }, [progressKey]);

  useEffect(() => {
    document.body.classList.add('ppt-body');
    document.title = 'SceneDeck · ' + (sceneIndex + 1) + '. ' + scene.title;
    return () => document.body.classList.remove('ppt-body');
  }, [scene.title, sceneIndex]);

  const togglePresentation = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen?.();
    } else {
      requestStageFullscreen(viewportRef.current);
    }
  }, []);

  return <div ref={appRef} className="scenedeck-app" data-ppt-react-slide data-scene-deck>
    <header className="scenedeck-toolbar" aria-label="SceneDeck 工具栏">
      <div className="scenedeck-toolbar__leading">
        <div className="scenedeck-brand">
          <span className="scenedeck-brand__mark" aria-hidden="true"><Icon name="sparkle" /></span>
          <span className="scenedeck-brand__copy">
            <Typography as="strong" variant="bodySmall" tone="inherit">SceneDeck</Typography>
            <Typography as="span" variant="bodySmall" tone="muted">课程播放器</Typography>
          </span>
        </div>
        <span className="scenedeck-toolbar__divider" />
        <div className="scenedeck-course-picker">
          <button className="scenedeck-course-button" type="button" onClick={() => setCourseMenuOpen((open) => !open)} aria-expanded={courseMenuOpen} aria-haspopup="menu">
            <span className="scenedeck-course-button__icon" aria-hidden="true"><Icon name="layers" /></span>
            <span className="scenedeck-course-button__copy">
              <Typography as="span" variant="bodySmall" tone="muted">当前课件</Typography>
              <Typography as="strong" variant="bodySmall" tone="inherit" wrap="truncate">{activeDeck.title}</Typography>
            </span>
            <span className="scenedeck-course-button__chevron" aria-hidden="true"><Icon name="chevronDown" /></span>
          </button>
          {courseMenuOpen && <div className="scenedeck-course-menu" role="menu" aria-label="选择课件">
            <Typography variant="bodySmall" tone="muted" className="scenedeck-course-menu__label">选择课件</Typography>
            {catalog.map((deck) => <button key={deck.id} className={'scenedeck-course-option' + (deck.id === activeDeck.id ? ' is-selected' : '')} type="button" role="menuitem" onClick={() => selectDeck(deck)}>
              <span className="scenedeck-course-option__icon" aria-hidden="true"><Icon name="layers" /></span>
              <span className="scenedeck-course-option__copy">
                <Typography as="strong" variant="bodySmall" tone="inherit" wrap="truncate">{deck.title}</Typography>
                <Typography as="span" variant="bodySmall" tone="muted" wrap="truncate">{deck.subtitle}</Typography>
              </span>
              {deck.id === activeDeck.id && <span className="scenedeck-course-option__check" aria-hidden="true"><Icon name="check" /></span>}
            </button>)}
          </div>}
        </div>
      </div>
      <div className="scenedeck-pager" aria-label="翻页">
        <button className="scenedeck-pager__step" type="button" onClick={() => navigate(sceneIndex - 1)} disabled={sceneIndex === 0} aria-label="上一页" title="上一页（←）"><Icon name="chevronLeft" /></button>
        <span className="scenedeck-pager__value">
          <Typography as="strong" variant="bodySmall" tone="inherit">{String(sceneIndex + 1).padStart(2, '0')}</Typography>
          <Typography as="span" variant="bodySmall" tone="muted">/ {scenes.length}</Typography>
        </span>
        <button className="scenedeck-pager__step" type="button" onClick={() => navigate(sceneIndex + 1)} disabled={sceneIndex === scenes.length - 1} aria-label="下一页" title="下一页（→）"><Icon name="chevronRight" /></button>
      </div>
      <div className="scenedeck-toolbar__tools" aria-label="编辑工具">
        <div className="scenedeck-toolgroup">
          <button className="scenedeck-tool" type="button" onClick={() => showDummyNotice('保存')}><Icon name="save" /><Typography as="span" variant="bodySmall" tone="inherit">保存</Typography></button>
          <button className="scenedeck-tool scenedeck-tool--icon" type="button" onClick={() => showDummyNotice('撤销')} aria-label="撤销" title="撤销"><Icon name="undo" /></button>
          <button className="scenedeck-tool scenedeck-tool--icon" type="button" onClick={() => showDummyNotice('重做')} aria-label="重做" title="重做"><Icon name="redo" /></button>
        </div>
        <div className="scenedeck-toolgroup">
          <button className="scenedeck-tool" type="button" onClick={() => showDummyNotice('布局')}><Icon name="layout" /><Typography as="span" variant="bodySmall" tone="inherit">布局</Typography></button>
          <button className="scenedeck-tool" type="button" onClick={() => showDummyNotice('标注')}><Icon name="annotate" /><Typography as="span" variant="bodySmall" tone="inherit">标注</Typography></button>
        </div>
        <button className={'scenedeck-tool scenedeck-tool--accent' + (notesOpen ? ' is-active' : '')} type="button" onClick={() => setNotesOpen((open) => !open)} aria-pressed={notesOpen} title="智能讲稿（N）"><Icon name="sparkle" /><Typography as="span" variant="bodySmall" tone="inherit">智能讲稿</Typography></button>
        <button className="scenedeck-tool scenedeck-tool--primary" type="button" onClick={togglePresentation} title="全屏演示（F）"><Icon name="present" /><Typography as="span" variant="bodySmall" tone="inherit">演示</Typography></button>
        <button className="scenedeck-tool scenedeck-tool--icon" type="button" onClick={() => showDummyNotice('更多')} aria-label="更多工具" title="更多工具"><Icon name="more" /></button>
      </div>
    </header>
    <div className="scenedeck-layout" style={{ gridTemplateColumns: sidebarWidth + 'px 6px minmax(0, 1fr)' }}>
      <aside className="scenedeck-sidebar" aria-label="幻灯片缩略图">
        <div className="scenedeck-sidebar__head">
          <Typography as="span" variant="bodySmall" tone="inherit">幻灯片</Typography>
          <span className="scenedeck-sidebar__count"><Typography as="span" variant="bodySmall" tone="inherit">{String(sceneIndex + 1).padStart(2, '0')} / {scenes.length}</Typography></span>
        </div>
        <div className="scenedeck-sidebar__list" ref={sidebarListRef} style={{ '--sd-thumb-scale': thumbnailScale } as CSSProperties}>
          {scenes.map((item, index) => <Thumbnail key={item.id} item={item} index={index} active={index === sceneIndex} complete={completedIds.includes(item.id)} onNavigate={navigate} />)}
        </div>
      </aside>
      <PanelResizeHandle label="调整缩略图栏宽度" onDelta={(delta) => setSidebarWidth((width) => clamp(width + delta, 200, 430))} />
      <main className="scenedeck-workspace">
        <div className="scenedeck-stage-row" style={{ gridTemplateColumns: notesOpen ? 'minmax(0, 1fr) 6px ' + inspectorWidth + 'px' : 'minmax(0, 1fr)' }}>
          <div className="scenedeck-stage-viewport" ref={viewportRef}>
            <div className="scenedeck-stage-grid" aria-hidden="true" />
            <div className="ppt-canvas scenedeck-stage course-shell" data-ppt-canvas style={{ transform: 'translate(-50%, -50%) scale(' + scale + ')' }}>
              <SceneSurface scene={scene} complete={complete} reset={reset} isComplete={completedIds.includes(scene.id)} />
            </div>
          </div>
          {notesOpen && <>
            <PanelResizeHandle label="调整智能讲稿栏宽度" onDelta={(delta) => setInspectorWidth((width) => clamp(width - delta, 300, 520))} />
            <SpeakerNotesPanel notes={notes} noteIndex={noteIndex} onChange={setNoteIndex} canAdvanceScene={sceneIndex < scenes.length - 1} onAdvanceScene={() => navigate(sceneIndex + 1)} sceneTitle={scene.title} onClose={() => setNotesOpen(false)} />
          </>}
        </div>
      </main>
    </div>
    {toolNotice && <Typography as="div" variant="bodySmall" tone="inherit" className="scenedeck-toast" role="status">{toolNotice}</Typography>}
  </div>;
}

function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }

const SceneSurface = memo(function SceneSurface({ scene, complete, reset, isComplete }: { scene: SceneDefinition; complete: () => void; reset: () => void; isComplete: boolean }) {
  return <div className="course-page-surface ppt-slide-surface">{scene.render({ complete, reset, isComplete })}</div>;
});

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

const Thumbnail = memo(function Thumbnail({ item, index, active, complete, onNavigate }: { item: SceneDefinition; index: number; active: boolean; complete: boolean; onNavigate: (index: number) => void }) {
  const activate = () => onNavigate(index);
  return <div className={'scenedeck-thumbnail' + (active ? ' is-active' : '')} role="button" tabIndex={0} onClick={activate} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(); } }} aria-current={active ? 'page' : undefined}>
    <span className="scenedeck-thumbnail__frame">
      <span className="scenedeck-thumbnail__preview">
        <span className="scenedeck-thumbnail__surface course-page-surface ppt-slide-surface course-shell" aria-hidden="true">
          {item.render({ complete: () => undefined, reset: () => undefined, isComplete: complete })}
        </span>
      </span>
      <Typography as="span" variant="bodySmall" tone="inherit" className="scenedeck-thumbnail__index">{String(index + 1).padStart(2, '0')}</Typography>
      {complete && <span className="scenedeck-thumbnail__check" role="img" aria-label="已完成" title="已完成"><Icon name="check" /></span>}
    </span>
    <Typography as="span" variant="bodySmall" tone="inherit" className="scenedeck-thumbnail__title">{item.title}</Typography>
  </div>;
});

function SpeakerNotesPanel({ notes, noteIndex, onChange, canAdvanceScene, onAdvanceScene }: { notes: SpeakerNote[]; noteIndex: number; onChange: (index: number) => void; canAdvanceScene: boolean; onAdvanceScene: () => void }) {
  const safeNoteIndex = Math.max(0, Math.min(noteIndex, notes.length - 1));
  const note = notes[safeNoteIndex];
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [narrationActive, setNarrationActive] = useState(false);
  const [narrationPaused, setNarrationPaused] = useState(false);
  const [speechSupported] = useState(() => 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window);
  const advanceRef = useRef({ notesLength: notes.length, noteIndex: safeNoteIndex, canAdvanceScene, onChange, onAdvanceScene });
  advanceRef.current = { notesLength: notes.length, noteIndex: safeNoteIndex, canAdvanceScene, onChange, onAdvanceScene };

  useEffect(() => {
    if (!narrationActive || !speechSupported) return;
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(note.text);
    const voices = synth.getVoices();
    utterance.voice = voices.find((voice) => voice.lang.toLowerCase() === 'zh-cn') ?? voices.find((voice) => voice.lang.toLowerCase().startsWith('zh')) ?? null;
    utterance.lang = utterance.voice?.lang ?? 'zh-CN';
    utterance.rate = 0.96;
    utterance.onend = () => {
      const current = advanceRef.current;
      if (current.noteIndex < current.notesLength - 1) current.onChange(current.noteIndex + 1);
      else if (current.canAdvanceScene) current.onAdvanceScene();
      else setNarrationActive(false);
    };
    utterance.onerror = (event) => { if (event.error !== 'canceled' && event.error !== 'interrupted') setNarrationActive(false); };
    synth.cancel();
    synth.speak(utterance);
    setNarrationPaused(false);
    return () => { utterance.onend = null; utterance.onerror = null; synth.cancel(); };
  }, [narrationActive, note.text, speechSupported]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const toggleNarration = () => {
    if (!speechSupported) return;
    if (!narrationActive) { setNarrationActive(true); return; }
    if (narrationPaused) window.speechSynthesis.resume();
    else window.speechSynthesis.pause();
    setNarrationPaused((paused) => !paused);
  };

  const stopNarration = () => {
    window.speechSynthesis?.cancel();
    setNarrationActive(false);
    setNarrationPaused(false);
  };
  const narrationStatus = !speechSupported ? '语音不可用' : narrationActive ? (narrationPaused ? '已暂停' : '正在朗读') : '准备朗读';
  const progress = ((safeNoteIndex + 1) / notes.length) * 100;
  const goToNext = () => {
    if (safeNoteIndex < notes.length - 1) onChange(safeNoteIndex + 1);
    else if (canAdvanceScene) onAdvanceScene();
  };
  useLayoutEffect(() => {
    const update = () => { const stage = document.querySelector('[data-ppt-canvas]'); const target = stage ? note.selectors.map((selector) => stage.querySelector(selector)).find(Boolean) : null; setTargetRect(target?.getBoundingClientRect() ?? null); };
    update();
    const timer = window.setInterval(update, 240);
    window.addEventListener('resize', update);
    return () => { window.clearInterval(timer); window.removeEventListener('resize', update); };
  }, [note]);
  return (
    <aside className="scenedeck-inspector" aria-label="智能讲稿检查器">
      {targetRect && <div className="scenedeck-focus-ring" style={{ top: targetRect.top - 7, left: targetRect.left - 7, width: targetRect.width + 14, height: targetRect.height + 14 }} aria-hidden="true" />}
      <div className="scenedeck-inspector__head">
        <Typography as="h2" variant="h3" tone="inherit">智能讲稿</Typography>
        <div className={'scenedeck-inspector__status' + (narrationActive && !narrationPaused ? ' is-active' : '')}><span aria-hidden="true" /><Typography as="span" variant="bodySmall" tone="inherit">{narrationStatus}</Typography></div>
      </div>
      <div className="scenedeck-inspector__progress-head">
        <Typography as="span" variant="bodySmall" tone="muted">当前讲稿</Typography>
        <Typography as="span" variant="bodySmall" tone="muted">{safeNoteIndex + 1} / {notes.length}</Typography>
      </div>
      <div className="scenedeck-inspector__progress" role="progressbar" aria-label="讲稿进度" aria-valuemin={1} aria-valuemax={notes.length} aria-valuenow={safeNoteIndex + 1}><span style={{ width: progress + '%' }} /></div>
      <div className="scenedeck-inspector__script"><Typography variant="bodySmall" tone="main">{note.text}</Typography></div>
      <div className="scenedeck-inspector__target"><span aria-hidden="true" /><Typography as="span" variant="bodySmall" tone="inherit">已聚焦当前区域</Typography></div>
      <div className="scenedeck-inspector__transport" aria-label="讲稿播放控制">
        <button type="button" disabled={safeNoteIndex === 0} onClick={() => onChange(safeNoteIndex - 1)} aria-label="上一段" title="上一段">‹</button>
        <button className="is-primary" type="button" onClick={toggleNarration} disabled={!speechSupported} aria-label={narrationActive && !narrationPaused ? '暂停朗读' : narrationPaused ? '继续朗读' : '开始朗读'} title={speechSupported ? (narrationActive && !narrationPaused ? '暂停朗读' : '开始朗读') : '当前浏览器不支持语音朗读'}>{narrationActive && !narrationPaused ? 'Ⅱ' : '▶'}</button>
        <button type="button" onClick={stopNarration} disabled={!narrationActive} aria-label="停止朗读" title="停止朗读">■</button>
        <button type="button" disabled={safeNoteIndex === notes.length - 1 && !canAdvanceScene} onClick={goToNext} aria-label="下一段" title="下一段">›</button>
      </div>
      <Typography variant="bodySmall" tone="muted" className="scenedeck-inspector__continuous">连续播放</Typography>
    </aside>
  );
}
