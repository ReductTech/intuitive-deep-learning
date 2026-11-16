import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { createElement, useEffect, useState } from 'react';
import { ContentBlock, CourseEndingPage, Typography } from "@shuku/course-style/react";
import './NeuronLessonFooter.css';

const videos = [
  {
    title: '什么是神经元，它们是如何工作的？',
    description: '从生物神经元出发，理解人工神经元的计算过程与核心思想。',
    embed: '<iframe title="什么是神经元，它们是如何工作的？" src="//player.bilibili.com/player.html?isOutside=true&aid=480613389&bvid=BV1FT41127Qg&cid=972217281&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>',
  },
  {
    title: '神经网络：从一个神经元到万能逼近',
    description: '从单个神经元延伸到网络表达能力。',
    embed: '<iframe title="神经网络：从一个神经元到万能逼近" src="//player.bilibili.com/player.html?isOutside=true&aid=116418058131506&bvid=BV1BPdqB6E9H&cid=37571920704&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>',
  },
];

export function NeuronCompletionPage() {
  return (
    <ContentBlock shuku-edit-id="e-17ff758d-647c-4194-b4c0-f91df8dc2c6d"
      headingLevel={1}
      className="ngtw-completion-stage"
      title="你已经搭出了一个人工神经元"
      subtitle="从生物神经元到人工神经元，真正被继承的不是结构，而是一种处理信息的方式。"
    >
      <NeuronModelViewer />
    </ContentBlock>
  );
}

export function NeuronLessonFooter() {
  return (
    <CourseEndingPage
      pageKey="neuron-guide-ending"
      developerIds={['ssocean']}
      title="你已经搭出了一个人工神经元"
      summary="从真实决策出发，你把影响因素转成输入，用权重表达影响程度，再通过加权和、偏置和激活函数得到判断。"
      topics={['输入信号', '权重', '加权求和', '偏置', '激活函数']}
      resources={videos.map((video) => ({
        title: video.title,
        description: video.description,
        embedUrl: video.embed.match(/\bsrc="([^"]+)"/i)?.[1]?.replace(/^\/\//, 'https://'),
      }))}
      resourceHeading="延伸资源"
    />
  );
}

const neuronModelUrl = moduleAssetUrl('multipolar_neuron.glb');
const modelViewerModuleUrl = new URL("@shuku/course-style/vendor/model-viewer/3.5.0/model-viewer.min.js", import.meta.url).href;

