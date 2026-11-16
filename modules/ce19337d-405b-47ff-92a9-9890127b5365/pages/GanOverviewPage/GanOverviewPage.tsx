import { ContentBlock, Typography } from "@shuku/course-style/react";
import { useLecturePlayback } from '../../components/LecturePlayback';
import { useEffect, useId, useMemo, useRef } from 'react';
import { useDiagramAsset } from '../../components/useDiagramAsset';
import './GanOverviewPage.css';

const revealCount = 6;

export function GanOverviewPage({ onComplete }: { onComplete?: () => void }) {
  const { markup: ganFlowDiagram, failed: diagramFailed } = useDiagramAsset('images/gan-overview/gan-generator-discriminator.svg');
  const { stage, controls } = useLecturePlayback(revealCount, 1000);
  const completedRef = useRef(false);
  const id = useId().replaceAll(':', '');
  const diagram = useMemo(() => ganFlowDiagram
    .replace(/id="([^"]+)"/g, (_, value: string) => `id="${id}-${value}"`)
    .replace(/url\(#([^)]+)\)/g, (_, value: string) => `url(#${id}-${value})`)
    .replace('aria-labelledby="title desc"', `aria-labelledby="${id}-title ${id}-desc"`)
    .replace(/data-reveal="(\d+)"/g, (_, value: string) => {
      const reveal = Number(value);
      return `data-reveal="${value}" data-hidden="${reveal > stage}" data-current="${reveal === stage}" aria-hidden="${reveal > stage}"`;
    }), [id, stage, ganFlowDiagram]);

  useEffect(() => {
    if (stage !== revealCount - 1 || completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  }, [onComplete, stage]);

  return <ContentBlock shuku-edit-id="e-d52b2110-c8b1-4e18-a785-b0523d7c70f0" headingLevel={1} title="GAN：生成器造样本，判别器辨真假" subtitle="随机噪声经过生成器得到图像，真实图像与生成图像送入同一个判别器。" bodyClassName="vg-gan__layout" className="vg-shared-page vg-gan vg-gan-overview" aria-label="GAN：生成器与判别器流程图" data-stage={stage}>
    <div shuku-edit-id="e-958da1d2-50df-4209-b8b1-41a27b9e1e34" className="vg-gan__body">
      <div shuku-edit-id="e-ba378d87-06ec-4638-8f12-a89615102b06" className="vg-gan__canvas">
        {diagramFailed ? <Typography shuku-edit-id="e-cd987f9e-efc0-4049-9bc1-208df50f93a1" role="alert" variant="bodySmall">图示加载失败，请刷新页面重试。</Typography> : <div shuku-edit-id="e-d2694de5-ec95-4d4a-8652-443742a86a43" className="vg-gan__diagram" dangerouslySetInnerHTML={{ __html: diagram }} />}
      </div>
    </div>
    <footer shuku-edit-id="e-8b389305-f274-49fd-a338-f3207772a502" className="vg-gan__footer">
      <div shuku-edit-id="e-56d1b9b8-25ca-4628-9910-6ffb90a1e812" className="vg-gan__actions">
        {controls}
      </div>
    </footer>
  </ContentBlock>;
}
