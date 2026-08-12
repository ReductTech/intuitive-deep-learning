import { createElement, useEffect, useState } from 'react';
import { Typography } from '../../shared/react';

const neuronModelUrl = new URL('../../Neuron-Guide/multipolar_neuron.glb', import.meta.url).href;
const modelViewerModuleUrl = new URL('../../shared/vendor/model-viewer/3.5.0/model-viewer.min.js', import.meta.url).href;

export function NeuronModelViewer() {
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
        {failed ? (
          <Typography as="div" variant="bodySmall" tone="muted" className="ng-model-fallback" role="status">3D 模型加载失败，不影响本节结论。</Typography>
        ) : createElement('model-viewer', {
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
        <Typography as="span" variant="bodySmall" tone="warning" className="edu-kicker">从汇总信号到人工神经元</Typography>
        <Typography as="h3" variant="h3" tone="accent">生物神经元启发了这套结构</Typography>
        <Typography variant="bodySmall" tone="muted">多个输入分别加权，再汇总为一个分数。</Typography>
        <Typography as="strong" variant="bodySmall" tone="warning">人工神经元保留可计算关系，并不复刻完整细胞机制。</Typography>
      </div>
    </div>
  );
}
