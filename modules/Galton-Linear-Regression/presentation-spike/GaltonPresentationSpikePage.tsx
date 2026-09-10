import { useEffect, useMemo, useState } from 'react';
import {
  GuideRenderer,
  NarrationPlayer,
  ScaledSlide,
  SlideEditor,
  WidgetRegistry,
  WidgetRegistryProvider,
  clonePresentationDocument,
  createPresentationStore,
  parsePresentationDocument,
  type PresentationDocument,
  type SlidePlacement,
  type WidgetRuntimeProps,
} from '../../shared/presentation-engine';
import { FitLabBlock } from '../blocks';
import { galtonSpikeDocument } from './document';
import '../galton-linear-regression.css';

const STORAGE_KEY = 'presentation-engine:galton-spike:v1';

function loadInitialDocument(): PresentationDocument {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? parsePresentationDocument(JSON.parse(saved)) : clonePresentationDocument(galtonSpikeDocument);
  } catch (error) {
    console.warn('Ignoring invalid saved presentation', error);
    return clonePresentationDocument(galtonSpikeDocument);
  }
}

function GaltonFitLabWidget({ activeAnchorId }: WidgetRuntimeProps) {
  return <div className={`pe-legacy-widget glr-shell${activeAnchorId === 'fit-lab-widget' ? ' is-speaking' : ''}`}>
    <FitLabBlock />
  </div>;
}

const widgetRegistry = new WidgetRegistry().register({
  type: 'galton-fit-lab',
  version: 1,
  displayName: '高尔顿线性拟合实验',
  Component: GaltonFitLabWidget,
  capabilities: {
    interactive: true,
    resizable: true,
    serializable: false,
    supportsSlide: true,
    supportsGuide: true,
    supportsNarration: true,
  },
  narrationAnchors: [
    { id: 'scatter-points', label: '家庭身高散点' },
    { id: 'trend-line', label: '线性预测线' },
  ],
});

const usePresentationStore = createPresentationStore(loadInitialDocument());

function LayerPanel() {
  const document = usePresentationStore((state) => state.document);
  const slideId = usePresentationStore((state) => state.activeSlideId);
  const selected = usePresentationStore((state) => state.selectedPlacementIds);
  const select = usePresentationStore((state) => state.selectPlacements);
  const page = document.views.slides.pages.find((candidate) => candidate.id === slideId) ?? document.views.slides.pages[0];
  const layers = [...page.placements].sort((a, b) => b.zIndex - a.zIndex);
  const nameFor = (placement: SlidePlacement) => {
    if (placement.source.kind === 'widget') return document.widgets[placement.source.id]?.widgetType ?? placement.source.id;
    const node = document.content[placement.source.id];
    return node?.type === 'text' ? node.text : placement.source.id;
  };
  return <aside className="pe-sidebar">
    <h2>图层</h2>
    <div className="pe-layer-list">{layers.map((placement) => <button
      type="button"
      className={`pe-layer${selected.includes(placement.id) ? ' is-selected' : ''}`}
      key={placement.id}
      onClick={() => select([placement.id])}
    >
      <span className="pe-layer__icon">{placement.source.kind === 'widget' ? 'W' : 'T'}</span>
      <span className="pe-layer__copy">{nameFor(placement)}</span>
    </button>)}</div>
  </aside>;
}

function InspectorPanel() {
  const document = usePresentationStore((state) => state.document);
  const slideId = usePresentationStore((state) => state.activeSlideId);
  const selected = usePresentationStore((state) => state.selectedPlacementIds);
  const update = usePresentationStore((state) => state.updatePlacements);
  const reorder = usePresentationStore((state) => state.reorderPlacement);
  const page = document.views.slides.pages.find((candidate) => candidate.id === slideId) ?? document.views.slides.pages[0];
  const placement = selected.length === 1 ? page.placements.find((candidate) => candidate.id === selected[0]) : undefined;
  if (!placement) return <aside className="pe-sidebar pe-sidebar--right"><h2>属性</h2><p className="pe-sidebar__empty">选择一个图层以精确调整位置和尺寸。按住 Shift 可以多选。</p></aside>;
  const fields: Array<[keyof Pick<SlidePlacement, 'x' | 'y' | 'width' | 'height' | 'rotation'>, string]> = [['x', 'X'], ['y', 'Y'], ['width', '宽'], ['height', '高'], ['rotation', '旋转']];
  return <aside className="pe-sidebar pe-sidebar--right">
    <h2>属性</h2>
    <div className="pe-inspector">
      <div className="pe-inspector__grid">{fields.map(([key, label]) => <label key={key}>{label}<input
        type="number"
        value={Math.round(placement[key] * 10) / 10}
        onChange={(event) => update([{ id: placement.id, patch: { [key]: Number(event.currentTarget.value) } }])}
      /></label>)}</div>
      <div className="pe-inspector__actions">
        <button type="button" onClick={() => reorder(placement.id, 'front')}>置于顶层</button>
        <button type="button" onClick={() => reorder(placement.id, 'back')}>置于底层</button>
        <button type="button" onClick={() => update([{ id: placement.id, patch: { locked: !placement.locked } }])}>{placement.locked ? '解锁' : '锁定'}</button>
        <button type="button" onClick={() => update([{ id: placement.id, patch: { hidden: !placement.hidden } }])}>{placement.hidden ? '显示' : '隐藏'}</button>
      </div>
    </div>
  </aside>;
}

