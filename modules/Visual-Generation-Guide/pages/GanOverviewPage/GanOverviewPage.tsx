import { useLecturePlayback } from '../../components/LecturePlayback';
import { useEffect, useId, useMemo, useRef } from 'react';
import ganFlowDiagram from '../../assets/gan-overview/gan-generator-discriminator.svg?raw';
import './GanOverviewPage.css';

const revealCount = 6;

export function GanOverviewPage({ onComplete }: { onComplete?: () => void }) {
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
    }), [id, stage]);

  useEffect(() => {
    if (stage !== revealCount - 1 || completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  }, [onComplete, stage]);

  return <section className="vg-gan vg-gan-overview" aria-label="GAN：生成器与判别器流程图" data-stage={stage}>
    <div className="vg-gan__body">
      <div className="vg-gan__canvas">
        <div className="vg-gan__diagram" dangerouslySetInnerHTML={{ __html: diagram }} />
      </div>
    </div>
    <footer className="vg-gan__footer">
      <div className="vg-gan__actions">
        {controls}
      </div>
    </footer>
  </section>;
}
