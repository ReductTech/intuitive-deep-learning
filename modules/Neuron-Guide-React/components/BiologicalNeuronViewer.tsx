import { createElement, useEffect, useState } from 'react';
import { Typography } from '../../shared/react';

const neuronModelUrl = new URL('../../Neuron-Guide/multipolar_neuron.glb', import.meta.url).href;
const modelViewerModuleUrl = new URL('../../shared/vendor/model-viewer/3.5.0/model-viewer.min.js', import.meta.url).href;

export function BiologicalNeuronViewer() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (customElements.get('model-viewer')) return;
    const existing = document.querySelector<HTMLScriptElement>('script[data-ng-model-viewer]');
    if (existing) return;
    const script = document.createElement('script');
    script.type = 'module';
    script.src = modelViewerModuleUrl;
    script.dataset.ngModelViewer = '';
    script.addEventListener('error', () => setFailed(true), { once: true });
    document.head.appendChild(script);
  }, []);

  return (
    <div className="ng-model-viewer-layout">
      <div className="ng-model-viewer-frame">
        {failed ? <Typography as="div" variant="bodySmall" tone="muted" className="ng-model-fallback" role="status">3D 模型加载失败，不影响本节结论。</Typography> : createElement('model-viewer', {
          src: neuronModelUrl,
          alt: '生物学上的多极神经元 3D 模型',
          'camera-controls': '',
          'auto-rotate': '',
          'rotation-per-second': '18deg',
          loading: 'lazy',
          onError: () => setFailed(true),
        })}
      </div>
      <div className="ng-model-viewer-copy">
        <Typography as="span" variant="bodySmall" tone="warning" className="edu-kicker">先观察形态</Typography>
        <Typography as="h3" variant="h3" tone="accent">一个细胞连接多条接收与传出通路</Typography>
        <Typography variant="bodySmall" tone="muted">旋转模型，观察树突围绕细胞体分枝，轴突向远处延伸。</Typography>
        <Typography variant="bodySmall" tone="muted">本页只追踪信号流向，省略复杂的电化学机制。</Typography>
        <Typography as="strong" variant="bodySmall" tone="warning">多路信号进入细胞，整合后再影响下游。</Typography>
      </div>
    </div>
  );
}
