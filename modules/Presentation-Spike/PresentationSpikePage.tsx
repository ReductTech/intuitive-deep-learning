import { createElement, useEffect, useRef, useState, type ChangeEvent } from 'react';
import {
  PRESENTATION_SCHEMA_VERSION,
  PresentationStudio,
  coreStudioLibraryItems,
  registerCoreStudioWidgets,
  WidgetRegistry,
  parsePresentationDocument,
  type PresentationDocument,
  type PresentationLibraryItem,
  type WidgetRuntimeProps,
} from '../shared/presentation-engine';
import './presentation-spike.css';

function createProjectId(): string {
  return `presentation-${crypto.randomUUID?.().slice(0, 8) ?? Date.now()}`;
}

export function createBlankPresentationDocument(): PresentationDocument {
  const projectId = createProjectId();
  return parsePresentationDocument({
    schemaVersion: PRESENTATION_SCHEMA_VERSION,
    id: projectId,
    title: '未命名演示文稿',
    content: {
      'title-1': {
        id: 'title-1',
        type: 'text',
        role: 'title',
        text: '在这里输入标题',
      },
    },
    assets: {},
    widgets: {},
    views: {
      slides: {
        pages: [{
          id: 'slide-1',
          title: '第 1 页',
          width: 1600,
          height: 900,
          background: '#fbfcfb',
          placements: [{
            id: 'placement-title-1',
            source: { kind: 'content', id: 'title-1' },
            x: 110,
            y: 100,
            width: 1100,
            height: 120,
            rotation: 0,
            zIndex: 1,
            locked: false,
            hidden: false,
            style: {},
          }],
        }],
      },
      guide: {
        sections: [{
          id: 'guide-slide-1',
          title: '第 1 页',
          layout: 'hero',
          theme: 'plain',
          sources: [{ kind: 'content', id: 'title-1' }],
        }],
      },
    },
    metadata: {},
  });
}

function VideoWidget({ props }: WidgetRuntimeProps<{ src?: string }>) {
  return <div className="pe-media-widget">
    {props.src
      ? <video src={props.src} controls playsInline />
      : <div className="pe-media-empty">选择此组件，在右侧粘贴视频地址</div>}
  </div>;
}

function ModelWidget({ props }: WidgetRuntimeProps<{ src?: string }>) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const src = new URL('../shared/vendor/model-viewer/3.5.0/model-viewer.min.js', import.meta.url).href;
    if (customElements.get('model-viewer') || document.querySelector('[data-presentation-model-viewer]')) return;
    const script = document.createElement('script');
    script.type = 'module';
    script.src = src;
    script.dataset.presentationModelViewer = 'true';
    script.onerror = () => setFailed(true);
    document.head.append(script);
  }, []);

  return !props.src || failed
    ? <div className="pe-media-empty">粘贴 GLB / GLTF 地址以加载可旋转的 3D 场景</div>
    : <div className="pe-media-widget pe-model-widget">
      {createElement('model-viewer', {
        src: props.src,
        'camera-controls': true,
        'auto-rotate': true,
        'shadow-intensity': '1',
        style: { width: '100%', height: '100%' },
      })}
    </div>;
}

function GameWidget({ props }: WidgetRuntimeProps<{ src?: string }>) {
  return <div className="pe-media-widget">
    {props.src
      ? <iframe title="互动内容" src={props.src} allow="fullscreen; autoplay" />
      : <div className="pe-media-empty">粘贴游戏或互动网页地址</div>}
  </div>;
}

const capabilities = {
  interactive: true,
  resizable: true,
  serializable: true,
  supportsSlide: true,
  supportsGuide: true,
  supportsNarration: true,
};

const registry = registerCoreStudioWidgets(new WidgetRegistry())
  .register({ type: 'studio-video', version: 1, displayName: '视频', Component: VideoWidget, capabilities })
  .register({ type: 'studio-model', version: 1, displayName: '3D 场景', Component: ModelWidget, capabilities })
  .register({ type: 'studio-game', version: 1, displayName: '互动游戏', Component: GameWidget, capabilities });

