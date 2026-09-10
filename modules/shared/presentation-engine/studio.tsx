import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentType,
  type DragEvent,
  type ReactNode,
} from 'react';
import {
  GuideRenderer,
  ScaledSlide,
} from './renderers';
import { NarrationPlayer } from './narration';
import { SlideEditor } from './editor';
import { StudioRibbon } from './studio-ribbon';
import {
  clonePresentationDocument,
  parsePresentationDocument,
  type ContentNode,
  type PresentationDocument,
  type SlidePage,
  type SlidePlacement,
} from './document';
import { createPresentationStore } from './store';
import {
  WidgetRegistryProvider,
  type WidgetRegistry,
} from './widget-registry';

const CANVAS = { width: 1600, height: 900 };

export interface PresentationLibraryItem {
  id: string;
  label: string;
  description: string;
  icon: string;
  group: string;
  kind: 'text' | 'image' | 'widget';
  role?: Extract<ContentNode, { type: 'text' }>['role'];
  widgetType?: string;
  defaultSize: { width: number; height: number };
  defaultStyle?: SlidePlacement['style'];
}

export interface PresentationStudioProps {
  initialDocument: PresentationDocument;
  storageKey: string;
  registry: WidgetRegistry;
  libraryItems: PresentationLibraryItem[];
  Provider?: ComponentType<{ children: ReactNode }>;
}

function loadInitialDocument(initialDocument: PresentationDocument, storageKey: string): PresentationDocument {
  try {
    if (typeof window === 'undefined') return clonePresentationDocument(initialDocument);
    const saved = window.localStorage.getItem(storageKey);
    return saved ? parsePresentationDocument(JSON.parse(saved)) : clonePresentationDocument(initialDocument);
  } catch {
    return clonePresentationDocument(initialDocument);
  }
}

