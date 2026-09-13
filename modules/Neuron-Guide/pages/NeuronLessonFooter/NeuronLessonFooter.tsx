import { createElement, useEffect, useState } from 'react';
import { ContentBlock, LessonFooter, Typography } from '../../../shared/react';
import './NeuronLessonFooter.css';

const videos = [
  {
    title: '什么是神经元，它们是如何工作的？',
    embed: '<iframe title="什么是神经元，它们是如何工作的？" src="//player.bilibili.com/player.html?isOutside=true&aid=480613389&bvid=BV1FT41127Qg&cid=972217281&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>',
  },
  {
    title: '神经网络：从一个神经元到万能逼近',
    embed: '<iframe title="神经网络：从一个神经元到万能逼近" src="//player.bilibili.com/player.html?isOutside=true&aid=116418058131506&bvid=BV1BPdqB6E9H&cid=37571920704&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>',
  },
];

export function NeuronCompletionPage() {
  return (
    <ContentBlock
      headingLevel={1}
      className="ng-completion-stage"
      title="你已经搭出了一个人工神经元"
      subtitle="从生物神经元到人工神经元，真正被继承的不是结构，而是一种处理信息的方式。"
    >
      <NeuronModelViewer />
    </ContentBlock>
  );
}

export function NeuronLessonFooter() {
  return (
    <LessonFooter
      developerIds={['ssocean', 'zhasion', 'zero223', 'GGbondas', 'dengyuhai','ShuyangHou',]}
      className="ng-guide-footer"
      title="推荐资源"
      description="继续认识真实神经元，再进入激活函数，观察神经元如何获得非线性表达能力。"
      back={{ href: '/', label: '返回课程目录' }}
      videos={videos}
      videosLabel="延伸观看"
    />
  );
}

const neuronModelUrl = new URL('../../assets/multipolar_neuron.glb', import.meta.url).href;
const modelViewerModuleUrl = new URL('../../../shared/vendor/model-viewer/3.5.0/model-viewer.min.js', import.meta.url).href;

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
        <div className="ng-model-viewer-copy__idea">
          <Typography as="h3" variant="h3" tone="accent">“神经网络”这个名字，更多是一段历史</Typography>
          <Typography variant="bodySmall" tone="muted">早期人工神经元确实受到生物神经元启发，但现代深度学习的发展，已经很少直接依赖神经科学。</Typography>
          <blockquote className="ng-model-viewer-copy__quote">
            <Typography variant="body" tone="accent">飞机可能受到鸟类启发，但鸟类学并不是航空创新的主要驱动力。</Typography>
          </blockquote>
          <Typography as="a" variant="bodySmall" tone="muted" href="https://zh.d2l.ai/chapter_references/zreferences.html#id141" target="_blank" rel="noreferrer">Russell &amp; Norvig, 2016</Typography>
        </div>

        <div className="ng-model-viewer-copy__scale">
          <Typography variant="bodySmall" tone="warning">小知识</Typography>
          <Typography variant="bodySmall" tone="main">人脑约有 <Typography as="strong" variant="body" tone="accent">860 亿</Typography>个神经元，突触连接更是高达约 <Typography as="strong" variant="body" tone="accent">100 万亿</Typography>。若只比较数量级，现代大模型的参数量仍不足人脑突触数的 <Typography as="strong" variant="body" tone="warning">1%</Typography>。</Typography>
          <Typography as="strong" variant="body" tone="success">更惊人的是，人脑非常节能。</Typography>
          <div className="ng-model-viewer-copy__numbers">
            <div>
              <Typography variant="bodySmall" tone="muted">人脑工作 1 小时</Typography>
              <Typography as="strong" variant="h2" tone="accent">≈ ¹⁄₁₃ 个馒头</Typography>
              <Typography variant="bodySmall" tone="muted">约 20 Wh</Typography>
            </div>
            <div>
              <Typography variant="bodySmall" tone="muted">大模型推理节点工作 1 小时</Typography>
              <Typography as="strong" variant="h2" tone="success">≈ 22 个馒头</Typography>
              <Typography variant="bodySmall" tone="muted">8 张高功率 GPU，约 5.6 kWh</Typography>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