function JsonDialog({ onClose }: { onClose: () => void }) {
  const document = usePresentationStore((state) => state.document);
  const replace = usePresentationStore((state) => state.replaceDocument);
  const [value, setValue] = useState(() => JSON.stringify(document, null, 2));
  const [error, setError] = useState<string>();
  const apply = () => {
    try {
      replace(parsePresentationDocument(JSON.parse(value)));
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  };
  return <div className="pe-json-dialog" role="dialog" aria-modal="true" aria-label="文档 JSON">
    <div className="pe-json-dialog__panel">
      <div><b>PresentationDocument</b>{error && <p style={{ color: '#a33' }}>{error}</p>}</div>
      <textarea value={value} onChange={(event) => setValue(event.currentTarget.value)} spellCheck={false} />
      <div className="pe-json-dialog__actions"><button type="button" onClick={onClose}>取消</button><button type="button" onClick={apply}>校验并应用</button></div>
    </div>
  </div>;
}

export function GaltonPresentationSpikePage() {
  const document = usePresentationStore((state) => state.document);
  const mode = usePresentationStore((state) => state.mode);
  const setMode = usePresentationStore((state) => state.setMode);
  const activeSlideId = usePresentationStore((state) => state.activeSlideId);
  const targetId = usePresentationStore((state) => state.activeNarrationTargetId);
  const setTarget = usePresentationStore((state) => state.setNarrationTarget);
  const undo = usePresentationStore((state) => state.undo);
  const redo = usePresentationStore((state) => state.redo);
  const pastCount = usePresentationStore((state) => state.past.length);
  const futureCount = usePresentationStore((state) => state.future.length);
  const replace = usePresentationStore((state) => state.replaceDocument);
  const [showJson, setShowJson] = useState(false);
  const page = useMemo(() => document.views.slides.pages.find((candidate) => candidate.id === activeSlideId) ?? document.views.slides.pages[0], [activeSlideId, document.views.slides.pages]);

  useEffect(() => usePresentationStore.subscribe((state) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.document));
  }), []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? redo() : undo(); }
      if (event.key.toLowerCase() === 'y') { event.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [redo, undo]);

  return <WidgetRegistryProvider registry={widgetRegistry}>
    <div className="pe-app pe-app-shell">
      <header className="pe-toolbar">
        <div className="pe-toolbar__brand"><b>Presentation Engine</b><span>多形态互动内容 · 技术纵切</span></div>
        <div className="pe-toolbar__group">
          <button type="button" className={mode === 'edit' ? 'is-active' : ''} onClick={() => setMode('edit')}>编辑</button>
          <button type="button" className={mode === 'present' ? 'is-active' : ''} onClick={() => setMode('present')}>幻灯片</button>
          <button type="button" className={mode === 'guide' ? 'is-active' : ''} onClick={() => setMode('guide')}>导览页</button>
        </div>
        <div className="pe-toolbar__group"><button type="button" onClick={undo} disabled={!pastCount}>撤销</button><button type="button" onClick={redo} disabled={!futureCount}>重做</button></div>
        <div className="pe-toolbar__spacer" />
        <button type="button" onClick={() => replace(clonePresentationDocument(galtonSpikeDocument))}>重置示例</button>
        <button type="button" onClick={() => setShowJson(true)}>文档 JSON</button>
      </header>
      {mode === 'edit' ? <div className="pe-workspace"><LayerPanel /><SlideEditor store={usePresentationStore} /><InspectorPanel /></div> : mode === 'present'
        ? <ScaledSlide document={document} page={page} mode="present" activeTargetId={targetId} />
        : <GuideRenderer document={document} activeTargetId={targetId} />}
      {mode !== 'edit' && document.narration && <NarrationPlayer segments={document.narration.segments} onTargetChange={setTarget} />}
      {showJson && <JsonDialog onClose={() => setShowJson(false)} />}
    </div>
  </WidgetRegistryProvider>;
}

