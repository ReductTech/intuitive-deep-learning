import {
  PRESENTATION_SCHEMA_VERSION,
  type PresentationDocument,
} from '../../shared/presentation-engine';
import biologicalNeuronDiagram from '../assets/biological-neuron-diagram.svg';

export const neuronGuidePresentationDocument: PresentationDocument = {
  schemaVersion: PRESENTATION_SCHEMA_VERSION,
  id: 'neuron-guide-presentation-spike',
  title: '从生物神经元到人工神经元',
  content: {
    'neuron-eyebrow': {
      id: 'neuron-eyebrow',
      type: 'text',
      role: 'eyebrow',
      text: 'NEURON GUIDE · PRESENTATION ENGINE',
    },
    'neuron-title': {
      id: 'neuron-title',
      type: 'text',
      role: 'title',
      text: '从生物神经元到人工神经元',
    },
    'neuron-subtitle': {
      id: 'neuron-subtitle',
      type: 'text',
      role: 'subtitle',
      text: '把输入、权重、偏置和激活函数放进同一套可编辑、可放映、可导览的演示框架。',
    },
    'biological-body': {
      id: 'biological-body',
      type: 'text',
      role: 'body',
      text: '1943 年，McCulloch 与 Pitts 没有复制神经元的形状，而是抽出它处理信号的基本规则：多路输入同时到达，连接强度改变每路信号的影响力，细胞体整合这些影响，并在超过阈值时向下游输出响应。',
    },
    'biological-note': {
      id: 'biological-note',
      type: 'text',
      role: 'note',
      text: '树突 → 输入 x\n突触 → 权重 w\n细胞体 → 加权和\n阈值 → 偏置 b\n轴突 → 输出 y',
    },
    'neuron-question': {
      id: 'neuron-question',
      type: 'text',
      role: 'question',
      text: '如果把一次判断写成神经元，哪些现实因素会成为输入？',
    },
    'weighted-intro': {
      id: 'weighted-intro',
      type: 'text',
      role: 'body',
      text: '先处理一个因素：把现实回答映射为输入强度，再让权重放大或缩小它的影响。',
    },
    'three-inputs-intro': {
      id: 'three-inputs-intro',
      type: 'text',
      role: 'body',
      text: '补充另外两个输入，观察三个加权信号如何汇总成一个用于判断的总分。',
    },
    'bias-intro': {
      id: 'bias-intro',
      type: 'text',
      role: 'body',
      text: '判断门槛可以移进公式。移项后的负门槛就是人工神经元里的偏置 b。',
    },
    'relu-intro': {
      id: 'relu-intro',
      type: 'text',
      role: 'body',
      text: 'ReLU 在零点做出选择：负值被抑制为 0，正值继续线性传递。',
    },
    'activation-intro': {
      id: 'activation-intro',
      type: 'text',
      role: 'body',
      text: '不同激活函数有不同形状与数值特性，但它们都在完成同一件事：打破纯线性叠加。',
    },
    'biological-image': {
      id: 'biological-image',
      type: 'image',
      assetId: 'biological-neuron-diagram',
      alt: '神经元结构示意图，展示树突、细胞体、轴突和轴突末梢',
      fit: 'contain',
    },
  },
  assets: {
    'biological-neuron-diagram': {
      id: 'biological-neuron-diagram',
      type: 'image',
      src: biologicalNeuronDiagram,
      mimeType: 'image/svg+xml',
      metadata: {},
    },
  },
  widgets: {
    'weighted-input-widget': {
      id: 'weighted-input-widget',
      widgetType: 'neuron-weighted-input',
      widgetVersion: 1,
      props: {},
    },
    'three-inputs-widget': {
      id: 'three-inputs-widget',
      widgetType: 'neuron-three-inputs',
      widgetVersion: 1,
      props: {},
    },
    'bias-widget': {
      id: 'bias-widget',
      widgetType: 'neuron-bias-threshold',
      widgetVersion: 1,
      props: {},
    },
    'relu-widget': {
      id: 'relu-widget',
      widgetType: 'neuron-relu',
      widgetVersion: 1,
      props: {},
    },
    'activation-widget': {
      id: 'activation-widget',
      widgetType: 'neuron-activation-catalog',
      widgetVersion: 1,
      props: {},
    },
  },
  views: {
    slides: {
      pages: [
        {
          id: 'slide-biological-model',
          title: '从生物神经元到数学模型',
          width: 1600,
          height: 900,
          background: 'radial-gradient(circle at 88% 4%, rgba(240,126,71,.14), transparent 28%), linear-gradient(135deg,#fbfcfe,#f4f7fb)',
          placements: [
            { id: 'p-eyebrow', source: { kind: 'content', id: 'neuron-eyebrow' }, x: 70, y: 46, width: 560, height: 30, rotation: 0, zIndex: 5, locked: false, hidden: false, style: {} },
            { id: 'p-title', source: { kind: 'content', id: 'neuron-title' }, x: 70, y: 86, width: 920, height: 90, rotation: 0, zIndex: 5, locked: false, hidden: false, style: {} },
            { id: 'p-subtitle', source: { kind: 'content', id: 'neuron-subtitle' }, x: 70, y: 184, width: 730, height: 58, rotation: 0, zIndex: 5, locked: false, hidden: false, style: {} },
            { id: 'p-body', source: { kind: 'content', id: 'biological-body' }, x: 70, y: 270, width: 650, height: 250, rotation: 0, zIndex: 4, locked: false, hidden: false, style: { background: 'rgba(255,255,255,.9)', border: '1px solid #dbe4ef', borderRadius: 16, padding: 24 } },
            { id: 'p-note', source: { kind: 'content', id: 'biological-note' }, x: 70, y: 545, width: 650, height: 160, rotation: 0, zIndex: 4, locked: false, hidden: false, style: { background: '#eef4fb', borderRadius: 14, padding: 20 } },
            { id: 'p-image', source: { kind: 'content', id: 'biological-image' }, x: 790, y: 95, width: 740, height: 590, rotation: 0, zIndex: 3, locked: false, hidden: false, style: { background: '#ffffff', border: '1px solid #dbe4ef', borderRadius: 18, padding: 18 } },
            { id: 'p-question', source: { kind: 'content', id: 'neuron-question' }, x: 220, y: 790, width: 1160, height: 56, rotation: 0, zIndex: 6, locked: false, hidden: false, style: { textAlign: 'center' } },
          ],
        },
        {
          id: 'slide-weighted-input',
          title: '一个输入与一个权重',
          width: 1600,
          height: 900,
          background: 'linear-gradient(135deg,#fbfcfe,#f2f6fb)',
          placements: [
            { id: 'p-weighted-widget', source: { kind: 'widget', id: 'weighted-input-widget' }, x: 50, y: 45, width: 1500, height: 810, rotation: 0, zIndex: 3, locked: false, hidden: false, style: {} },
          ],
        },
        {
          id: 'slide-three-inputs',
          title: '三个输入的加权汇总',
          width: 1600,
          height: 900,
          background: 'linear-gradient(135deg,#fbfcfe,#f4f7fb)',
          placements: [
            { id: 'p-three-inputs-widget', source: { kind: 'widget', id: 'three-inputs-widget' }, x: 50, y: 45, width: 1500, height: 810, rotation: 0, zIndex: 3, locked: false, hidden: false, style: {} },
          ],
        },
        {
          id: 'slide-bias-threshold',
          title: '判断门槛与偏置',
          width: 1600,
          height: 900,
          background: 'linear-gradient(135deg,#fffaf7,#f7f8fb)',
          placements: [
            { id: 'p-bias-widget', source: { kind: 'widget', id: 'bias-widget' }, x: 50, y: 45, width: 1500, height: 810, rotation: 0, zIndex: 3, locked: false, hidden: false, style: {} },
          ],
        },
        {
          id: 'slide-relu',
          title: '从线性结果到 ReLU',
          width: 1600,
          height: 900,
          background: 'linear-gradient(135deg,#f8fbf8,#f5f7fb)',
          placements: [
            { id: 'p-relu-widget', source: { kind: 'widget', id: 'relu-widget' }, x: 50, y: 45, width: 1500, height: 810, rotation: 0, zIndex: 3, locked: false, hidden: false, style: {} },
          ],
        },
        {
          id: 'slide-activations',
          title: '常见激活函数',
          width: 1600,
          height: 900,
          background: 'linear-gradient(135deg,#fbfcfe,#f6f8fb)',
          placements: [
            { id: 'p-activation-widget', source: { kind: 'widget', id: 'activation-widget' }, x: 50, y: 45, width: 1500, height: 810, rotation: 0, zIndex: 3, locked: false, hidden: false, style: {} },
          ],
        },
      ],
    },
    guide: {
      sections: [
        {
          id: 'guide-hero',
          layout: 'hero',
          theme: 'paper',
          sources: [
            { kind: 'content', id: 'neuron-eyebrow' },
            { kind: 'content', id: 'neuron-title' },
            { kind: 'content', id: 'neuron-subtitle' },
          ],
        },
        {
          id: 'guide-biological-model',
          title: '从生物结构到可计算关系',
          layout: 'text-media',
          theme: 'plain',
          sources: [
            { kind: 'content', id: 'biological-body' },
            { kind: 'content', id: 'biological-image' },
            { kind: 'content', id: 'biological-note' },
            { kind: 'content', id: 'neuron-question' },
          ],
        },
        {
          id: 'guide-weighted-input',
          title: '先处理一个输入',
          layout: 'interactive',
          theme: 'accent',
          sources: [
            { kind: 'content', id: 'weighted-intro' },
            { kind: 'widget', id: 'weighted-input-widget' },
          ],
        },
        {
          id: 'guide-three-inputs',
          title: '三个输入的加权汇总',
          layout: 'interactive',
          theme: 'plain',
          sources: [
            { kind: 'content', id: 'three-inputs-intro' },
            { kind: 'widget', id: 'three-inputs-widget' },
          ],
        },
        {
          id: 'guide-bias-threshold',
          title: '判断门槛与偏置',
          layout: 'interactive',
          theme: 'accent',
          sources: [
            { kind: 'content', id: 'bias-intro' },
            { kind: 'widget', id: 'bias-widget' },
          ],
        },
        {
          id: 'guide-relu',
          title: '认识 ReLU',
          layout: 'interactive',
          theme: 'plain',
          sources: [
            { kind: 'content', id: 'relu-intro' },
            { kind: 'widget', id: 'relu-widget' },
          ],
        },
        {
          id: 'guide-activations',
          title: '常见激活函数',
          layout: 'comparison',
          theme: 'paper',
          sources: [
            { kind: 'content', id: 'activation-intro' },
            { kind: 'widget', id: 'activation-widget' },
          ],
        },
      ],
    },
  },
  narration: {
    segments: [
      {
        id: 'narration-opening',
        text: '我们从生物神经元出发，把多路输入、连接强度、整合和输出，翻译成一个可计算的数学模型。',
        duration: 8,
        cues: [{ id: 'cue-neuron-title', at: 0.4, targetId: 'neuron-title', action: 'spotlight', duration: 6 }],
      },
      {
        id: 'narration-weighted-input',
        text: '先看一个输入。现实回答先变成数值，权重决定这路信号被放大还是缩小。',
        duration: 8,
        cues: [{ id: 'cue-weighted-widget', at: 0.5, targetId: 'weighted-input-widget', action: 'highlight', duration: 6 }],
      },
      {
        id: 'narration-three-inputs',
        text: '再加入两个输入。每路信号先乘以自己的权重，再相加，得到用于判断的加权总分。',
        duration: 9,
        cues: [{ id: 'cue-three-inputs-widget', at: 0.5, targetId: 'three-inputs-widget', action: 'highlight', duration: 7 }],
      },
      {
        id: 'narration-bias',
        text: '判断门槛可以移进公式。移到左侧后变成负数，这个负门槛就是偏置。',
        duration: 9,
        cues: [{ id: 'cue-bias-widget', at: 0.5, targetId: 'bias-widget', action: 'highlight', duration: 7 }],
      },
      {
        id: 'narration-relu',
        text: 'ReLU 在零点做出选择：小于等于零输出零，大于零保持线性。',
        duration: 7,
        cues: [{ id: 'cue-relu-widget', at: 0.4, targetId: 'relu-widget', action: 'highlight', duration: 5 }],
      },
      {
        id: 'narration-activations',
        text: '激活函数有很多选择，但共同目标是引入非线性，让网络不再只是线性叠加。',
        duration: 8,
        cues: [{ id: 'cue-activation-widget', at: 0.4, targetId: 'activation-widget', action: 'highlight', duration: 6 }],
      },
    ],
  },
  metadata: {
    status: 'presentation-engine-adaptation',
    sourceModule: 'Neuron-Guide-Test',
  },
};
