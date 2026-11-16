import { useLecturePlayback } from '../../components/LecturePlayback';
import { useEffect, useId, useMemo, useRef } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import { useDiagramAsset } from '../../components/useDiagramAsset';
import '../GanOverviewPage/GanOverviewPage.css';
import './GanGeneratorPage.css';

const revealCount = 8;
const explanations = [
  { title: '起点是一份随机输入', text: '从简单分布采样 z。它没有人脸语义，是生成器合成图像的起点。' },
  { title: '先映射到初始特征', text: '网络把随机向量投影成低分辨率的特征表示，作为后续生成的基础。' },
  { title: '从 4×4 的小特征图开始', text: '这些方块表示网络内部的特征，不是从图库中挑出来的照片。' },
  { title: '上采样到 8×8', text: '上采样扩大特征图，卷积学习如何组合局部特征，逐步组织空间结构。' },
  { title: '在 16×16 中形成更多结构', text: '分辨率提高后，网络可以表达更细的空间关系，逐层补充轮廓与局部特征。' },
  { title: '到 64×64，细节逐渐丰富', text: '继续上采样与卷积，特征逐步转换为具有图像结构和纹理的表示。' },
  { title: '得到生成图像 x̂ = G(z)', text: '生成器输出一张新图像。固定网络后，更换随机输入 z，通常会得到不同的生成样本。' },
] as const;
const compactCaptions = [
  { after: 2, text: '内部特征', left: '38.4%', width: '7.5%' },
  { after: 3, text: '扩展空间', left: '47%', width: '7.5%' },
  { after: 4, text: '整合结构', left: '56.7%', width: '8.6%' },
  { after: 5, text: '丰富纹理', left: '66.5%', width: '10%' },
] as const;
const diagramSummaries: Record<string, number> = {
  '从简单分布采样，': 1,
  '如 z ~ N(0, I)': 1,
  '先把 z 投影为': 2,
  '低分辨率特征表示': 2,
  '输出最终图像 x̂ = G(z)': 7,
};

export function GanGeneratorPage({ onComplete }: { onComplete?: () => void }) {
  const { markup: generatorDiagram, failed: diagramFailed } = useDiagramAsset('images/gan-generator/gan-generator.svg');
  const { stage, controls } = useLecturePlayback(revealCount, 1000);
  const completedRef = useRef(false);
  const id = useId().replaceAll(':', '');
  const diagram = useMemo(() => generatorDiagram
    .replace(/id="([^"]+)"/g, (_, value: string) => `id="${id}-${value}"`)
    .replace(/url\(#([^)]+)\)/g, (_, value: string) => `url(#${id}-${value})`)
    .replace('aria-labelledby="title desc"', `aria-labelledby="${id}-title ${id}-desc"`)
    .replace(/data-reveal="(\d+)"/g, (_, value: string) => {
      const reveal = Number(value);
      return `data-reveal="${value}" data-hidden="${reveal > stage}" data-current="${reveal === stage}" aria-hidden="${reveal > stage}"`;
    })
    .replace(/<g aria-label="([^"]+)"/g, (match, label: string) => {
      const reveal = diagramSummaries[label];
      return reveal === undefined ? match : `${match} data-hidden="${stage < reveal}" aria-hidden="${stage < reveal}"`;
    }), [id, stage, generatorDiagram]);

  useEffect(() => {
    if (stage !== revealCount - 1 || completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  }, [onComplete, stage]);

  return <ContentBlock shuku-edit-id="e-1ebcfe93-742f-40f3-aa55-1bb0d6a56830" headingLevel={1} title="GAN 生成器：从随机噪声到人脸" subtitle="从简单的随机向量出发，逐层学习图像的结构与细节。" bodyClassName="vg-gan__layout" className="vg-shared-page vg-gan vg-gan-generator" aria-label="GAN 生成器：从随机噪声到人脸" data-stage={stage}>
    <div shuku-edit-id="e-2b034c18-7a5d-4809-9a03-6fb3b87629d9" className="vg-gan__body">
      <div shuku-edit-id="e-0bb5a256-9f9e-4251-87c8-1a8d4fadf296" className="vg-gan__canvas">
        {diagramFailed ? <Typography shuku-edit-id="e-cb3a0df5-7dfc-4a7f-820b-4d5377d6582f" role="alert" variant="bodySmall">图示加载失败，请刷新页面重试。</Typography> : <div shuku-edit-id="e-2c819d8f-ba1f-40a6-a6e5-ecbfc83ae52c" className="vg-gan__diagram" dangerouslySetInnerHTML={{ __html: diagram }} />}
        {stage < explanations.length && <div shuku-edit-id="e-e85a05c2-ca8b-4aca-bcf2-f428492e8800" className="vg-gan-generator__detail" aria-live="polite" aria-atomic="true">
          <Typography shuku-edit-id="e-72aa0814-fa2a-4618-9b61-4872275eab00" as="strong" variant="body" tone="accent">{explanations[stage].title}</Typography>
          <Typography shuku-edit-id="e-f05b8c70-6695-4046-b125-76a639da5df7" variant="body" tone="main">{explanations[stage].text}</Typography>
        </div>}
        {compactCaptions.map(caption => stage > caption.after && <Typography shuku-edit-id="e-5769a44f-e0d3-4051-ae35-bf9a6700f1d2" key={caption.after}
          variant="bodySmall" tone="main" className="vg-gan-generator__caption"
          style={{ left: caption.left, width: caption.width }}>{caption.text}</Typography>)}
        {stage >= 7 && <Typography shuku-edit-id="e-cb95c49a-f4c8-4eec-8afd-91ae15ce579d" variant="bodySmall" tone="main" className="vg-gan-generator__feature-note">
          方块表示内部特征，不是照片。
        </Typography>}
      </div>
    </div>
    <footer shuku-edit-id="e-b4ed325e-b50e-414d-8369-3f51389eb88f" className="vg-gan__footer">
      <div shuku-edit-id="e-7893a12f-3d29-4911-85ec-737f38a7cd3f" className="vg-gan__actions">
        {controls}
      </div>
    </footer>
  </ContentBlock>;
}