function createId(prefix: string): string {
  const randomId = crypto.randomUUID?.().slice(0, 8) ?? `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return `${prefix}-${randomId}`;
}

function pageFor(document: PresentationDocument, id: string): SlidePage {
  return document.views.slides.pages.find((page) => page.id === id) ?? document.views.slides.pages[0];
}

function placementFor(
  source: SlidePlacement['source'],
  item: PresentationLibraryItem,
  point?: { x: number; y: number },
): SlidePlacement {
  const { width, height } = item.defaultSize;
  return {
    id: createId('placement'),
    source,
    x: Math.max(20, Math.min(CANVAS.width - width - 20, (point?.x ?? 800) - width / 2)),
    y: Math.max(20, Math.min(CANVAS.height - height - 20, (point?.y ?? 450) - height / 2)),
    width,
    height,
    rotation: 0,
    zIndex: 20,
    locked: false,
    hidden: false,
    style: item.defaultStyle ?? {},
  };
}

function SlideThumbnail({ document, page, active, onClick }: {
  document: PresentationDocument;
  page: SlidePage;
  active: boolean;
  onClick: () => void;
}) {
  const placements = [...page.placements].sort((left, right) => left.zIndex - right.zIndex);
  return <button className={`pe-slide-thumb${active ? ' is-active' : ''}`} type="button" onClick={onClick}>
    <span className="pe-slide-thumb__number">{document.views.slides.pages.indexOf(page) + 1}</span>
    <span className="pe-slide-thumb__canvas">
      <span style={{ width: page.width, height: page.height, transform: 'scale(.105)', transformOrigin: 'top left' }}>
        <span className="pe-slide-thumb__surface" style={{ background: page.background }}>
          {placements.map((placement) => {
            const node = placement.source.kind === 'content' ? document.content[placement.source.id] : undefined;
            const label = placement.source.kind === 'widget'
              ? 'W'
              : node?.type === 'text'
                ? node.text
                : node?.type === 'image'
                  ? '图片'
                  : '';
            return <span
              className={`pe-slide-thumb__item${placement.source.kind === 'widget' ? ' pe-slide-thumb__item--widget' : ''}`}
              key={placement.id}
              style={{
                left: placement.x,
                top: placement.y,
                width: placement.width,
                height: placement.height,
                background: placement.style.background,
                textAlign: placement.style.textAlign,
              }}
            >
              {label}
            </span>;
          })}
        </span>
      </span>
    </span>
    <strong>{page.title}</strong>
  </button>;
}

function MediaUrlField({ label, value, onChange }: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
}) {
  return <label className="pe-property-field">
    {label}
    <input value={value ?? ''} placeholder="https://…" onChange={(event) => onChange(event.currentTarget.value)} />
  </label>;
}

function StudioSidebar({ document, activeSlideId, libraryItems, onSelectSlide, onAdd, onAddPage, onDuplicatePage, onDeletePage }: {
  document: PresentationDocument;
  activeSlideId: string;
  libraryItems: PresentationLibraryItem[];
  onSelectSlide: (id: string) => void;
  onAdd: (item: PresentationLibraryItem, point?: { x: number; y: number }) => void;
  onAddPage: () => void;
  onDuplicatePage: () => void;
  onDeletePage: () => void;
}) {
  const [tab, setTab] = useState<'slides' | 'assets'>('slides');
  const [scanned, setScanned] = useState(false);
  const groups = useMemo(() => [...new Set(libraryItems.map((item) => item.group))], [libraryItems]);
  const drag = (event: DragEvent, item: PresentationLibraryItem) => event.dataTransfer.setData('application/x-presentation-item', item.id);

  return <aside className="pe-studio-left">
    <div className="pe-side-tabs">
      <button className={tab === 'slides' ? 'is-active' : ''} onClick={() => setTab('slides')}>页面</button>
      <button className={tab === 'assets' ? 'is-active' : ''} onClick={() => setTab('assets')}>素材</button>
    </div>
    {tab === 'slides' ? <>
      <div className="pe-page-actions">
        <button onClick={onAddPage}>＋ 新页面</button>
        <button onClick={onDuplicatePage}>复制</button>
        <button disabled={document.views.slides.pages.length === 1} onClick={onDeletePage}>删除</button>
      </div>
      <div className="pe-thumbnail-list">
        {document.views.slides.pages.map((page) => <SlideThumbnail
          document={document}
          page={page}
          active={page.id === activeSlideId}
          onClick={() => onSelectSlide(page.id)}
          key={page.id}
        />)}
      </div>
    </> : <>
      <div className="pe-library-head">
        <span>组件素材库</span>
        <button onClick={() => setScanned(true)}>{scanned ? '已扫描' : '扫描现有模块'}</button>
      </div>
      {groups.map((group) => <section className="pe-library-group" key={group}>
        <h3>
          {group}
          {group === '现有模块' && scanned ? <em>{libraryItems.filter((item) => item.group === group).length} 个已发现</em> : null}
        </h3>
        {libraryItems.filter((item) => item.group === group).map((item) => <button
          draggable
          type="button"
          className="pe-library-item"
          onDragStart={(event) => drag(event, item)}
          onClick={() => onAdd(item)}
          key={item.id}
        >
          <b>{item.icon}</b>
          <span><strong>{item.label}</strong><small>{item.description}</small></span>
          <i>拖入</i>
        </button>)}
      </section>)}
    </>}
  </aside>;
}

function Inspector({ document, activeSlideId, registry, selected, onUpdatePlacement, onUpdateDocument, onDeletePlacement }: {
  document: PresentationDocument;
  activeSlideId: string;
  registry: WidgetRegistry;
  selected: string[];
  onUpdatePlacement: (patch: Partial<SlidePlacement>) => void;
  onUpdateDocument: (mutate: (document: PresentationDocument) => void) => void;
  onDeletePlacement: () => void;
}) {
  const page = pageFor(document, activeSlideId);
  const placement = selected.length === 1 ? page.placements.find((candidate) => candidate.id === selected[0]) : undefined;
  if (!placement) {
    return <aside className="pe-studio-right">
      <h2>属性</h2>
      <div className="pe-empty-inspector">从素材库拖入组件，或点击画布元素开始编辑。</div>
    </aside>;
  }

  const contentSource = placement.source.kind === 'content' ? document.content[placement.source.id] : undefined;
  const widgetSource = placement.source.kind === 'widget' ? document.widgets[placement.source.id] : undefined;
  const editText = (text: string) => onUpdateDocument((next) => {
    const node = next.content[placement.source.id];
    if (node?.type === 'text') node.text = text;
  });
  const editUrl = (src: string) => onUpdateDocument((next) => {
    if (placement.source.kind === 'content') {
      const node = next.content[placement.source.id];
      if (node?.type === 'image') next.assets[node.assetId].src = src;
    } else {
      next.widgets[placement.source.id].props = { ...next.widgets[placement.source.id].props, src };
    }
  });
  const fields: Array<[keyof Pick<SlidePlacement, 'x' | 'y' | 'width' | 'height' | 'rotation'>, string]> = [
    ['x', 'X'],
    ['y', 'Y'],
    ['width', '宽'],
    ['height', '高'],
    ['rotation', '旋转'],
  ];
  const currentUrl = contentSource?.type === 'image' ? document.assets[contentSource.assetId]?.src : String(widgetSource?.props.src ?? '');

  return <aside className="pe-studio-right">
    <h2>属性</h2>
    <div className="pe-property-title">
      <b>{widgetSource ? registry.get(widgetSource.widgetType)?.displayName ?? widgetSource.widgetType : contentSource?.type ?? '内容'}</b>
      <button onClick={onDeletePlacement}>删除元素</button>
    </div>
    {contentSource?.type === 'text' ? <label className="pe-property-field">
      文字
      <textarea value={contentSource.text} onChange={(event) => editText(event.currentTarget.value)} />
    </label> : null}
    {currentUrl || contentSource?.type === 'image' ? <MediaUrlField
      label={widgetSource?.widgetType === 'studio-game' ? '网页地址' : '资源地址'}
      value={currentUrl}
      onChange={editUrl}
    /> : null}
    <div className="pe-inspector__grid">
      {fields.map(([key, label]) => <label key={key}>
        {label}
        <input
          type="number"
          value={Math.round(placement[key] * 10) / 10}
          onChange={(event) => onUpdatePlacement({ [key]: Number(event.currentTarget.value) })}
        />
      </label>)}
    </div>
    <div className="pe-inspector__actions">
      <button onClick={() => onUpdatePlacement({ zIndex: Math.max(...page.placements.map((item) => item.zIndex)) + 1 })}>置于顶层</button>
      <button onClick={() => onUpdatePlacement({ zIndex: Math.min(...page.placements.map((item) => item.zIndex)) - 1 })}>置于底层</button>
      <button onClick={() => onUpdatePlacement({ locked: !placement.locked })}>{placement.locked ? '解锁' : '锁定'}</button>
      <button onClick={() => onUpdatePlacement({ hidden: !placement.hidden })}>{placement.hidden ? '显示' : '隐藏'}</button>
    </div>
  </aside>;
}

export function PresentationStudio({
  initialDocument,
  storageKey,
  registry,
  libraryItems,
  Provider,
}: PresentationStudioProps) {
  const [usePresentationStore] = useState(() => createPresentationStore(loadInitialDocument(initialDocument, storageKey)));
  const presentationStore = usePresentationStore;
  const document = presentationStore((state) => state.document);
  const activeSlideId = presentationStore((state) => state.activeSlideId);
  const setActiveSlide = presentationStore((state) => state.setActiveSlide);
  const selected = presentationStore((state) => state.selectedPlacementIds);
  const selectPlacements = presentationStore((state) => state.selectPlacements);
  const targetId = presentationStore((state) => state.activeNarrationTargetId);
  const setTarget = presentationStore((state) => state.setNarrationTarget);
  const undo = presentationStore((state) => state.undo);
  const redo = presentationStore((state) => state.redo);
  const replace = presentationStore((state) => state.replaceDocument);
  const updatePlacements = presentationStore((state) => state.updatePlacements);
  const mode = presentationStore((state) => state.mode);
  const [showJson, setShowJson] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const page = useMemo(() => pageFor(document, activeSlideId), [activeSlideId, document]);

  useEffect(() => presentationStore.subscribe((state) => {
    window.localStorage.setItem(storageKey, JSON.stringify(state.document));
  }), [presentationStore, storageKey]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() === 'z') {
        event.preventDefault();
        event.shiftKey ? redo() : undo();
      }
      if (event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [redo, undo]);

  const changeDocument = (mutate: (next: PresentationDocument) => void) => {
    const next = clonePresentationDocument(document);
    mutate(next);
    replace(parsePresentationDocument(next));
  };

  const addItem = (item: PresentationLibraryItem, point?: { x: number; y: number }) => changeDocument((next) => {
    const activePage = pageFor(next, activeSlideId);
    if (item.kind === 'text') {
      const id = createId('text');
      next.content[id] = {
        id,
        type: 'text',
        role: item.role ?? 'body',
        text: item.role === 'title' ? '在这里输入标题' : item.role === 'note' ? '补充说明' : '在这里输入内容',
      };
      activePage.placements.push(placementFor({ kind: 'content', id }, item, point));
    } else if (item.kind === 'image') {
      const assetId = createId('image-asset');
      const id = createId('image');
      next.assets[assetId] = {
        id: assetId,
        type: 'image',
        src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="480"><rect width="100%" height="100%" fill="#e7efec"/><path d="M120 360 300 180l130 130 105-94 150 144" fill="none" stroke="#4e7a70" stroke-width="24"/><circle cx="590" cy="140" r="42" fill="#d7a15b"/></svg>'),
        mimeType: 'image/svg+xml',
        metadata: {},
      };
      next.content[id] = { id, type: 'image', assetId, alt: '新图片', fit: 'cover' };
      activePage.placements.push(placementFor({ kind: 'content', id }, item, point));
    } else if (item.widgetType) {
      const id = createId('widget');
      next.widgets[id] = { id, widgetType: item.widgetType, widgetVersion: 1, props: {} };
      activePage.placements.push(placementFor({ kind: 'widget', id }, item, point));
    }
  });

  const addPage = () => changeDocument((next) => {
    const number = next.views.slides.pages.length + 1;
    const textId = createId('page-title');
    const pageId = createId('slide');
    next.content[textId] = { id: textId, type: 'text', role: 'title', text: `第 ${number} 页` };
    next.views.slides.pages.push({
      id: pageId,
      title: `第 ${number} 页`,
      width: CANVAS.width,
      height: CANVAS.height,
      background: '#fbfcfb',
      placements: [{
        id: createId('placement'),
        source: { kind: 'content', id: textId },
        x: 110,
        y: 100,
        width: 1100,
        height: 100,
        rotation: 0,
        zIndex: 1,
        locked: false,
        hidden: false,
        style: {},
      }],
    });
    next.views.guide.sections.push({
      id: `guide-${pageId}`,
      title: `第 ${number} 页`,
      layout: 'hero',
      theme: 'plain',
      sources: [{ kind: 'content', id: textId }],
    });
    setActiveSlide(pageId);
  });

  const duplicatePage = () => changeDocument((next) => {
    const original = pageFor(next, activeSlideId);
    const pageId = createId('slide');
    next.views.slides.pages.push({
      ...structuredClone(original),
      id: pageId,
      title: `${original.title} 副本`,
      placements: original.placements.map((placement) => ({ ...placement, id: createId('placement') })),
    });
    setActiveSlide(pageId);
  });

  const deletePage = () => {
    if (document.views.slides.pages.length === 1) return;
    changeDocument((next) => {
      next.views.slides.pages = next.views.slides.pages.filter((candidate) => candidate.id !== activeSlideId);
      next.views.guide.sections = next.views.guide.sections.filter((section) => section.id !== `guide-${activeSlideId}`);
      setActiveSlide(next.views.slides.pages[0].id);
    });
  };

  const deletePlacement = () => changeDocument((next) => {
    const activePage = pageFor(next, activeSlideId);
    activePage.placements = activePage.placements.filter((placement) => !selected.includes(placement.id));
    selectPlacements([]);
  });

  const exportProject = () => {
    const blob = new Blob([JSON.stringify(document, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement('a');
    anchor.href = url;
    anchor.download = `${document.id}.presentation.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importProject = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    try {
      replace(parsePresentationDocument(JSON.parse(await file.text())));
    } catch (error) {
      window.alert(`项目文件无效：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      event.currentTarget.value = '';
    }
  };
  const activePageNumber = document.views.slides.pages.findIndex((candidate) => candidate.id === activeSlideId) + 1;

  const studio = <WidgetRegistryProvider registry={registry}>
    <div className="pe-app pe-app-shell pe-studio-shell">
      <StudioRibbon
        store={presentationStore}
        onInsert={(id) => {
          const item = libraryItems.find((candidate) => candidate.id === id);
          if (item) addItem(item);
        }}
        onImport={() => importRef.current?.click()}
        onExport={exportProject}
        onOpenJson={() => setShowJson(true)}
      />
      <input ref={importRef} hidden type="file" accept="application/json,.json" onChange={importProject} />
      {mode === 'edit' ? <div className="pe-studio-workspace">
        <StudioSidebar
          document={document}
          activeSlideId={activeSlideId}
          libraryItems={libraryItems}
          onSelectSlide={setActiveSlide}
          onAdd={addItem}
          onAddPage={addPage}
          onDuplicatePage={duplicatePage}
          onDeletePage={deletePage}
        />
        <SlideEditor
          store={presentationStore}
          onCanvasDrop={(id, point) => {
            const item = libraryItems.find((candidate) => candidate.id === id);
            if (item) addItem(item, point);
          }}
        />
        <Inspector
          document={document}
          activeSlideId={activeSlideId}
          registry={registry}
          selected={selected}
          onUpdatePlacement={(patch) => selected[0] && updatePlacements([{ id: selected[0], patch }])}
          onUpdateDocument={changeDocument}
          onDeletePlacement={deletePlacement}
        />
      </div> : mode === 'present' ? <ScaledSlide document={document} page={page} mode="present" activeTargetId={targetId} /> : <GuideRenderer document={document} activeTargetId={targetId} />}
      {mode !== 'edit' && document.narration ? <NarrationPlayer segments={document.narration.segments} onTargetChange={setTarget} /> : null}
      <footer className="pe-studio-status">
        <span>幻灯片 {activePageNumber} / {document.views.slides.pages.length}</span>
        <span>{mode === 'edit' ? '单击文字直接编辑 · 拖动元素调整布局' : mode === 'present' ? '放映模式 · 智能讲解可同步高亮' : '导览模式 · 同一内容，自适应长页面'}</span>
        <span>16:9 · 1600 × 900 · 自动保存</span>
      </footer>
      {showJson ? <div className="pe-json-dialog" role="dialog" aria-modal="true">
        <div className="pe-json-dialog__panel">
          <b>PresentationDocument</b>
          <textarea value={JSON.stringify(document, null, 2)} readOnly />
          <div className="pe-json-dialog__actions"><button onClick={() => setShowJson(false)}>关闭</button></div>
        </div>
      </div> : null}
    </div>
  </WidgetRegistryProvider>;

  return Provider ? <Provider>{studio}</Provider> : studio;
}
