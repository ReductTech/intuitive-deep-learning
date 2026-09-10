import { createElement, useEffect, useState, type ReactNode } from 'react';
import {
  PresentationStudio,
  WidgetRegistry,
  coreStudioLibraryItems,
  registerCoreStudioWidgets,
  type PresentationLibraryItem,
  type WidgetRuntimeProps,
} from '../../shared/presentation-engine';
import { BiasThresholdTheoryBlock } from '../blocks/BiasThresholdTheoryBlock';
import { ExtraInputsBlock } from '../blocks/ExtraInputsBlock';
import { WeightedSumBlock } from '../blocks/WeightedSumBlock';
import { NeuronLessonProvider } from '../model/NeuronLessonContext';
import { neuronGuidePresentationDocument } from './document';
import { NeuronActivationCatalogWidget, NeuronReluWidget } from './widgets';
import '../neuron-guide.css';
import '../linear-network.css';
import './presentation-spike.css';

const STORAGE_KEY = 'presentation-engine:neuron-guide-studio:v1';

function LegacyNeuronWidget({ children, activeAnchorId }: { children: ReactNode; activeAnchorId?: string }) {
  return <div className={`pe-legacy-widget neuron-presentation-widget${activeAnchorId ? ' is-speaking' : ''}`}>
    {children}
  </div>;
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
    const src = new URL('../../shared/vendor/model-viewer/3.5.0/model-viewer.min.js', import.meta.url).href;
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

const legacyCapability = {
  interactive: true,
  resizable: true,
  serializable: false,
  supportsSlide: true,
  supportsGuide: true,
  supportsNarration: true,
};

const widgetCapability = {
  interactive: true,
  resizable: true,
  serializable: true,
  supportsSlide: true,
  supportsGuide: true,
  supportsNarration: true,
};

const widgetRegistry = registerCoreStudioWidgets(new WidgetRegistry())
  .register({
    type: 'neuron-weighted-input',
    version: 1,
    displayName: '单输入加权实验',
    Component: () => <LegacyNeuronWidget><WeightedSumBlock onComplete={() => undefined} /></LegacyNeuronWidget>,
    capabilities: legacyCapability,
    narrationAnchors: [
      { id: 'weighted-input', label: '输入评分' },
      { id: 'weighted-network', label: '加权信号网络' },
    ],
  })
  .register({
    type: 'neuron-three-inputs',
    version: 1,
    displayName: '三输入加权实验',
    Component: () => <LegacyNeuronWidget><ExtraInputsBlock onComplete={() => undefined} /></LegacyNeuronWidget>,
    capabilities: legacyCapability,
    narrationAnchors: [
      { id: 'three-factor-cards', label: '三个输入' },
      { id: 'three-input-network', label: '汇总网络' },
    ],
  })
  .register({
    type: 'neuron-bias-threshold',
    version: 1,
    displayName: '偏置与判断门槛',
    Component: () => <LegacyNeuronWidget><BiasThresholdTheoryBlock onComplete={() => undefined} /></LegacyNeuronWidget>,
    capabilities: legacyCapability,
    narrationAnchors: [
      { id: 'threshold-question', label: '门槛问题' },
      { id: 'bias-equivalence', label: '偏置等价关系' },
    ],
  })
  .register({
    type: 'neuron-relu',
    version: 1,
    displayName: 'ReLU 响应实验',
    Component: NeuronReluWidget,
    capabilities: widgetCapability,
    narrationAnchors: [
      { id: 'relu-definition', label: 'ReLU 定义' },
      { id: 'relu-plot', label: 'ReLU 图像' },
    ],
  })
  .register({
    type: 'neuron-activation-catalog',
    version: 1,
    displayName: '激活函数目录',
    Component: NeuronActivationCatalogWidget,
    capabilities: { ...widgetCapability, interactive: false },
    narrationAnchors: [
      { id: 'activation-grid', label: '激活函数卡片' },
    ],
  })
  .register({ type: 'studio-video', version: 1, displayName: '视频', Component: VideoWidget, capabilities: widgetCapability })
  .register({ type: 'studio-model', version: 1, displayName: '3D 场景', Component: ModelWidget, capabilities: widgetCapability })
  .register({ type: 'studio-game', version: 1, displayName: '互动游戏', Component: GameWidget, capabilities: widgetCapability });

const libraryItems: PresentationLibraryItem[] = [
  { id: 'title', label: '标题', description: '醒目的主标题', icon: 'T', group: '基础', kind: 'text', role: 'title', defaultSize: { width: 980, height: 100 } },
  {
    id: 'body',
    label: '正文',
    description: '段落与说明',
    icon: '¶',
    group: '基础',
    kind: 'text',
    defaultSize: { width: 620, height: 180 },
    defaultStyle: { background: 'rgba(255,255,255,.9)', borderRadius: 14, padding: 20 },
  },
  {
    id: 'note',
    label: '注释卡片',
    description: '辅助说明信息',
    icon: '✦',
    group: '基础',
    kind: 'text',
    role: 'note',
    defaultSize: { width: 360, height: 130 },
    defaultStyle: { background: '#eef4fb', borderRadius: 14, padding: 18 },
  },
  ...coreStudioLibraryItems,
  { id: 'image', label: '图片', description: 'URL 或本地文件', icon: '▧', group: '媒体', kind: 'image', defaultSize: { width: 560, height: 340 } },
  { id: 'video', label: '视频', description: 'MP4 / WebM', icon: '▶', group: '媒体', kind: 'widget', widgetType: 'studio-video', defaultSize: { width: 640, height: 360 } },
  { id: 'model', label: '3D 场景', description: 'GLB / GLTF', icon: '◇', group: '媒体', kind: 'widget', widgetType: 'studio-model', defaultSize: { width: 640, height: 420 } },
  { id: 'game', label: '互动游戏', description: '嵌入网页', icon: '⌘', group: '媒体', kind: 'widget', widgetType: 'studio-game', defaultSize: { width: 720, height: 460 } },
  { id: 'neuron-weighted-input', label: '单输入加权实验', description: '输入评分与权重', icon: 'x', group: '现有模块', kind: 'widget', widgetType: 'neuron-weighted-input', defaultSize: { width: 1500, height: 810 } },
  { id: 'neuron-three-inputs', label: '三输入加权实验', description: '三个因素汇总', icon: 'Σ', group: '现有模块', kind: 'widget', widgetType: 'neuron-three-inputs', defaultSize: { width: 1500, height: 810 } },
  { id: 'neuron-bias-threshold', label: '偏置与门槛', description: '阈值移项成偏置', icon: 'b', group: '现有模块', kind: 'widget', widgetType: 'neuron-bias-threshold', defaultSize: { width: 1500, height: 810 } },
  { id: 'neuron-relu', label: 'ReLU 响应实验', description: '分段激活规则', icon: '∠', group: '现有模块', kind: 'widget', widgetType: 'neuron-relu', defaultSize: { width: 1500, height: 810 } },
  { id: 'neuron-activation-catalog', label: '激活函数目录', description: '常见函数对照', icon: 'ƒ', group: '现有模块', kind: 'widget', widgetType: 'neuron-activation-catalog', defaultSize: { width: 1500, height: 810 } },
];

export function NeuronPresentationSpikePage() {
  return <PresentationStudio
    initialDocument={neuronGuidePresentationDocument}
    storageKey={STORAGE_KEY}
    registry={widgetRegistry}
    libraryItems={libraryItems}
    Provider={NeuronLessonProvider}
  />;
}