const libraryItems: PresentationLibraryItem[] = [
  { id: 'title', label: '标题', description: '醒目的主标题', icon: 'T', group: '基础', kind: 'text', role: 'title', defaultSize: { width: 980, height: 100 } },
  { id: 'body', label: '正文', description: '段落与说明', icon: '¶', group: '基础', kind: 'text', role: 'body', defaultSize: { width: 620, height: 180 }, defaultStyle: { background: 'rgba(255,255,255,.9)', borderRadius: 14, padding: 20 } },
  { id: 'note', label: '注释卡片', description: '辅助说明信息', icon: '✦', group: '基础', kind: 'text', role: 'note', defaultSize: { width: 360, height: 130 }, defaultStyle: { background: '#eef4fb', borderRadius: 14, padding: 18 } },
  ...coreStudioLibraryItems,
  { id: 'image', label: '图片', description: 'URL 或本地文件', icon: '▧', group: '媒体', kind: 'image', defaultSize: { width: 560, height: 340 } },
  { id: 'video', label: '视频', description: 'MP4 / WebM', icon: '▶', group: '媒体', kind: 'widget', widgetType: 'studio-video', defaultSize: { width: 640, height: 360 } },
  { id: 'model', label: '3D 场景', description: 'GLB / GLTF', icon: '◇', group: '媒体', kind: 'widget', widgetType: 'studio-model', defaultSize: { width: 640, height: 420 } },
  { id: 'game', label: '互动游戏', description: '嵌入网页', icon: '⌘', group: '媒体', kind: 'widget', widgetType: 'studio-game', defaultSize: { width: 720, height: 460 } },
];

export function PresentationSpikePage() {
  const [project, setProject] = useState<PresentationDocument>();
  const [error, setError] = useState('');
  const openRef = useRef<HTMLInputElement>(null);

  const openProject = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    try {
      setProject(parsePresentationDocument(JSON.parse(await file.text())));
      setError('');
    } catch (reason) {
      setError(`无法打开项目：${reason instanceof Error ? reason.message : String(reason)}`);
    } finally {
      event.currentTarget.value = '';
    }
  };

  if (project) {
    return <PresentationStudio
      key={project.id}
      initialDocument={project}
      registry={registry}
      libraryItems={libraryItems}
    />;
  }

  return <main className="presentation-spike-launcher">
    <section className="presentation-spike-launcher__panel" aria-labelledby="presentation-spike-title">
      <span className="presentation-spike-launcher__eyebrow">PRESENTATION STUDIO</span>
      <h1 id="presentation-spike-title">打开或创建演示项目</h1>
      <p>先选择已有的课程项目，或打开此前保存的 <code>.presentation.json</code> 文件。工作台不会默认载入其中任何一个。</p>
      <section className="presentation-spike-launcher__projects" aria-label="已有课程项目">
        <a href="/presentation-spike/neuron">
          <span>课程项目</span>
          <strong>Neuron Guide Test</strong>
          <small>modules/Neuron-Guide-Test</small>
        </a>
        <a href="/presentation-spike/galton">
          <span>课程项目</span>
          <strong>Galton Linear Regression</strong>
          <small>modules/Galton-Linear-Regression</small>
        </a>
      </section>
      <div className="presentation-spike-launcher__actions">
        <button type="button" className="is-primary" onClick={() => setProject(createBlankPresentationDocument())}>新建空白项目</button>
        <button type="button" onClick={() => openRef.current?.click()}>打开本地项目文件</button>
      </div>
      <input ref={openRef} hidden type="file" accept="application/json,.json,.presentation.json" onChange={openProject} />
      {error ? <p className="presentation-spike-launcher__error" role="alert">{error}</p> : null}
      <small>打开课程项目后，可编辑其演示文稿，并通过顶部“保存”导出项目文件。</small>
    </section>
  </main>;
}