export function NeuronModelViewer() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (customElements.get('model-viewer')) return;
    const existing = document.querySelector<HTMLScriptElement>('script[data-ngtw-model-viewer]');
    if (existing) return;
    const script = document.createElement('script');
    script.type = 'module';
    script.src = modelViewerModuleUrl;
    script.dataset.ngModelViewer = '';
    script.addEventListener('error', () => setFailed(true), { once: true });
    document.head.appendChild(script);
  }, []);

  return (
    <div shuku-edit-id="e-4df7348a-f48b-4aaf-acd8-613d3c88d2e3" className="ngtw-model-viewer-layout grid min-w-0 grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] items-stretch gap-[18px]">
      <div shuku-edit-id="e-faa80a6a-ff3f-4263-8994-b4bcf8df8476" className="ngtw-model-viewer-frame min-h-[520px] overflow-hidden">
        {failed ? (
          <Typography shuku-edit-id="e-e3eee22d-ee93-4b81-994d-556e18f13c57" as="div" variant="bodySmall" tone="muted" className="ngtw-model-fallback" role="status">3D 模型加载失败，不影响本节结论。</Typography>
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
      <div shuku-edit-id="e-1f3c49c6-5be6-41b8-98c4-4dba1b0336fc" className="ngtw-model-viewer-copy grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-[10px]">
        <div shuku-edit-id="e-23fa573b-ac45-4794-a4b1-834e65347dba" className="ngtw-model-viewer-copy__idea">
          <Typography shuku-edit-id="e-b151a693-dba1-4ab3-ae62-e4dcf617c034" as="h3" variant="h3" tone="accent">“神经网络”这个名字，更多是一段历史</Typography>
          <Typography shuku-edit-id="e-2e674afc-9ce0-47dd-882d-20b6d45c2605" variant="bodySmall" tone="muted">早期人工神经元确实受到生物神经元启发，但现代深度学习的发展，已经很少直接依赖神经科学。</Typography>
          <blockquote shuku-edit-id="e-aa5d6e74-c5a6-4f6f-adaf-9254666b564a" className="ngtw-model-viewer-copy__quote m-0 bg-[rgba(240,126,71,.06)] p-[10px_14px]">
            <Typography shuku-edit-id="e-e68cba66-b9dc-42d4-8cd7-ccaed5f444b1" variant="body" tone="accent">飞机可能受到鸟类启发，但鸟类学并不是航空创新的主要驱动力。</Typography>
          </blockquote>
          <Typography shuku-edit-id="e-01e35155-033b-4829-a9d5-4d349fd6f2ff" as="a" variant="bodySmall" tone="muted" href="https://zh.d2l.ai/chapter_references/zreferences.html#id141" target="_blank" rel="noreferrer">Russell &amp; Norvig, 2016</Typography>
        </div>

        <div shuku-edit-id="e-d7dc0a8b-bfe7-4ea3-bf79-920e94c988d1" className="ngtw-model-viewer-copy__scale">
          <Typography shuku-edit-id="e-9d450911-932f-4551-a376-3fa9c1a9f82b" variant="bodySmall" tone="warning">小知识</Typography>
          <Typography shuku-edit-id="e-549fec30-5404-4af9-b0b5-cad9bb079760" variant="bodySmall" tone="main">人脑约有 <Typography shuku-edit-id="e-6310bd57-763e-4454-bd31-f7b6f1736bf4" as="strong" variant="body" tone="accent">860 亿</Typography>个神经元，突触连接更是高达约 <Typography shuku-edit-id="e-b4197460-a7c1-4509-a618-cf9b6a6a8bb8" as="strong" variant="body" tone="accent">100 万亿</Typography>。若只比较数量级，现代大模型的参数量仍不足人脑突触数的 <Typography shuku-edit-id="e-0168adce-f091-40ea-9186-6874076c3d5e" as="strong" variant="body" tone="warning">1%</Typography>。</Typography>
          <Typography shuku-edit-id="e-4123b8f1-42c9-4f37-bddc-2e69ff6c2397" as="strong" variant="body" tone="success">更惊人的是，人脑非常节能。</Typography>
          <div shuku-edit-id="e-0d58a58c-e179-484a-a9d0-4989fe5bea97" className="ngtw-model-viewer-copy__numbers grid grid-cols-[repeat(2,minmax(0,1fr))] gap-[12px]">
            <div shuku-edit-id="e-3d3a162f-1d7d-4085-b2ce-2bc72211060a">
              <Typography shuku-edit-id="e-73891b07-f174-4087-a696-f09a1d08845d" variant="bodySmall" tone="muted">人脑工作 1 小时</Typography>
              <Typography shuku-edit-id="e-29735709-db25-45f9-aa0c-e0702d8eba2a" as="strong" variant="h2" tone="accent">≈ ¹⁄₁₃ 个馒头</Typography>
              <Typography shuku-edit-id="e-07e7a606-ef28-43c0-8781-4e0d22230903" variant="bodySmall" tone="muted">约 20 Wh</Typography>
            </div>
            <div shuku-edit-id="e-612582dc-28cf-4f9f-b848-117c3e46c2cb">
              <Typography shuku-edit-id="e-f6b59d75-be3a-4e1a-ae91-8b4610e55b72" variant="bodySmall" tone="muted">大模型推理节点工作 1 小时</Typography>
              <Typography shuku-edit-id="e-c320e979-b10b-49eb-9a87-797f518b5c51" as="strong" variant="h2" tone="success">≈ 22 个馒头</Typography>
              <Typography shuku-edit-id="e-7cf6953a-1445-41e4-8977-33bc65fc4201" variant="bodySmall" tone="muted">8 张高功率 GPU，约 5.6 kWh</Typography>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

