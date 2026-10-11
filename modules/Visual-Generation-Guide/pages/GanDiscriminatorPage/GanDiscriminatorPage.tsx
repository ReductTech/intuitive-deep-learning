import { useLecturePlayback } from '../../components/LecturePlayback';
import { useEffect, useId, useMemo, useRef } from 'react';
import { Typography } from '../../../shared/react';
import discriminatorDiagram from '../../assets/gan-discriminator/gan-discriminator.svg?raw';
import '../GanOverviewPage/GanOverviewPage.css';
import './GanDiscriminatorPage.css';

const stages = [
  { title: '输入是一张样本图像', explanation: '真实图像和生成图像分别送入同一个 D。判别器每次判断一张图像。' },
  { title: '从图像中提取线索', explanation: '卷积读取局部模式，下采样缩小空间尺寸；图中的方块表示内部特征。' },
  { title: '从 64×64 到 32×32', explanation: '空间尺寸减小，网络把局部线索组合起来，形成更适合判别的特征。' },
  { title: '进一步压缩到 16×16', explanation: '后续层继续整合纹理与结构，判断依据逐渐从像素转为学习到的特征。' },
  { title: '到 8×8，汇集判别线索', explanation: '下采样缩小的是空间尺寸。网络仍在学习哪些特征有助于区分真假。' },
  { title: '压缩成判别特征 h', explanation: 'h = f(x) 汇集图像中的判别信息，用于下一步的真假判断。' },
  { title: '输出真实概率 D(x)', explanation: '分数在 0 到 1 之间。越接近 1，判别器越倾向于把输入判断为真。' },
  { title: '真实样本的高分示例', explanation: '图中 0.93 表示一次高分判断。训练时，希望真实样本的分数接近 1。' },
  { title: '生成样本的低分示例', explanation: '0.07 只是一次示例。逼真的生成图像也可能得到高分，这正是生成器的目标。' },
  { title: '图像 → 特征 → 真假概率', explanation: '判别器学习判断，生成器学习让它信以为真。图中分数仅作示意。' },
] as const;

export function GanDiscriminatorPage({ onComplete }: { onComplete?: () => void }) {
  const { stage, controls } = useLecturePlayback(stages.length, 1000);
  const completedRef = useRef(false);
  const id = useId().replaceAll(':', '');
  const diagram = useMemo(() => discriminatorDiagram
    .replace(/id="([^"]+)"/g, (_, value: string) => `id="${id}-${value}"`)
    .replace(/url\(#([^)]+)\)/g, (_, value: string) => `url(#${id}-${value})`)
    .replace('aria-labelledby="title desc"', `aria-labelledby="${id}-title ${id}-desc"`)
    .replace(/data-reveal="(\d+)"/g, (_, value: string) => {
      const reveal = Number(value);
      return `data-reveal="${value}" data-hidden="${reveal > stage}" data-current="${reveal === stage}" aria-hidden="${reveal > stage}"`;
    }), [id, stage]);

  useEffect(() => {
    if (stage !== stages.length - 1 || completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  }, [onComplete, stage]);

  return <section className="vg-gan vg-gan-discriminator" aria-label="GAN 判别器：图像真假判断流程" data-stage={stage}>
    <div className="vg-gan__body">
      <div className="vg-gan__canvas">
        <div className="vg-gan__diagram" dangerouslySetInnerHTML={{ __html: diagram }} />
        {stage >= 1 && <Typography as="span" variant="bodySmall" tone="muted" className="vg-gan-discriminator__model-label">判别器 D</Typography>}
        <div className="vg-gan__explanation" aria-live="polite" aria-atomic="true">
          <Typography as="strong" variant="body" tone="accent">{stages[stage].title}</Typography>
          <Typography variant="bodySmall" tone="main">{stages[stage].explanation}</Typography>
        </div>
      </div>
    </div>
    <footer className="vg-gan__footer">
      <div className="vg-gan__actions">
        {controls}
      </div>
    </footer>
  </section>;
}
